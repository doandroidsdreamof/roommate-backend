import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailService } from 'src/mail/email.service';
import { EmailModule } from 'src/mail/email.module';

@Module({
  controllers: [AuthController],
  imports: [EmailModule],
  providers: [AuthService, EmailService],
})
export class AuthModule {}
