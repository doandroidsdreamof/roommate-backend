import { pgEnum } from 'drizzle-orm/pg-core';
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

// Auth & Verification
export const verificationStatus = pgEnum(
  'verification_status',
  getEnumValues(VERIFICATION_STATUS),
);

export const accountStatusEnum = pgEnum(
  'account_status',
  getEnumValues(ACCOUNT_STATUS),
);

// User Profile
export const ageRangeEnum = pgEnum('age_range', getEnumValues(AGE_RANGES));
export const genderEnum = pgEnum('gender', getEnumValues(GENDER));

// Preferences
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

// Postings
export const postingTypeEnum = pgEnum('posting_type', [
  'offering_room',
  'looking_for_room',
  'looking_for_roommate',
]);

export const postingStatusEnum = pgEnum('posting_status', [
  'active',
  'inactive',
  'rented',
  'expired',
]);

export const occupantGenderCompositionEnum = pgEnum(
  'occupant_gender_composition',
  ['male_only', 'female_only', 'mixed', 'not_specified'],
);
