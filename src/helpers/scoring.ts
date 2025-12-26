import { ALCOHOL_CONSUMPTION } from 'src/constants/enums';

export const SCORE_WEIGHTS = {
  LOCATION: 40,
  BUDGET: 30,
  LIFESTYLE: 20,
  PROFILE_QUALITY: 5,
  RECENCY: 5,
} as const;

export const ALCOHOL_LEVELS: Record<string, number> = {
  [ALCOHOL_CONSUMPTION.NEVER]: 0,
  [ALCOHOL_CONSUMPTION.OCCASIONALLY]: 1,
  [ALCOHOL_CONSUMPTION.SOCIALLY]: 2,
  [ALCOHOL_CONSUMPTION.REGULARLY]: 3,
} as const;
/**
 * Calculate budget overlap percentage
 */
export function calculateBudgetOverlap(
  userMin: number,
  userMax: number,
  candidateMin: number,
  candidateMax: number,
): number {
  const overlapStart = Math.max(userMin, candidateMin);
  const overlapEnd = Math.min(userMax, candidateMax);

  if (overlapStart > overlapEnd) {
    return 0; // No overlap
  }

  const userRange = userMax - userMin || 1; // Prevent division by zero
  const overlap = overlapEnd - overlapStart;

  return overlap / userRange;
}

/**
 * Calculate days since last activity and current time
 */
export function getDaysSinceActive(lastActiveAt: Date | null): number {
  if (!lastActiveAt) return Infinity;
  const MS_PER_DAY = 86_400_000; // 1000 * 60 * 60 * 24 ms in a day

  const now = Date.now();
  const lastActiveTimestamp = lastActiveAt.getTime(); //  Returns the stored time value in milliseconds since midnight, January 1, 1970 UTC.
  const daysSince = now - lastActiveTimestamp;
  const result = Math.floor(daysSince / MS_PER_DAY);

  return result;
}
