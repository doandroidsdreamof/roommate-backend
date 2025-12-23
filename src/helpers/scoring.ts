export const SCORE_WEIGHTS = {
  LOCATION: 40,
  BUDGET: 30,
  LIFESTYLE: 20,
  PROFILE_QUALITY: 5,
  RECENCY: 5,
} as const;

type AlcoholLevel = 'never' | 'rarely' | 'socially' | 'regularly';

export const ALCOHOL_LEVELS: Record<AlcoholLevel, number> = {
  never: 0,
  rarely: 1,
  socially: 2,
  regularly: 3,
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
 * Calculate hours since last activity
 */
export function getHoursSinceActive(lastActiveAt: Date | null): number {
  if (!lastActiveAt) return Infinity;
  return (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60);
}

/**
 * Parse budget string to number (handles "5000", "5.000", etc)
 */
export function parseBudget(budget: string | null): number {
  if (!budget) return 0;
  return parseInt(budget.replace(/[^0-9]/g, '')) || 0;
}
