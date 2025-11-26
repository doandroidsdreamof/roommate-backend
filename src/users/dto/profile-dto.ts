import { z } from 'zod';
import { AGE_RANGES, GENDER } from 'src/constants/enums';
import { getEnumValues } from 'src/helpers/getEnumValues';

const ageRangeValues = getEnumValues(AGE_RANGES);
const genderValues = getEnumValues(GENDER);

export const createProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(30, 'Name must be at most 30 characters'),

  ageRange: z.enum(ageRangeValues),

  gender: z.enum(genderValues),

  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be at most 100 characters'),

  district: z
    .string()
    .min(1, 'District is required')
    .max(100, 'District must be at most 100 characters'),
});

export const updateProfileSchema = createProfileSchema.partial().extend({
  photoUrl: z.url('Must be a valid URL').optional(),
});

export type CreateProfileDto = z.infer<typeof createProfileSchema>;
