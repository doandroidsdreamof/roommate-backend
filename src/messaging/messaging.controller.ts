import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { MessagingService } from './messaging.service';

@Controller({ path: 'messaging', version: '1' })
@UseGuards(AuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  async getConversations(@AuthUser('sub') userId: string) {
    return this.messagingService.getUserConversations(userId);
  }
}
