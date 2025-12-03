import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { paginateResults } from 'src/helpers/cursorPagination';
import { BlockUserDto } from './dto/blocks.dto';
import { BookmarkPostingDto, PaginationQueryDto } from './dto/bookmarks.dto';
import {
  CreatePreferencesDto,
  UpdatePreferencesDto,
} from './dto/preference.dto';
import {
  CreateProfileDto,
  UpdateAddressDto,
  UpdatePhotoDto,
} from './dto/profile-dto';
import { PreferenceService } from './services/preference.service';
import { ProfileService } from './services/profile.service';

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

  async blockUser(userId: string, blockUserDto: BlockUserDto) {
    const { blockedId } = blockUserDto;

    if (userId === blockedId) {
      throw new BadRequestException();
    }

    const isBlockExist = await this.db.query.userBlocks.findFirst({
      where: and(
        eq(schema.userBlocks.blockerId, userId),
        eq(schema.userBlocks.blockedId, blockedId),
      ),
    });

    if (isBlockExist) {
      throw new ConflictException();
    }

    await this.db.insert(schema.userBlocks).values({
      blockedId: blockedId,
      blockerId: userId,
    });

    return { message: 'User blocked successfully' };
  }

  async unblockUser(userId: string, unblockUserDto: BlockUserDto) {
    const { blockedId } = unblockUserDto;

    if (userId === blockedId) {
      throw new BadRequestException();
    }

    const result = await this.db
      .delete(schema.userBlocks)
      .where(
        and(
          eq(schema.userBlocks.blockedId, blockedId),
          eq(schema.userBlocks.blockerId, userId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Block not found');
    }

    return { message: 'User unblocked successfully' };
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

  async incrementPostingCount(userId: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({ postingCount: sql`${schema.users.postingCount} + 1` })
      .where(eq(schema.users.id, userId));

    this.logger.debug(`Incremented posting count for user ${userId}`);
  }

  async decrementPostingCount(userId: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({
        postingCount: sql`GREATEST(${schema.users.postingCount} - 1, 0)`, // Prevent negative
      })
      .where(eq(schema.users.id, userId));

    this.logger.debug(`Decremented posting count for user ${userId}`);
  }

  private async validateUserExists(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async bookmarkPosting(userId: string, bookmarkDto: BookmarkPostingDto) {
    const { postingId } = bookmarkDto;

    // TODO code duplication and ownership guards
    const posting = await this.db.query.postings.findFirst({
      where: and(
        eq(schema.postings.id, postingId),
        sql`${schema.postings.deletedAt} IS NULL`,
      ),
    });

    if (!posting) {
      throw new NotFoundException();
    }

    const existingBookmark = await this.db.query.userBookmarks.findFirst({
      where: and(
        eq(schema.userBookmarks.userId, userId),
        eq(schema.userBookmarks.postingId, postingId),
      ),
    });

    if (existingBookmark) {
      throw new ConflictException('Posting already bookmarked');
    }

    try {
      await this.db.transaction(async (tx) => {
        // Create bookmark
        await tx.insert(schema.userBookmarks).values({
          userId,
          postingId,
        });

        // Increment bookmark count
        await tx
          .update(schema.postings)
          .set({
            bookmarkCount: sql`${schema.postings.bookmarkCount} + 1`,
          })
          .where(eq(schema.postings.id, postingId));
      });

      return {
        message: 'Posting bookmarked successfully',
      };
    } catch (error) {
      this.logger.error('Failed to bookmark posting', error);
      throw new InternalServerErrorException('Failed to bookmark posting');
    }
  }

  async unbookmarkPosting(userId: string, bookmarkDto: BookmarkPostingDto) {
    const { postingId } = bookmarkDto;

    const existingBookmark = await this.db.query.userBookmarks.findFirst({
      where: and(
        eq(schema.userBookmarks.userId, userId),
        eq(schema.userBookmarks.postingId, postingId),
      ),
    });

    if (!existingBookmark) {
      throw new NotFoundException();
    }

    try {
      await this.db.transaction(async (tx) => {
        await tx
          .delete(schema.userBookmarks)
          .where(eq(schema.userBookmarks.id, existingBookmark.id));

        // Decrement bookmark count
        await tx
          .update(schema.postings)
          .set({
            bookmarkCount: sql`GREATEST(${schema.postings.bookmarkCount} - 1, 0)`,
          })
          .where(eq(schema.postings.id, postingId));
      });

      return {
        message: 'Posting unbookmarked successfully',
      };
    } catch (error) {
      this.logger.error('Failed to unbookmark posting', error);
      throw new InternalServerErrorException();
    }
  }

  // TODO separated service for bookmarks
  // TODO return last timeStamp as nextCursor
  // TODO how to use with UUIDs => Composite Values?
  // TODO tests for pagination
  async getUserBookmarks(userId: string, paginationDto: PaginationQueryDto) {
    const { limit, cursor } = paginationDto;
    const bookmarks = await this.db.query.userBookmarks.findMany({
      where: and(
        eq(schema.userBookmarks.userId, userId),
        cursor
          ? sql`${schema.userBookmarks.createdAt} < ${new Date(cursor)}` //* is it safe?
          : undefined,
      ),
      with: {
        posting: {
          columns: {
            id: true,
            title: true,
            coverImageUrl: true,
            city: true,
            district: true,
            rentAmount: true,
            availableFrom: true,
            viewCount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: (bookmarks, { desc }) => [desc(bookmarks.createdAt)],
      limit: limit + 1,
    });
    const { items, nextCursor, hasMore } = paginateResults(bookmarks, limit);

    // TODO return type
    return {
      bookmarks: items.map((b) => ({
        id: b.id,
        postingId: b.postingId,
        bookmarkedAt: b.createdAt,
        posting: b.posting,
      })),
      nextCursor,
      hasMore,
    };
  }
}
