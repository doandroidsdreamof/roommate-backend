import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { POSTING_STATUS } from 'src/constants/enums';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import { validateOwnership } from 'src/helpers/validateOwnership';
import { UsersService } from 'src/users/users.service';
import {
  ClosePostingDto,
  CreatePostingDto,
  UpdatePostingDto,
  UpdatePostingImagesDto,
} from './dto/postings.dto';
import { MAXIMUM_POSTINGS } from 'src/constants/configuration';

@Injectable()
export class PostingsService {
  private readonly logger = new Logger(PostingsService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private usersService: UsersService,
  ) {}

  async getPosting(postingId: string, userId: string) {
    const isUserView = await this.isUserViewedPostingDetail(postingId, userId);
    if (!isUserView) {
      await this.createView(postingId, userId);
    }
    const posting = await this.db.query.postings.findFirst({
      where: and(
        eq(schema.postings.id, postingId),
        sql`${schema.postings.deletedAt} IS NULL`,
      ),
      columns: {
        status: false,
        updatedAt: false,
        createdAt: false,
        viewCount: false,
        bookmarkCount: false,
      },
      with: {
        specs: {
          columns: {
            createdAt: false,
            updatedAt: false,
          },
          with: {
            posting: true,
          },
        },
        user: {
          columns: {
            id: true,
          },
        },
      },
    });

    if (!posting) {
      throw new DomainException('POSTING_NOT_FOUND');
    }

    const bookmark = await this.db.query.userBookmarks.findFirst({
      where: and(
        eq(schema.userBookmarks.userId, userId),
        eq(schema.userBookmarks.postingId, postingId),
      ),
    });

    return {
      ...posting,
      isBookmarked: !!bookmark,
    };
  }

  async createView(postingId: string, userId: string) {
    await this.db.transaction(async (tx) => {
      await tx.insert(schema.postingViews).values({
        postingId,
        userId,
      });
      await tx
        .update(schema.postings)
        .set({ viewCount: sql`${schema.postings.viewCount} + 1` })
        .where(eq(schema.postings.id, postingId));
    });
  }

  async isUserViewedPostingDetail(
    postingId: string,
    userId: string,
  ): Promise<boolean> {
    const isViewed = await this.db.query.postingViews.findFirst({
      where: and(
        eq(schema.postingViews.postingId, postingId),
        eq(schema.postingViews.userId, userId),
      ),
    });
    return !!isViewed;
  }

  async create(userId: string, createPostingDto: CreatePostingDto) {
    const { specs, images, ...postingData } = createPostingDto;
    await this.checkPostingLimit(userId);

    await this.checkDuplicatePosting(userId, postingData.neighborhoodId);

    try {
      await this.db.transaction(async (tx) => {
        this.logger.debug('Transaction started');

        this.logger.debug('Inserting posting...');
        const [posting] = await tx
          .insert(schema.postings)
          .values({
            userId,
            ...postingData,
            latitude: postingData.latitude.toString(),
            longitude: postingData.longitude.toString(),
            status: POSTING_STATUS.ACTIVE,
            availableFrom: new Date(postingData.availableFrom),
          })
          .returning();

        if (!posting) {
          throw new DomainException('POSTING_CREATION_FAILED');
        }

        // 2. Insert posting specs
        this.logger.debug('Inserting posting specs...');
        const [postingSpec] = await tx
          .insert(schema.postingSpecs)
          .values({
            postingId: posting.id,
            ...specs,
          })
          .returning();
        if (!postingSpec) {
          throw new DomainException('POSTING_SPEC_CREATION_FAILED');
        }
        // 3. Insert posting images (if existed)
        if (images && images.length > 0) {
          await tx.insert(schema.postingImages).values({
            postingSpecsId: postingSpec.id,
            images: images,
          });
          this.logger.debug(`${images.length} images inserted`);
        }

        this.logger.debug('Transaction completed successfully');
        await this.usersService.incrementPostingCount(userId);
        return posting;
      });

      return {
        message: 'Posting created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create posting', error);
      this.logger.warn('Transaction rolled back');
      throw new DomainException('POSTING_CREATION_FAILED');
    }
  }

  private async findPostingById(postingId: string) {
    const posting = await this.db.query.postings.findFirst({
      where: and(
        eq(schema.postings.id, postingId),
        sql`${schema.postings.deletedAt} IS NULL`,
      ),
    });

    if (!posting) {
      throw new DomainException('POSTING_NOT_FOUND');
    }

    return posting;
  }

