import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import { AuthService } from './auth.service';
import {
  verifyOtpValidationSchema,
  VerifyOtpDTO,
  OtpDTO,
  otpValidationSchema,
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
}
