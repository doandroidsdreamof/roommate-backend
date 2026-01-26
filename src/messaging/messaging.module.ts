import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { MatchesModule } from 'src/matches/matches.module';
import { PostingsModule } from 'src/postings/postings.module';
import { UsersModule } from 'src/users/users.module';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [DrizzleModule, UsersModule, MatchesModule, PostingsModule],
  providers: [MessagingService],
  controllers: [MessagingController],
  exports: [MessagingService],
})
export class MessagingModule {}
