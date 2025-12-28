import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { FeedsController } from './feeds.controller';
import { FeedsService } from './feeds.service';
import { FeedScorerService } from './services/feedScorer.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [DrizzleModule, RedisModule],
  controllers: [FeedsController],
  providers: [FeedsService, FeedScorerService],
})
export class FeedsModule {}
