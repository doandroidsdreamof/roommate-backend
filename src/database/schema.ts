import { InferSelectModel, relations, sql } from 'drizzle-orm';
import {
  boolean,
  char,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// TODO find more convenient way to structure these repetetive enums
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

export const AGE_RANGES = {
  RANGE_18_24: '18-24',
  RANGE_25_30: '25-30',
  RANGE_31_35: '31-35',
  RANGE_36_40: '36-40',
  RANGE_41_45: '41-45',
  RANGE_46_50: '46-50',
  RANGE_51_55: '51-55',
  RANGE_56_60: '56-60',
  RANGE_61_65: '61-65',
  RANGE_65_PLUS: '65+',
} as const;

export const ageRangeEnum = pgEnum('age_range', [
  AGE_RANGES.RANGE_18_24,
  AGE_RANGES.RANGE_25_30,
  AGE_RANGES.RANGE_31_35,
  AGE_RANGES.RANGE_36_40,
  AGE_RANGES.RANGE_41_45,
  AGE_RANGES.RANGE_46_50,
  AGE_RANGES.RANGE_51_55,
  AGE_RANGES.RANGE_56_60,
  AGE_RANGES.RANGE_61_65,
  AGE_RANGES.RANGE_65_PLUS,
]);

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

export const genderEnum = pgEnum('gender', [
  GENDER.MALE,
  GENDER.FEMALE,
  GENDER.OTHER,
  GENDER.PREFER_NOT_TO_SAY,
]);

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export const accountStatusEnum = pgEnum('account_status', [
  ACCOUNT_STATUS.ACTIVE,
  ACCOUNT_STATUS.SUSPENDED,
  ACCOUNT_STATUS.DELETED,
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).unique(),
  username: varchar('username', { length: 100 }).unique(),
  isActive: boolean('is_active').default(true).notNull(), //* account suspension flag
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profile = pgTable('profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 30 }).notNull(), //TODO make it unique
  ageRange: ageRangeEnum('age_range').notNull(),
  gender: genderEnum('gender').notNull(),
  email: varchar('email', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(), // TODO aggregated full address may good idea with latitude and longitude values
  district: varchar('district', { length: 100 }).notNull(),
  photoUrl: text('photo_url'), //TODO think about DoS / storage bloat URLs may too long, but what is the best practice should it prevented on application level?
  photoVerified: boolean('photo_verified').notNull().default(false),
  accountStatus: accountStatusEnum('account_status')
    .notNull()
    .default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
});

// TODO separate here
/* 
provinces (il)
└── counties (ilçe)
    └── districts (belde / merkez / belediye)
        └── neighborhoods (mahalle + posta kodu)
*/

// 1. Province (il)
export const provinces = pgTable('provinces', {
  plateCode: integer('plate_code').primaryKey(), //TODO create formatter utility 6 => 06
  name: varchar('name', { length: 100 }).notNull(),
});

// 2. County (İlçe)
export const counties = pgTable('counties', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  provincePlateCode: integer('province_plate_code')
    .notNull()
    .references(() => provinces.plateCode, { onDelete: 'restrict' }),
});

// 3. District (Belde / Merkez)
export const districts = pgTable('districts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  countyId: integer('county_id')
    .notNull()
    .references(() => counties.id, { onDelete: 'cascade' }),
});

// 4. Neighborhood (Mahalle)
export const neighborhoods = pgTable('neighborhoods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: char('postal_code', { length: 5 }).notNull(), // 01920 - always 5 digits
  districtId: integer('district_id')
    .notNull()
    .references(() => districts.id, { onDelete: 'cascade' }),
});

export const verifications = pgTable('verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  status: verificationStatus('status').default('pending').notNull(),
  identifier: varchar('identifier', { length: 255 }).notNull().unique(),
  attemptsCount: integer('attempts_count').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  code: varchar('code', { length: 6 }),
  codeExpiresAt: timestamp('code_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const refreshToken = pgTable('refresh_tokens', {
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const provincesRelations = relations(provinces, ({ many }) => ({
  counties: many(counties),
}));

export const countiesRelations = relations(counties, ({ one, many }) => ({
  province: one(provinces, {
    fields: [counties.provincePlateCode],
    references: [provinces.plateCode],
  }),
  districts: many(districts),
}));

export const districtsRelations = relations(districts, ({ one, many }) => ({
  county: one(counties, {
    fields: [districts.countyId],
    references: [counties.id],
  }),
  neighborhoods: many(neighborhoods),
}));

export const neighborhoodsRelations = relations(neighborhoods, ({ one }) => ({
  district: one(districts, {
    fields: [neighborhoods.districtId],
    references: [districts.id],
  }),
}));
export const usersRelations = relations(users, ({ one }) => ({
  verifications: one(verifications),
  refreshToken: one(refreshToken),
  profile: one(profile),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  user: one(users, {
    fields: [verifications.userId],
    references: [users.id],
  }),
}));

export const refreshTokenRelations = relations(refreshToken, ({ one }) => ({
  user: one(users, {
    fields: [refreshToken.userId],
    references: [users.id],
  }),
}));

export type User = InferSelectModel<typeof users>;

export type Verification = InferSelectModel<typeof verifications>;

export type RefreshToken = InferSelectModel<typeof refreshToken>;
export type Province = InferSelectModel<typeof provinces>;
export type County = InferSelectModel<typeof counties>;
export type District = InferSelectModel<typeof districts>;
export type Neighborhood = InferSelectModel<typeof neighborhoods>;
