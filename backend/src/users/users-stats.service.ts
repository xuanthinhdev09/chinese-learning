import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Learning statistics for the profile page.
 * - vocabularyLearned: vocab entries the user has any progress on
 * - lessonsCompleted: lessons marked completed
 * - streakDays: consecutive active days up to today (or yesterday if
 *   today has no activity yet)
 * - activeDays: total distinct days with activity
 */
@Injectable()
export class UsersStatsService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const [vocabularyLearned, lessonsCompleted, vocabActivity, lessonActivity] =
      await Promise.all([
        this.prisma.userVocabularyProgress.count({ where: { userId } }),
        this.prisma.userProgress.count({
          where: { userId, isCompleted: true },
        }),
        this.prisma.userVocabularyProgress.findMany({
          where: { userId, lastReviewedAt: { not: null } },
          select: { lastReviewedAt: true },
        }),
        this.prisma.userProgress.findMany({
          where: { userId, completedAt: { not: null } },
          select: { completedAt: true },
        }),
      ]);

    const activityDates = [
      ...vocabActivity.map((v) => v.lastReviewedAt),
      ...lessonActivity.map((l) => l.completedAt),
    ];

    return {
      vocabularyLearned,
      lessonsCompleted,
      ...this.computeActiveDayStats(activityDates),
    };
  }

  /**
   * Compute active-day stats from raw activity timestamps.
   * Days are grouped by UTC calendar date — a user near midnight may see
   * their streak off by one day; accepted trade-off (see plan phase 1).
   * @param dates - Activity timestamps (nulls filtered out)
   */
  private computeActiveDayStats(dates: (Date | null)[]): {
    streakDays: number;
    activeDays: number;
  } {
    const activeDayKeys = new Set(
      dates
        .filter((date): date is Date => date !== null)
        .map((date) => date.toISOString().slice(0, 10)),
    );

    // Walk backwards day by day from today (or yesterday if today is
    // inactive yet) and stop at the first gap.
    const cursor = new Date();
    if (!activeDayKeys.has(cursor.toISOString().slice(0, 10))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    let streakDays = 0;
    while (activeDayKeys.has(cursor.toISOString().slice(0, 10))) {
      streakDays++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return { streakDays, activeDays: activeDayKeys.size };
  }
}
