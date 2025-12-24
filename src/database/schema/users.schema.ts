import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { ACCOUNT_STATUS } from 'src/constants/enums';
import {
  accountStatusEnum,
  ageRangeEnum,
  alcoholConsumptionEnum,
  genderEnum,
  genderPreferenceEnum,
  housingSearchTypeEnum,
  petCompatibilityEnum,
  petOwnershipEnum,
  smokingHabitEnum,
} from './enums.schema';
import { postings } from './postings.schema';
import { createdAndUpdatedTimestamps } from './shared-types';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phoneNumber: varchar('phone_number', { length: 20 }).unique(),
    username: varchar('username', { length: 100 }).unique(),
    isActive: boolean('is_active').default(true).notNull(),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),
    isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    isAnonymized: boolean('is_anonymized').default(false).notNull(), //* for analytics etc.
    postingCount: integer('posting_count').default(0).notNull(),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    index('users_not_deleted_idx')
      .on(table.id)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const profile = pgTable(
  'profile',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 30 }).notNull(),
    ageRange: ageRangeEnum('age_range').notNull(),
    gender: genderEnum('gender').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    district: varchar('district', { length: 100 }).notNull(),
    photoUrl: text('photo_url'),
    photoVerified: boolean('photo_verified').notNull().default(false),
    accountStatus: accountStatusEnum('account_status')
      .notNull()
      .default(ACCOUNT_STATUS.ACTIVE),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    index('profile_user_id_idx').on(table.userId),
    index('profile_city_gender_status_idx').on(
      table.city,
      table.gender,
      table.accountStatus,
    ),
  ],
);

export const preferences = pgTable(
  'preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    housingSearchType: housingSearchTypeEnum('housing_search_type').notNull(),
    budgetMin: integer('budget_min'),
    budgetMax: integer('budget_max'),
    genderPreference: genderPreferenceEnum('gender_preference'),
    smokingHabit: smokingHabitEnum('smoking_habit'),
    petOwnership: petOwnershipEnum('pet_ownership'),
    petCompatibility: petCompatibilityEnum('pet_compatibility'),
    alcoholConsumption: alcoholConsumptionEnum('alcohol_consumption'),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    index('preferences_user_id_idx').on(table.userId),
    index('preferences_housing_type_idx').on(table.housingSearchType),
    index('preferences_user_housing_idx').on(
      table.userId,
      table.housingSearchType,
    ),
    index('preferences_budget_range_idx').on(table.budgetMin, table.budgetMax),
  ],
);

//*  junction table users <=> userBookmarks <=> postings
export const userBookmarks = pgTable(
  'user_bookmarks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postingId: uuid('posting_id')
      .notNull()
      .references(() => postings.id, { onDelete: 'cascade' }),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    index('user_bookmarks_user_created_idx').on(
      table.userId,
      table.createdAt.desc(),
    ),
    index('user_bookmarks_posting_idx').on(table.postingId),
  ],
);

export const userBlocks = pgTable(
  'user_blocks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    blockerId: uuid('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: uuid('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    index('user_blocks_blocker_idx').on(table.blockerId),
    index('user_blocks_blocked_idx').on(table.blockedId),
    index('user_blocks_blocker_blocked_idx').on(
      table.blockerId,
      table.blockedId,
    ),
  ],
);
