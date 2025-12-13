import {
  Controller,
  Delete,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/decorators/auth-user.decorator';

@Controller('matches')
@UseGuards(AuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getMatches(@AuthUser('sub') userId: string) {
    return this.matchesService.getMatches(userId);
  }

  @Delete(':matchId')
  @HttpCode(HttpStatus.OK)
  unmatch(@AuthUser('sub') userId: string, @Param('matchId') matchId: string) {
    return this.matchesService.unmatch(userId, matchId);
  }
}
