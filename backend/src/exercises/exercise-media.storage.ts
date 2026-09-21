import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Disk storage for workbook exercise media. Two roots, mirroring the TTS
 * storage pattern:
 *  - images: EXERCISE_IMAGE_STORAGE_DIR (default storage/exercise-images)
 *      files addressed by DB-stored relative paths like "lesson-01/p07-crop-3.png"
 *  - audio:  EXERCISE_AUDIO_STORAGE_DIR (default storage/exercise-audio)
 *      files addressed by whitelisted track names like "01-1.mp3"
 *
 * Path safety: image relative paths must match the importer's naming
 * convention, audio must match the NN-1/NN-2 track pattern — user input can
 * never escape the storage roots. Uploads never receive a path from the
 * client: the filePath comes from the ExerciseImage DB row only.
 */

const IMAGE_PATH_PATTERN =
  /^lesson-\d{2}\/[A-Za-z0-9_-]+\.(png|jpe?g|webp)$/;
const AUDIO_NAME_PATTERN = /^\d{2}-[12]\.mp3$/;
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export function isValidImageRelPath(relPath: string): boolean {
  return IMAGE_PATH_PATTERN.test(relPath);
}

export function isValidAudioName(filename: string): boolean {
  return AUDIO_NAME_PATTERN.test(filename);
}

export function imageContentType(filePath: string): string {
  const type = CONTENT_TYPE_BY_EXT[path.extname(filePath).toLowerCase()];
  return type ?? 'application/octet-stream';
}

@Injectable()
export class ExerciseMediaStorage {
  private readonly logger = new Logger(ExerciseMediaStorage.name);
  private readonly imagesDir: string;
  private readonly audioDir: string;

  constructor(config: ConfigService) {
    this.imagesDir =
      config.get<string>('EXERCISE_IMAGE_STORAGE_DIR') ||
      path.join(process.cwd(), 'storage', 'exercise-images');
    this.audioDir =
      config.get<string>('EXERCISE_AUDIO_STORAGE_DIR') ||
      path.join(process.cwd(), 'storage', 'exercise-audio');
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.imagesDir, { recursive: true });
    await fs.mkdir(this.audioDir, { recursive: true });
  }

  private absPath(root: string, relPath: string, pattern: RegExp): string {
    if (!pattern.test(relPath)) {
      throw new Error(`Invalid media path: ${relPath}`);
    }
    const abs = path.resolve(root, relPath);
    // Belt-and-braces: the resolved path must stay inside the root.
    if (!abs.startsWith(path.resolve(root) + path.sep)) {
      throw new Error(`Media path escapes storage root: ${relPath}`);
    }
    return abs;
  }

  async saveImage(relPath: string, data: Buffer): Promise<void> {
    const abs = this.absPath(this.imagesDir, relPath, IMAGE_PATH_PATTERN);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, data);
    this.logger.log(`Stored exercise image ${relPath} (${data.length} bytes)`);
  }

  async imageExists(relPath: string): Promise<boolean> {
    try {
      await fs.access(this.absPath(this.imagesDir, relPath, IMAGE_PATH_PATTERN));
      return true;
    } catch {
      return false;
    }
  }

  async readImage(relPath: string): Promise<Buffer> {
    return fs.readFile(this.absPath(this.imagesDir, relPath, IMAGE_PATH_PATTERN));
  }

  async saveAudio(filename: string, data: Buffer): Promise<void> {
    const abs = this.absPath(this.audioDir, filename, AUDIO_NAME_PATTERN);
    await fs.writeFile(abs, data);
    this.logger.log(`Stored exercise audio ${filename} (${data.length} bytes)`);
  }

  async audioExists(filename: string): Promise<boolean> {
    try {
      await fs.access(this.absPath(this.audioDir, filename, AUDIO_NAME_PATTERN));
      return true;
    } catch {
      return false;
    }
  }

  async readAudio(filename: string): Promise<Buffer> {
    return fs.readFile(this.absPath(this.audioDir, filename, AUDIO_NAME_PATTERN));
  }
}
