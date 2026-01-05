import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { REDIS_TTL } from 'src/constants/redis-ttl.config';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import { CacheKeys } from 'src/redis/cache-keys';
import { RedisService } from 'src/redis/redis.service';
import {
  CreateProfileDto,
  UpdateAddressDto,
  UpdatePhotoDto,
} from '../dto/profile.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly redis: RedisService,
  ) {}
  async insertProfile(userId: string, createProfileDto: CreateProfileDto) {
    this.logger.log('profile', createProfileDto);
    const existingProfile = await this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
    });

    if (existingProfile) {
      throw new DomainException('PROFILE_ALREADY_EXISTS');
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

  async findProfile(userId: string) {
    const cacheKey = CacheKeys.userProfile(userId);

    const cached =
      await this.redis.getJSON<typeof schema.profile.$inferSelect>(cacheKey);
    if (cached) {
      return cached;
    }

    const profile = await this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
    });

    if (!profile) {
      throw new DomainException('PROFILE_NOT_FOUND');
    }
    await this.redis.setJSONWithExpiry(cacheKey, profile, REDIS_TTL.PROFILE);

    return profile;
  }

  async updateProfilePhoto(userId: string, updatePhotoDto: UpdatePhotoDto) {
    const existingProfile = await this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
    });
    if (!existingProfile) {
      throw new DomainException('PROFILE_NOT_FOUND');
    }

    const [updatedProfile] = await this.db
      .update(schema.profile)
      .set({
        photoUrl: updatePhotoDto.photoUrl,
      })
      .where(eq(schema.profile.userId, userId))
      .returning();

    await this.redis.del(CacheKeys.userProfile(userId));

    return updatedProfile;
  }

  async updateProfileAddress(
    userId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    const existingProfile = await this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
    });

    if (!existingProfile) {
      throw new DomainException('PROFILE_NOT_FOUND');
    }

    const [updatedProfile] = await this.db
      .update(schema.profile)
      .set({
        city: updateAddressDto.city,
        district: updateAddressDto.district,
      })
      .where(eq(schema.profile.userId, userId))
      .returning();

    await this.redis.del(CacheKeys.userProfile(userId));

    return updatedProfile;
  }
}
