import { Injectable, Logger } from '@nestjs/common';
import { PET_COMPATIBILITY, SMOKING_HABIT } from 'src/constants/enums';
import {
  ALCOHOL_LEVELS,
  calculateBudgetOverlap,
  getDaysSinceActive,
} from 'src/helpers/scoring';
import { EligibleUser, FeedContext, ScoredUser } from '../types';
import { SCORING } from 'src/constants/scoringWeights';

@Injectable()
export class FeedScorerService {
  private readonly logger = new Logger(FeedScorerService.name);

  /**
   * Score all candidates based on compatibility
   * Max score: 100 points
   * - Location: 40 points
   * - Budget: 30 points
   * - Lifestyle: 20 points (Smoking: 7, Pets: 7, Alcohol: 6)
   * - Profile Quality: 5 points
   * - Recency: 5 points
   */
  scoreUsers(context: FeedContext, candidates: EligibleUser[]): ScoredUser[] {
    return candidates.map((candidate) => {
      const location = this.scoreLocation(context, candidate);
      const budget = this.scoreBudget(context, candidate);
      const lifestyle = this.scoreLifestyle(context, candidate);
      const profileQuality = this.scoreProfileQuality(candidate);
      const recency = this.scoreRecency(candidate);

      const totalScore =
        location + budget + lifestyle + profileQuality + recency;

      return {
        ...candidate,
        score: Math.round(totalScore),
        scoreBreakdown: {
          location,
          budget,
          lifestyle,
          profileQuality,
          recency,
        },
      };
    });
  }

  /**
   * Location Proximity Score (40 points max)
   * - Same district: 40 points
   * - Different district, same city: 20 points
   */
  private scoreLocation(context: FeedContext, candidate: EligibleUser): number {
    if (context.profile.district === candidate.district) {
      return SCORING.LOCATION.SAME_DISTRICT;
    }

    return SCORING.LOCATION.SAME_CITY_DIFF_DISTRICT;
  }

  /**
   * Budget Compatibility Score (30 points max)
   * Based on budget range overlap percentage
   */
  private scoreBudget(context: FeedContext, candidate: EligibleUser): number {
    const userMin = context.preferences?.budgetMin;
    const userMax = context.preferences?.budgetMax;
    const candidateMin = candidate.budgetMin;
    const candidateMax = candidate.budgetMax;

    if (
      typeof userMin !== 'number' ||
      typeof userMax !== 'number' ||
      typeof candidateMin !== 'number' ||
      typeof candidateMax !== 'number'
    ) {
      return 0;
    }

    const overlapPercent = calculateBudgetOverlap(
      userMin,
      userMax,
      candidateMin,
      candidateMax,
    );

    return Math.round(SCORING.BUDGET.MAX_SCORE * overlapPercent);
  }

  /**
   * Lifestyle Compatibility Score (20 points max)
   * - Smoking: 7 points
   * - Pets: 7 points
   * - Alcohol: 6 points
   */
  private scoreLifestyle(
    context: FeedContext,
    candidate: EligibleUser,
  ): number {
    let score = 0;

    score += this.scoreSmokingCompatibility(
      context.preferences?.smokingHabit,
      candidate.smokingHabit,
    );

    score += this.scorePetCompatibility(candidate.petCompatibility);

    score += this.scoreAlcoholCompatibility(
      context.preferences?.alcoholConsumption,
      candidate.alcoholConsumption,
    );

    return score;
  }

  private scoreSmokingCompatibility(
    userHabit: string | null | undefined,
    candidateHabit: string | null,
  ): number {
    if (!userHabit || !candidateHabit) {
      return SCORING.LIFESTYLE.SMOKING.NO_MATCH;
    }

    if (userHabit === candidateHabit) {
      return SCORING.LIFESTYLE.SMOKING.PERFECT_MATCH;
    }

    // Partial compatibility between NO and SOCIAL
    if (
      (userHabit === SMOKING_HABIT.NO &&
        candidateHabit === SMOKING_HABIT.SOCIAL) ||
      (userHabit === SMOKING_HABIT.SOCIAL &&
        candidateHabit === SMOKING_HABIT.NO)
    ) {
      return SCORING.LIFESTYLE.SMOKING.PARTIAL_NO_SOCIAL;
    }

    // Partial compatibility between SOCIAL and REGULAR
    if (
      (userHabit === SMOKING_HABIT.SOCIAL &&
        candidateHabit === SMOKING_HABIT.REGULAR) ||
      (userHabit === SMOKING_HABIT.REGULAR &&
        candidateHabit === SMOKING_HABIT.SOCIAL)
    ) {
      return SCORING.LIFESTYLE.SMOKING.PARTIAL_SOCIAL_REGULAR;
    }

    return SCORING.LIFESTYLE.SMOKING.NO_MATCH;
  }

