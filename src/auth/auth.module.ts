import { Module } from '@nestjs/common';
import { EmailModule } from 'src/mail/email.module';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';
import { DrizzleModule } from 'src/database/drizzle.module';

@Module({
  imports: [EmailModule, UsersModule, DrizzleModule],
  providers: [AuthService, OtpService],
})
export class AuthModule {}
