import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Storage port for synthesized audio so the disk-backed MVP can later move
 * to S3/R2/Blob without touching TtsService. Files are addressed ONLY by a
 * validated hex cacheKey — never by user input — which rules out path
 * traversal at the storage boundary.
 */
export interface TtsStorage {
  /** Persist bytes and return the storage-relative filePath for the DB row. */
  save(cacheKey: string, data: Buffer): Promise<string>;
  exists(cacheKey: string): Promise<boolean>;
  read(cacheKey: string): Promise<Buffer>;
}

const CACHE_KEY_PATTERN = /^[a-f0-9]{64}$/;

export function assertValidCacheKey(cacheKey: string): void {
  if (!CACHE_KEY_PATTERN.test(cacheKey)) {
    throw new Error(`Invalid cache key format: ${cacheKey.slice(0, 8)}…`);
  }
}

@Injectable()
export class LocalTtsStorage implements TtsStorage {
  private readonly logger = new Logger(LocalTtsStorage.name);
  private readonly baseDir: string;

  constructor(config: ConfigService) {
    this.baseDir = config.get<string>('TTS_STORAGE_DIR') || path.join(process.cwd(), 'storage', 'tts');
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  private fileFor(cacheKey: string): string {
    assertValidCacheKey(cacheKey);
    return path.join(this.baseDir, `${cacheKey}.mp3`);
  }

  async save(cacheKey: string, data: Buffer): Promise<string> {
    const filePath = `${cacheKey}.mp3`;
    await fs.writeFile(this.fileFor(cacheKey), data);
    this.logger.log(`Stored audio ${filePath} (${data.length} bytes)`);
    return filePath;
  }

  async exists(cacheKey: string): Promise<boolean> {
    try {
      await fs.access(this.fileFor(cacheKey));
      return true;
    } catch {
      return false;
    }
  }

  async read(cacheKey: string): Promise<Buffer> {
    return fs.readFile(this.fileFor(cacheKey));
  }
}
