import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  ExerciseMediaStorage,
  imageContentType,
  isValidAudioName,
  isValidImageRelPath,
} from './exercise-media.storage';
import { ConfigService } from '@nestjs/config';

/** Temp dirs under the OS tmpdir so tests never touch real storage/. */
function tmpDir(name: string): string {
  const dir = path.join(os.tmpdir(), `ex-media-spec-${Date.now()}`, name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

describe('media path guards', () => {
  it('accepts importer-convention image paths', () => {
    expect(isValidImageRelPath('lesson-01/p07-crop-3.png')).toBe(true);
    expect(isValidImageRelPath('lesson-15/p16-crop-12.webp')).toBe(true);
  });

  it('rejects path traversal and malformed image paths', () => {
    expect(isValidImageRelPath('../secret.png')).toBe(false);
    expect(isValidImageRelPath('lesson-01/../../.env')).toBe(false);
    expect(isValidImageRelPath('lesson-01/p07-crop-3.exe')).toBe(false);
    expect(isValidImageRelPath('other/p07-crop-3.png')).toBe(false);
    expect(isValidImageRelPath('p07-crop-3.png')).toBe(false);
  });

  it('accepts only NN-1/NN-2 workbook audio names', () => {
    expect(isValidAudioName('01-1.mp3')).toBe(true);
    expect(isValidAudioName('15-2.mp3')).toBe(true);
    expect(isValidAudioName('../01-1.mp3')).toBe(false);
    expect(isValidAudioName('01-3.mp3')).toBe(false);
    expect(isValidAudioName('1-1.mp3')).toBe(false);
    expect(isValidAudioName('01-1.txt')).toBe(false);
  });

  it('maps extensions to content types with a safe fallback', () => {
    expect(imageContentType('lesson-01/a.png')).toBe('image/png');
    expect(imageContentType('lesson-01/a.jpeg')).toBe('image/jpeg');
    expect(imageContentType('lesson-01/a.webp')).toBe('image/webp');
    expect(imageContentType('lesson-01/a.bin')).toBe('application/octet-stream');
  });
});

describe('ExerciseMediaStorage', () => {
  function makeStorage(imagesDir: string, audioDir: string): ExerciseMediaStorage {
    const config = {
      get: (key: string) =>
        key === 'EXERCISE_IMAGE_STORAGE_DIR' ? imagesDir : key === 'EXERCISE_AUDIO_STORAGE_DIR' ? audioDir : undefined,
    } as unknown as ConfigService;
    return new ExerciseMediaStorage(config);
  }

  it('round-trips an image through save/read/exists', async () => {
    const imagesDir = tmpDir('images');
    const storage = makeStorage(imagesDir, tmpDir('audio'));
    await storage.onModuleInit();
    await storage.saveImage('lesson-01/p07-crop-1.png', Buffer.from('png-bytes'));
    expect(await storage.imageExists('lesson-01/p07-crop-1.png')).toBe(true);
    expect(await storage.imageExists('lesson-01/p08-crop-1.png')).toBe(false);
    expect((await storage.readImage('lesson-01/p07-crop-1.png')).toString()).toBe('png-bytes');
  });

  it('refuses to read or write paths outside the convention', async () => {
    const storage = makeStorage(tmpDir('images'), tmpDir('audio'));
    await expect(storage.saveImage('../evil.png', Buffer.from('x'))).rejects.toThrow(/Invalid media path/);
    await expect(storage.readImage('lesson-01/../../package.json')).rejects.toThrow(/Invalid media path/);
    await expect(storage.readAudio('01-99.mp3')).rejects.toThrow(/Invalid media path/);
  });

  it('round-trips an audio track', async () => {
    const storage = makeStorage(tmpDir('images'), tmpDir('audio'));
    await storage.onModuleInit();
    await storage.saveAudio('01-1.mp3', Buffer.from('mp3-bytes'));
    expect(await storage.audioExists('01-1.mp3')).toBe(true);
    expect((await storage.readAudio('01-1.mp3')).toString()).toBe('mp3-bytes');
  });
});
