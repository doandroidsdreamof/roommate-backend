import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, gte, lte, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  ACCOUNT_STATUS,
  GENDER,
  GENDER_PREFERENCE,
  HOUSING_SEARCH_TYPE,
  SWIPE_ACTIONS,
} from 'src/constants/enums';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import { RedisService } from 'src/redis/redis.service';
import { FeedScorerService } from './services/feedScorer.service';
import { EligibleUser, FeedContext, FeedResponse } from './types';
import { REDIS_TTL } from 'src/constants/redis-ttl.config';
import { CacheKeys } from 'src/redis/cache-keys';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);
  constructor(
    @Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof schema>,
    private readonly redis: RedisService,
    private feedScorerService: FeedScorerService,
  ) {}

  async feedContext(userId: string): Promise<FeedContext> {
    const profile = await this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
      columns: {
        userId: true,
        city: true,
        gender: true,
        district: true,
      },
      with: {
        preferences: {
          columns: {
            genderPreference: true,
            housingSearchType: true,
            budgetMin: true,
            budgetMax: true,
            smokingHabit: true,
            petOwnership: true,
            petCompatibility: true,
            alcoholConsumption: true,
          },
        },
      },
    });

    if (!profile?.preferences) {
      throw new DomainException('PREFERENCES_NOT_FOUND');
    }

    return {
      userId: profile.userId,
      profile: {
        city: profile.city,
        gender: profile.gender,
        district: profile.district,
      },
      preferences: profile.preferences,
    };
  }
  private async getExcludedUserIds(userId: string): Promise<string[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const result = await this.db.execute<{ excluded_id: string }>(sql`
      SELECT DISTINCT excluded_id 
      FROM (
        SELECT CASE 
          WHEN ${schema.userBlocks.blockerId} = ${userId} 
          THEN ${schema.userBlocks.blockedId}
          ELSE ${schema.userBlocks.blockerId}
        END AS excluded_id
        FROM ${schema.userBlocks}
        WHERE ${schema.userBlocks.blockedId} = ${userId} 
           OR ${schema.userBlocks.blockerId} = ${userId}
        
        UNION ALL
        
        SELECT ${schema.swipes.swipedId}
        FROM ${schema.swipes}
        WHERE ${schema.swipes.swiperId} = ${userId}
          AND ${schema.swipes.action} = ${SWIPE_ACTIONS.PASS}
          AND ${schema.swipes.createdAt} >= ${thirtyDaysAgo}
        
        UNION ALL
        
        SELECT ${schema.swipes.swipedId}
        FROM ${schema.swipes}
        WHERE ${schema.swipes.swiperId} = ${userId}
          AND ${schema.swipes.action} = ${SWIPE_ACTIONS.LIKE}
        
        UNION ALL
        
        SELECT CASE 
          WHEN ${schema.matches.userFirstId} = ${userId} 
          THEN ${schema.matches.userSecondId}
          ELSE ${schema.matches.userFirstId}
        END
        FROM ${schema.matches}
        WHERE (${schema.matches.userFirstId} = ${userId}
               OR ${schema.matches.userSecondId} = ${userId})
          AND ${schema.matches.unmatchedAt} IS NULL
      ) AS all_excluded
    `);

      return result.rows.map((row) => row.excluded_id);
    } catch (error) {
      this.logger.error('Failed to get excluded user IDs', error);
      throw new DomainException('DATABASE_ERROR');
    }
  }

  //* filter feed candidates based on multiple criteria before weighting
  async applyExclusions(userId: string, candidates: EligibleUser[]) {
    const excludedIds = new Set(await this.getExcludedUserIds(userId));
    return candidates.filter((c) => !excludedIds.has(c.userId));
  }

  async _generateFreshFeed(userId: string): Promise<FeedResponse[]> {
    const context = await this.feedContext(userId);
    const candidates = await this.fetchEligiblePool(context);
    const filtered = await this.applyExclusions(userId, candidates);
    const scored = this.feedScorerService.scoreUsers(context, filtered);
    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 21);
    // TODO: shuffle algorithm

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return sorted.map(({ score, scoreBreakdown, ...user }) => user); //* return top 20
  }

  async generateFeed(userId: string): Promise<FeedResponse[]> {
    const cacheKey = CacheKeys.feed(userId);

    const cached = await this.redis.getJSON<FeedResponse[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const feed = await this._generateFreshFeed(userId);

    await this.redis.setJSONWithExpiry(cacheKey, feed, REDIS_TTL.FEED_CACHE);

    return feed;
  }

  private buildGenderFilter(context: FeedContext) {
    const pref = context.preferences?.genderPreference;
    if (!pref || pref === GENDER_PREFERENCE.MIXED) return undefined;
    if (pref === GENDER_PREFERENCE.FEMALE_ONLY)
      return eq(schema.profile.gender, GENDER.FEMALE);
    if (pref === GENDER_PREFERENCE.MALE_ONLY)
      return eq(schema.profile.gender, GENDER.MALE);

    return undefined;
  }

  //* Apply hard filters: city, gender preference, account status
  private async fetchEligiblePool(
    context: FeedContext,
  ): Promise<EligibleUser[]> {
    const genderFilter = this.buildGenderFilter(context);
    const budgetFilter = this.buildBudgetFilter(context);

    try {
      const result = await this.db
        .select({
          userId: schema.profile.userId,
          name: schema.profile.name,
          ageRange: schema.profile.ageRange,
          gender: schema.profile.gender,
          city: schema.profile.city,
          district: schema.profile.district,
          photoUrl: schema.profile.photoUrl,
          photoVerified: schema.profile.photoVerified,
          lastActiveAt: schema.profile.lastActiveAt,

          budgetMin: schema.preferences.budgetMin,
          budgetMax: schema.preferences.budgetMax,
          smokingHabit: schema.preferences.smokingHabit,
          petOwnership: schema.preferences.petOwnership,
          petCompatibility: schema.preferences.petCompatibility,
          alcoholConsumption: schema.preferences.alcoholConsumption,
        })
        .from(schema.profile)
        .innerJoin(
          schema.preferences,
          eq(schema.preferences.userId, schema.profile.userId),
        )
        .where(
          and(
            ne(schema.profile.userId, context.userId),
            eq(schema.profile.city, context.profile.city),
            eq(schema.profile.accountStatus, ACCOUNT_STATUS.ACTIVE),
            eq(
              schema.preferences.housingSearchType,
              HOUSING_SEARCH_TYPE.LOOKING_FOR_ROOMMATE,
            ),
            genderFilter,
            budgetFilter,
          ),
        )
        .limit(1000);
      return result;
    } catch (error) {
      this.logger.error(error);
      throw new DomainException('DATABASE_ERROR');
    }
  }
  // TODO move it t query builder
  private buildBudgetFilter(context: FeedContext): SQL | undefined {
    const userMin = context.preferences?.budgetMin;
    const userMax = context.preferences?.budgetMax;

    if (typeof userMin !== 'number' || typeof userMax !== 'number') {
      return undefined;
    }

    return and(
      lte(schema.preferences.budgetMin, userMax),
      gte(schema.preferences.budgetMax, userMin),
    );
  }
}
