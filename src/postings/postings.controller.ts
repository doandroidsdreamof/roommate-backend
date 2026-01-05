import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';
import {
  ClosePostingDto,
  closePostingSchema,
  CreatePostingDto,
  createPostingSchema,
  postingImageUpdateSchema,
  UpdatePostingDto,
  UpdatePostingImagesDto,
  updatePostingSchema,
} from './dto/postings.dto';
import { PostingsService } from './postings.service';
import { ListsService } from './services/lists.service';
import { ListsQueryDto, listsQuerySchema } from './dto/lists.dto';

@Controller({ path: 'postings', version: '1' })
@UseGuards(AuthGuard)
export class PostingsController {
  constructor(
    private readonly postingsService: PostingsService,
    private readonly listsService: ListsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(createPostingSchema))
    createPostingDto: CreatePostingDto,
  ) {
    return this.postingsService.create(userId, createPostingDto);
  }

  @Patch('images')
  @HttpCode(HttpStatus.OK)
  updateImages(
    @AuthUser('sub') userId: string,
    @Body(new ZodValidationPipe(postingImageUpdateSchema))
    updatePostingImageDto: UpdatePostingImagesDto,
  ) {
    return this.postingsService.updatePostingsImages(
      userId,
      updatePostingImageDto,
    );
  }
  @Get('lists')
  @HttpCode(HttpStatus.OK)
  getLists(
    @Query(new ZodValidationPipe(listsQuerySchema)) query: ListsQueryDto,
  ) {
    return this.listsService.getLists(query);
  }

  @Patch(':id/close')
  @HttpCode(HttpStatus.OK)
  close(
    @AuthUser('sub') userId: string,
    @Param('id') postingId: string,
    @Body(new ZodValidationPipe(closePostingSchema))
    closePostingDto: ClosePostingDto,
  ) {
    return this.postingsService.closePosting(
      userId,
      postingId,
      closePostingDto,
    );
  }
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @AuthUser('sub') userId: string,
    @Param('id') postingId: string,
    @Body(new ZodValidationPipe(updatePostingSchema))
    updatePostingDto: UpdatePostingDto,
  ) {
    return this.postingsService.update(userId, postingId, updatePostingDto);
  }
}
