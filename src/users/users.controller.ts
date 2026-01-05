import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import { BlockUserDto, blockUserSchema } from './dto/blocks.dto';
import {
  bookmarkPaginationQuery,
  BookmarkPaginationQueryDto,
  BookmarkPostingDto,
  bookmarkPostingSchema,
} from './dto/bookmarks.dto';
import {
  CreatePreferencesDto,
  createPreferencesSchema,
  UpdatePreferencesDto,
  updatePreferencesSchema,
} from './dto/preference.dto';
import {
  CreateProfileDto,
  createProfileSchema,
  UpdateAddressDto,
  updateAddressSchema,
  UpdatePhotoDto,
  updateProfilePhotoSchema,
} from './dto/profile.dto';
import { UsersService } from './users.service';

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

  @Post('block')
  @HttpCode(HttpStatus.CREATED)
  blockUser(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(blockUserSchema))
    blockUserDto: BlockUserDto,
  ) {
    return this.usersService.blockUser(userId, blockUserDto);
  }

  @Delete('unblock')
  unblockUser(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(blockUserSchema))
    blockUserDto: BlockUserDto,
  ) {
    return this.usersService.unblockUser(userId, blockUserDto);
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
  @HttpCode(HttpStatus.OK)
  updatePreference(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(updatePreferencesSchema))
    updatePreferenceDto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreference(userId, updatePreferenceDto);
  }

  @Patch('profile/photo')
  @HttpCode(HttpStatus.OK)
  updatePhoto(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(updateProfilePhotoSchema))
    updatePhotoDto: UpdatePhotoDto,
  ) {
    return this.usersService.updatePhoto(userId, updatePhotoDto);
  }

  @Patch('profile/address')
  @HttpCode(HttpStatus.OK)
  updateAddress(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(updateAddressSchema))
    updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(userId, updateAddressDto);
  }

  @Post('bookmarks')
  @HttpCode(HttpStatus.CREATED)
  bookmarkPosting(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(bookmarkPostingSchema))
    bookmarkDto: BookmarkPostingDto,
  ) {
    return this.usersService.bookmarkPosting(userId, bookmarkDto);
  }

  @Delete('bookmarks')
  @HttpCode(HttpStatus.OK)
  unbookmarkPosting(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(bookmarkPostingSchema))
    bookmarkDto: BookmarkPostingDto,
  ) {
    return this.usersService.unbookmarkPosting(userId, bookmarkDto);
  }
  @Get('bookmarks')
  @HttpCode(HttpStatus.OK)
  getUserBookmarks(
    @AuthUser('sub') userId: string,
    @Query(new ZodValidationPipe(bookmarkPaginationQuery))
    query: BookmarkPaginationQueryDto,
  ) {
    return this.usersService.getUserBookmarks(userId, query);
  }
}
