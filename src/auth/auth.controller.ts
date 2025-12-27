import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import { AuthService } from './auth.service';
import {
  verifyOtpValidationSchema,
  VerifyOtpDTO,
  OtpDTO,
  otpValidationSchema,
  RefreshTokenDTO,
  refreshTokenValidationSchema,
  LogoutDTO,
  logoutValidationSchema,
} from './dto/auth-dto';
import { AuthGuard } from './auth.guard';
import { AuthUser } from './decorators/auth-user.decorator';

// TODO http-only mechanism
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp')
  @UsePipes(new ZodValidationPipe(otpValidationSchema))
  requestOtp(@Body() dto: OtpDTO) {
    return this.authService.sendOtp(dto);
  }

  @Post('authenticate')
  @UsePipes(new ZodValidationPipe(verifyOtpValidationSchema))
  authenticate(@Body() dto: VerifyOtpDTO) {
    return this.authService.authenticate(dto);
  }
  @UseGuards(AuthGuard)
  @Post('logout')
  logout(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(logoutValidationSchema)) dto: LogoutDTO,
  ) {
    return this.authService.logout(dto, userId);
  }
  // TODO rate-limitter
  @Post('refresh')
  @UsePipes(new ZodValidationPipe(refreshTokenValidationSchema))
  refreshToken(@Body() dto: RefreshTokenDTO) {
    return this.authService.refreshToken(dto);
  }
}
