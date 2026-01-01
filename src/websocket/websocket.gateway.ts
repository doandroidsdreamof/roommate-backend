import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './guards/ws-auth.guard';

@WebSocketGateway({})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private connectedUsers = new Map<string, string>();
  private logger = new Logger(WebsocketGateway.name);
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.logger.log('userId:', userId);
    this.logger.log('client.id):', client.id);

    this.connectedUsers.set(userId, client.id);

    this.logger.log(`connectedUsers ===> `, [...this.connectedUsers.entries()]);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { event: string; data: { recipientId: string; message: string } },
  ) {
    const { data } = payload;
    const { message, recipientId } = data;
    this.logger.log('payload:', payload);
    this.logger.log('data.id):', data);

    const recipientSocketId = this.connectedUsers.get(recipientId);
    this.logger.log('recipientSocketId:', recipientSocketId);

    if (recipientSocketId) {
      const recipientSocket = this.connectedUsers.get(recipientId);
      this.logger.log('client.id=======>', client.id);
      this.logger.log('recipientSocket=======>', recipientSocket);

      this.server.to(recipientSocket as string).emit('message', {
        from: Array.from(this.connectedUsers.entries()).find(
          ([, id]) => id === client.id,
        )?.[0],
        message: message,
      });
      this.logger.log(`Message sent from ${client.id} to ${recipientSocketId}`);
    } else {
      this.logger.error('User not online');

      client.emit('warn', {
        message: `User not online: ${recipientSocketId}`,
      });
    }
  }
}
