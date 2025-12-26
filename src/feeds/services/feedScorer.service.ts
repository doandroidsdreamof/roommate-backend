import { Injectable, Logger } from '@nestjs/common';
import { PET_COMPATIBILITY, SMOKING_HABIT } from '../../constants/enums';
import {
  ALCOHOL_LEVELS,
  calculateBudgetOverlap,
  getDaysSinceActive,
  SCORE_WEIGHTS,
} from '../../helpers/scoring';
import { EligibleUser, FeedContext, ScoredUser } from '../types';

@Injectable()
export class FeedScorerService {
  private readonly logger = new Logger(FeedScorerService.name);
  /**
   * Score all candidates based on compatibility
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
   * Location Proximity Score
   * Same district = 40 points
   * Different district, same city = 20 points
   */
  private scoreLocation(context: FeedContext, candidate: EligibleUser): number {
    if (context.profile.district === candidate.district) {
      return SCORE_WEIGHTS.LOCATION;
    }

    return SCORE_WEIGHTS.LOCATION / 2;
  }

  /**
   * Budget Compatibility Score (30 points max)
   * Based on budget range overlap
   */
  private scoreBudget(context: FeedContext, candidate: EligibleUser): number {
    const userMin = context.preferences?.budgetMin;
    const userMax = context.preferences?.budgetMax;

    const candidateMin = candidate.budgetMin;
    const candidateMax = candidate.budgetMax;

    const overlapPercent = calculateBudgetOverlap(
      userMin,
      userMax,
      candidateMin,
      candidateMax,
    );

    return Math.round(SCORE_WEIGHTS.BUDGET * overlapPercent);
  }

  /**
   * Lifestyle Compatibility Score (20 points max)
   * Smoking: 7 points
   * Pets: 7 points
   * Alcohol: 6 points
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
    if (!userHabit || !candidateHabit) return 0;

    if (userHabit === candidateHabit) {
      return 7; // Perfect match
    }

    // Partial compatibility between NO and SOCIAL
    if (
      (userHabit === SMOKING_HABIT.NO &&
        candidateHabit === SMOKING_HABIT.SOCIAL) ||
      (userHabit === SMOKING_HABIT.SOCIAL &&
        candidateHabit === SMOKING_HABIT.NO)
    ) {
      return 3;
    }

    // Partial compatibility between SOCIAL and REGULAR
    if (
      (userHabit === SMOKING_HABIT.SOCIAL &&
        candidateHabit === SMOKING_HABIT.REGULAR) ||
      (userHabit === SMOKING_HABIT.REGULAR &&
        candidateHabit === SMOKING_HABIT.SOCIAL)
    ) {
      return 2;
    }

    return 0;
  }

  private scorePetCompatibility(
    candidatePetCompatibility: string | null,
  ): number {
    if (!candidatePetCompatibility) return 0;

    if (candidatePetCompatibility === PET_COMPATIBILITY.NO) return 7;
    if (candidatePetCompatibility === PET_COMPATIBILITY.DOESNT_MATTER) return 5;
    if (candidatePetCompatibility === PET_COMPATIBILITY.NO_BOTHERED) return 2;
    if (candidatePetCompatibility === PET_COMPATIBILITY.YES_LOVE_PETS) return 0;

    return 0;
  }

  private scoreAlcoholCompatibility(
    userConsumption: keyof typeof ALCOHOL_LEVELS | undefined,
    candidateConsumption: string | null,
  ): number {
    if (!userConsumption || !candidateConsumption) return 0;

    if (userConsumption === candidateConsumption) {
      return 6; // Perfect match
    }

    // Check proximity in alcohol levels
    const userLevel =
      userConsumption in ALCOHOL_LEVELS ? ALCOHOL_LEVELS[userConsumption] : -1;

    const candidateLevel =
      candidateConsumption in ALCOHOL_LEVELS
        ? ALCOHOL_LEVELS[candidateConsumption]
        : -1;

    if (userLevel === -1 || candidateLevel === -1) return 0;

    const difference = Math.abs(userLevel - candidateLevel);

    if (difference === 1) return 3; // Adjacent levels (e.g., never ↔ occasionally)
    if (difference === 2) return 1; // Two levels apart (e.g., never ↔ socially)

    return 0;
  }

  /**
   * Profile Quality Score (5 points max)
   * Photo: 2 points
   * Verified photo: +1 point
   */
  private scoreProfileQuality(candidate: EligibleUser): number {
    let score = 0;

    if (candidate.photoUrl) {
      score += 2;
      if (candidate.photoVerified) {
        score += 1;
      }
    }

    return score;
  }

  /**
   * Activity Recency Score (5 points max)
   * Active in last 24h: 5 points
   * Active in last 3 days: 3 points
   * Active in last week: 1 point
   * Older: 0 points
   */
  private scoreRecency(candidate: EligibleUser): number {
    const daysSinceActive = getDaysSinceActive(candidate.lastActiveAt);

    if (daysSinceActive < 1) return 5; // Last 24 hours
    if (daysSinceActive < 3) return 3; // Last 3 days
    if (daysSinceActive < 7) return 1; // Last 7 days

    return 0;
  }
}
