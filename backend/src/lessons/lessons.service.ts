import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LessonQueryDto } from './dto/lesson-query.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: LessonQueryDto) {
    // API keeps the legacy hskLevelId query param; internally it maps to courseId
    const { hskLevelId: courseId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = courseId ? { courseId } : {};

    const [data, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ course: { level: 'asc' } }, { order: 'asc' }],
        include: {
          course: {
            select: { id: true, level: true, name: true, type: true },
          },
          _count: {
            select: { vocabularies: true },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return {
      data: data.map(({ course, ...lesson }) => ({
        ...lesson,
        // legacy response field kept for frontend compatibility
        hskLevel: course,
        vocabularyCount: lesson._count.vocabularies,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, level: true, name: true, type: true },
        },
        vocabularies: {
          orderBy: { id: 'asc' },
        },
        conversations: {
          orderBy: [{ dialogueOrder: 'asc' }, { order: 'asc' }],
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const { course, ...rest } = lesson;
    return {
      ...rest,
      // legacy response field kept for frontend compatibility
      hskLevel: course,
    };
  }
}