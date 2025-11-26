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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private profileService: ProfileService,
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
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
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
}
