import { Inject, Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { UsersService } from 'src/users/users.service';
import * as schema from 'src/database/schema';
import { CreateSwipeDto } from './dto/swipes.dto';
import { MatchesService } from 'src/matches/matches.service';

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
}
