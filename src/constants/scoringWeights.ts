const SCORE_WEIGHTS = {
  LOCATION: 40,
  BUDGET: 30,
  LIFESTYLE: 20,
  PROFILE_QUALITY: 5,
  RECENCY: 5,
} as const;

const SCORING = {
  // Location scoring
  LOCATION: {
    SAME_DISTRICT: 40,
    SAME_CITY_DIFF_DISTRICT: 20,
  },

  // Budget scoring
  BUDGET: {
    MAX_SCORE: 30,
  },

  // Lifestyle scoring
  LIFESTYLE: {
    WEIGHTS: {
      SMOKING: 7,
      PETS: 7,
      ALCOHOL: 6,
    },
    SMOKING: {
      PERFECT_MATCH: 7,
      PARTIAL_NO_SOCIAL: 3,
      PARTIAL_SOCIAL_REGULAR: 2,
      NO_MATCH: 0,
    },
    PETS: {
      NO_PETS: 7,
      DOESNT_MATTER: 5,
      NOT_BOTHERED: 2,
      LOVES_PETS: 0,
      DEFAULT: 0,
    },
    ALCOHOL: {
      PERFECT_MATCH: 6,
      ADJACENT_LEVEL: 3,
      TWO_LEVELS_APART: 1,
      NO_MATCH: 0,
    },
  },

  // Profile quality scoring
  PROFILE_QUALITY: {
    HAS_PHOTO: 2,
    VERIFIED_PHOTO_BONUS: 1,
  },

  // Recency scoring
  RECENCY: {
    THRESHOLDS_DAYS: {
      LAST_24_HOURS: 1,
      LAST_3_DAYS: 3,
      LAST_7_DAYS: 7,
    },
    SCORES: {
      LAST_24_HOURS: 5,
      LAST_3_DAYS: 3,
      LAST_7_DAYS: 1,
      OLDER: 0,
    },
  },
} as const;

export { SCORE_WEIGHTS, SCORING };
