import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { UsersService } from 'src/users/users.service';
import { EligibleUser, FeedContext } from './types';
import { SwipesService } from 'src/swipes/swipes.service';
import { MatchesService } from 'src/matches/matches.service';
import { FeedScorerService } from './services/feedScorer.service';

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
    const result = await this.db
      .select({
        userId: schema.users.id,
        city: schema.profile.city,
        gender: schema.profile.gender,
        district: schema.profile.district,
        genderPreference: schema.preferences.genderPreference,
        housingSearchType: schema.preferences.housingSearchType,
        budgetMin: schema.preferences.budgetMin,
        budgetMax: schema.preferences.budgetMax,
        smokingHabit: schema.preferences.smokingHabit,
        petOwnership: schema.preferences.petOwnership,
        petCompatibility: schema.preferences.petCompatibility,
        alcoholConsumption: schema.preferences.alcoholConsumption,
      })
      .from(schema.users)
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.users.id))
      .innerJoin(
        schema.preferences,
        eq(schema.preferences.userId, schema.users.id),
      )
      .where(eq(schema.users.id, userId))
      .limit(1);
    const context = result[0];
    if (!context) {
      throw new NotFoundException('Context not found');
    }

    return {
      userId: context.userId,
      profile: {
        city: context.city,
        gender: context.gender,
        district: context.district,
      },
      preferences: {
        genderPreference: context.genderPreference,
        housingSearchType: context.housingSearchType,
        budgetMin: context.budgetMin,
        budgetMax: context.budgetMax,
        smokingHabit: context.smokingHabit,
        petOwnership: context.petOwnership,
        petCompatibility: context.petCompatibility,
        alcoholConsumption: context.alcoholConsumption,
      },
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
  
    return sorted.map(({ score, scoreBreakdown, ...user }) => user); //* return top 20
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
          userId: schema.users.id,
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
        .from(schema.users)
        .innerJoin(schema.profile, eq(schema.profile.userId, schema.users.id))
        .innerJoin(
          schema.preferences,
          eq(schema.preferences.userId, schema.users.id),
        )
        .where(
          and(
            isNull(schema.users.deletedAt),
            ne(schema.users.id, context.userId),
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
