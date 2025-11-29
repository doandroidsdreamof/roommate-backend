import {
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
import { validateOwnership } from 'src/helpers/validateOwnership';
import { UsersService } from 'src/users/users.service';
import { CreatePostingDto, UpdatePostingDto } from './dto/postings.dto';

@Injectable()
export class PostingsService {
  private readonly logger = new Logger(PostingsService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private usersService: UsersService,
  ) {}

  // TODO refactor these methods and read doc about auto rollbacks
  async create(userId: string, createPostingDto: CreatePostingDto) {
    const { specs, images, ...postingData } = createPostingDto;
    await this.checkDuplicatePosting(userId, postingData.neighborhoodId);

    try {
      const result = await this.db.transaction(async (tx) => {
        this.logger.debug('Transaction started');

        this.logger.debug('Inserting posting...');
        const [posting] = await tx
          .insert(schema.postings)
          .values({
            userId,
            ...postingData,
            latitude: postingData.latitude.toString(),
            longitude: postingData.longitude.toString(),
            availableFrom: new Date(postingData.availableFrom),
          })
          .returning();
        this.logger.debug(`Posting created with ID: ${posting.id}`);

        // 2. Insert posting specs
        this.logger.debug('Inserting posting specs...');
        const [postingSpec] = await tx
          .insert(schema.postingSpecs)
          .values({
            postingId: posting.id,
            ...specs,
            availableUntil: specs.availableUntil
              ? new Date(specs.availableUntil)
              : undefined,
          })
          .returning();
        this.logger.debug(`Posting specs created with ID: ${postingSpec.id}`);

        // 3. Insert posting images (if existed)
        if (images && images.length > 0) {
          this.logger.debug(`Inserting ${images.length} images...`);
          await tx.insert(schema.postingImages).values(
            images.map((img, index) => ({
              postingSpecsId: postingSpec.id,
              imageUrl: img.url,
              displayOrder: index,
            })),
          );
          this.logger.debug(`${images.length} images inserted`);
        }

        this.logger.debug('Transaction completed successfully');
        await this.usersService.incrementPostingCount(userId);
        return posting;
      });

      this.logger.log(`Posting created successfully: ${result.id}`);
      return {
        message: 'Posting created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create posting', error);

      this.logger.warn('Transaction rolled back');

      throw new InternalServerErrorException('Failed to create posting');
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
      throw new NotFoundException('Posting not found');
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
        this.logger.debug('Transaction started');

        this.logger.debug('Updating posting...');

        const updateData = {
          ...postingData,
          ...(postingData.availableFrom !== undefined && {
            availableFrom: new Date(postingData.availableFrom),
          }),
        };

        await tx
          .update(schema.postings)
          .set(updateData)
          .where(eq(schema.postings.id, postingId));

        this.logger.debug('Posting updated');
        if (specs && Object.keys(specs).length > 0) {
          this.logger.debug('Updating posting specs...');

          const specsUpdateData = {
            ...specs,
            ...(specs.availableUntil !== undefined && {
              availableUntil: new Date(specs.availableUntil),
            }),
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
      this.logger.warn('Transaction rolled back');
      throw new InternalServerErrorException('Failed to update posting');
    }
  }
  // TODO more robust mechanisms to check
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
      throw new ConflictException(
        'You already have an active posting in this neighborhood. Please deactivate it before creating a new one.',
      );
    }
  }
}
