import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from '../../database/schema';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  createAccessToken(userId: string, email: string) {
    this.logger.log('access token is created');
    return this.jwtService.sign({
      sub: userId,
      email: email,
    });
  }
  async createRefreshToken(userId: string) {
    const token = randomBytes(32).toString('hex');
    const hash = this.hashToken(token);
    this.logger.log('refresh token is created');
    await this.db
      .insert(schema.refreshToken)
      .values({ userId, tokenHash: hash })
      .onConflictDoUpdate({
        target: schema.refreshToken.userId,
        set: { tokenHash: hash, isRevoked: false },
      });

    return token;
  }
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
