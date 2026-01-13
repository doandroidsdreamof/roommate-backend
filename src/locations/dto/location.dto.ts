import { z } from 'zod';

const querySchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters').max(100),
});
export const searchNeighborhoodsSchema = z.object({
  ...querySchema.shape,
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const getDistrictsByProvinceSchema = z.object({
  provinceId: z
    .string()
    .regex(/^\d+$/, 'Province ID must be a numeric string')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Province ID must be greater than 0'),
});

export type GetDistrictsByProvinceDto = z.infer<
  typeof getDistrictsByProvinceSchema
>;
export type SearchNeighborhoodsDto = z.infer<typeof searchNeighborhoodsSchema>;
