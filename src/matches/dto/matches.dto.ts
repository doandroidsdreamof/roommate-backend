import { paginationQuerySchema } from 'src/shared/validation-schema';
import z from 'zod';

export const getMatchesValidationSchema = z.object({
  ...paginationQuerySchema.shape,
});

export type GetMatchesDto = z.infer<typeof getMatchesValidationSchema>;
