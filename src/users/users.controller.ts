import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import { CreateProfileDto, createProfileSchema } from './dto/profile-dto';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  createProfile(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(createProfileSchema))
    createProfileDto: CreateProfileDto,
  ) {
    return this.usersService.createProfile(userId, createProfileDto);
  }
}
