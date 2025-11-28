import {
  boolean,
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

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).unique(),
  username: varchar('username', { length: 100 }).unique(),
  isActive: boolean('is_active').default(true).notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  isAnonymized: boolean('is_anonymized').default(false).notNull(),
  ...timestamps,
});

export const profile = pgTable('profile', {
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
  ...timestamps,
});

export const preferences = pgTable('preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  housingSearchType: housingSearchTypeEnum('housing_search_type').notNull(),
  budgetMin: varchar('budget_min', { length: 20 }),
  budgetMax: varchar('budget_max', { length: 20 }),
  genderPreference: genderPreferenceEnum('gender_preference'),
  smokingHabit: smokingHabitEnum('smoking_habit'),
  petOwnership: petOwnershipEnum('pet_ownership'),
  petCompatibility: petCompatibilityEnum('pet_compatibility'),
  alcoholConsumption: alcoholConsumptionEnum('alcohol_consumption'),
  ...timestamps,
});

export const userBookmarks = pgTable('user_bookmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  postingId: uuid('posting_id')
    .notNull()
    .references(() => postings.id, { onDelete: 'cascade' }),
  notes: text('notes'),
  ...timestamps,
});
