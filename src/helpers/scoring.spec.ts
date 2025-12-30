import { getDaysSinceActive } from './scoring';

describe('getDaysSinceActive', () => {
  const MOCK_NOW = new Date('2025-12-26T12:00:00Z').getTime();
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW); // fix value of const now = Date.now();
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('should return 368 days for PostgreSQL timestamp from last year', () => {
    const timestampString = '2024-12-22 22:43:55.272+00';
    const lastActiveAt = new Date(timestampString);
    const result = getDaysSinceActive(lastActiveAt);
    expect(result).toBe(368);
  });
  it('should return 0 for current date', () => {
    const currentDate = new Date(MOCK_NOW);
    const result = getDaysSinceActive(currentDate);
    expect(result).toBe(0);
  });
  it('should return 9 days for date 9 days ago', () => {
    const timestampString = '2025-12-16 22:43:55.272+00';
    const lastActiveAt = new Date(timestampString);
    const result = getDaysSinceActive(lastActiveAt);
    expect(result).toBe(9);
  });
  it('should return Infinity when lastActiveAt is null', () => {
    const result = getDaysSinceActive(null);
    expect(result).toBe(Infinity);
  });
});
