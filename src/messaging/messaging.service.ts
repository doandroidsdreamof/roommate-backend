import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';
import { MatchesService } from 'src/matches/matches.service';
import { PostingsService } from 'src/postings/postings.service';
import { UsersService } from 'src/users/users.service';
import { MESSAGE_CONTEXT_TYPE, SendMessageInput } from './dto/messaging.dto';
import { Message } from './messaging.interface';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  constructor(
    @Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof schema>,
    private usersService: UsersService,
    private matchesService: MatchesService,
    private postingService: PostingsService,
  ) {}
  // TODO: Update lastMessageAt
  // TODO: pendingMessages for offline users

  async sendMessage(dto: SendMessageInput): Promise<Message> {
    const { senderId, recipientId, messageContent } = dto;
    const canSendOrConversation = await this.canSendMessage(dto);
    return {
      senderId,
      recipientId,
      content: messageContent,
      conversationId: canSendOrConversation.id,
      createdAt: new Date(),
      nonce: 'placeholder', // TODO: Real nonce later
    };
  }

  private async canSendMessage(
    dto: SendMessageInput,
  ): Promise<schema.Conversation> {
    const { senderId, recipientId } = dto;
    if (senderId === recipientId) {
      throw new DomainException('CANNOT_MESSAGE_SELF');
    }
    const isBlocked = await this.usersService.isBlockedRelationship(
      senderId,
      recipientId,
    );
    if (isBlocked) {
      throw new DomainException('BLOCKED_USER_MESSAGE');
    }
    const existedConversation = await this.getConversation(
      senderId,
      recipientId,
    );
    if (existedConversation) {
      return existedConversation;
    }

    const isConversationValid = await this.messageContextGuard(dto);
    if (!isConversationValid) {
      throw new DomainException('CONVERSATION_CREATION_FAILED');
    }
    const conversation = await this.createConversation(senderId, recipientId);
    return conversation;
  }
  async createConversation(
    userAId: string,
    userBId: string,
  ): Promise<schema.Conversation> {
    const [userFirstId, userSecondId] = [userAId, userBId].sort() as [
      string,
      string,
    ];
    const [conversation] = await this.db
      .insert(schema.conversations)
      .values({
        userFirstId,
        userSecondId,
      })
      .returning();
    if (!conversation) {
      throw new DomainException('CONVERSATION_CREATION_FAILED');
    }
    return conversation;
  }
  private async messageContextGuard(dto: SendMessageInput): Promise<boolean> {
    const { senderId, recipientId, contextType } = dto;
    switch (contextType) {
      case MESSAGE_CONTEXT_TYPE.MATCH: {
        const match = await this.matchesService.getActiveMatch(
          senderId,
          recipientId,
        );
        if (!match) {
          throw new DomainException('MATCH_REQUIRED');
        }
        return true;
      }

      case MESSAGE_CONTEXT_TYPE.POSTING: {
        const hasPosting =
          await this.postingService.isPostingExist(recipientId);
        if (!hasPosting) {
          throw new DomainException('POSTING_NOT_FOUND_FOR_MESSAGING');
        }
        return true;
      }
      default:
        return false;
    }
  }
  private async getConversation(
    userAId: string,
    userBId: string,
  ): Promise<null | schema.Conversation> {
    const [userFirstId, userSecondId] = [userAId, userBId].sort() as [
      string,
      string,
    ];

    const conversation = await this.db.query.conversations.findFirst({
      where: and(
        eq(schema.conversations.userFirstId, userFirstId),
        eq(schema.conversations.userSecondId, userSecondId),
      ),
    });

    return conversation ?? null;
  }

  // TODO implement inifinite scroll
  async getUserConversations(userId: string) {
    const conversations = await this.db.query.conversations.findMany({
      where: or(
        eq(schema.conversations.userFirstId, userId),
        eq(schema.conversations.userSecondId, userId),
      ),
      orderBy: (conversations, { desc }) => [desc(conversations.createdAt)],
      with: {
        userFirst: {
          columns: {
            id: true,
          },
          with: {
            profile: {
              columns: {
                name: true,
                photoUrl: true,
              },
            },
          },
        },
        userSecond: {
          columns: {
            id: true,
          },
          with: {
            profile: {
              columns: {
                name: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });
    this.logger.log(conversations);

    return conversations.map((conv) => {
      const isUserFirst = conv.userFirstId === userId;
      const otherUser = isUserFirst ? conv.userSecond : conv.userFirst;

      return {
        id: conv.id,
        otherUserId: otherUser.id,
        otherUserName: otherUser.profile?.name || 'Unknown',
        otherUserPhoto: otherUser.profile?.photoUrl || null,
        createdAt: conv.createdAt,
      };
    });
  }
  async createPendingMessage(message: Message) {
    this.logger.log('=======================> createPendingMessage:', message);
    // TODO createdAt can be confused with record createdAt
    await this.db
      .insert(schema.pendingMessages)
      .values({
        conversationId: message.conversationId,
        senderId: message.senderId,
        recipientId: message.recipientId,
        messages: [
          {
            message: message.content,
            createdAt: message.createdAt,
          },
        ],
        nonce: message.nonce,
      })
      .onConflictDoUpdate({
        target: schema.pendingMessages.conversationId,
        set: {
          messages: sql`${schema.pendingMessages.messages} || excluded.messages`,
        },
      })
      .returning();
  }

  async getPendingMessages(recipientId: string) {
    return this.db.query.pendingMessages.findMany({
      where: eq(schema.pendingMessages.recipientId, recipientId),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });
  }

  async deletePendingMessage(messageId: string) {
    await this.db
      .delete(schema.pendingMessages)
      .where(eq(schema.pendingMessages.id, messageId));
  }
}
