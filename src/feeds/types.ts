import {
  AGE_RANGES,
  GENDER,
  SMOKING_HABIT,
  PET_OWNERSHIP,
  PET_COMPATIBILITY,
  ALCOHOL_CONSUMPTION,
} from 'src/constants/enums';
import * as schema from 'src/database/schema';

export type FeedContext = {
  userId: string;
  profile: Pick<
    typeof schema.profile.$inferSelect,
    'city' | 'gender' | 'district'
  >;
  preferences: Pick<
    typeof schema.preferences.$inferSelect,
    | 'genderPreference'
    | 'housingSearchType'
    | 'budgetMin'
    | 'budgetMax'
    | 'smokingHabit'
    | 'petOwnership'
    | 'petCompatibility'
    | 'alcoholConsumption'
  > | null;
};

export type EligibleUser = {
  userId: string;
  name: string;
  ageRange: (typeof schema.profile.$inferSelect)['ageRange'];
  gender: (typeof schema.profile.$inferSelect)['gender'];
  city: string;
  district: string;
  photoUrl: string | null;
  photoVerified: boolean;
  lastActiveAt: Date | null;
  budgetMin: number | null;
  budgetMax: number | null;
  smokingHabit: (typeof schema.preferences.$inferSelect)['smokingHabit'];
  petOwnership: (typeof schema.preferences.$inferSelect)['petOwnership'];
  petCompatibility: (typeof schema.preferences.$inferSelect)['petCompatibility'];
  alcoholConsumption: (typeof schema.preferences.$inferSelect)['alcoholConsumption'];
};

export type ScoredUser = EligibleUser & {
  score: number;
  scoreBreakdown: {
    location: number;
    budget: number;
    lifestyle: number;
    profileQuality: number;
    recency: number;
  };
};

export type FeedResponse = {
  userId: string;
  name: string;
  ageRange: (typeof AGE_RANGES)[keyof typeof AGE_RANGES];
  gender: (typeof GENDER)[keyof typeof GENDER];
  city: string;
  district: string;
  photoUrl: string | null;
  photoVerified: boolean;
  lastActiveAt: Date | null;
  budgetMin: number | null;
  budgetMax: number | null;
  smokingHabit: (typeof SMOKING_HABIT)[keyof typeof SMOKING_HABIT] | null;
  petOwnership: (typeof PET_OWNERSHIP)[keyof typeof PET_OWNERSHIP] | null;
  petCompatibility:
    | (typeof PET_COMPATIBILITY)[keyof typeof PET_COMPATIBILITY]
    | null;
  alcoholConsumption:
    | (typeof ALCOHOL_CONSUMPTION)[keyof typeof ALCOHOL_CONSUMPTION]
    | null;
};
