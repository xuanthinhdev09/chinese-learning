import { NotFoundException } from '@nestjs/common';
import { DailySessionService } from './daily-session.service';
import { SpacedRepetitionService } from '../spaced-repetition/spaced-repetition.service';

const DAY_MS = 24 * 60 * 60 * 1000;

function buildPrismaMock() {
  return {
    userDialogueProgress: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation(({ where, create, update }) =>
        Promise.resolve({ id: 'dp-1', userId: 'u1', lessonId: where.userId_lessonId.lessonId, ...update })
      ),
    },
    lesson: {
      findUnique: jest.fn().mockImplementation(({ where }) =>
        Promise.resolve({ id: where.id, title: 'L', courseId: 'c1', order: 1 })
      ),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    course: { findFirst: jest.fn().mockResolvedValue(null) },
    vocabulary: { findMany: jest.fn().mockResolvedValue([]) },
    userProgress: {
      upsert: jest.fn().mockResolvedValue({ isCompleted: true, completedAt: new Date() }),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ isCompleted: true, completedAt: new Date() }),
    },
  };
}

function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const spaced = {
    getDueVocabularies: jest.fn().mockResolvedValue({ vocabularies: [], total: 0 }),
    getStreak: jest.fn().mockResolvedValue(3),
  } as unknown as SpacedRepetitionService;
  return {
    service: new DailySessionService(prisma as never, spaced),
    spaced: spaced as jest.Mocked<SpacedRepetitionService>,
  };
}

describe('DailySessionService — dialogue review schedule', () => {
  it('records a first passed review at stage 1 with a 3-day interval', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    const result = await service.recordDialogueReview('u1', { lessonId: 'l1', passed: true });

    expect(result.stage).toBe(1);
    expect(result.graduated).toBe(false);
    const expected = Date.now() + 3 * DAY_MS;
    expect(new Date(result.nextReviewAt as string).getTime()).toBeGreaterThanOrEqual(expected - 5000);
    expect(prisma.userDialogueProgress.upsert).toHaveBeenCalled();
  });

  it('graduates at stage 4 with no further review scheduled', async () => {
    const prisma = buildPrismaMock();
    prisma.userDialogueProgress.findUnique.mockResolvedValue({ stage: 3, lastReviewedAt: new Date() });
    const { service } = buildService(prisma);

    const result = await service.recordDialogueReview('u1', { lessonId: 'l1', passed: true });

    expect(result.stage).toBe(4);
    expect(result.graduated).toBe(true);
    expect(result.nextReviewAt).toBeNull();
  });

  it('keeps the stage and schedules +1 day on a failed review', async () => {
    const prisma = buildPrismaMock();
    prisma.userDialogueProgress.findUnique.mockResolvedValue({ stage: 2, lastReviewedAt: new Date() });
    const { service } = buildService(prisma);

    const result = await service.recordDialogueReview('u1', { lessonId: 'l1', passed: false });

    expect(result.stage).toBe(2);
    expect(result.graduated).toBe(false);
    const expected = Date.now() + 1 * DAY_MS;
    expect(new Date(result.nextReviewAt as string).getTime()).toBeGreaterThanOrEqual(expected - 5000);
  });

  it('throws when the lesson does not exist', async () => {
    const prisma = buildPrismaMock();
    prisma.lesson.findUnique.mockResolvedValue(null);
    const { service } = buildService(prisma);

    await expect(
      service.recordDialogueReview('u1', { lessonId: 'ghost', passed: true })
    ).rejects.toThrow(NotFoundException);
  });
});

