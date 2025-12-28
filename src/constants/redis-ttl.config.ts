export const REDIS_TTL = {
  // Feed
  FEED_CACHE: 600, // 10 min

  // User data
  PROFILE: 3600, // 1 hour
  PREFERENCES: 3600, // 1 hour

  // Counters
  SWIPE_COUNT_DAILY: 86400, // 24 hours

  // Sessions
  AUTH_SESSION: 14400, // 4 hours
  TEMP_DATA: 300, // 5 min
} as const;