  private scorePetCompatibility(
    candidatePetCompatibility: string | null,
  ): number {
    if (!candidatePetCompatibility) {
      return SCORING.LIFESTYLE.PETS.DEFAULT;
    }

    switch (candidatePetCompatibility) {
      case PET_COMPATIBILITY.NO:
        return SCORING.LIFESTYLE.PETS.NO_PETS;
      case PET_COMPATIBILITY.DOESNT_MATTER:
        return SCORING.LIFESTYLE.PETS.DOESNT_MATTER;
      case PET_COMPATIBILITY.NO_BOTHERED:
        return SCORING.LIFESTYLE.PETS.NOT_BOTHERED;
      case PET_COMPATIBILITY.YES_LOVE_PETS:
        return SCORING.LIFESTYLE.PETS.LOVES_PETS;
      default:
        return SCORING.LIFESTYLE.PETS.DEFAULT;
    }
  }

  private scoreAlcoholCompatibility(
    userConsumption: keyof typeof ALCOHOL_LEVELS | null | undefined,
    candidateConsumption: string | null,
  ): number {
    if (!userConsumption || !candidateConsumption) {
      return SCORING.LIFESTYLE.ALCOHOL.NO_MATCH;
    }

    if (userConsumption === candidateConsumption) {
      return SCORING.LIFESTYLE.ALCOHOL.PERFECT_MATCH;
    }

    // Check proximity in alcohol levels
    const userLevel =
      userConsumption in ALCOHOL_LEVELS ? ALCOHOL_LEVELS[userConsumption] : -1;

    const candidateLevel =
      candidateConsumption in ALCOHOL_LEVELS
        ? ALCOHOL_LEVELS[candidateConsumption]
        : -1;

    if (
      userLevel === undefined ||
      candidateLevel === undefined ||
      userLevel === -1 ||
      candidateLevel === -1
    ) {
      return SCORING.LIFESTYLE.ALCOHOL.NO_MATCH;
    }

    const difference = Math.abs(userLevel - candidateLevel);

    if (difference === 1) {
      return SCORING.LIFESTYLE.ALCOHOL.ADJACENT_LEVEL;
    }

    if (difference === 2) {
      return SCORING.LIFESTYLE.ALCOHOL.TWO_LEVELS_APART;
    }

    return SCORING.LIFESTYLE.ALCOHOL.NO_MATCH;
  }

  /**
   * Profile Quality Score (5 points max)
   * - Photo: 2 points
   * - Verified photo: +1 point
   */
  private scoreProfileQuality(candidate: EligibleUser): number {
    let score = 0;

    if (candidate.photoUrl) {
      score += SCORING.PROFILE_QUALITY.HAS_PHOTO;
      if (candidate.photoVerified) {
        score += SCORING.PROFILE_QUALITY.VERIFIED_PHOTO_BONUS;
      }
    }

    return score;
  }

  /**
   * Activity Recency Score (5 points max)
   * - Active in last 24h: 5 points
   * - Active in last 3 days: 3 points
   * - Active in last week: 1 point
   * - Older: 0 points
   */
  private scoreRecency(candidate: EligibleUser): number {
    const daysSinceActive = getDaysSinceActive(candidate.lastActiveAt);

    if (daysSinceActive < SCORING.RECENCY.THRESHOLDS_DAYS.LAST_24_HOURS) {
      return SCORING.RECENCY.SCORES.LAST_24_HOURS;
    }

    if (daysSinceActive < SCORING.RECENCY.THRESHOLDS_DAYS.LAST_3_DAYS) {
      return SCORING.RECENCY.SCORES.LAST_3_DAYS;
    }

    if (daysSinceActive < SCORING.RECENCY.THRESHOLDS_DAYS.LAST_7_DAYS) {
      return SCORING.RECENCY.SCORES.LAST_7_DAYS;
    }

    return SCORING.RECENCY.SCORES.OLDER;
  }
}
