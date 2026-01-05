import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { MessagingService } from 'src/messaging/messaging.service';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  constructor(private messagingService: MessagingService) {}
  // TODO move connectedUsers to redis
  // TODO sanitize message content
  // server.to(recipientSocketId).emit('message') => This targets ONLY the recipient
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  /**
   * Add user to connected users map
   */
  addConnection(userId: string, socketId: string): void {
    this.connectedUsers.set(userId, socketId);
    this.logger.log(`User ${userId} added to connections`);
  }

  /**
   * Remove user from connected users map
   */
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

  /**
   * Get socket ID for a user
   */
  getSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  /**
   * Get user ID by socket ID
   */
  getUserId(socketId: string): string | undefined {
    for (const [userId, sid] of this.connectedUsers.entries()) {
      if (sid === socketId) {
        return userId;
      }
    }
    return undefined;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get all connected users
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Send message to specific user
   */
  sendMessageToUser(
    server: Server,
    recipientId: string,
    senderId: string,
    message: string,
  ): boolean {
    const recipientSocketId = this.getSocketId(recipientId);

    if (!recipientSocketId) {
      this.logger.warn(`User ${recipientId} not online`);
      return false;
    }

    server.to(recipientSocketId).emit('message', {
      from: senderId,
      message: message,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Message sent: ${senderId} → ${recipientId}`);
    return true;
  }

  /**
   * Send error to specific socket
   */
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
}
