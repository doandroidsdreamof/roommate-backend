import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from 'src/mail/email.service';
import { VerifyOtpDTO, OtpDTO } from './dto/auth-dto';
import { OtpService } from './services/otp.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private emailService: EmailService,
    private otpService: OtpService,
    private usersService: UsersService,
  ) {}
  async sendOtp(dto: OtpDTO) {
    const { email } = dto;
    const otpCode = this.otpService.generateOTP();
    const savedOtp = await this.otpService.insertOtp(email, otpCode); //* use synced otp
    const userName = await this.usersService.getUsername(email);

    await this.emailService.sendOtpEmail({
      email,
      userName,
      otp: savedOtp,
    });
    // TODO hard-coded response
    return { message: 'Check your email for OTP' };
  }
  async authenticate(dto: VerifyOtpDTO) {
    const { email, otp } = dto;
    console.log('🚀 ~ otp:', otp);
    console.log('🚀 ~ email:', email);
  }
}
