import { Injectable, NotFoundException } from '@nestjs/common';
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

interface ImportVocabularyItem {
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

  async findByLesson(lessonId: string) {
    const vocabularies = await this.prisma.vocabulary.findMany({
      where: { lessonId },
      orderBy: { id: 'asc' },
    });

    return vocabularies;
  }

  async findByHSKLevel(hskLevel: number) {
    const vocabularies = await this.prisma.vocabulary.findMany({
      where: { hskLevel },
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
        SELECT hskLevel, COUNT(*) as count
        FROM vocabularies
        WHERE hskLevel IS NOT NULL
        GROUP BY hskLevel
        ORDER BY hskLevel
      `,
    ]);

    return {
      total: totalCount,
      byLevel,
    };
  }
}