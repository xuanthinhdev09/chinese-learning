import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HskService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const levels = await this.prisma.hskLevel.findMany({
      orderBy: { level: 'asc' },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    return levels.map((level) => ({
      ...level,
      lessonCount: level._count.lessons,
    }));
  }

  async findOne(id: string) {
    const level = await this.prisma.hskLevel.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { vocabularies: true },
            },
          },
        },
      },
    });

    if (!level) {
      throw new NotFoundException('HSK level not found');
    }

    return {
      ...level,
      lessons: level.lessons.map((lesson) => ({
        ...lesson,
        vocabularyCount: lesson._count.vocabularies,
      })),
    };
  }
}