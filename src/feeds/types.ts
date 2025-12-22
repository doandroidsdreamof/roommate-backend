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
  profile: typeof schema.profile.$inferSelect;
  preferences: typeof schema.preferences.$inferSelect;
};
