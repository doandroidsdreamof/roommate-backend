import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, gte, lte, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  ACCOUNT_STATUS,
  GENDER,
  GENDER_PREFERENCE,
  HOUSING_SEARCH_TYPE,
} from 'src/constants/enums';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import { MatchesService } from 'src/matches/matches.service';
import { SwipesService } from 'src/swipes/swipes.service';
import { UsersService } from 'src/users/users.service';
import { FeedScorerService } from './services/feedScorer.service';
import { EligibleUser, FeedContext } from './types';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private usersService: UsersService,
    private swipesService: SwipesService,
    private matchesService: MatchesService,
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

  //* filter feed candidates based on multiple criteria before weighting
  async applyExclusions(userId: string, candidates: EligibleUser[]) {
    const [blockedIds, passedIds, likedIds, matchedIds] = await Promise.all([
      this.usersService.getBlockedUserIds(userId),
      this.swipesService.getPassedSwipeIds(userId),
      this.swipesService.getLikedSwipeIds(userId),
      this.matchesService.getMatchedUserIds(userId),
    ]);

    const excludedIds = new Set([
      ...blockedIds,
      ...passedIds,
      ...likedIds,
      ...matchedIds,
    ]);

    return candidates.filter((c) => !excludedIds.has(c.userId));
  }

  async generateFeed(userId: string) {
    const context = await this.feedContext(userId);
    const candidates = await this.fetchEligiblePool(context);
    const filtered = await this.applyExclusions(userId, candidates);
    const scored = this.feedScorerService.scoreUsers(context, filtered);
    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 21);

    // TODO: shuffle algorithm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return sorted.map(({ score, scoreBreakdown, ...user }) => user); //* return top 20
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
            and(
              lte(schema.preferences.budgetMin, context.preferences.budgetMax),
              gte(schema.preferences.budgetMax, context.preferences.budgetMin),
            ),
          ),
        )
        .limit(1000);
      return result;
    } catch (error) {
      this.logger.error(error);
      throw new DomainException('DATABASE_ERROR');
    }
  }
}
