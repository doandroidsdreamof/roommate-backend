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
  petCompatibilityEnum,
  petOwnershipEnum,
  postingStatusEnum,
  postingTypeEnum,
  smokingHabitEnum,
} from './enums.schema';
import { neighborhoods } from './locations.schema';
import { timestamps, users } from './users.schema';

export const postings = pgTable('postings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  // Basic Info
  type: postingTypeEnum('type').notNull(),
  status: postingStatusEnum('status').default('active').notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),

  // Location
  city: varchar('city', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  neighborhoodId: integer('neighborhood_id')
    .notNull()
    .references(() => neighborhoods.id, { onDelete: 'restrict' }),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),

  // Pricing
  rentAmount: integer('rent_amount'),
  depositAmount: integer('deposit_amount'),
  billsIncluded: boolean('bills_included').default(false),

  // Property Details
  roomCount: integer('room_count'),
  bathroomCount: integer('bathroom_count'),
  squareMeters: integer('square_meters'),
  floor: integer('floor'),
  totalFloors: integer('total_floors'),
  isFurnished: boolean('is_furnished'),
  hasBalcony: boolean('has_balcony'),
  hasParking: boolean('has_parking'),
  hasElevator: boolean('has_elevator'),

  // Occupancy
  currentOccupants: integer('current_occupants'),
  totalCapacity: integer('total_capacity'),
  availableRooms: integer('available_rooms'),

  // Current Occupants Demographics
  occupantGenderComposition: occupantGenderCompositionEnum(
    'occupant_gender_composition',
  ),
  occupantAgeRange: ageRangeEnum('occupant_age_range'),

  // Roommate Preferences
  preferredRoommateGender: genderPreferenceEnum('preferred_roommate_gender'),
  preferredRoommateAgeRange: ageRangeEnum('preferred_roommate_age_range'),

  // Lifestyle Preferences
  preferredSmokingHabit: smokingHabitEnum('preferred_smoking_habit'),
  currentSmokingHabit: smokingHabitEnum('current_smoking_habit'),
  preferredPetCompatibility: petCompatibilityEnum(
    'preferred_pet_compatibility',
  ),
  currentPetOwnership: petOwnershipEnum('current_pet_ownership'),

  // Dates
  availableFrom: timestamp('available_from', { withTimezone: true }).notNull(),
  availableUntil: timestamp('available_until', { withTimezone: true }),

  // Metadata
  viewCount: integer('view_count').default(0).notNull(),
  favoriteCount: integer('favorite_count').default(0).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

  ...timestamps,
});
