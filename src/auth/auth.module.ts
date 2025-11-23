import { Module } from '@nestjs/common';
import { EmailModule } from 'src/mail/email.module';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';

@Module({
  imports: [EmailModule, UsersModule],
  providers: [AuthService, OtpService],
})
export class AuthModule {}