  async update(
    userId: string,
    postingId: string,
    updatePostingDto: UpdatePostingDto,
  ) {
    const { specs, ...postingData } = updatePostingDto;
    const existingPosting = await this.findPostingById(postingId);

    validateOwnership(existingPosting.userId, userId, 'posting');

    try {
      await this.db.transaction(async (tx) => {
        const { availableFrom, ...restPostingData } = postingData;

        const updateData = {
          ...restPostingData,
          ...(availableFrom !== undefined && {
            availableFrom: new Date(availableFrom),
          }),
        };

        await tx
          .update(schema.postings)
          .set(updateData)
          .where(eq(schema.postings.id, postingId));

        if (specs && Object.keys(specs).length > 0) {
          const { ...restSpecs } = specs;

          const specsUpdateData = {
            ...restSpecs,
          };

          await tx
            .update(schema.postingSpecs)
            .set(specsUpdateData)
            .where(eq(schema.postingSpecs.postingId, postingId));

          this.logger.debug('Posting specs updated');
        }

        this.logger.debug('Transaction completed successfully');
      });

      return {
        message: 'Posting updated successfully',
      };
    } catch (error) {
      this.logger.warn('Update posting: transaction rolled back');
      throw new DomainException('POSTING_UPDATE_FAILED');
    }
  }
  private async checkDuplicatePosting(
    userId: string,
    neighborhoodId: number,
  ): Promise<void> {
    const existingPosting = await this.db.query.postings.findFirst({
      where: and(
        eq(schema.postings.userId, userId),
        eq(schema.postings.neighborhoodId, neighborhoodId),
        eq(schema.postings.status, 'active'),
        sql`${schema.postings.deletedAt} IS NULL`,
      ),
    });
    if (existingPosting) {
      throw new DomainException('DUPLICATE_POSTING');
    }
  }

  async updatePostingsImages(
    userId: string,
    postingImageDto: UpdatePostingImagesDto,
  ) {
    const { postingImageId, postingId, images } = postingImageDto;
    this.logger.log('TEST================>', images);
    const existingPosting = await this.findPostingById(postingId);
    validateOwnership(existingPosting.userId, userId, 'posting_image');

    const currentRecord = await this.db
      .select({ images: schema.postingImages.images })
      .from(schema.postingImages)
      .where(eq(schema.postingImages.id, postingImageId))
      .limit(1);

    if (!currentRecord[0]) {
      throw new DomainException('POSTING_IMAGE_NOT_FOUND');
    }
    //* do not update if there is no URL change
    const hasChanges = images?.some((newImg) => {
      const existingImg = currentRecord[0]?.images.find(
        (img) => img.order === newImg.order,
      );
      return !existingImg || existingImg.url !== newImg.url;
    });

    if (!hasChanges) {
      return { message: 'No changes detected' };
    }

    await this.db
      .update(schema.postingImages)
      .set({
        images: sql`(
        SELECT jsonb_agg(
          COALESCE(
            (
              SELECT to_jsonb(u)
              FROM jsonb_to_recordset(${JSON.stringify(images)}::jsonb) 
                AS u(url text, "order" int)
              WHERE u.order = (elem->>'order')::int
            ),
            elem
          )
          ORDER BY (elem->>'order')::int
        )
        FROM jsonb_array_elements(images) elem
      )`,
      })
      .where(eq(schema.postingImages.id, postingImageId));
  }

  async closePosting(
    userId: string,
    postingId: string,
    closePostingDto: ClosePostingDto,
  ) {
    const { status } = closePostingDto;
    const existingPosting = await this.findPostingById(postingId);

    validateOwnership(existingPosting.userId, userId, 'posting');

    if (existingPosting.deletedAt) {
      throw new DomainException('POSTING_ALREADY_CLOSED');
    }

    await this.db
      .update(schema.postings)
      .set({
        status,
        deletedAt: new Date(),
      })
      .where(eq(schema.postings.id, postingId));

    return {
      message: `Posting closed successfully as ${status}`,
    };
  }
  async isPostingExist(userId: string): Promise<boolean> {
    const checkPosting = await this.db.query.postings.findFirst({
      where: and(
        eq(schema.postings.userId, userId),
        eq(schema.postings.status, POSTING_STATUS.ACTIVE),
        isNull(schema.postings.deletedAt),
      ),
    });
    return !!checkPosting;
  }
  /**
   * Check if user has reached maximum posting limit (2)
   */
  private async checkPostingLimit(userId: string): Promise<void> {
    const count = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.postings)
      .where(
        and(
          eq(schema.postings.userId, userId),
          isNull(schema.postings.deletedAt),
        ),
      );

    const postingCount = Number(count[0]?.count);

    if (postingCount >= MAXIMUM_POSTINGS.LIMIT) {
      throw new DomainException('MAX_POSTINGS_REACHED');
    }
  }
}
