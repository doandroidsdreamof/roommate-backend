import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/auth.guard';

interface SocketData {
  userId: string;
}

interface AuthenticatedSocket extends Socket {
  data: SocketData;
}
@Injectable()
export class WsAuthGuard implements CanActivate {
  private logger = new Logger(WsAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const jwtToken = client?.handshake?.auth as unknown as string | undefined;

    if (!jwtToken || typeof jwtToken !== 'string') {
      throw new WsException('Unauthorized');
    }

    try {
      const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync<JwtPayload>(jwtToken, {
        secret: JWT_SECRET,
      });

      client.data.userId = payload.sub;
      return true;
    } catch (error) {
      this.logger.error(error);
      throw new WsException('Invalid token');
    }
  }
}