describe('DailySessionService — plan composition', () => {
  it('composes due dialogues, next lesson keywords, and completedToday', async () => {
    const prisma = buildPrismaMock();
    prisma.userDialogueProgress.findMany.mockResolvedValue([
      {
        lessonId: 'l1',
        stage: 1,
        nextReviewAt: new Date(),
        lesson: {
          title: 'Bài 1',
          conversations: [
            { id: 'cv1', order: 1, speaker: '妈妈', hanzi: '你好', pinyin: 'nǐ hǎo', vietnamese: 'Xin chào' },
          ],
        },
      },
    ]);
    prisma.course.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.lesson.findFirst
      // first call: resolveActiveCourseId (selects courseId only)
      .mockResolvedValueOnce({ courseId: 'c1' })
      // second call: findNextLesson
      .mockResolvedValue({
        id: 'l2',
        title: 'Bài 2',
        order: 2,
        conversations: [{ id: 'cv2', order: 1, speaker: null, hanzi: '谢谢', pinyin: 'xiè xie', vietnamese: 'Cảm ơn' }],
      });
    prisma.userDialogueProgress.findFirst.mockResolvedValue({ id: 'dp-today' });
    const { service, spaced } = buildService(prisma);

    const plan = await service.getDailySession('u1');

    expect(plan.dueDialogues).toHaveLength(1);
    expect(plan.dueDialogues[0].lines[0].speaker).toBe('妈妈');
    expect(plan.nextLesson?.lessonId).toBe('l2');
    expect(plan.dueVocabularyTotal).toBe(0);
    expect(plan.streak).toBe(3);
    expect(plan.completedToday).toBe(true);
    expect(spaced.getStreak).toHaveBeenCalledWith('u1');
  });

  it('reports an all-empty plan when nothing is due and course is finished', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    const plan = await service.getDailySession('u1');

    expect(plan.dueDialogues).toEqual([]);
    expect(plan.nextLesson).toBeNull();
    expect(plan.completedToday).toBe(false);
  });

  it('honors an explicit courseId instead of resolving the active course', async () => {
    const prisma = buildPrismaMock();
    prisma.lesson.findFirst.mockResolvedValue({
      id: 'l9',
      title: 'Bài 9',
      order: 9,
      conversations: [],
    });
    const { service } = buildService(prisma);

    await service.getDailySession('u1', 'c-explicit');

    expect(prisma.course.findFirst).not.toHaveBeenCalled();
    expect(prisma.lesson.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ courseId: 'c-explicit' }) })
    );
  });
});

describe('DailySessionService — session completion', () => {
  it('marks the lesson completed and returns the streak', async () => {
    const prisma = buildPrismaMock();
    const { service, spaced } = buildService(prisma);

    const result = await service.completeSession('u1', { lessonId: 'l1' });

    expect(result.isCompleted).toBe(true);
    expect(result.streak).toBe(3);
    expect(prisma.userProgress.upsert).toHaveBeenCalled();
    expect(spaced.getStreak).toHaveBeenCalled();
  });

  it('throws when completing a missing lesson', async () => {
    const prisma = buildPrismaMock();
    prisma.lesson.findUnique.mockResolvedValue(null);
    const { service } = buildService(prisma);

    await expect(service.completeSession('u1', { lessonId: 'ghost' })).rejects.toThrow(
      NotFoundException
    );
  });
});

describe('DailySessionService — current lesson lookup', () => {
  const emptyLesson = { lessonId: null, lessonTitle: null, order: null, courseId: null };

  it('returns the first uncompleted lesson of the active course', async () => {
    const prisma = buildPrismaMock();
    prisma.course.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.lesson.findFirst
      // first call: resolveActiveCourseId (selects courseId only)
      .mockResolvedValueOnce({ courseId: 'c1' })
      // second call: the open lesson lookup
      .mockResolvedValueOnce({ id: 'l2', title: 'Bài 2', order: 2, courseId: 'c1' });
    const { service } = buildService(prisma);

    const result = await service.getCurrentLesson('u1');

    expect(result).toEqual({ lessonId: 'l2', lessonTitle: 'Bài 2', order: 2, courseId: 'c1' });
    expect(prisma.lesson.findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ id: true }),
      })
    );
  });

  it('returns nulls when every lesson is completed', async () => {
    const prisma = buildPrismaMock();
    prisma.course.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.lesson.findFirst
      .mockResolvedValueOnce({ courseId: 'c1' })
      .mockResolvedValueOnce(null);
    const { service } = buildService(prisma);

    expect(await service.getCurrentLesson('u1')).toEqual(emptyLesson);
  });

  it('returns nulls when there is no active course', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    expect(await service.getCurrentLesson('u1')).toEqual(emptyLesson);
    // only the resolveActiveCourseId lookup ran — no lesson query afterwards
    expect(prisma.lesson.findFirst).toHaveBeenCalledTimes(1);
  });
});

