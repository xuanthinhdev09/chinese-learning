import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';

const NON_ADMIN_EMAIL = 'user@example.com';
const ADMIN_EMAIL = 'admin@example.com';

function buildPrismaMock() {
  return {
    lesson: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    course: { findFirst: jest.fn().mockResolvedValue(null) },
    vocabulary: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  return new VocabularyService(prisma as never);
}

describe('VocabularyService — sequential lesson locking', () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  it('throws Forbidden when lesson order is beyond the user first uncompleted lesson', async () => {
    const prisma = buildPrismaMock();
    prisma.lesson.findUnique.mockResolvedValue({ id: 'l3', order: 3, courseId: 'c1' });
    // Bài đầu chưa hoàn thành của user là bài 2 → bài 3 bị khóa
    prisma.lesson.findFirst.mockResolvedValue({ order: 2 });
    const service = buildService(prisma);

    await expect(service.findByLesson('l3', 'u1', NON_ADMIN_EMAIL)).rejects.toThrow(ForbiddenException);
    expect(prisma.vocabulary.findMany).not.toHaveBeenCalled();
  });

  it('returns vocabulary for a lesson at or before the unlocked boundary', async () => {
    const prisma = buildPrismaMock();
    prisma.lesson.findUnique.mockResolvedValue({ id: 'l2', order: 2, courseId: 'c1' });
    prisma.lesson.findFirst.mockResolvedValue({ order: 2 });
    prisma.vocabulary.findMany.mockResolvedValue([{ id: 'v1' }]);
    const service = buildService(prisma);

    const result = await service.findByLesson('l2', 'u1', NON_ADMIN_EMAIL);

    expect(result).toEqual([{ id: 'v1' }]);
  });

  it('locks nothing when the user completed every lesson of the course', async () => {
    const prisma = buildPrismaMock();
    prisma.lesson.findUnique.mockResolvedValue({ id: 'l15', order: 15, courseId: 'c1' });
    prisma.lesson.findFirst.mockResolvedValue(null);
    prisma.vocabulary.findMany.mockResolvedValue([{ id: 'v1' }]);
    const service = buildService(prisma);

    const result = await service.findByLesson('l15', 'u1', NON_ADMIN_EMAIL);

    expect(result).toEqual([{ id: 'v1' }]);
  });

  it('throws NotFound for an unknown lesson', async () => {
    const prisma = buildPrismaMock();
    const service = buildService(prisma);

    await expect(service.findByLesson('missing', 'u1', NON_ADMIN_EMAIL)).rejects.toThrow(NotFoundException);
  });

  it('bypasses the lock for an admin email (ADMIN_EMAILS)', async () => {
    process.env.ADMIN_EMAILS = ADMIN_EMAIL;
    const prisma = buildPrismaMock();
    prisma.lesson.findUnique.mockResolvedValue({ id: 'l3', order: 3, courseId: 'c1' });
    prisma.lesson.findFirst.mockResolvedValue({ order: 2 });
    prisma.vocabulary.findMany.mockResolvedValue([{ id: 'v1' }]);
    const service = buildService(prisma);

    const result = await service.findByLesson('l3', 'u1', ADMIN_EMAIL);

    expect(result).toEqual([{ id: 'v1' }]);
    expect(prisma.vocabulary.findMany).toHaveBeenCalled();
  });

  it('caps hsk-level vocabulary at the user unlocked order, ignoring any client hint', async () => {
    const prisma = buildPrismaMock();
    prisma.course.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.lesson.findFirst.mockResolvedValue({ order: 2 });
    const service = buildService(prisma);

    await service.findByHSKLevel(2, 'u1', NON_ADMIN_EMAIL);

    expect(prisma.vocabulary.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hskLevel: 2, lesson: { order: { lte: 2 } } },
      })
    );
  });

  it('returns all level vocabulary when the course has no unlocked boundary (all completed)', async () => {
    const prisma = buildPrismaMock();
    prisma.course.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.lesson.findFirst.mockResolvedValue(null);
    const service = buildService(prisma);

    await service.findByHSKLevel(2, 'u1', NON_ADMIN_EMAIL);

    expect(prisma.vocabulary.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hskLevel: 2 } })
    );
  });

  it('returns all level vocabulary when no course matches the level', async () => {
    const prisma = buildPrismaMock();
    const service = buildService(prisma);

    await service.findByHSKLevel(9, 'u1', NON_ADMIN_EMAIL);

    expect(prisma.vocabulary.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hskLevel: 9 } })
    );
  });

  it('does not cap hsk-level vocabulary for an admin email', async () => {
    process.env.ADMIN_EMAILS = ADMIN_EMAIL;
    const prisma = buildPrismaMock();
    prisma.course.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.lesson.findFirst.mockResolvedValue({ order: 2 });
    const service = buildService(prisma);

    await service.findByHSKLevel(2, 'u1', ADMIN_EMAIL);

    expect(prisma.vocabulary.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hskLevel: 2 } })
    );
  });
});
