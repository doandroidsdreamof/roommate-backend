import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from '../../database/schema';
import { CreateProfileDto } from '../dto/profile-dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}
  async insertProfile(userId: string, createProfileDto: CreateProfileDto) {
    this.logger.log('profile', createProfileDto);
    const existingProfile = await this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
    });

    if (existingProfile) {
      throw new ConflictException('Profile already exists for this user');
    }

    const [profile] = await this.db
      .insert(schema.profile)
      .values({
        userId,
        ...createProfileDto,
      })
      .returning();

    return profile;
  }
}
