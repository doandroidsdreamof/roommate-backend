import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { MatchesService } from 'src/matches/matches.service';
import { UsersService } from 'src/users/users.service';
import { CreateSwipeDto } from './dto/swipes.dto';

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
      throw new BadRequestException('Cannot swipe on yourself');
    }
    const targetUser = await this.db.query.users.findFirst({
      where: eq(schema.users.id, swipedId),
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }
    const isBlocked = await this.usersService.isBlockedRelationship(
      userId,
      swipedId,
    );
    if (isBlocked) {
      throw new BadRequestException('Cannot swipe on blocked user');
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
      if (action === 'like') {
        const mutualLike = await this.db.query.swipes.findFirst({
          where: and(
            eq(schema.swipes.swiperId, swipedId),
            eq(schema.swipes.swipedId, userId),
            eq(schema.swipes.action, 'like'),
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
      throw new InternalServerErrorException('Failed to process swipe');
    }
  }

  async getLikedSwipeIds(userId: string): Promise<string[]> {
    const swipes = await this.db
      .select({ swipedId: schema.swipes.swipedId })
      .from(schema.swipes)
      .where(
        and(
          eq(schema.swipes.swiperId, userId),
          eq(schema.swipes.action, 'like'),
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
          eq(schema.swipes.action, 'pass'),
          gte(schema.swipes.createdAt, thirtyDaysAgo),
        ),
      );

    return swipes.map((s) => s.swipedId);
  }
}
