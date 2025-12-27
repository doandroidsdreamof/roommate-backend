import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { EmailService } from 'src/mail/email.service';
import {
  VerifyOtpDTO,
  OtpDTO,
  RefreshTokenDTO,
  LogoutDTO,
} from './dto/auth-dto';
import { OtpService } from './services/otp.service';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './services/token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private emailService: EmailService,
    private otpService: OtpService,
    private usersService: UsersService,
    private tokenService: TokenService,
  ) {}
  async sendOtp(dto: OtpDTO) {
    const { email } = dto;
    const otpCode = this.otpService.generateOTP();
    const [savedOtp, userName] = await Promise.all([
      this.otpService.insertOtp(email, otpCode), //* use synced otp
      this.usersService.getUsername(email),
    ]);
    // TODO bottleneck
    // Fire and forget => Tradeoffs Can't tell user if email failed
    this.emailService
      .sendOtpEmail({
        email,
        userName: userName ?? 'User',
        otp: savedOtp,
      })
      .catch((err) => {
        this.logger.error(`Failed to send OTP email`, err);
      });
    // TODO hardcoded response
    return { message: 'Check your email for OTP' };
  }
  async authenticate(dto: VerifyOtpDTO) {
    const { email, otp } = dto;

    const isValid = await this.otpService.verifyOtp(email, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.createUser(email);
    }

    return this.login(user.id, user.email);
  }

  async login(userId: string, email: string) {
    const refreshToken = await this.tokenService.createRefreshToken(userId);
    const accessToken = this.tokenService.createAccessToken(userId, email);
    // TODO move accessToken to Bearer
    return { accessToken: accessToken, refreshToken: refreshToken };
  }

  async logout(dto: LogoutDTO, userId: string) {
    const { refreshToken } = dto;
    //* what if this silently faield
    await this.tokenService.revokeRefreshToken(refreshToken, userId);
    return { message: 'Logged out successfully' };
  }

  async refreshToken(dto: RefreshTokenDTO) {
    const { refreshToken } = dto;
    const userId = await this.tokenService.validateRefreshToken(refreshToken);
    this.logger.log(userId);
    if (!userId) {
      throw new UnauthorizedException();
    }
    const user = await this.usersService.findById(userId);

    const accessToken = this.tokenService.createAccessToken(
      user.id,
      user.email,
    );
    return { accessToken: accessToken };
  }
}
