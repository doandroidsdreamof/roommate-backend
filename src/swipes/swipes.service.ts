import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { SWIPE_ACTIONS } from 'src/constants/enums';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import { MatchesService } from 'src/matches/matches.service';
import { UsersService } from 'src/users/users.service';
import { CreateSwipeDto } from './dto/swipes.dto';
import { RedisService } from 'src/redis/redis.service';
import { CacheKeys } from 'src/redis/cache-keys';
import { MessagingService } from 'src/messaging/messaging.service';

@Injectable()
export class SwipesService {
  private readonly logger = new Logger(SwipesService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private usersService: UsersService,
    private matchesService: MatchesService,
    private messagingService: MessagingService,
    private readonly redis: RedisService,
  ) {}

  async swipeAction(userId: string, createSwipeDto: CreateSwipeDto) {
    const { action, swipedId } = createSwipeDto;

    await this.checkAndResetSwipeLimit(userId);

    if (userId === swipedId) {
      throw new DomainException('CANNOT_SWIPE_SELF');
    }
    const targetUser = await this.db.query.users.findFirst({
      where: eq(schema.users.id, swipedId),
    });

    if (!targetUser) {
      throw new DomainException('SWIPE_TARGET_NOT_FOUND');
    }
    const isBlocked = await this.usersService.isBlockedRelationship(
      userId,
      swipedId,
    );
    if (isBlocked) {
      throw new DomainException('BLOCKED_USER_INTERACTION');
    }
    try {
      const [swipe] = await this.db
        .insert(schema.swipes)
        .values({
          swiperId: userId,
          swipedId,
          action, //* => pass or like
        })
        .onConflictDoUpdate({
          target: [schema.swipes.swiperId, schema.swipes.swipedId],
          set: { action, updatedAt: new Date() },
        })
        .returning();
      if (action === SWIPE_ACTIONS.LIKE) {
        const mutualLike = await this.db.query.swipes.findFirst({
          where: and(
            eq(schema.swipes.swiperId, swipedId),
            eq(schema.swipes.swipedId, userId),
            eq(schema.swipes.action, SWIPE_ACTIONS.LIKE),
          ),
        });
        // TODO transaction
        if (mutualLike) {
          await this.matchesService.insertMatch(userId, swipedId);
          const conversation = await this.messagingService.createConversation(
            userId,
            swipedId,
          );
          // TODO only invalidate on last swipe
          await this.redis.invalidate(CacheKeys.feed(userId));
          return {
            recipientId: swipedId,
            conversationId: conversation.id,
            swipe,
            matched: true,
          };
        }
      }
      await this.redis.invalidate(CacheKeys.feed(userId));
      return { swipe, matched: false };
    } catch (error) {
      this.logger.error('Swipe action failed', error);
      throw new DomainException('SWIPE_FAILED');
    }
  }

  // TODO split it to separated methods
  async checkAndResetSwipeLimit(userId: string): Promise<void> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: {
        swipesUsed: true,
        swipesResetAt: true,
      },
    });

    if (!user) {
      throw new DomainException('USER_NOT_FOUND');
    }

    const now = new Date();

    if (user.swipesResetAt && now >= user.swipesResetAt) {
      await this.db
        .update(schema.users)
        .set({
          swipesUsed: 0,
          swipesResetAt: null,
          updatedAt: now,
        })
        .where(eq(schema.users.id, userId));

      return;
    }

    if (user.swipesUsed >= 40) {
      if (!user.swipesResetAt) {
        const resetAt = new Date(now);
        resetAt.setDate(resetAt.getDate() + 1);
        resetAt.setHours(0, 0, 0, 0);

        await this.db
          .update(schema.users)
          .set({
            swipesResetAt: resetAt,
            updatedAt: now,
          })
          .where(eq(schema.users.id, userId));

        throw new DomainException('SWIPE_LIMIT_REACHED', {
          resetAt: resetAt.toISOString(),
        });
      }

      throw new DomainException('SWIPE_LIMIT_REACHED', {
        resetAt: user.swipesResetAt.toISOString(),
      });
    }

    const newCount = user.swipesUsed + 1;

    let resetAt = user.swipesResetAt;
    if (newCount >= 40) {
      resetAt = new Date(now);
      resetAt.setDate(resetAt.getDate() + 1);
      resetAt.setHours(0, 0, 0, 0);
    }

    await this.db
      .update(schema.users)
      .set({
        swipesUsed: newCount,
        swipesResetAt: resetAt,
        updatedAt: now,
      })
      .where(eq(schema.users.id, userId));
  }
}
