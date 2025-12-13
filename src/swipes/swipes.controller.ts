import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SwipesService } from './swipes.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import { createSwipeSchema, CreateSwipeDto } from './dto/swipes.dto';

@Controller('swipes')
@UseGuards(AuthGuard)
export class SwipesController {
  constructor(private readonly swipesService: SwipesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(createSwipeSchema))
    createSwipeDto: CreateSwipeDto,
  ) {
    return this.swipesService.create(userId, createSwipeDto);
  }
}
