import { InferSelectModel, relations } from 'drizzle-orm';
import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const verificationType = pgEnum('verification_type', [
  'email_signup',
  'email_login',
  'phone_signup',
  'phone_login',
  'password_reset',
  'two_factor',
  'phone_change',
  'email_change',
]);

export const verificationStatus = pgEnum('verification_status', [
  'pending',
  'verified',
  'expired',
  'failed',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: verificationType('type').notNull(),
  status: verificationStatus('status').default('pending').notNull(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  attemptsCount: varchar('attempts_count').default('0').notNull(),
  maxAttempts: varchar('max_attempts').default('3').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  verificationId: uuid('verification_id')
    .notNull()
    .references(() => verifications.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 6 }).notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  usedAt: timestamp('used_at'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  verifications: many(verifications),
}));

export const verificationsRelations = relations(
  verifications,
  ({ one, many }) => ({
    user: one(users, {
      fields: [verifications.userId],
      references: [users.id],
    }),
    otpCodes: many(otpCodes),
  }),
);

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
  verification: one(verifications, {
    fields: [otpCodes.verificationId],
    references: [verifications.id],
  }),
}));

export type User = InferSelectModel<typeof users>;

export type Verification = InferSelectModel<typeof verifications>;

export type OtpCode = InferSelectModel<typeof otpCodes>;
