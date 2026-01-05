import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebsocketGateway } from './websocket.gateway';
import { WsAuthMiddleware } from './middleware/ws-auth.middleware';
import { WebsocketService } from './websocket.service';
import { MessagingModule } from 'src/messaging/messaging.module';

@Module({
  imports: [ConfigModule, MessagingModule],
  providers: [WebsocketGateway, WsAuthMiddleware, WebsocketService],
})
export class WebsocketModule {}
