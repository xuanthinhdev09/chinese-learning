import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  collectPayloadRefs,
  validateJsonV3,
} from './json-v3.validator';

/**
 * Workbook JSON v3 importer: idempotent per-lesson sync of exercises +
 * exercise images, plus a best-effort copy of referenced media into the
 * backend storage roots. Re-running with the same file converges to the
 * same DB state; rows no longer present in the JSON are removed (the JSON
 * is the source of truth for the lesson).
 */
export interface WorkbookImportOptions {
  file: string;
  /** content-source audio dir holding NN-1.mp3 / NN-2.mp3 tracks */
  audioDir?: string;
  /** content-source dir holding lesson-NN/ image files (uploaded or cropped) */
  imagesDir?: string;
  /** backend storage root for images (EXERCISE_IMAGE_STORAGE_DIR) */
  imageStorageDir?: string;
  /** backend storage root for audio (EXERCISE_AUDIO_STORAGE_DIR) */
  audioStorageDir?: string;
  dryRun?: boolean;
}

export interface WorkbookImportResult {
  lessonDbId: string;
  lessonOrder: number;
  exercisesUpserted: number;
  imagesUpserted: number;
  exercisesRemoved: number;
  imagesRemoved: number;
  audioCopied: string[];
  imagesCopied: string[];
  imagesMissingOnDisk: string[];
  audioMissingOnDisk: string[];
}

const DEFAULT_HSK_LEVEL = 2;

export async function importWorkbookV3(
  prisma: PrismaClient,
  options: WorkbookImportOptions,
): Promise<WorkbookImportResult> {
  const raw = JSON.parse(fs.readFileSync(options.file, 'utf-8'));
  const errors = validateJsonV3(raw);
  if (errors.length > 0) {
    throw new Error(`Invalid workbook JSON v3:\n  - ${errors.join('\n  - ')}`);
  }
  const doc = raw;
  const lessonOrder = doc.lesson.order;
  const lessonDir = `lesson-${String(lessonOrder).padStart(2, '0')}`;
  const imageStorage = options.imageStorageDir || path.join(process.cwd(), 'storage', 'exercise-images');
  const audioStorage = options.audioStorageDir || path.join(process.cwd(), 'storage', 'exercise-audio');

  const course = await prisma.course.findFirst({
    where: { type: 'HSK', level: DEFAULT_HSK_LEVEL },
    select: { id: true, name: true },
  });
  if (!course) {
    throw new Error(`No HSK${DEFAULT_HSK_LEVEL} course found — import the textbook first`);
  }
  const lesson = await prisma.lesson.findFirst({
    where: { courseId: course.id, order: lessonOrder },
    select: { id: true, title: true },
  });
  if (!lesson) {
    throw new Error(
      `Lesson order ${lessonOrder} not found in course "${course.name}" — import lessons first`,
    );
  }

  const result: WorkbookImportResult = {
    lessonDbId: lesson.id,
    lessonOrder,
    exercisesUpserted: 0,
    imagesUpserted: 0,
    exercisesRemoved: 0,
    imagesRemoved: 0,
    audioCopied: [],
    imagesCopied: [],
    imagesMissingOnDisk: [],
    audioMissingOnDisk: [],
  };

  if (options.dryRun) {
    return result;
  }

  // --- exercises -----------------------------------------------------------
  // doc.exercises is validated contiguous (1..N) but not necessarily sorted;
  // map by order so imageRef linking never depends on array order.
  const keepExerciseIds: string[] = [];
  const exerciseIdByOrder = new Map<number, string>();
  for (const ex of doc.exercises) {
    const data = {
      lessonId: lesson.id,
      order: ex.order,
      section: ex.section,
      typeCode: ex.typeCode,
      instructionHanzi: ex.instructionHanzi ?? null,
      instructionVi: ex.instructionVi ?? null,
      payload: ex.payload as unknown as Prisma.InputJsonValue,
    };
    const row = await prisma.exercise.upsert({
      where: { lessonId_order: { lessonId: lesson.id, order: ex.order } },
      create: data,
      update: {
        section: data.section,
        typeCode: data.typeCode,
        instructionHanzi: data.instructionHanzi,
        instructionVi: data.instructionVi,
        payload: data.payload,
      },
      select: { id: true },
    });
    keepExerciseIds.push(row.id);
    exerciseIdByOrder.set(ex.order, row.id);
    result.exercisesUpserted += 1;
  }
  const staleExercises = await prisma.exercise.findMany({
    where: { lessonId: lesson.id, id: { notIn: keepExerciseIds } },
    select: { id: true, order: true },
  });
  if (staleExercises.length > 0) {
    await prisma.exercise.deleteMany({
      where: { id: { in: staleExercises.map((e) => e.id) } },
    });
    result.exercisesRemoved = staleExercises.length;
  }

  // --- images: per-item refs link to their exercise, pool refs stay null ---
  const exerciseIdByRef = new Map<string, string>();
  for (const ex of doc.exercises) {
    const row = exerciseIdByOrder.get(ex.order)!;
    for (const item of ex.payload.items ?? []) {
      const ref = (item as { imageRef?: unknown }).imageRef;
      if (typeof ref === 'string') exerciseIdByRef.set(ref, row);
    }
  }
  const keepImageIds: string[] = [];
  for (const im of doc.images) {
    const data = {
      lessonId: lesson.id,
      exerciseId: exerciseIdByRef.get(im.ref) ?? null,
      filePath: im.file,
      page: im.page,
      cropBox: null as Prisma.InputJsonValue | null,
    };
    const row = await prisma.exerciseImage.upsert({
      where: { lessonId_filePath: { lessonId: lesson.id, filePath: im.file } },
      create: data,
      update: { exerciseId: data.exerciseId, page: data.page, cropBox: null },
      select: { id: true },
    });
    keepImageIds.push(row.id);
    result.imagesUpserted += 1;
  }
  const staleImages = await prisma.exerciseImage.findMany({
    where: { lessonId: lesson.id, id: { notIn: keepImageIds } },
    select: { id: true },
  });
  if (staleImages.length > 0) {
    await prisma.exerciseImage.deleteMany({
      where: { id: { in: staleImages.map((im) => im.id) } },
    });
    result.imagesRemoved = staleImages.length;
  }

  // --- media copy (best effort: missing source files are reported, not fatal) ---
  for (const ex of doc.exercises) {
    const audio = ex.payload.audioFile;
    if (typeof audio !== 'string' || result.audioCopied.includes(audio) || result.audioMissingOnDisk.includes(audio)) {
      continue;
    }
    const src = path.join(options.audioDir ?? '', audio);
    if (options.audioDir && fs.existsSync(src)) {
      fs.mkdirSync(audioStorage, { recursive: true });
      fs.copyFileSync(src, path.join(audioStorage, audio));
      result.audioCopied.push(audio);
    } else {
      result.audioMissingOnDisk.push(audio);
    }
  }
  if (options.imagesDir) {
    for (const im of doc.images) {
      const src = path.join(options.imagesDir, im.file);
      const dest = path.join(imageStorage, im.file);
      if (fs.existsSync(dest)) continue;
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        result.imagesCopied.push(im.file);
      } else {
        result.imagesMissingOnDisk.push(im.file);
      }
    }
  } else {
    for (const im of doc.images) {
      if (!fs.existsSync(path.join(imageStorage, im.file))) {
        result.imagesMissingOnDisk.push(im.file);
      }
    }
  }
  return result;
}

export { collectPayloadRefs, validateJsonV3 };
