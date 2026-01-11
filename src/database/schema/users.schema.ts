import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
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

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phoneNumber: varchar('phone_number', { length: 20 }).unique(),
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
    check('users_posting_count_non_negative', sql`${table.postingCount} >= 0`),
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
    // Composite index for city + gender + accountStatus filtering
    // Performance varies by production data distribution: Beneficial for low-population cities
    // Sequential scan preferred for high-distribution cities (assumed Istanbul ~60%)
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
    ageMin: integer('age_min').notNull(),
    ageMax: integer('age_max').notNull(),
    genderPreference: genderPreferenceEnum('gender_preference'),
    smokingHabit: smokingHabitEnum('smoking_habit'),
    petOwnership: petOwnershipEnum('pet_ownership'),
    petCompatibility: petCompatibilityEnum('pet_compatibility'),
    alcoholConsumption: alcoholConsumptionEnum('alcohol_consumption'),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    check(
      'age_min_valid',
      sql`${table.ageMin} >= 18 AND ${table.ageMin} <= 100`,
    ),
    check(
      'age_max_valid',
      sql`${table.ageMax} >= 18 AND ${table.ageMax} <= 100`,
    ),
    check('age_range_valid', sql`${table.ageMax} >= ${table.ageMin}`),
    check('age_range_reasonable', sql`${table.ageMax} - ${table.ageMin} <= 50`),
    index('preferences_user_id_idx').on(table.userId),
    index('preferences_housing_type_idx').on(table.housingSearchType),
    index('preferences_user_housing_idx').on(
      table.userId,
      table.housingSearchType,
    ),
    index('preferences_budget_range_idx').on(table.budgetMin, table.budgetMax),
    check(
      'preferences_budget_min_positive',
      sql`${table.budgetMin} IS NULL OR ${table.budgetMin} > 0`,
    ),
    check(
      'preferences_budget_max_positive',
      sql`${table.budgetMax} IS NULL OR ${table.budgetMax} > 0`,
    ),
    check(
      'preferences_budget_valid_range',
      sql`
        ${table.budgetMin} IS NULL 
        OR ${table.budgetMax} IS NULL 
        OR ${table.budgetMax} > ${table.budgetMin}
      `,
    ),
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
