import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import { paginateResults } from 'src/helpers/cursorPagination';
import { BlockUserDto } from './dto/blocks.dto';
import {
  BookmarkPaginationQueryDto,
  BookmarkPostingDto,
} from './dto/bookmarks.dto';
import {
  CreatePreferencesDto,
  UpdatePreferencesDto,
} from './dto/preference.dto';
import {
  CreateProfileDto,
  UpdateAddressDto,
  UpdatePhotoDto,
} from './dto/profile.dto';
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
      with: {
        profile: {
          columns: {
            name: true,
          },
        },
      },
    });
    return userName?.profile?.name;
  }

  async createUser(email: string) {
    const { users: usersSchema } = schema;
    const [user] = await this.db
      .insert(schema.users)
      .values({ email, isEmailVerified: true })
      .returning({
        id: usersSchema.id,
        email: usersSchema.email,
      });
    return user;
  }
  async findById(userId: string): Promise<typeof schema.users.$inferSelect> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new DomainException('USER_NOT_FOUND');
    }

    return user;
  }

  async blockUser(userId: string, blockUserDto: BlockUserDto) {
    const { blockedId } = blockUserDto;

    if (userId === blockedId) {
      throw new DomainException('CANNOT_BLOCK_SELF');
    }

    const isBlockExist = await this.db.query.userBlocks.findFirst({
      where: and(
        eq(schema.userBlocks.blockerId, userId),
        eq(schema.userBlocks.blockedId, blockedId),
      ),
    });

    if (isBlockExist) {
      throw new DomainException('BLOCK_ALREADY_EXISTS');
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
      throw new DomainException('BLOCK_NOT_FOUND');
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
      throw new DomainException('BLOCK_NOT_FOUND');
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
  }

  async decrementPostingCount(userId: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({
        postingCount: sql`GREATEST(${schema.users.postingCount} - 1, 0)`, // Prevent negative
      })
      .where(eq(schema.users.id, userId));
  }

  protected async validateUserExists(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new DomainException('USER_NOT_FOUND');
    }
  }

  async bookmarkPosting(userId: string, bookmarkDto: BookmarkPostingDto) {
    const { postingId } = bookmarkDto;

    const posting = await this.db.query.postings.findFirst({
      where: and(
        eq(schema.postings.id, postingId),
        sql`${schema.postings.deletedAt} IS NULL`,
      ),
    });

    if (!posting) {
      throw new DomainException('POSTING_NOT_FOUND');
    }

    const existingBookmark = await this.db.query.userBookmarks.findFirst({
      where: and(
        eq(schema.userBookmarks.userId, userId),
        eq(schema.userBookmarks.postingId, postingId),
      ),
    });

    if (existingBookmark) {
      throw new DomainException('BOOKMARK_ALREADY_EXISTS');
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
      throw new DomainException('BOOKMARK_FAILED', { operation: 'create' });
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
      throw new DomainException('BOOKMARK_NOT_FOUND');
    }

    try {
      await this.db.transaction(async (tx) => {
        await tx
          .delete(schema.userBookmarks)
          .where(eq(schema.userBookmarks.id, existingBookmark.id));

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
      throw new DomainException('BOOKMARK_FAILED', { operation: 'delete' });
    }
  }

  async getUserBookmarks(
    userId: string,
    paginationDto: BookmarkPaginationQueryDto,
  ) {
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
  async isBlockedRelationship(
    userId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const block = await this.db.query.userBlocks.findFirst({
      where: or(
        and(
          eq(schema.userBlocks.blockerId, userId),
          eq(schema.userBlocks.blockedId, targetUserId),
        ),
        and(
          eq(schema.userBlocks.blockerId, targetUserId),
          eq(schema.userBlocks.blockedId, userId),
        ),
      ),
    });

    return !!block;
  }
}
