import { Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, Lesson } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpacedRepetitionService } from '../spaced-repetition/spaced-repetition.service';
import {
  CompleteSessionDto,
  CompleteSessionResultDto,
  DailySessionResponseDto,
  DialogueLineDto,
  DialogueReviewResultDto,
  NextLessonDto,
  RecordDialogueReviewDto,
} from './dto/daily-session.dto';

// Dialogue spaced repetition: reviewing at stage s schedules the next review
// in INTERVALS[s] days; stage 4 = graduated (no further schedule)
const DIALOGUE_INTERVALS_DAYS = [1, 3, 7, 14];
const GRADUATED_STAGE = 4;
// Lesson keywords feeding the daily exercises (plan: fixed params, YAGNI)
const KEYWORDS_PER_LESSON = 8;
const DUE_VOCABULARY_LIMIT = 15;

function toLineDto(conversation: Conversation): DialogueLineDto {
  return {
    id: conversation.id,
    order: conversation.order,
    speaker: conversation.speaker,
    hanzi: conversation.hanzi,
    pinyin: conversation.pinyin,
    vietnamese: conversation.vietnamese,
    dialogueOrder: conversation.dialogueOrder,
    dialogueTitleHanzi: conversation.dialogueTitleHanzi,
    dialogueTitleVi: conversation.dialogueTitleVi,
  };
}

@Injectable()
export class DailySessionService {
  constructor(
    private prisma: PrismaService,
    private readonly spacedRepetition: SpacedRepetitionService
  ) {}

  /**
   * Compose the one-button daily plan: due dialogue reviews, next lesson
   * material, due vocabulary, streak, and today's completion signal
   */
  async getDailySession(userId: string, courseId?: string): Promise<DailySessionResponseDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeCourseId = courseId ?? (await this.resolveActiveCourseId());

    const [dueDialogues, nextLesson, dueVocabularies, streak, reviewedToday] = await Promise.all([
      this.prisma.userDialogueProgress.findMany({
        where: { userId, nextReviewAt: { lte: now } },
        orderBy: { nextReviewAt: 'asc' },
        include: {
          lesson: { include: { conversations: { orderBy: [{ dialogueOrder: 'asc' }, { order: 'asc' }] } } },
        },
      }),
      activeCourseId
        ? this.findNextLesson(userId, activeCourseId)
        : Promise.resolve(null),
      this.spacedRepetition.getDueVocabularies(userId, DUE_VOCABULARY_LIMIT),
      this.spacedRepetition.getStreak(userId),
      // Pinned completedToday rule: ∃ dialogue review recorded today
      this.prisma.userDialogueProgress.findFirst({
        where: { userId, lastReviewedAt: { gte: todayStart } },
        select: { id: true },
      }),
    ]);

    let nextLessonDto: NextLessonDto | null = null;
    if (nextLesson) {
      const [keywords, vocabulary] = await Promise.all([
        this.prisma.vocabulary.findMany({
          where: { lessonId: nextLesson.id, isKeyword: true },
          take: KEYWORDS_PER_LESSON,
          orderBy: { id: 'asc' },
        }),
        this.prisma.vocabulary.findMany({
          where: { lessonId: nextLesson.id },
          orderBy: { id: 'asc' },
        }),
      ]);
      nextLessonDto = {
        lessonId: nextLesson.id,
        lessonTitle: nextLesson.title,
        order: nextLesson.order,
        lines: nextLesson.conversations.map(toLineDto),
        keywords,
        vocabulary,
      };
    }

    return {
      dueDialogues: dueDialogues.map((progress) => ({
        lessonId: progress.lessonId,
        lessonTitle: progress.lesson.title,
        stage: progress.stage,
        nextReviewAt: progress.nextReviewAt?.toISOString() ?? null,
        lines: progress.lesson.conversations.map(toLineDto),
      })),
      nextLesson: nextLessonDto,
      dueVocabulary: dueVocabularies.vocabularies,
      dueVocabularyTotal: dueVocabularies.total,
      streak,
      completedToday: reviewedToday !== null,
    };
  }

  /**
   * Record a dialogue shadowing review: passed advances the stage on the
   * 1/3/7/14 ladder, failed repeats tomorrow at the same stage
   */
  async recordDialogueReview(
    userId: string,
    dto: RecordDialogueReviewDto
  ): Promise<DialogueReviewResultDto> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const now = new Date();
    const existing = await this.prisma.userDialogueProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
    });

    const currentStage = existing?.stage ?? 0;
    let stage = currentStage;
    let nextReviewAt: Date | null;

    if (dto.passed) {
      stage = Math.min(currentStage + 1, GRADUATED_STAGE);
      nextReviewAt =
        stage >= GRADUATED_STAGE
          ? null
          : this.addDays(now, DIALOGUE_INTERVALS_DAYS[stage]);
    } else {
      nextReviewAt = this.addDays(now, DIALOGUE_INTERVALS_DAYS[0]);
    }

    await this.prisma.userDialogueProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      create: {
        userId,
        lessonId: lesson.id,
        stage,
        lastReviewedAt: now,
        nextReviewAt,
      },
      update: {
        stage,
        lastReviewedAt: now,
        nextReviewAt,
      },
    });

    return {
      lessonId: lesson.id,
      stage,
      graduated: stage >= GRADUATED_STAGE,
      nextReviewAt: nextReviewAt?.toISOString() ?? null,
    };
  }

  /**
   * Mark the lesson completed and report the (day-scoped) streak
   */
  async completeSession(userId: string, dto: CompleteSessionDto): Promise<CompleteSessionResultDto> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const now = new Date();
    const progress = await this.prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      create: { userId, lessonId: lesson.id, isCompleted: true, completedAt: now },
      update: { isCompleted: true, completedAt: now },
    });

    const streak = await this.spacedRepetition.getStreak(userId);

    return {
      lessonId: lesson.id,
      isCompleted: progress.isCompleted,
      completedAt: (progress.completedAt ?? now).toISOString(),
      streak,
    };
  }

  /**
   * Active course resolution (pinned): explicit courseId, else the course
   * owning the most recently created lesson lacking completed progress,
   * falling back to the most recently created course when all are done
   */
  private async resolveActiveCourseId(): Promise<string | null> {
    const latestOpen = await this.prisma.lesson.findFirst({
      where: { userProgress: { none: { isCompleted: true } } },
      orderBy: { createdAt: 'desc' },
      select: { courseId: true },
    });
    if (latestOpen) {
      return latestOpen.courseId;
    }

    const latestCourse = await this.prisma.course.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    return latestCourse?.id ?? null;
  }

  private async findNextLesson(userId: string, courseId: string): Promise<Lesson | null> {
    return this.prisma.lesson.findFirst({
      where: {
        courseId,
        userProgress: { none: { userId, isCompleted: true } },
      },
      orderBy: { order: 'asc' },
      include: { conversations: { orderBy: [{ dialogueOrder: 'asc' }, { order: 'asc' }] } },
    });
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
