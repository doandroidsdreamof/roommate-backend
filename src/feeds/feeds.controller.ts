import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/decorators/auth-user.decorator';

@Controller({ path: 'feeds', version: '1' })
@UseGuards(AuthGuard)
export class FeedsController {
  constructor(private readonly feedsService: FeedsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getFeed(@AuthUser('sub') userId: string) {
    return this.feedsService.generateFeed(userId);
  }
}
