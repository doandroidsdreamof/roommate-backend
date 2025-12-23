import { Injectable } from '@nestjs/common';
import { EligibleUser, FeedContext, ScoredUser } from '../types';
import {
  SCORE_WEIGHTS,
  ALCOHOL_LEVELS,
  calculateBudgetOverlap,
  getHoursSinceActive,
  parseBudget,
} from '../../helpers/scoring';

// TODO properly design here strategy pattern may useful
@Injectable()
export class FeedScorerService {
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
      return SCORE_WEIGHTS.LOCATION; // Perfect match
    }

    // Same city already filtered, so this is different district
    return SCORE_WEIGHTS.LOCATION / 2;
  }

  /**
   * Budget Compatibility Score (30 points max)
   * Based on budget range overlap
   */
  private scoreBudget(context: FeedContext, candidate: EligibleUser): number {
    const userMin = parseBudget(context.preferences?.budgetMin);
    const userMax = parseBudget(context.preferences?.budgetMax) || 999999; // TODO refactor
    const candidateMin = parseBudget(candidate.budgetMin);
    const candidateMax = parseBudget(candidate.budgetMax) || 999999;

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

    // Smoking compatibility (7 points)
    score += this.scoreSmokingCompatibility(
      context.preferences?.smokingHabit,
      candidate.smokingHabit,
    );

    // Pet compatibility (7 points)
    score += this.scorePetCompatibility(
      context.preferences?.petOwnership,
      candidate.petCompatibility,
    );

    // Alcohol compatibility (6 points)
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

    // Partial compatibility
    if (
      (userHabit === 'non_smoker' && candidateHabit === 'occasional') ||
      (userHabit === 'occasional' && candidateHabit === 'non_smoker')
    ) {
      return 3;
    }

    return 0;
  }

  private scorePetCompatibility(
    userPetOwnership: string | null | undefined,
    candidatePetCompatibility: string | null,
  ): number {
    if (!userPetOwnership || !candidatePetCompatibility) return 0;

    // User has no pets
    if (userPetOwnership === 'no_pets') {
      if (candidatePetCompatibility === 'no_pets_allowed') return 7;
      if (candidatePetCompatibility === 'pet_friendly') return 4;
    }

    // User has pets
    if (userPetOwnership === 'has_pets') {
      if (candidatePetCompatibility === 'pet_friendly') return 7;
      if (candidatePetCompatibility === 'no_pets_allowed') return 0;
    }

    return 0;
  }

  private scoreAlcoholCompatibility(
    userConsumption: string | null | undefined,
    candidateConsumption: string | null,
  ): number {
    if (!userConsumption || !candidateConsumption) return 0;

    if (userConsumption === candidateConsumption) {
      return 6; // Perfect match
    }

    // Check proximity in alcohol levels
    const userLevel =
      userConsumption in ALCOHOL_LEVELS
        ? ALCOHOL_LEVELS[userConsumption as keyof typeof ALCOHOL_LEVELS]
        : -1;

    const candidateLevel =
      candidateConsumption in ALCOHOL_LEVELS
        ? ALCOHOL_LEVELS[candidateConsumption as keyof typeof ALCOHOL_LEVELS]
        : -1;

    if (userLevel === -1 || candidateLevel === -1) return 0;

    const difference = Math.abs(userLevel - candidateLevel);

    if (difference === 1) return 3; // Adjacent levels
    if (difference === 2) return 1; // Two levels apart

    return 0;
  }

  /**
   * Profile Quality Score (5 points max)
   * Photo: 2 points
   * Verified photo: +1 point
   * (Bio would be +2 points but not in current schema)
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
    const hoursSinceActive = getHoursSinceActive(candidate.lastActiveAt);

    if (hoursSinceActive < 24) return 5; // Last day
    if (hoursSinceActive < 72) return 3; // Last 3 days
    if (hoursSinceActive < 168) return 1; // Last week

    return 0;
  }
}
