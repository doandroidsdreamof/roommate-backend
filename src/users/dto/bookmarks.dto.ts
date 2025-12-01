import { z } from 'zod';

export const bookmarkPostingSchema = z.object({
  postingId: z.uuid('Invalid posting ID'),
});

export const updateBookmarkNotesSchema = z.object({
  bookmarkId: z.uuid('Invalid bookmark ID'),
});

export const paginationQuerySchema = z.object({
  cursor: z.iso.datetime({ offset: true }), // 2020-01-01T06:15:00+02:00  ✅
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;
export type BookmarkPostingDto = z.infer<typeof bookmarkPostingSchema>;
export type UpdateBookmarkNotesDto = z.infer<typeof updateBookmarkNotesSchema>;
