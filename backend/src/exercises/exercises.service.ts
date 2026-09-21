import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExerciseMediaStorage,
  imageContentType,
  isValidImageRelPath,
} from './exercise-media.storage';

const UPLOAD_MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface LessonExerciseImageDto {
  id: string;
  filePath: string;
  /** imageRef used by exercise payloads: file base name without extension */
  ref: string;
  exists: boolean;
  contentType: string;
}

export interface LessonExercisesResponseDto {
  lesson: { id: string; order: number; title: string };
  exercises: {
    id: string;
    order: number;
    section: string;
    typeCode: string;
    instructionHanzi: string | null;
    instructionVi: string | null;
    payload: unknown;
  }[];
  images: LessonExerciseImageDto[];
}

/** imageRef convention: "lesson-01/p07-crop-3.png" -> "p07-crop-3" */
export function refFromFilePath(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

@Injectable()
export class ExercisesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ExerciseMediaStorage,
  ) {}

  async getLessonExercises(lessonId: string): Promise<LessonExercisesResponseDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, order: true, title: true },
    });
    if (!lesson) {
      throw new NotFoundException('LESSON_NOT_FOUND');
    }
    const [exercises, images] = await Promise.all([
      this.prisma.exercise.findMany({
        where: { lessonId },
        orderBy: { order: 'asc' },
      }),
      this.prisma.exerciseImage.findMany({
        where: { lessonId },
        orderBy: { filePath: 'asc' },
      }),
    ]);
    // Importer-owned paths always match; a stray row cannot be addressed,
    // so skip it rather than serving an unvalidated path. Exists checks run
    // concurrently — a lesson can carry ~27 images.
    const validImages = images.filter((image) => isValidImageRelPath(image.filePath));
    const existsFlags = await Promise.all(
      validImages.map((image) => this.storage.imageExists(image.filePath)),
    );
    const imageDtos: LessonExerciseImageDto[] = validImages.map((image, i) => ({
      id: image.id,
      filePath: image.filePath,
      ref: refFromFilePath(image.filePath),
      exists: existsFlags[i],
      contentType: imageContentType(image.filePath),
    }));
    return {
      lesson,
      exercises: exercises.map((e) => ({
        id: e.id,
        order: e.order,
        section: e.section,
        typeCode: e.typeCode,
        instructionHanzi: e.instructionHanzi,
        instructionVi: e.instructionVi,
        payload: e.payload,
      })),
      images: imageDtos,
    };
  }

  async readImage(imageId: string): Promise<{ data: Buffer; contentType: string }> {
    const image = await this.prisma.exerciseImage.findUnique({
      where: { id: imageId },
      select: { filePath: true },
    });
    // Address files only through DB rows — the client never supplies a path.
    if (!image || !isValidImageRelPath(image.filePath)) {
      throw new NotFoundException('IMAGE_NOT_FOUND');
    }
    try {
      return {
        data: await this.storage.readImage(image.filePath),
        contentType: imageContentType(image.filePath),
      };
    } catch {
      throw new NotFoundException('IMAGE_FILE_MISSING');
    }
  }

  /** Overwrite the file backing an ExerciseImage row. Path comes from the row. */
  async saveImage(
    imageId: string,
    file: { mimetype: string; size: number; buffer: Buffer },
  ): Promise<{ id: string; filePath: string }> {
    const image = await this.prisma.exerciseImage.findUnique({
      where: { id: imageId },
      select: { id: true, filePath: true },
    });
    if (!image || !isValidImageRelPath(image.filePath)) {
      throw new NotFoundException('IMAGE_NOT_FOUND');
    }
    const expectedExt = UPLOAD_MIME_TO_EXT[file.mimetype];
    if (!expectedExt) {
      throw new BadRequestException('UNSUPPORTED_IMAGE_TYPE');
    }
    if (path.extname(image.filePath).toLowerCase() !== expectedExt) {
      throw new BadRequestException('IMAGE_EXTENSION_MISMATCH');
    }
    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('IMAGE_SIZE_OUT_OF_RANGE');
    }
    await this.storage.saveImage(image.filePath, file.buffer);
    return { id: image.id, filePath: image.filePath };
  }

  async readAudio(filename: string): Promise<Buffer> {
    try {
      return await this.storage.readAudio(filename);
    } catch {
      throw new NotFoundException('AUDIO_FILE_MISSING');
    }
  }
}
