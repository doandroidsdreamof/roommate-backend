import { z } from 'zod';
import {
  ALCOHOL_CONSUMPTION,
  GENDER_PREFERENCE,
  HOUSING_SEARCH_TYPE,
  PET_COMPATIBILITY,
  PET_OWNERSHIP,
  SMOKING_HABIT,
} from 'src/constants/enums';

// TODO refactor budget min and max
export const createPreferencesSchema = z.object({
  housingSearchType: z.enum(HOUSING_SEARCH_TYPE),
  budgetMin: z.string().max(20).optional(),
  budgetMax: z.string().max(20).optional(),
  genderPreference: z.enum(GENDER_PREFERENCE).optional(),
  smokingHabit: z.enum(SMOKING_HABIT).optional(),
  petOwnership: z.enum(PET_OWNERSHIP).optional(),
  petCompatibility: z.enum(PET_COMPATIBILITY).optional(),
  alcoholConsumption: z.enum(ALCOHOL_CONSUMPTION).optional(),
});

export const updatePreferencesSchema = z.object({
  housingSearchType: z.enum(HOUSING_SEARCH_TYPE).optional(),
  budgetMin: z.string().max(20).optional(),
  budgetMax: z.string().max(20).optional(),
  genderPreference: z.enum(GENDER_PREFERENCE).optional(),
  smokingHabit: z.enum(SMOKING_HABIT).optional(),
  petOwnership: z.enum(PET_OWNERSHIP).optional(),
  petCompatibility: z.enum(PET_COMPATIBILITY).optional(),
  alcoholConsumption: z.enum(ALCOHOL_CONSUMPTION).optional(),
});

export type CreatePreferencesDto = z.infer<typeof createPreferencesSchema>;
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
