import { Module } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { FeedsController } from './feeds.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { UsersModule } from 'src/users/users.module';
import { SwipesModule } from 'src/swipes/swipes.module';
import { MatchesModule } from 'src/matches/matches.module';
import { FeedScorerService } from './services/feedScorer.service';

@Module({
  imports: [DrizzleModule, UsersModule, SwipesModule, MatchesModule],
  controllers: [FeedsController],
  providers: [FeedsService, FeedScorerService],
})
export class FeedsModule {}
