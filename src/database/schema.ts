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
import {
  ACCOUNT_STATUS,
  AGE_RANGES,
  GENDER,
  GENDER_PREFERENCE,
  HOUSING_SEARCH_TYPE,
  PET_COMPATIBILITY,
  PET_OWNERSHIP,
  SMOKING_HABIT,
  VERIFICATION_STATUS,
} from 'src/constants/enums';
import { getEnumValues } from 'src/helpers/getEnumValues';

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const verificationStatus = pgEnum(
  'verification_status',
  getEnumValues(VERIFICATION_STATUS),
);

export const ageRangeEnum = pgEnum('age_range', getEnumValues(AGE_RANGES));

export const genderEnum = pgEnum('gender', getEnumValues(GENDER));

export const accountStatusEnum = pgEnum(
  'account_status',
  getEnumValues(ACCOUNT_STATUS),
);

export const housingSearchTypeEnum = pgEnum(
  'housing_search_type',
  getEnumValues(HOUSING_SEARCH_TYPE),
);

export const genderPreferenceEnum = pgEnum(
  'gender_preference',
  getEnumValues(GENDER_PREFERENCE),
);

export const smokingHabitEnum = pgEnum(
  'smoking_habit',
  getEnumValues(SMOKING_HABIT),
);

export const petOwnershipEnum = pgEnum(
  'pet_ownership',
  getEnumValues(PET_OWNERSHIP),
);

export const petCompatibilityEnum = pgEnum(
  'pet_compatibility',
  getEnumValues(PET_COMPATIBILITY),
);

export const preferences = pgTable('preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  housingSearchType: housingSearchTypeEnum('housing_search_type').notNull(),
  budgetMin: varchar('budget_min', { length: 20 }), // TODO consider min and max value types
  budgetMax: varchar('budget_max', { length: 20 }),
  genderPreference: genderPreferenceEnum('gender_preference'),
  smokingHabit: smokingHabitEnum('smoking_habit'),
  petOwnership: petOwnershipEnum('pet_ownership'),
  petCompatibility: petCompatibilityEnum('pet_compatibility'),
  ...timestamps,
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).unique(),
  username: varchar('username', { length: 100 }).unique(),
  isActive: boolean('is_active').default(true).notNull(), //* account suspension flag
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
  ...timestamps,
});

export const profile = pgTable('profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 30 }).notNull().unique(), //TODO make it unique
  ageRange: ageRangeEnum('age_range').notNull(),
  gender: genderEnum('gender').notNull(),
  city: varchar('city', { length: 100 }).notNull(), // TODO aggregated full address may good idea with latitude and longitude values
  district: varchar('district', { length: 100 }).notNull(),
  photoUrl: text('photo_url'), //TODO think about DoS / storage bloat URLs may too long, but what is the best practice should it prevented on application level?
  photoVerified: boolean('photo_verified').notNull().default(false),
  accountStatus: accountStatusEnum('account_status')
    .notNull()
    .default(ACCOUNT_STATUS.ACTIVE),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  ...timestamps,
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
  ...timestamps,
});

// 2. County (İlçe)
export const counties = pgTable('counties', {
  id: serial('id').primaryKey(), //* Serial => Auto Increment
  name: varchar('name', { length: 100 }).notNull(),
  provincePlateCode: integer('province_plate_code')
    .notNull()
    .references(() => provinces.plateCode, { onDelete: 'restrict' }),
  ...timestamps,
});

// 3. District (Belde / Merkez)
export const districts = pgTable('districts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  countyId: integer('county_id')
    .notNull()
    .references(() => counties.id, { onDelete: 'cascade' }),
  ...timestamps,
});

// 4. Neighborhood (Mahalle)
export const neighborhoods = pgTable('neighborhoods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  code: char('postal_code', { length: 5 }).notNull(), // 01920 - always 5 digits
  districtId: integer('district_id')
    .notNull()
    .references(() => districts.id, { onDelete: 'cascade' }),
  ...timestamps,
});

export const verifications = pgTable('verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  status: verificationStatus('status')
    .default(VERIFICATION_STATUS.PENDING)
    .notNull(),
  identifier: varchar('identifier', { length: 255 }).notNull().unique(),
  attemptsCount: integer('attempts_count').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  code: varchar('code', { length: 6 }),
  codeExpiresAt: timestamp('code_expires_at'),
  ...timestamps,
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
  ...timestamps,
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
  preferences: one(preferences),
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
export const profileRelations = relations(profile, ({ one }) => ({
  user: one(users, {
    fields: [profile.userId],
    references: [users.id],
  }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, {
    fields: [preferences.userId],
    references: [users.id],
  }),
}));

export type Preferences = InferSelectModel<typeof preferences>;
export type User = InferSelectModel<typeof users>;
export type Verification = InferSelectModel<typeof verifications>;
export type RefreshToken = InferSelectModel<typeof refreshToken>;
export type Province = InferSelectModel<typeof provinces>;
export type County = InferSelectModel<typeof counties>;
export type District = InferSelectModel<typeof districts>;
export type Neighborhood = InferSelectModel<typeof neighborhoods>;
export type Profile = InferSelectModel<typeof profile>;
