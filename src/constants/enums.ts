export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const;

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export const GENDER_PREFERENCE = {
  FEMALE_ONLY: 'female_only',
  MALE_ONLY: 'male_only',
  MIXED: 'mixed',
} as const;

export const SMOKING_HABIT = {
  REGULAR: 'regular',
  SOCIAL: 'social',
  NO: 'no',
} as const;

export const PET_OWNERSHIP = {
  CAT: 'cat',
  DOG: 'dog',
  OTHER: 'other',
  NONE: 'none',
} as const;

export const PET_COMPATIBILITY = {
  YES_LOVE_PETS: 'yes_love_pets',
  PREFER_NOT: 'prefer_not',
  NO: 'no',
  DOESNT_MATTER: 'doesnt_matter',
} as const;

export const ALCOHOL_CONSUMPTION = {
  NEVER: 'never',
  OCCASIONALLY: 'occasionally',
  SOCIALLY: 'socially',
  REGULARLY: 'regularly',
} as const;

export const POSTING_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  RENTED: 'rented',
} as const;

export const OCCUPANT_GENDER_COMPOSITION = {
  ALL_MALE: 'all_male',
  ALL_FEMALE: 'all_female',
  MIXED: 'mixed',
} as const;

export const SWIPE_ACTIONS = {
  PASS: 'pass',
  LIKE: 'like',
} as const;
