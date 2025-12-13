import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [DrizzleModule, UsersModule],
  exports: [MatchesService],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
