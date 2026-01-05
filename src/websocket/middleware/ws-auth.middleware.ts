import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/auth.guard';
import { Socket } from 'socket.io';

export interface SocketData {
  userId: string;
}

export interface AuthenticatedSocket extends Socket {
  data: SocketData;
}

@Injectable()
export class WsAuthMiddleware {
  private logger = new Logger(WsAuthMiddleware.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  use(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = (socket.handshake.auth?.token ||
        socket.handshake.query?.token) as string | undefined;

      this.logger.log('Middleware - Checking token');

      if (!token || typeof token !== 'string') {
        this.logger.warn('No token provided');
        return next(new Error('Unauthorized: No token provided'));
      }

      const JWT_SECRET = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: JWT_SECRET,
      });

      socket.data.userId = payload.sub;

      this.logger.log(`User ${payload.sub} authenticated`);

      next();
    } catch (error) {
      this.logger.error('Auth failed:', (error as Error).message);
      next(new Error('Unauthorized: Invalid token'));
    }
  }
}
