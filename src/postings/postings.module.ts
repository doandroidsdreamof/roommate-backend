import { Module } from '@nestjs/common';
import { PostingsService } from './postings.service';
import { PostingsController } from './postings.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { UsersModule } from 'src/users/users.module';
import { ListsService } from './services/lists.service';

@Module({
  imports: [DrizzleModule, UsersModule],
  controllers: [PostingsController],
  providers: [PostingsService, ListsService],
  exports: [PostingsService],
})
export class PostingsModule {}
