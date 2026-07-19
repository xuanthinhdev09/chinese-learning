/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 *
 * Based on the original SuperMemo 2 algorithm by Piotr Woźniak
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Quality ratings:
 * - 0: Again (Complete blackout, forgot completely)
 * - 1: (Not used in SM-2)
 * - 2: (Not used in SM-2)
 * - 3: Hard (Correct answer but with difficulty)
 * - 4: Good (Correct answer with some hesitation)
 * - 5: Easy (Perfect recall, instant response)
 */

export interface SM2State {
  easeFactor: number;      // E-Factor: How easy the item is (1.3+)
  interval: number;         // I: Interval in days until next review
  repetitions: number;      // R: Number of successful repetitions
}

export interface SM2Result {
  nextReviewAt: Date;
  newState: SM2State;
  quality: number;
}

export interface SM2Input extends SM2State {
  quality: number;
  lastReviewAt?: Date;
}

/**
 * Calculate next review parameters using SM-2 algorithm
 *
 * @param input - Current state and quality rating
 * @returns Next review date and new state
 */
export function calculateNextReview(input: SM2Input): SM2Result {
  const { easeFactor, interval, repetitions, quality, lastReviewAt = new Date() } = input;

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Quality < 3: Failed - reset to initial state
  if (quality < 3) {
    return {
      nextReviewAt: new Date(lastReviewAt.getTime() + 10 * 60 * 1000), // 10 minutes
      newState: {
        easeFactor,
        interval: 0,
        repetitions: 0,
      },
      quality,
    };
  }

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Minimum ease factor is 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor);

  // Calculate new interval based on repetitions
  if (repetitions === 0) {
    // First successful review: 1 day
    newInterval = 1;
  } else if (repetitions === 1) {
    // Second successful review: 6 days
    newInterval = 6;
  } else {
    // Subsequent reviews: I = I * EF
    newInterval = Math.round(interval * newEaseFactor);
  }

  newRepetitions = repetitions + 1;

  // Calculate next review date
  const nextReviewAt = new Date(lastReviewAt.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    nextReviewAt,
    newState: {
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
    },
    quality,
  };
}

/**
 * Calculate mastery level (0-5) based on repetitions and ease factor
 *
 * @param state - Current SM-2 state
 * @returns Mastery level (0=unknown, 5=mastered)
 */
export function calculateMasteryLevel(state: SM2State): number {
  const { repetitions, easeFactor } = state;

  if (repetitions === 0) return 0;
  if (repetitions === 1) return 1;
  if (repetitions === 2) return 2;
  if (repetitions >= 3 && easeFactor < 2.0) return 3;
  if (repetitions >= 3 && easeFactor < 2.5) return 4;
  if (repetitions >= 4) return 5;

  return 3; // Default
}

/**
 * Get quality rating from button label
 *
 * @param label - Button label (Again, Hard, Good, Easy)
 * @returns Quality rating (0-5)
 */
export function getQualityFromLabel(label: 'Again' | 'Hard' | 'Good' | 'Easy'): number {
  const mapping: Record<string, number> = {
    'Again': 0,
    'Hard': 3,
    'Good': 4,
    'Easy': 5,
  };
  return mapping[label] ?? 3;
}

/**
 * Get human-readable description of quality rating
 *
 * @param quality - Quality rating (0-5)
 * @returns Description
 */
export function getQualityDescription(quality: number): string {
  const descriptions: Record<number, string> = {
    0: 'Làm lại - Ôn lại sau 10 phút',
    1: 'Rất khó - Không dùng',
    2: 'Khó - Không dùng',
    3: 'Khó - Cần cố gắng',
    4: 'Tốt - Nhớ khá',
    5: 'Dễ - Nhớ tốt',
  };
  return descriptions[quality] ?? 'Unknown';
}
