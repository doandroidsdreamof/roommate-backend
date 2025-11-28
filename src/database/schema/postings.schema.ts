import {
  boolean,
  integer,
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
import { timestamps, users } from './users.schema';

export const postings = pgTable('postings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  // Basic Info (REQUIRED)
  type: postingTypeEnum('type').notNull(),
  status: postingStatusEnum('status').default('active').notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),

  // Location (REQUIRED)
  city: varchar('city', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  neighborhoodId: integer('neighborhood_id')
    .notNull()
    .references(() => neighborhoods.id, { onDelete: 'restrict' }),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),

  // Pricing (REQUIRED)
  rentAmount: integer('rent_amount').notNull(),
  depositAmount: integer('deposit_amount').notNull(),
  billsIncluded: boolean('bills_included').default(false).notNull(),

  // Property Details (REQUIRED)
  roomCount: integer('room_count').notNull(),
  bathroomCount: integer('bathroom_count').notNull(),
  squareMeters: integer('square_meters').notNull(),
  floor: integer('floor').notNull(),
  totalFloors: integer('total_floors').notNull(),
  isFurnished: boolean('is_furnished').notNull(),
  hasBalcony: boolean('has_balcony').notNull(),
  hasParking: boolean('has_parking').notNull(),
  hasElevator: boolean('has_elevator').notNull(),

  // Occupancy (OPTIONAL - depends on posting type)
  currentOccupants: integer('current_occupants'),
  totalCapacity: integer('total_capacity'),
  availableRooms: integer('available_rooms'),

  // Current Occupants Demographics (OPTIONAL)
  occupantGenderComposition: occupantGenderCompositionEnum(
    'occupant_gender_composition',
  ),
  occupantAgeRange: ageRangeEnum('occupant_age_range'),

  // Roommate Preferences
  preferredRoommateGender: genderPreferenceEnum(
    'preferred_roommate_gender',
  ).notNull(),
  preferredRoommateAgeRange: ageRangeEnum('preferred_roommate_age_range'),

  smokingAllowed: boolean('smoking_allowed'), //TODO it can be enum. e.g not allowed common spaces etc.
  alcoholFriendly: boolean('alcohol_friendly'),
  hasPets: boolean('has_pets'),

  currentPetOwnership: petOwnershipEnum('current_pet_ownership'),

  // Dates (REQUIRED)
  availableFrom: timestamp('available_from', { withTimezone: true }).notNull(),
  availableUntil: timestamp('available_until', { withTimezone: true }),

  // Metadata
  viewCount: integer('view_count').default(0).notNull(),
  favoriteCount: integer('favorite_count').default(0).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

  ...timestamps,
});
