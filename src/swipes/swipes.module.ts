import { Module } from '@nestjs/common';
import { SwipesService } from './swipes.service';
import { SwipesController } from './swipes.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { MatchesService } from 'src/matches/matches.service';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [DrizzleModule],
  controllers: [SwipesController],
  providers: [SwipesService, MatchesService, UsersService],
})
export class SwipesModule {}
