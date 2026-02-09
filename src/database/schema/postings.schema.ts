import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  genderPreferenceEnum,
  occupantGenderCompositionEnum,
  petOwnershipEnum,
  postingStatusEnum,
} from './enums.schema';
import { neighborhoods } from './locations.schema';
import { createdAndUpdatedTimestamps } from './shared-types';
import { users } from './users.schema';

// TODO max integer constraints

export const postingImages = pgTable(
  'posting_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postingSpecsId: uuid('posting_specs_id')
      .notNull()
      .references(() => postingSpecs.id, { onDelete: 'cascade' }),
    images: jsonb('images')
      .$type<Array<{ url: string; order: number }>>()
      .notNull(),
    isVerified: boolean('is_verified').default(false),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [index('posting_images_specs_id_idx').on(table.postingSpecsId)],
);

export const postings = pgTable(
  'postings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // Basic Info
    status: postingStatusEnum('status').default('active').notNull(),
    title: varchar('title', { length: 100 }).notNull(),

    // Cover Image (for card thumbnail)
    coverImageUrl: text('cover_image_url').notNull(),
    isVerified: boolean('is_verified').default(false),

    // Location
    city: varchar('city', { length: 100 }).notNull(),
    district: varchar('district', { length: 100 }).notNull(),
    neighborhoodId: integer('neighborhood_id')
      .notNull()
      .references(() => neighborhoods.id, { onDelete: 'restrict' }),
    latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),

    // Pricing (shown on card)
    rentAmount: integer('rent_amount').notNull(),

    // Key Property Info (shown on card)
    roomCount: integer('room_count').notNull(),
    bathroomCount: integer('bathroom_count').notNull(),
    squareMeters: integer('square_meters').notNull(),
    isFurnished: boolean('is_furnished').notNull(),

    // Matching Info
    preferredRoommateGender: genderPreferenceEnum(
      'preferred_roommate_gender',
    ).notNull(),

    // Dates
    availableFrom: timestamp('available_from', {
      withTimezone: true,
    }).notNull(),

    // Metadata
    bookmarkCount: integer('bookmark_count').default(0).notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    ...createdAndUpdatedTimestamps,
  },

  (table) => [
    index('postings_created_at_idx')
      .on(table.createdAt.desc())
      .where(sql`${table.deletedAt} IS NULL`), //* partial index => do not index deleted rows
    index('postings_user_id_idx').on(table.userId),
    check(
      'postings_bookmark_count_non_negative',
      sql`${table.bookmarkCount} >= 0`,
    ),
    check('postings_view_count_non_negative', sql`${table.viewCount} >= 0`),
  ],
);

export const postingViews = pgTable(
  'posting_views',
  {
    postingId: uuid('posting_id')
      .notNull()
      .references(() => postings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...createdAndUpdatedTimestamps,
  },
  (table) => [
    primaryKey({ columns: [table.postingId, table.userId] }),
    index('posting_views_posting_id_idx').on(table.postingId),
    index('posting_views_user_id_idx').on(table.userId),
  ],
);

export const postingSpecs = pgTable(
  'posting_specs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postingId: uuid('posting_id')
      .notNull()
      .unique()
      .references(() => postings.id, { onDelete: 'cascade' }),

    // Full Description
    description: text('description').notNull(), // TODO check constraint

    // Additional Pricing
    depositAmount: integer('deposit_amount').notNull(),
    billsIncluded: boolean('bills_included').default(false).notNull(),

    // Property Details
    floor: integer('floor').notNull(),
    totalFloors: integer('total_floors').notNull(),
    hasBalcony: boolean('has_balcony').notNull(),
    hasParking: boolean('has_parking').notNull(),
    hasElevator: boolean('has_elevator').notNull(),

    // Occupancy
    currentOccupants: integer('current_occupants'),
    totalCapacity: integer('total_capacity'),
    availableRooms: integer('available_rooms'),

    // Demographics
    occupantGenderComposition: occupantGenderCompositionEnum(
      'occupant_gender_composition',
    ),
    ageMin: integer('age_min').notNull(),
    ageMax: integer('age_max').notNull(),

    // Lifestyle
    smokingAllowed: boolean('smoking_allowed'),
    alcoholFriendly: boolean('alcohol_friendly'),

    hasPets: boolean('has_pets'),
    currentPetOwnership: petOwnershipEnum('current_pet_ownership'),
    nearbyTransport: text('nearby_transport'),

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
    check(
      'posting_specs_deposit_non_negative',
      sql`${table.depositAmount} >= 0`,
    ),
    check(
      'posting_specs_description_not_empty',
      sql`LENGTH(TRIM(${table.description})) > 0`,
    ),
  ],
);
