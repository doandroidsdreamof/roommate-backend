import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import {
  CreateProfileDto,
  createProfileSchema,
  UpdateAddressDto,
  updateAddressSchema,
  UpdatePhotoDto,
  updateProfilePhotoSchema,
} from './dto/profile-dto';
import {
  CreatePreferencesDto,
  createPreferencesSchema,
  UpdatePreferencesDto,
  updatePreferencesSchema,
} from './dto/preference.dto';

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

  @Get('profile')
  getProfile(@AuthUser('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Post('preference')
  @HttpCode(HttpStatus.CREATED)
  createPreference(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(createPreferencesSchema))
    createPreferenceDto: CreatePreferencesDto,
  ) {
    return this.usersService.createPreferences(userId, createPreferenceDto);
  }
  @Get('preference')
  getPreference(@AuthUser('sub') userId: string) {
    return this.usersService.getPreference(userId);
  }

  @Patch('preference')
  updatePreference(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(updatePreferencesSchema))
    updatePreferenceDto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreference(userId, updatePreferenceDto);
  }

  @Patch('profile/photo')
  updatePhoto(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(updateProfilePhotoSchema))
    updatePhotoDto: UpdatePhotoDto,
  ) {
    return this.usersService.updatePhoto(userId, updatePhotoDto);
  }

  @Patch('profile/address')
  updateAddress(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(updateAddressSchema))
    updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(userId, updateAddressDto);
  }
}
