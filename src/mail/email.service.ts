import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { getOtpEmailTemplate } from 'src/constants/emailTemplate';

interface OTPParams {
  email: string;
  userName?: string;
  otp: string;
}

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendHtmlEmail(to: string, subject: string, html: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendOtpEmail({ email, userName, otp }: OTPParams) {
    const html = getOtpEmailTemplate(otp, userName);
    // TODO hard-coded string
    // TODO html sanitizer
    return await this.sendHtmlEmail(email, 'Verify your email', html);
  }
}
