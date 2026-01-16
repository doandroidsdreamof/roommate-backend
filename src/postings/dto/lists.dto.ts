import { GENDER_PREFERENCE } from 'src/constants/enums';
import { getEnumValues } from 'src/helpers/getEnumValues';
import { paginationQuerySchema } from 'src/shared/validation-schema';
import { z } from 'zod';

const genderPreferenceValues = getEnumValues(GENDER_PREFERENCE);

const optionalBooleanParam = z
  .enum(['true', 'false'])
  .optional()
  .transform((val) => (val === undefined ? undefined : val === 'true'));

export const listsQuerySchema = z.object({
  // Pagination
  ...paginationQuerySchema.shape,
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),

  // Location filters
  city: z.string().optional(),
  district: z.string().optional(),
  neighborhoodId: z.coerce.number().int().positive().optional(),

  // Price filters
  minRent: z.coerce.number().int().min(0).optional(),
  maxRent: z.coerce.number().int().min(0).optional(),

  // Room filters
  minRooms: z.coerce.number().int().min(0).optional(),
  maxRooms: z.coerce.number().int().min(0).optional(),

  // Property filters
  isFurnished: optionalBooleanParam,
  minSquareMeters: z.coerce.number().int().min(0).optional(),
  maxSquareMeters: z.coerce.number().int().min(0).optional(),

  // Matching filters
  preferredRoommateGender: z.enum(genderPreferenceValues).optional(),

  // Specs filters (from postingSpecs table)
  hasParking: optionalBooleanParam,
  hasBalcony: optionalBooleanParam,
  hasElevator: optionalBooleanParam,
  billsIncluded: optionalBooleanParam,
  smokingAllowed: optionalBooleanParam,
  alcoholFriendly: optionalBooleanParam,
  hasPets: optionalBooleanParam,

  // Date filter
  availableFrom: z.iso.datetime({ offset: true }).optional(),

  // Sort
  sortBy: z
    .enum(['createdAt', 'rentAmount', 'viewCount', 'bookmarkCount'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  // Search
  search: z.string().min(2).max(100).optional(),
});

export type ListsQueryDto = z.infer<typeof listsQuerySchema>;
