import { Module } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { FeedsController } from './feeds.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [DrizzleModule, UsersModule],
  controllers: [FeedsController],
  providers: [FeedsService],
})
export class FeedsModule {}
