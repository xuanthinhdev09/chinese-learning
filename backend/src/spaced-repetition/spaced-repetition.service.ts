import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateNextReview,
  calculateMasteryLevel,
  SM2State,
} from './sm2.algorithm';
import {
  ProgressResponseDto,
  VocabularyWithProgressDto,
  DueVocabulariesResponseDto,
  ProgressStatsResponseDto,
} from './dto/progress.dto';

@Injectable()
export class SpacedRepetitionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record learning progress for a vocabulary item
   * @param userId - User ID
   * @param vocabularyId - Vocabulary ID
   * @param quality - Quality rating (0-5)
   * @returns Updated progress
   */
  async recordProgress(
    userId: string,
    vocabularyId: string,
    quality: number
  ): Promise<ProgressResponseDto> {
    // Validate vocabulary exists
    const vocabulary = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
    });

    if (!vocabulary) {
      throw new NotFoundException('Vocabulary not found');
    }

    // Get or create progress record
    let progress = await this.prisma.userVocabularyProgress.findUnique({
      where: {
        userId_vocabularyId: {
          userId,
          vocabularyId,
        },
      },
    });

    const now = new Date();

    if (!progress) {
      // Create new progress record with default SM-2 state
      const defaultState: SM2State = {
        easeFactor: 2.5, // Default ease factor
        interval: 0,
        repetitions: 0,
      };

      const result = calculateNextReview({
        ...defaultState,
        quality,
        lastReviewAt: now,
      });

      const masteryLevel = calculateMasteryLevel(result.newState);

      progress = await this.prisma.userVocabularyProgress.create({
        data: {
          userId,
          vocabularyId,
          masteryLevel,
          reviewCount: 1,
          correctCount: quality >= 3 ? 1 : 0,
          lastReviewedAt: now,
          nextReviewAt: result.nextReviewAt,
          isMastered: masteryLevel === 5,
        },
      });
    } else {
      // Update existing progress
      const currentState: SM2State = {
        easeFactor: 2.5, // Default (in future, store in DB)
        interval: 0, // Default (in future, store in DB)
        repetitions: progress.reviewCount,
      };

      const result = calculateNextReview({
        ...currentState,
        quality,
        lastReviewAt: progress.lastReviewedAt || now,
      });

      const masteryLevel = calculateMasteryLevel(result.newState);

      progress = await this.prisma.userVocabularyProgress.update({
        where: { id: progress.id },
        data: {
          masteryLevel,
          reviewCount: { increment: 1 },
          correctCount: { increment: quality >= 3 ? 1 : 0 },
          lastReviewedAt: now,
          nextReviewAt: result.nextReviewAt,
          isMastered: masteryLevel === 5,
        },
      });
    }

    return this.formatProgressResponse(progress);
  }

  /**
   * Get due vocabularies for review
   * @param userId - User ID
   * @param limit - Maximum number of items to return
   * @returns Due vocabularies
   */
  async getDueVocabularies(
    userId: string,
    limit: number = 20
  ): Promise<DueVocabulariesResponseDto> {
    const now = new Date();

    // Get vocabularies due for review (nextReviewAt <= now)
    const dueProgress = await this.prisma.userVocabularyProgress.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
      take: limit,
      include: {
        vocabulary: true,
      },
    });

    // Get count of new vocabularies (never reviewed)
    const newCount = await this.prisma.vocabulary.count({
      where: {
        hskLevel: { in: [1, 2] }, // HSK 1-2 for now
        userProgress: {
          none: { userId },
        },
      },
    });

    // Get total due count
    const dueCount = await this.prisma.userVocabularyProgress.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
    });

    const vocabularies: VocabularyWithProgressDto[] = dueProgress.map((p) => ({
      id: p.vocabulary.id,
      hanzi: p.vocabulary.hanzi,
      traditional: p.vocabulary.traditional,
      pinyin: p.vocabulary.pinyin,
      meaning: p.vocabulary.meaning,
      pos: p.vocabulary.pos,
      hskCode: p.vocabulary.hskCode,
      hskLevel: p.vocabulary.hskLevel,
      progress: {
        masteryLevel: p.masteryLevel,
        nextReviewAt: p.nextReviewAt?.toISOString() || null,
        isMastered: p.isMastered,
        easeFactor: 2.5, // Default
      },
    }));

    return {
      vocabularies,
      total: dueCount,
      dueCount,
      newCount,
    };
  }

  /**
   * Get progress statistics for a user
   * @param userId - User ID
   * @returns Progress statistics
   */
  async getProgressStats(userId: string): Promise<ProgressStatsResponseDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Total vocabularies in HSK 1-2
    const total = await this.prisma.vocabulary.count({
      where: { hskLevel: { in: [1, 2] } },
    });

    // Count by status
    const [newCount, learningCount, masteredCount, dueTodayCount] = await Promise.all([
      // New: never reviewed
      this.prisma.vocabulary.count({
        where: {
          hskLevel: { in: [1, 2] },
          userProgress: {
            none: { userId },
          },
        },
      }),
      // Learning: masteryLevel 1-4 and not mastered
      this.prisma.userVocabularyProgress.count({
        where: {
          userId,
          masteryLevel: { gte: 1, lte: 4 },
          isMastered: false,
        },
      }),
      // Mastered: masteryLevel 5 or isMastered=true
      this.prisma.userVocabularyProgress.count({
        where: {
          userId,
          OR: [
            { masteryLevel: 5 },
            { isMastered: true },
          ],
        },
      }),
      // Due today: nextReviewAt <= end of today
      this.prisma.userVocabularyProgress.count({
        where: {
          userId,
          nextReviewAt: { lte: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Calculate streak (consecutive days with activity)
    const streak = await this.calculateStreak(userId);

    return {
      total,
      new: newCount,
      learning: learningCount,
      mastered: masteredCount,
      dueToday: dueTodayCount,
      streak,
    };
  }

  /**
   * Get progress for a specific vocabulary
   * @param userId - User ID
   * @param vocabularyId - Vocabulary ID
   * @returns Progress or null
   */
  async getVocabularyProgress(
    userId: string,
    vocabularyId: string
  ): Promise<ProgressResponseDto | null> {
    const progress = await this.prisma.userVocabularyProgress.findUnique({
      where: {
        userId_vocabularyId: {
          userId,
          vocabularyId,
        },
      },
    });

    if (!progress) {
      return null;
    }

    return this.formatProgressResponse(progress);
  }

  /**
   * Calculate learning streak (consecutive days with activity)
   * @param userId - User ID
   * @returns Number of consecutive days
   */
  private async calculateStreak(userId: string): Promise<number> {
    const now = new Date();
    let streak = 0;
    let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check each day going backwards
    while (true) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

      const hasActivity = await this.prisma.userVocabularyProgress.findFirst({
        where: {
          userId,
          lastReviewedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      if (hasActivity) {
        streak++;
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        // Check if it's today (no activity yet today doesn't break streak)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (currentDate.getTime() === todayStart.getTime()) {
          currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
          continue;
        }
        break;
      }
    }

    return streak;
  }

  /**
   * Format progress for response
   */
  private formatProgressResponse(progress: any): ProgressResponseDto {
    return {
      id: progress.id,
      userId: progress.userId,
      vocabularyId: progress.vocabularyId,
      masteryLevel: progress.masteryLevel,
      reviewCount: progress.reviewCount,
      correctCount: progress.correctCount,
      lastReviewedAt: progress.lastReviewedAt?.toISOString() || null,
      nextReviewAt: progress.nextReviewAt?.toISOString() || null,
      isMastered: progress.isMastered,
      easeFactor: 2.5, // Default (will be stored in DB in future)
      interval: 0, // Default (will be stored in DB in future)
      createdAt: progress.createdAt.toISOString(),
      updatedAt: progress.updatedAt.toISOString(),
    };
  }
}
