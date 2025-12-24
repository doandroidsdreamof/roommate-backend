import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
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
      throw new NotFoundException('Context not found');
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
    this.logger.log('scored', scored.length);
    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 21);

    // TODO: shuffle algorithm
    // TODO: Track shown users in Redis
    //  score, scoreBreakdown,
    return sorted.map(({ ...user }) => user); //* return top 20
  }

  private buildGenderFilter(context: FeedContext) {
    const pref = context.preferences?.genderPreference;
    if (!pref || pref === 'mixed') return undefined;
    if (pref === 'female_only') return eq(schema.profile.gender, 'female');
    if (pref === 'male_only') return eq(schema.profile.gender, 'male');

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
            eq(schema.profile.accountStatus, 'active'),
            eq(schema.preferences.housingSearchType, 'looking_for_roommate'),
            genderFilter,
          ),
        );

      return result;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
