import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthUser } from './decorators/auth-user.decorator';
import {
  LogoutDTO,
  logoutValidationSchema,
  OtpDTO,
  otpValidationSchema,
  RefreshTokenDTO,
  refreshTokenValidationSchema,
  VerifyOtpDTO,
  verifyOtpValidationSchema,
} from './dto/auth.dto';

// TODO http-only mechanism
// TODO resetting otp attempt count

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
