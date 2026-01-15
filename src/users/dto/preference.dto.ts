import {
  ALCOHOL_CONSUMPTION,
  GENDER_PREFERENCE,
  PET_COMPATIBILITY,
  PET_OWNERSHIP,
  SMOKING_HABIT,
} from 'src/constants/enums';
import { ageRangeSchema } from 'src/shared/validation-schema';
import { z } from 'zod';

const budgetSchema = z
  .number()
  .int('Budget must be a whole number')
  .min(0, 'Budget cannot be negative')
  .max(1_000_000, 'Budget too high (max 1M)')
  .optional();

// TODO refactor budget min and max
export const createPreferencesSchema = z
  .object({
    ...ageRangeSchema.shape,
    budgetMin: budgetSchema,
    budgetMax: budgetSchema,
    genderPreference: z.enum(GENDER_PREFERENCE).optional(),
    smokingHabit: z.enum(SMOKING_HABIT).optional(),
    petOwnership: z.enum(PET_OWNERSHIP).optional(),
    petCompatibility: z.enum(PET_COMPATIBILITY).optional(),
    alcoholConsumption: z.enum(ALCOHOL_CONSUMPTION).optional(),
  })
  .refine(
    (data) =>
      !data.budgetMin || !data.budgetMax || data.budgetMin <= data.budgetMax,
    {
      message: 'budgetMin must be less than or equal to budgetMax',
      path: ['budgetMin'],
    },
  );

export const updatePreferencesSchema = createPreferencesSchema.partial();

export type CreatePreferencesDto = z.infer<typeof createPreferencesSchema>;
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
