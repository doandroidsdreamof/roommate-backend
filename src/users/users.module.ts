import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { ProfileService } from './services/profile.service';
import { PreferenceService } from './services/preference.service';

@Module({
  imports: [DrizzleModule],
  exports: [UsersService],
  controllers: [UsersController],
  providers: [UsersService, ProfileService, PreferenceService],
})
export class UsersModule {}
