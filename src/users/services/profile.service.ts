import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import {
  CreateProfileDto,
  UpdateAddressDto,
  UpdatePhotoDto,
} from '../dto/profile-dto';

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

  async findProfile(userId: string) {
    const profile = await this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfilePhoto(userId: string, updatePhotoDto: UpdatePhotoDto) {
    const existingProfile = await this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
    });
    if (!existingProfile) {
      throw new NotFoundException('Profile not found');
    }

    const [updatedProfile] = await this.db
      .update(schema.profile)
      .set({
        photoUrl: updatePhotoDto.photoUrl,
      })
      .where(eq(schema.profile.userId, userId))
      .returning();

    this.logger.log(`Photo updated for user: ${userId}`);
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
      throw new NotFoundException('Profile not found');
    }

    const [updatedProfile] = await this.db
      .update(schema.profile)
      .set({
        city: updateAddressDto.city,
        district: updateAddressDto.district,
      })
      .where(eq(schema.profile.userId, userId))
      .returning();

    this.logger.log(`Address updated for user: ${userId}`);
    return updatedProfile;
  }
}
