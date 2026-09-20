import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface HSK30CsvRow {
  ID: string;
  Simplified: string;
  Traditional: string;
  Pinyin: string;
  POS: string;
  Level: string;
  WebNo: string;
  WebPinyin: string;
  OCR: string;
  Variants: string;
  CEDICT: string;
}

export interface ImportVocabularyItem {
  lessonId: string;
  hanzi: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  pos: string;
  hskCode: string;
  hskLevel: number;
  variants: string;
  cedict: string;
}

@Injectable()
export class VocabularyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ranh giới mở khóa học tuần tự của user trong 1 course:
   * order của bài đầu chưa hoàn thành; null = đã hoàn thành hết (mở tất cả)
   */
  private async firstUncompletedOrder(userId: string, courseId: string): Promise<number | null> {
    const firstOpen = await this.prisma.lesson.findFirst({
      where: { courseId, userProgress: { none: { userId, isCompleted: true } } },
      orderBy: { order: 'asc' },
      select: { order: true },
    });
    return firstOpen ? firstOpen.order : null;
  }

  async findByLesson(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, order: true, courseId: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Chặn tuần tự phía server — UI khóa chip chỉ là hiển thị, nội dung phải chặn tại đây
    const cap = await this.firstUncompletedOrder(userId, lesson.courseId);
    if (cap !== null && lesson.order > cap) {
      throw new ForbiddenException('Lesson is locked — complete previous lessons first');
    }

    const vocabularies = await this.prisma.vocabulary.findMany({
      where: { lessonId },
      orderBy: { id: 'asc' },
    });

    return vocabularies;
  }

  /**
   * Phạm vi "tất cả từ" luôn bị chặn theo tiến độ của user (order <= bài đang học) —
   * cap tính server-side, không tin tham số gửi lên từ client
   */
  async findByHSKLevel(hskLevel: number, userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { level: hskLevel },
      select: { id: true },
    });
    const cap = course ? await this.firstUncompletedOrder(userId, course.id) : null;

    const vocabularies = await this.prisma.vocabulary.findMany({
      where: {
        hskLevel,
        ...(cap !== null && { lesson: { order: { lte: cap } } }),
      },
      orderBy: { hskCode: 'asc' },
    });

    return vocabularies;
  }

  async importVocabularies(items: ImportVocabularyItem[]) {
    // Bulk insert with createMany
    const result = await this.prisma.vocabulary.createMany({
      data: items.map(item => ({
        lessonId: item.lessonId,
        hanzi: item.hanzi,
        traditional: item.traditional || null,
        pinyin: item.pinyin,
        meaning: item.meaning || `HSK ${item.hskLevel} vocabulary`,
        pos: item.pos || null,
        hskCode: item.hskCode,
        hskLevel: item.hskLevel,
        variants: item.variants || null,
        cedict: item.cedict || null,
      })),
      skipDuplicates: true,
    });

    return { count: result.count };
  }

  /**
   * Parse HSK 3.0 CSV from ivankra/hsk30 repository
   * CSV format: ID,Simplified,Traditional,Pinyin,POS,Level,WebNo,WebPinyin,OCR,Variants,CEDICT
   */
  parseHSK30Csv(csvContent: string, lessonId: string, maxLevel: number = 2): ImportVocabularyItem[] {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');

    const items: ImportVocabularyItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV handling quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);

      const row: Partial<HSK30CsvRow> = {};
      headers.forEach((header, index) => {
        row[header.trim() as keyof HSK30CsvRow] = values[index] || '';
      });

      const level = parseInt(row.Level || '0');

      // Filter by HSK level (1-2 for MVP)
      if (level < 1 || level > maxLevel) continue;

      items.push({
        lessonId,
        hanzi: row.Simplified || '',
        traditional: row.Traditional || row.Simplified || '',
        pinyin: row.Pinyin || '',
        meaning: `HSK ${level} vocabulary`, // Default meaning
        pos: row.POS || '',
        hskCode: row.ID || '',
        hskLevel: level,
        variants: row.Variants || '',
        cedict: row.CEDICT || '',
      });
    }

    return items;
  }

  async deleteByLesson(lessonId: string) {
    await this.prisma.vocabulary.deleteMany({
      where: { lessonId },
    });
  }

  async getStatistics() {
    const [totalCount, byLevel] = await Promise.all([
      this.prisma.vocabulary.count(),
      this.prisma.$queryRaw`
        SELECT "hskLevel", COUNT(*)::int as count
        FROM vocabularies
        WHERE "hskLevel" IS NOT NULL
        GROUP BY "hskLevel"
        ORDER BY "hskLevel"
      `,
    ]);

    return {
      total: totalCount,
      byLevel,
    };
  }
}