import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [DrizzleModule, RedisModule],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
