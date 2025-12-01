import { z } from 'zod';

export const bookmarkPostingSchema = z.object({
  postingId: z.uuid('Invalid posting ID'),
});

export const updateBookmarkNotesSchema = z.object({
  bookmarkId: z.uuid('Invalid bookmark ID'),
});
export type BookmarkPostingDto = z.infer<typeof bookmarkPostingSchema>;
export type UpdateBookmarkNotesDto = z.infer<typeof updateBookmarkNotesSchema>;
