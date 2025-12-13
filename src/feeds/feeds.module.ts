import { Module } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { FeedsController } from './feeds.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [DrizzleModule],
  controllers: [FeedsController],
  providers: [FeedsService, UsersService],
})
export class FeedsModule {}
