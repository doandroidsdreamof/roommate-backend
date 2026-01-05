import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  WsAuthMiddleware,
} from './middleware/ws-auth.middleware';
import { WebsocketService } from './websocket.service';
import {
  SendMessageDTO,
  SendMessageSchema,
} from 'src/messaging/dto/messaging.dto';
import { ZodValidationPipe } from 'src/pipes/validation-pipe';

@WebSocketGateway({})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;
  //  server.emit() - To ALL connected clients
  // client.broadcast.emit() - To everyone EXCEPT sender
  constructor(
    private wsAuthMiddleware: WsAuthMiddleware,
    private websocketService: WebsocketService,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) =>
      this.wsAuthMiddleware.use(socket as AuthenticatedSocket, next),
    );
    this.logger.log('WebSocket middleware applied');
  }

  async handleConnection(client: AuthenticatedSocket) {
    const userId = client.data.userId;

    this.websocketService.addConnection(userId, client.id);

    await this.websocketService.deliverPendingMessages(this.server, userId);

    this.logger.log(`User ${userId} connected (${client.id})`);
    this.logger.log(
      `Connected users: ${this.websocketService.getConnectedUsers() as any}`,
    );
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.websocketService.removeConnection(client.id);

    this.logger.log(`User ${userId} disconnected (${client.id})`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody(new ZodValidationPipe(SendMessageSchema))
    payload: SendMessageDTO,
  ) {
    await this.websocketService.handleSendMessage(this.server, client, payload);
  }
}
