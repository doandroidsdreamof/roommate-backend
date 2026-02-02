import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { SendMessageDTO } from 'src/messaging/dto/messaging.dto';
import { MessagingService } from 'src/messaging/messaging.service';
import { AuthenticatedSocket } from './middleware/ws-auth.middleware';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  constructor(private messagingService: MessagingService) {}
  // TODO move connectedUsers to redis
  // TODO sanitize message content
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  async handleSendMessage(
    server: Server,
    client: AuthenticatedSocket,
    payload: SendMessageDTO,
  ): Promise<void> {
    const senderId = client.data.userId;

    try {
      const message = await this.messagingService.sendMessage({
        ...payload,
        senderId,
      });

      const isOnline = this.isUserOnline(payload.recipientId);
      this.logger.log('🚀 ~ isOnline:', isOnline);

      if (isOnline) {
        this.sendMessageToUser(
          server,
          payload.recipientId,
          senderId,
          message.content,
          message.conversationId,
        );
      } else {
        await this.messagingService.createPendingMessage(message);
        this.logger.log(
          `Message queued for offline user: ${payload.recipientId}`,
        );
      }

      client.emit('message_sent', {
        conversationId: message.conversationId,
        timestamp: message.createdAt,
      });
    } catch (error) {
      this.logger.error('Send message failed:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.sendError(server, client.id, 'MESSAGE_FAILED', errorMessage);
    }
  }

  addConnection(userId: string, socketId: string): void {
    this.connectedUsers.set(userId, socketId);
    this.logger.log(`User ${userId} added to connections`);
  }

  removeConnection(socketId: string): string | undefined {
    for (const [userId, sid] of this.connectedUsers.entries()) {
      if (sid === socketId) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User ${userId} removed from connections`);
        return userId;
      }
    }
    return undefined;
  }

  getSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  getUserId(socketId: string): string | undefined {
    for (const [userId, sid] of this.connectedUsers.entries()) {
      if (sid === socketId) {
        return userId;
      }
    }
    return undefined;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  sendMessageToUser(
    server: Server,
    recipientId: string,
    senderId: string,
    message: string,
    conversationId: string,
  ): boolean {
    const recipientSocketId = this.getSocketId(recipientId);

    if (!recipientSocketId) {
      this.logger.warn(`User ${recipientId} not online`);
      return false;
    }

    server.to(recipientSocketId).emit('message', {
      from: senderId,
      message: message,
      conversationId: conversationId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Message sent: ${senderId} → ${recipientId}`);
    return true;
  }

  sendError(
    server: Server,
    socketId: string,
    code: string,
    message: string,
  ): void {
    server.to(socketId).emit('error', {
      code,
      message,
      timestamp: new Date().toISOString(),
    });
  }
  async deliverPendingMessages(server: Server, userId: string): Promise<void> {
    const pending = await this.messagingService.getPendingMessages(userId);
    if (pending.length === 0) return;

    this.logger.log(
      `Delivering ${pending.length} pending messages to ${userId}`,
    );

    const socketId = this.getSocketId(userId);
    if (!socketId) return;

    for (const msg of pending) {
      // TODO implement Acknowledgment
      this.logger.log(msg);
      server.to(socketId).emit('pending_messages', {
        from: msg.senderId,
        message: msg.messages,
        timestamp: msg.createdAt.toISOString(),
        conversationId: msg.conversationId,
        isPending: true,
        isOwn: false,
      });

      await this.messagingService.deletePendingMessage(msg.id);
    }

    this.logger.log(`Delivered and deleted ${pending.length} messages`);
  }
}
