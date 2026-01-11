import z from 'zod';

export const emailSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

export const refreshToken = z.object({
  refreshToken: z.string().min(5), //TODO move it to config
});

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
});

export const ageRangeSchema = z
  .object({
    ageMin: z.number().int().min(18).max(100),
    ageMax: z.number().int().min(18).max(100),
  })
  .refine((data) => data.ageMax >= data.ageMin, {
    message: 'Maximum age must be greater than or equal to minimum age',
  });
