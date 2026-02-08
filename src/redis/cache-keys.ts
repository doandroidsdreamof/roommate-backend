export const CacheKeys = {
  feed: (userId: string) => `feed:${userId}`,
  refreshToken: (tokenHash: string) => `refresh_token:${tokenHash}`,
  userProfile: (userId: string) => `profile:${userId}`,
  userPreference: (userId: string) => `preference:${userId}`,
  matches: (userId: string) => `matches:${userId}`,
  provinces: () => 'locations:provinces',
  districtsByProvince: (provinceId: string) => `disticts:${provinceId}`,
  neighborhoodsByDistrict: (provinceId: string) =>
    `neighborhoods:district:${provinceId}`,
} as const;
