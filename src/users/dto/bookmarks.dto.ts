import { paginationQuerySchema } from 'src/shared/validation-schema';
import { z } from 'zod';

export const bookmarkPostingSchema = z.object({
  postingId: z.uuid('Invalid posting ID'),
});

export const updateBookmarkNotesSchema = z.object({
  bookmarkId: z.uuid('Invalid bookmark ID'),
});

export const bookmarkPaginationQuery = z.object({
  ...paginationQuerySchema.shape,
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type BookmarkPaginationQueryDto = z.infer<
  typeof bookmarkPaginationQuery
>;
export type BookmarkPostingDto = z.infer<typeof bookmarkPostingSchema>;
export type UpdateBookmarkNotesDto = z.infer<typeof updateBookmarkNotesSchema>;
