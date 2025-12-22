import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { UsersService } from 'src/users/users.service';
import { EligibleUser, FeedContext } from './types';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private usersService: UsersService,
  ) {}

  async feedContext(userId: string): Promise<FeedContext> {
    const context = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: {
        id: true,
      },
      with: {
        profile: {
          columns: {
            city: true,
            gender: true,
            district: true,
          },
        },
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
    if (!context || !context.profile) {
      throw new NotFoundException('Context not found');
    }

    return {
      userId: context.id,
      profile: context.profile,
      preferences: context.preferences,
    };
  }

  async generateFeed(userId: string) {
    const context = await this.feedContext(userId);
    const pool = await this.fetchEligiblePool(context);
    this.logger.log('poolLength => ', pool.length);
    // TODO: Apply exclusions (swipes, blocks)
    // TODO: Score and rank users
    // TODO: Track shown users in Redis

    return pool;
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

    return await this.db
      .select({
        userId: schema.users.id,
        profile: schema.profile,
        preferences: schema.preferences,
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
  }
}
