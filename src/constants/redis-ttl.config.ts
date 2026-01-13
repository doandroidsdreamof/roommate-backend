export const REDIS_TTL = {
  // Feed
  FEED_CACHE: 3600, // 1 hour

  // User data
  PROFILE: 7200, // 2 hours
  PREFERENCES: 7200, // 2 hours

  // Counters
  SWIPE_COUNT_DAILY: 86400, // 24 hours

  // Location
  PROVINCES: 2592000, // 30 days
  DISTRICTS: 2592000, // 30 days
  NEIGHBORHOOD_SEARCH: 2592000,
} as const;
