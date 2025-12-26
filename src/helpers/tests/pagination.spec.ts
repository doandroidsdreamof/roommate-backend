import { paginateResults } from '../cursorPagination';

describe('Pagination helpers tests', () => {
  const limit = 20;
  const createTestItems = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      createdAt: new Date(2025, 0, i + 1),
    }));
  };

  it('should return correct items and cursor when data.length <= limit', () => {
    const data = createTestItems(20);
    const result = paginateResults(data, limit);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBe(null);
    expect(result.items).toHaveLength(20);
  });
  it('should return correct items and cursor when data.length > limit', () => {
    const data = createTestItems(45);
    const result = paginateResults(data, limit);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toEqual(new Date(2025, 0, 20));
    expect(result.items).toHaveLength(20);
  });
  it('should handle empty array', () => {
    const data = createTestItems(0);
    const result = paginateResults(data, limit);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBe(null);
    expect(result.items).toHaveLength(0);
  });
});
