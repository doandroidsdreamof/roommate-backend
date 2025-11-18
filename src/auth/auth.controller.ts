import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import { AuthService } from './auth.service';
import { OtpValidationDTO, otpValidationSchema } from './dto/auth-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp')
  @UsePipes(new ZodValidationPipe(otpValidationSchema))
  findOne(@Body() dto: OtpValidationDTO) {
    return this.authService.sendEmail({ ...dto });
  }
}
