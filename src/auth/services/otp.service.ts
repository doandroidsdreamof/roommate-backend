import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { OTP_LENGTH } from 'src/constants/configuration';
import { VERIFICATION_STATUS } from 'src/constants/enums';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async insertOtp(email: string, optCode: string) {
    //* onConflictDoUpdate => equivalent of the upsert
    const [result] = await this.db
      .insert(schema.verifications)
      .values({
        identifier: email,
        codeExpiresAt: sql`(NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes'`, //* To consistent timing as single source of truth
        code: optCode,
      })
      .onConflictDoUpdate({
        target: schema.verifications.identifier,
        set: {
          code: optCode,
          codeExpiresAt: sql`(NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes'`,
          status: VERIFICATION_STATUS.PENDING,
        },
      })
      .returning({ code: schema.verifications.code });
    return result.code;
  }

  generateOTP(): string {
    const digits = '0123456789';
    const MAX = digits.length;
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[randomInt(0, MAX)];
    }
    return otp;
  }
  async verifyOtp(email: string, code: string): Promise<boolean> {
    // TODO refactor SELECT
    const [verification] = await this.db
      .select()
      .from(schema.verifications)
      .where(
        and(
          eq(schema.verifications.identifier, email),
          eq(schema.verifications.status, VERIFICATION_STATUS.PENDING),
          gt(schema.verifications.codeExpiresAt, sql`NOW() AT TIME ZONE 'UTC'`), // TODO make sure about this usage
        ),
      )
      .limit(1);

    if (
      !verification ||
      verification.attemptsCount >= verification.maxAttempts
    ) {
      this.logger.log('verification is failed => verifyOtp');
      return false;
    }

    if (verification.code !== code) {
      // TODO review here
      this.logger.log('otp code is mismatched => verifyOtp');
      await this.db
        .update(schema.verifications)
        .set({ attemptsCount: verification.attemptsCount + 1 })
        .where(eq(schema.verifications.identifier, email));
      return false;
    }
    this.logger.log('success => verifyOtp');

    await this.db
      .update(schema.verifications)
      .set({ status: VERIFICATION_STATUS.VERIFIED })
      .where(eq(schema.verifications.identifier, email));

    return true;
  }
}
