import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import { AuthService } from './auth.service';
import {
  verifyOtpValidationSchema,
  VerifyOtpDTO,
  OtpDTO,
  otpValidationSchema,
  RefreshTokenDTO,
  refreshTokenValidationSchema,
} from './dto/auth-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp')
  @UsePipes(new ZodValidationPipe(otpValidationSchema))
  requestOtp(@Body() dto: OtpDTO) {
    return this.authService.sendOtp({ ...dto });
  }

  @Post('authenticate')
  @UsePipes(new ZodValidationPipe(verifyOtpValidationSchema))
  authenticate(@Body() dto: VerifyOtpDTO) {
    return this.authService.authenticate({ ...dto });
  }

  @Post('logout')
  @UsePipes(new ZodValidationPipe(refreshTokenValidationSchema))
  logout(@Body() dto: RefreshTokenDTO) {
    return this.authService.logout({ ...dto });
  }
  // TODO rate-limitter
  @Post('refresh')
  @UsePipes(new ZodValidationPipe(refreshTokenValidationSchema))
  refreshToken(@Body() dto: RefreshTokenDTO) {
    return this.authService.refreshToken({ ...dto });
  }
}
