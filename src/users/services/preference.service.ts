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

@Injectable()
export class PreferenceService {
  private readonly logger = new Logger(PreferenceService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
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
    const preference = await this.findPreferencesByUserId(userId);
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

    this.logger.log(`Preferences updated for user: ${userId}`);
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
