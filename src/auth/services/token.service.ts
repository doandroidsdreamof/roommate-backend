import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { and, eq, not, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { DomainException } from 'src/exceptions/domain.exception';

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
        set: {
          tokenHash: hash,
          isRevoked: false,
          expiresAt: sql`(NOW() AT TIME ZONE 'UTC') + INTERVAL '3 months'`,
        },
      });

    return token;
  }

  async revokeRefreshToken(refreshToken: string, userId: string) {
    const hashedToken = this.hashToken(refreshToken);

    const storedToken = await this.db
      .update(schema.refreshToken)
      .set({ isRevoked: true })
      .where(
        and(
          eq(schema.refreshToken.tokenHash, hashedToken),
          eq(schema.refreshToken.userId, userId),
          not(schema.refreshToken.isRevoked),
        ),
      );
    if (storedToken.rowCount === 0) {
      throw new DomainException('LOGOUT_FAILED');
    }
  }

  hashToken(token: string): string {
    // TODO consider database breach. Current implementation has high entropy. Does it mitigates rainbow attacks are there more nuances?
    return createHash('sha256').update(token).digest('hex');
  }
  async validateRefreshToken(refreshToken: string): Promise<string | null> {
    const hashedToken = this.hashToken(refreshToken);
    const NOW = new Date(Date.now());
    const storedToken = await this.db.query.refreshToken.findFirst({
      where: and(eq(schema.refreshToken.tokenHash, hashedToken)),
      columns: {
        isRevoked: true,
        tokenHash: true,
        expiresAt: true,
        userId: true,
      },
    });
    const expiresAt = new Date(storedToken.expiresAt);

    if (!storedToken || storedToken.isRevoked === true || expiresAt <= NOW) {
      return null;
    }

    return storedToken?.userId;
  }
}
