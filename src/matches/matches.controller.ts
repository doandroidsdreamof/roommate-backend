import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { GetMatchesDto, getMatchesValidationSchema } from './dto/matches.dto';
import { MatchesService } from './matches.service';

@Controller({ path: 'matches', version: '1' })
@UseGuards(AuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getMatches(
    @AuthUser('sub') userId: string,
    @Query(new ZodValidationPipe(getMatchesValidationSchema))
    query: GetMatchesDto,
  ) {
    return this.matchesService.getMatches(userId, query);
  }

  @Delete(':matchId')
  @HttpCode(HttpStatus.OK)
  unmatch(@AuthUser('sub') userId: string, @Param('matchId') matchId: string) {
    return this.matchesService.unmatch(userId, matchId);
  }
}
