import { z } from 'zod';
import { getEnumValues } from 'src/helpers/getEnumValues';
import { GENDER_PREFERENCE } from 'src/constants/enums';

const genderPreferenceValues = getEnumValues(GENDER_PREFERENCE);

// Query parameters for browsing listings
export const listsQuerySchema = z.object({
  // Pagination
  cursor: z.string().optional(), //* optional => for fist page
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
  isFurnished: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  minSquareMeters: z.coerce.number().int().min(0).optional(),
  maxSquareMeters: z.coerce.number().int().min(0).optional(),

  // Matching filters
  preferredRoommateGender: z.enum(genderPreferenceValues).optional(),

  // Specs filters (from postingSpecs table)
  hasParking: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  hasBalcony: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  hasElevator: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  billsIncluded: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  smokingAllowed: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  alcoholFriendly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  hasPets: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),

  // Date filter
  availableFrom: z.iso.datetime({ offset: true }).optional(),

  // Sort
  sortBy: z
    .enum(['price', 'date', 'views', 'bookmarks'])
    .optional()
    .default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  // Search
  search: z.string().min(2).max(100).optional(),
});

export type ListsQueryDto = z.infer<typeof listsQuerySchema>;
