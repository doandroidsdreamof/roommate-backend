import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { MatchesModule } from 'src/matches/matches.module';
import { UsersModule } from 'src/users/users.module';
import { SwipesController } from './swipes.controller';
import { SwipesService } from './swipes.service';
import { RedisModule } from 'src/redis/redis.module';
import { MessagingModule } from 'src/messaging/messaging.module';

@Module({
  imports: [
    DrizzleModule,
    MatchesModule,
    UsersModule,
    RedisModule,
    MessagingModule,
  ],
  controllers: [SwipesController],
  exports: [SwipesService],
  providers: [SwipesService],
})
export class SwipesModule {}
