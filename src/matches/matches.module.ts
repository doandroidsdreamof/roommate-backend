import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { DrizzleModule } from 'src/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  exports: [MatchesService],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
