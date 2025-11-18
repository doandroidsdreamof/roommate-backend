import { Injectable, Logger } from '@nestjs/common';
import { OTP_LENGTH } from 'src/constants/contants';
import { EmailService } from 'src/mail/email.service';
import { OtpValidationDTO } from './dto/auth-dto';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private emailService: EmailService) {}
  // TODO remove test controller it will serivce only
  async sendEmail(dto: OtpValidationDTO) {
    const { email, userName } = dto;
    const otpCode = this._generateOTP();
    return await this.emailService.sendOtpEmail({
      email,
      userName,
      otp: otpCode,
    });
  }

  //TODO decouple
  private _generateOTP(): string {
    const digits = '0123456789';
    const max = digits.length;
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[randomInt(0, max)];
    }
    return otp;
  }
}
