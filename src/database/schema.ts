import { InferSelectModel, relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const;

export const verificationStatus = pgEnum('verification_status', [
  VERIFICATION_STATUS.PENDING,
  VERIFICATION_STATUS.VERIFIED,
  VERIFICATION_STATUS.EXPIRED,
  VERIFICATION_STATUS.FAILED,
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).unique(),
  username: varchar('username', { length: 100 }).unique(),
  isActive: boolean('is_active').default(true).notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  status: verificationStatus('status').default('pending').notNull(),
  identifier: varchar('identifier', { length: 255 }).notNull().unique(), //* for now email, but it will be implemented phone too
  attemptsCount: integer('attempts_count').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  code: varchar('code', { length: 6 }),
  codeExpiresAt: timestamp('code_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  verifications: one(verifications),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  user: one(users, {
    fields: [verifications.userId],
    references: [users.id],
  }),
}));

export type User = InferSelectModel<typeof users>;

export type Verification = InferSelectModel<typeof verifications>;
