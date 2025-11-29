import { Module } from '@nestjs/common';
import { PostingsService } from './postings.service';
import { PostingsController } from './postings.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [DrizzleModule, UsersModule],
  controllers: [PostingsController],
  providers: [PostingsService],
})
export class PostingsModule {}
