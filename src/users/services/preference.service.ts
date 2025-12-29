import { Inject, Injectable, Logger } from '@nestjs/common';
import { DrizzleQueryError, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseError } from 'pg';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import {
  CreatePreferencesDto,
  UpdatePreferencesDto,
} from '../dto/preference.dto';
import { RedisService } from 'src/redis/redis.service';
import { CacheKeys } from 'src/redis/cache-keys';
import { REDIS_TTL } from 'src/constants/redis-ttl.config';

@Injectable()
export class PreferenceService {
  private readonly logger = new Logger(PreferenceService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly redis: RedisService,
  ) {}

  async insertPreferences(
    userId: string,
    createPreferencesDto: CreatePreferencesDto,
  ) {
    try {
      const [preference] = await this.db
        .insert(schema.preferences)
        .values({ userId, ...createPreferencesDto })
        .returning();

      this.logger.log(`Preferences created for user: ${userId}`);
      return preference;
    } catch (error) {
      // TODO making exception filter for this structure may a good idea
      if (error instanceof DrizzleQueryError) {
        if (error.cause instanceof DatabaseError) {
          if (error.cause.code === '23505') {
            throw new DomainException('PREFERENCES_ALREADY_EXIST');
          }
        }
      }
      throw error;
    }
  }

  async findPreferences(userId: string) {
    const cacheKey = CacheKeys.userPreference(userId);

    const cached =
      await this.redis.getJSON<typeof schema.preferences.$inferSelect>(
        cacheKey,
      );
    if (cached) {
      return cached;
    }
    const preference = await this.findPreferencesByUserId(userId);
    await this.redis.setJSONWithExpiry(
      cacheKey,
      preference,
      REDIS_TTL.PREFERENCES,
    );

    return preference;
  }

  async updatePreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ) {
    await this.findPreferencesByUserId(userId);

    const [updatedPreference] = await this.db
      .update(schema.preferences)
      .set(updatePreferencesDto)
      .where(eq(schema.preferences.userId, userId))
      .returning();

    await this.redis.del(CacheKeys.userPreference(userId));

    return updatedPreference;
  }

  private async findPreferencesByUserId(userId: string) {
    const preference = await this.db.query.preferences.findFirst({
      where: eq(schema.preferences.userId, userId),
    });

    if (!preference) {
      throw new DomainException('PREFERENCES_NOT_FOUND');
    }

    return preference;
  }
}
