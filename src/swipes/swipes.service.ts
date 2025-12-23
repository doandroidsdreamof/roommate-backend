import { Inject, Injectable, Logger } from '@nestjs/common';
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

  create(userId: string, createSwipeDto: CreateSwipeDto) {
    return 'This action adds a new swipe';
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
