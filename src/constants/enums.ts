export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const;

export const AGE_RANGES = {
  RANGE_18_24: '18-24',
  RANGE_25_30: '25-30',
  RANGE_31_35: '31-35',
  RANGE_36_40: '36-40',
  RANGE_41_45: '41-45',
  RANGE_46_50: '46-50',
  RANGE_51_55: '51-55',
  RANGE_56_60: '56-60',
  RANGE_61_65: '61-65',
  RANGE_65_PLUS: '65+',
} as const;

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;
