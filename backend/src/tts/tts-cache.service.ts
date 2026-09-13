import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TtsAudio } from '@prisma/client';

/**
 * DB-backed audio cache mapping. Rows are immutable: re-synthesis with the
 * same cacheKey never happens, so upsert only creates (update is a no-op).
 */
@Injectable()
export class TtsCacheService {
  constructor(private readonly prisma: PrismaService) {}

  async find(cacheKey: string): Promise<TtsAudio | null> {
    return this.prisma.ttsAudio.findUnique({ where: { cacheKey } });
  }

  async upsert(entry: {
    cacheKey: string;
    type: string;
    text: string;
    voice: string;
    locale: string;
    speed: number;
    pauseMs: number | null;
    outputFormat: string;
    filePath: string;
    charCount: number;
  }): Promise<TtsAudio> {
    return this.prisma.ttsAudio.upsert({
      where: { cacheKey: entry.cacheKey },
      create: entry,
      update: {},
    });
  }
}
