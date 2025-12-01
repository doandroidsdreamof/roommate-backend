import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  ageRangeEnum,
  genderPreferenceEnum,
  occupantGenderCompositionEnum,
  petOwnershipEnum,
  postingStatusEnum,
  postingTypeEnum,
} from './enums.schema';
import { neighborhoods } from './locations.schema';
import { createdAndUpdatedTimestamps } from './shared-types';
import { users } from './users.schema';

export const postingImages = pgTable('posting_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  postingSpecsId: uuid('posting_specs_id')
    .notNull()
    .references(() => postingSpecs.id, { onDelete: 'cascade' }),
  images: jsonb('images')
    .$type<Array<{ url: string; order: number }>>()
    .notNull(),
  isVerified: boolean('is_verified').default(false),
  ...createdAndUpdatedTimestamps,
});

export const postings = pgTable('postings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  // Basic Info
  type: postingTypeEnum('type').notNull(),
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
  availableFrom: timestamp('available_from', { withTimezone: true }).notNull(),

  // Metadata
  bookmarkCount: integer('bookmark_count').default(0).notNull(),
  viewCount: integer('view_count').default(0).notNull(), // TODO one view count per user
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

  ...createdAndUpdatedTimestamps,
});

export const postingSpecs = pgTable('posting_specs', {
  id: uuid('id').defaultRandom().primaryKey(),
  postingId: uuid('posting_id')
    .notNull()
    .unique()
    .references(() => postings.id, { onDelete: 'cascade' }),

  // Full Description
  description: text('description').notNull(),

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
  occupantAgeRange: ageRangeEnum('occupant_age_range'),
  preferredRoommateAgeRange: ageRangeEnum('preferred_roommate_age_range'),

  // Lifestyle
  smokingAllowed: boolean('smoking_allowed'),
  alcoholFriendly: boolean('alcohol_friendly'), //TODO it can be enum. e.g not allowed common spaces etc.

  hasPets: boolean('has_pets'),
  currentPetOwnership: petOwnershipEnum('current_pet_ownership'),
  availableUntil: timestamp('available_until', { withTimezone: true }),
  nearbyTransport: text('nearby_transport'),

  ...createdAndUpdatedTimestamps,
});
