import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { MatchesModule } from 'src/matches/matches.module';
import { UsersModule } from 'src/users/users.module';
import { SwipesController } from './swipes.controller';
import { SwipesService } from './swipes.service';

@Module({
  imports: [DrizzleModule, MatchesModule, UsersModule],
  controllers: [SwipesController],
  providers: [SwipesService],
})
export class SwipesModule {}