describe('DailySessionService — per-activity completion', () => {
  const D = new Date('2026-09-25T10:00:00Z');

  it('records only the vocab flag and does not complete the lesson', async () => {
    const prisma = buildPrismaMock();
    prisma.userProgress.findUnique.mockResolvedValue({
      isCompleted: false,
      vocabCompletedAt: D,
      dialogueCompletedAt: null,
      exercisesCompletedAt: null,
    });
    const { service } = buildService(prisma);

    const result = await service.completeActivity('u1', { lessonId: 'l1', activity: 'vocab' });

    expect(result.vocabCompletedAt).not.toBeNull();
    expect(result.dialogueCompletedAt).toBeNull();
    expect(result.exercisesCompletedAt).toBeNull();
    expect(result.isCompleted).toBe(false);
    expect(prisma.userProgress.update).not.toHaveBeenCalled();
  });

  it('derives isCompleted true when all three activities are done', async () => {
    const prisma = buildPrismaMock();
    prisma.userProgress.findUnique.mockResolvedValue({
      isCompleted: false,
      vocabCompletedAt: D,
      dialogueCompletedAt: D,
      exercisesCompletedAt: D,
    });
    const { service } = buildService(prisma);

    const result = await service.completeActivity('u1', { lessonId: 'l1', activity: 'exercises' });

    expect(result.isCompleted).toBe(true);
    expect(prisma.userProgress.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isCompleted: true }) })
    );
  });

  it('writes the matching column for each activity', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    await service.completeActivity('u1', { lessonId: 'l1', activity: 'dialogue' });

    expect(prisma.userProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ dialogueCompletedAt: expect.any(Date) }),
      })
    );
  });

  it('is sticky — update only sets the target column, never clears others', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    await service.completeActivity('u1', { lessonId: 'l1', activity: 'vocab' });

    const update = prisma.userProgress.upsert.mock.calls[0][0].update;
    expect(update).toEqual({ vocabCompletedAt: expect.any(Date) });
    expect(update).not.toHaveProperty('dialogueCompletedAt');
    expect(update).not.toHaveProperty('exercisesCompletedAt');
  });

  it('throws NotFound when the lesson does not exist', async () => {
    const prisma = buildPrismaMock();
    prisma.lesson.findUnique.mockResolvedValue(null);
    const { service } = buildService(prisma);

    await expect(
      service.completeActivity('u1', { lessonId: 'ghost', activity: 'vocab' })
    ).rejects.toThrow(NotFoundException);
  });

  it('getLessonStatus returns all-null for a lesson with no progress', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    const status = await service.getLessonStatus('u1', 'l1');

    expect(status).toEqual({
      lessonId: 'l1',
      vocabCompletedAt: null,
      dialogueCompletedAt: null,
      exercisesCompletedAt: null,
      isCompleted: false,
    });
  });

  it('getLessonStatus reflects recorded flags', async () => {
    const prisma = buildPrismaMock();
    prisma.userProgress.findUnique.mockResolvedValue({
      isCompleted: false,
      vocabCompletedAt: D,
      dialogueCompletedAt: D,
      exercisesCompletedAt: null,
    });
    const { service } = buildService(prisma);

    const status = await service.getLessonStatus('u1', 'l1');

    expect(status.vocabCompletedAt).not.toBeNull();
    expect(status.dialogueCompletedAt).not.toBeNull();
    expect(status.exercisesCompletedAt).toBeNull();
    expect(status.isCompleted).toBe(false);
  });
});
