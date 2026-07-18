import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LessonQueryDto } from './dto/lesson-query.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: LessonQueryDto) {
    const { hskLevelId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = hskLevelId ? { hskLevelId } : {};

    const [data, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ hskLevel: { level: 'asc' } }, { order: 'asc' }],
        include: {
          hskLevel: {
            select: { id: true, level: true, name: true },
          },
          _count: {
            select: { vocabularies: true },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return {
      data: data.map((lesson) => ({
        ...lesson,
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
        hskLevel: {
          select: { id: true, level: true, name: true },
        },
        vocabularies: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }
}