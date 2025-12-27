import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, gte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import { MatchesService } from 'src/matches/matches.service';
import { UsersService } from 'src/users/users.service';
import { CreateSwipeDto } from './dto/swipes.dto';
import { SWIPE_ACTIONS } from 'src/constants/enums';

/* 

 Potential edge-cases
 
 Self swipe 
 Duplicate swipe (unique constraint)
 Swiping deleted/blocked user (check before insert)
 Race condition on match creation 

*/

@Injectable()
export class SwipesService {
  private readonly logger = new Logger(SwipesService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private usersService: UsersService,
    private matchesService: MatchesService,
  ) {}

  async swipeAction(userId: string, createSwipeDto: CreateSwipeDto) {
    const { action, swipedId } = createSwipeDto;

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
          action,
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

        if (mutualLike) {
          await this.matchesService.insertMatch(userId, swipedId);
          return { swipe, matched: true };
        }
      }

      return { swipe, matched: false };
    } catch (error) {
      this.logger.error('Swipe action failed', error);
      throw new DomainException('SWIPE_FAILED');
    }
  }

  async getLikedSwipeIds(userId: string): Promise<string[]> {
    const swipes = await this.db
      .select({ swipedId: schema.swipes.swipedId })
      .from(schema.swipes)
      .where(
        and(
          eq(schema.swipes.swiperId, userId),
          eq(schema.swipes.action, SWIPE_ACTIONS.LIKE),
        ),
      );

    return swipes.map((s) => s.swipedId);
  }

  async getPassedSwipeIds(userId: string): Promise<string[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const swipes = await this.db
      .select({ swipedId: schema.swipes.swipedId })
      .from(schema.swipes)
      .where(
        and(
          eq(schema.swipes.swiperId, userId),
          eq(schema.swipes.action, SWIPE_ACTIONS.PASS),
          gte(schema.swipes.createdAt, thirtyDaysAgo),
        ),
      );

    return swipes.map((s) => s.swipedId);
  }
}
