import { z } from 'zod';
import {
  POSTING_TYPE,
  POSTING_STATUS,
  GENDER_PREFERENCE,
  AGE_RANGES,
  OCCUPANT_GENDER_COMPOSITION,
  PET_OWNERSHIP,
} from 'src/constants/enums';
import { getEnumValues } from 'src/helpers/getEnumValues';

const postingTypeValues = getEnumValues(POSTING_TYPE);
const postingStatusValues = getEnumValues(POSTING_STATUS);
const genderPreferenceValues = getEnumValues(GENDER_PREFERENCE);
const ageRangeValues = getEnumValues(AGE_RANGES);
const occupantGenderCompositionValues = getEnumValues(
  OCCUPANT_GENDER_COMPOSITION,
);
const petOwnershipValues = getEnumValues(PET_OWNERSHIP);

const postingImageSchema = z.object({
  url: z.url('Must be a valid URL'),
});

const postingsSpecsSchema = z.object({
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  depositAmount: z
    .number()
    .int()
    .nonnegative('Deposit amount must be non-negative'),
  billsIncluded: z.boolean(),
  floor: z.number().int().min(0, 'Floor must be at least 0'),
  totalFloors: z.number().int().positive('Total floors must be positive'),
  hasBalcony: z.boolean(),
  hasParking: z.boolean(),
  hasElevator: z.boolean(),
  currentOccupants: z.number().int().nonnegative().optional(),
  totalCapacity: z.number().int().positive().optional(),
  availableRooms: z.number().int().positive().optional(),
  occupantGenderComposition: z.enum(occupantGenderCompositionValues).optional(),
  occupantAgeRange: z.enum(ageRangeValues).optional(),
  preferredRoommateAgeRange: z.enum(ageRangeValues).optional(),
  smokingAllowed: z.boolean().optional(),
  alcoholFriendly: z.boolean().optional(),
  hasPets: z.boolean().optional(),
  currentPetOwnership: z.enum(petOwnershipValues).optional(),
  availableUntil: z.iso.datetime().optional(),
  nearbyTransport: z.string().max(500).optional(),
});

export const createPostingSchema = z.object({
  type: z.enum(postingTypeValues),
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must be at most 100 characters'),
  coverImageUrl: z.url('Must be a valid URL'),
  city: z.string().min(1, 'City is required').max(100),
  district: z.string().min(1, 'District is required').max(100),
  neighborhoodId: z.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rentAmount: z.number().int().positive(),
  roomCount: z.number().int().min(1),
  bathroomCount: z.number().int().min(1),
  squareMeters: z.number().int().positive(),
  isFurnished: z.boolean(),
  preferredRoommateGender: z.enum(genderPreferenceValues),
  availableFrom: z.iso.datetime(),
  specs: postingsSpecsSchema,
  images: z
    .array(postingImageSchema)
    .max(10, 'Maximum 10 images allowed')
    .optional(),
});

export const updatePostingSchema = z
  .object({
    rentAmount: z.number().int().positive().optional(),
    roomCount: z.number().int().min(1).optional(),
    bathroomCount: z.number().int().min(1).optional(),
    squareMeters: z.number().int().positive().optional(),
    isFurnished: z.boolean().optional(),
    preferredRoommateGender: z.enum(genderPreferenceValues).optional(),
    availableFrom: z.iso.datetime().optional(),
    specs: postingsSpecsSchema.partial().optional(),
  })
  .refine(
    (data) => {
      //* it can be buggy regarding postings => postingsSpecs => postingsImages
      const { ...postingData } = data;
      const hasPostingUpdates = Object.keys(postingData).length > 0;
      return hasPostingUpdates;
    },
    { message: 'At least one field must be provided to update' },
  );

export type CreatePostingDto = z.infer<typeof createPostingSchema>;
export type UpdatePostingDto = z.infer<typeof updatePostingSchema>;
