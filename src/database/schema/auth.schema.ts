import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { VERIFICATION_STATUS } from 'src/constants/enums';
import { verificationStatus } from './enums.schema';
import { users } from './users.schema';
import { sql } from 'drizzle-orm';
import { createdAndUpdatedTimestamps } from './shared-types';

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    status: verificationStatus('status')
      .default(VERIFICATION_STATUS.PENDING)
      .notNull(),
    identifier: varchar('identifier', { length: 255 }).notNull().unique(),
    attemptsCount: integer('attempts_count').default(0).notNull(),
    code: varchar('code', { length: 6 }),
    codeExpiresAt: timestamp('code_expires_at').notNull(),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    check(
      'attempts_count',
      sql`${table.attemptsCount} >= 0 AND ${table.attemptsCount} <= 3`,
    ),
  ],
);

export const refreshToken = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at')
      .default(sql`(NOW() AT TIME ZONE 'UTC') + INTERVAL '3 months'`)
      .notNull(),
    isRevoked: boolean('is_revoked').default(false).notNull(),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [index('refresh_token_hash_idx').on(table.tokenHash)],
);
