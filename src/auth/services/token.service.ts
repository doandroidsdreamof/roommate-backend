import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { and, eq, not } from 'drizzle-orm';
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
      expiresIn: '4', // TODO hardcoded config
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

  async revokeRefreshToken(refreshToken: string, userId: string) {
    const hashedToken = this.hashToken(refreshToken);
    this.logger.log('🚀 ~ time:', new Date(Date.now()));
    const expiredTime = new Date(Date.now() - 10000); //* 10 sec
    this.logger.log('🚀 ~ expiredTime:', expiredTime);

    //TODO review here maybe transaction may useful
    const storedToken = await this.db
      .update(schema.refreshToken)
      .set({ expiresAt: expiredTime, isRevoked: true })
      .where(
        and(
          eq(schema.refreshToken.tokenHash, hashedToken),
          eq(schema.refreshToken.userId, userId),
          not(schema.refreshToken.isRevoked),
        ),
      );
    if (storedToken.rowCount === 0) {
      throw new UnauthorizedException('Logout failed');
    }
    this.logger.log('storedToken', storedToken.rows);
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  async isRefreshTokenValid(
    refreshToken: string,
    userId: string,
  ): Promise<boolean> {
    const hashedToken = this.hashToken(refreshToken);
    const NOW = new Date(Date.now());
    const storedToken = await this.db.query.refreshToken.findFirst({
      where: and(
        eq(schema.refreshToken.tokenHash, hashedToken),
        eq(schema.refreshToken.userId, userId),
      ),
      columns: {
        isRevoked: true,
        tokenHash: true,
        expiresAt: true,
      },
    });
    if (
      !storedToken ||
      storedToken.isRevoked === true ||
      storedToken.expiresAt <= NOW
    ) {
      return false;
    }

    return true;
  }
}
