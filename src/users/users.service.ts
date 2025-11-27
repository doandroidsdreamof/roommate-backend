import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from '../database/schema';
import {
  CreateProfileDto,
  UpdateAddressDto,
  UpdatePhotoDto,
} from './dto/profile-dto';
import { ProfileService } from './services/profile.service';
import { PreferenceService } from './services/preference.service';
import {
  CreatePreferencesDto,
  UpdatePreferencesDto,
} from './dto/preference.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private profileService: ProfileService,
    private preferenceService: PreferenceService,
  ) {}

  async getUsername(email: string): Promise<string | undefined> {
    const userName = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    return userName?.username;
  }

  async createUser(email: string) {
    const { users: usersSchema } = schema;
    const [user] = await this.db
      .insert(schema.users)
      .values({ email, isEmailVerified: true })
      .returning({
        id: usersSchema.id,
        email: usersSchema.email,
        isActive: usersSchema.isActive,
      });
    return user;
  }
  async findById(
    userId: string,
  ): Promise<typeof schema.users.$inferSelect | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    return user ?? null;
  }

  async createProfile(userId: string, createProfileDto: CreateProfileDto) {
    await this.validateUserExists(userId);
    const profile = await this.profileService.insertProfile(
      userId,
      createProfileDto,
    );

    return profile;
  }

  async getProfile(userId: string) {
    return await this.profileService.findProfile(userId);
  }

  async updateAddress(userId: string, updateAddressDto: UpdateAddressDto) {
    return await this.profileService.updateProfileAddress(
      userId,
      updateAddressDto,
    );
  }
  async updatePhoto(userId: string, updatePhotoDto: UpdatePhotoDto) {
    return await this.profileService.updateProfilePhoto(userId, updatePhotoDto);
  }

  async getPreference(userId: string) {
    return await this.preferenceService.findPreferences(userId);
  }

  async findByEmail(email: string) {
    return await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
      columns: {
        id: true,
        isActive: true,
        email: true,
      },
    });
  }

  async createPreferences(
    userId: string,
    createPreferencesDto: CreatePreferencesDto,
  ) {
    await this.validateUserExists(userId);
    return this.preferenceService.insertPreferences(
      userId,
      createPreferencesDto,
    );
  }

  async updatePreference(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ) {
    await this.validateUserExists(userId);
    return this.preferenceService.updatePreferences(
      userId,
      updatePreferencesDto,
    );
  }

  private async validateUserExists(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
