import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { OTP_LENGTH } from 'src/constants/contants';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from '../../database/schema';
import { VERIFICATION_STATUS } from '../../database/schema';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async insertOtp(email: string, optCode: string) {
    const [result] = await this.db
      .insert(schema.verifications)
      .values({ identifier: email })
      .onConflictDoUpdate({
        target: schema.verifications.identifier,
        set: { code: optCode, status: VERIFICATION_STATUS.PENDING },
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
    // Check code matches + not expired + not used
  }
}
