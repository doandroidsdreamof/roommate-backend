/**
 * @returns Sliced items, cursor, and hasMore flag
 */
export function paginateResults<T>(
  results: T[],
  limit: number,
  cursorField: keyof T = 'createdAt' as keyof T,
) {
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const nextCursor = getNextCursor(items, hasMore, cursorField);

  return { items, nextCursor, hasMore };
}

/**
 * Extracts cursor value from last item for pagination
 * @returns Cursor value or null if no more items
 */
export function getNextCursor<T>(
  items: T[],
  hasMore: boolean,
  field: keyof T = 'createdAt' as keyof T,
) {
  return hasMore && items.length > 0 ? items[items.length - 1][field] : null;
}
