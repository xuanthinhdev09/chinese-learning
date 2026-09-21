/**
 * Structural validator for workbook lesson JSON v3
 * (content-source/extracted-wb/lesson-NN.json).
 *
 * Pure functions — no DB, no fs. Content correctness (verbatim text, answer
 * keys) is verified upstream by the extraction pipeline; this only guards
 * the shape the importer and the app rely on.
 */

export interface JsonV3Image {
  ref: string;
  page: number;
  file: string;
  desc?: string;
}

export interface JsonV3Payload {
  audioFile?: string;
  drillType?: string;
  options?: unknown;
  example?: unknown;
  items?: unknown[];
}

export interface JsonV3Exercise {
  order: number;
  section: string;
  typeCode: string;
  instructionHanzi?: string;
  instructionVi?: string;
  source_page?: number;
  payload: JsonV3Payload;
}

export interface JsonV3LessonDoc {
  _meta?: { format?: string };
  lesson: { order: number; book_page: number };
  exercises: JsonV3Exercise[];
  images: JsonV3Image[];
}

export const SECTIONS = ['听力', '阅读', '语音', '汉字'] as const;

export const TYPE_CODES = [
  'listen_judge_picture_tf',
  'listen_dialogue_choose_picture',
  'listen_dialogue_choose_answer',
  'read_picture_for_sentence',
  'read_fill_blank_word',
  'read_judge_tf',
  'read_match_qa',
  'listen_choose_word',
  'listen_repeat_drill',
  'hanzi_classify_radical',
  'hanzi_guess_meaning_picture',
  'hanzi_write_stroke_order',
] as const;

export const DRILL_TYPES = [
  'word_stress',
  'sentence_stress',
  'sentence_intonation',
  'rising_intonation',
  'stress_and_intonation',
] as const;

/** typeCode -> whether the exercise plays a workbook audio track */
const AUDIO_TYPES = new Set([
  'listen_judge_picture_tf',
  'listen_dialogue_choose_picture',
  'listen_dialogue_choose_answer',
  'listen_choose_word',
  'listen_repeat_drill',
]);

const AUDIO_FILE_PATTERN = /^\d{2}-[12]\.mp3$/;
const IMAGE_FILE_PATTERN = /^lesson-\d{2}\/[A-Za-z0-9_-]+\.(png|jpe?g|webp)$/;
const REF_PATTERN = /^p\d{2}-crop-\d+$/;

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

/** Collect imageRef strings used by a payload (per-item refs and option pools). */
export function collectPayloadRefs(payload: JsonV3Payload): string[] {
  const refs: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      if (REF_PATTERN.test(v)) refs.push(v);
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (v && typeof v === 'object') {
      Object.values(v).forEach(walk);
    }
  };
  walk(payload);
  return refs;
}

export function validateJsonV3(raw: unknown): string[] {
  const errors: string[] = [];
  const doc = raw as JsonV3LessonDoc;
  if (!doc || typeof doc !== 'object') {
    return ['root: not an object'];
  }
  if (doc._meta?.format !== 'workbook-json-v3') {
    errors.push('_meta.format: expected "workbook-json-v3"');
  }
  const lesson = doc.lesson;
  if (
    !lesson ||
    !Number.isInteger(lesson.order) ||
    lesson.order < 1 ||
    !Number.isInteger(lesson.book_page)
  ) {
    errors.push('lesson: order (int ≥ 1) and book_page (int) required');
    return errors;
  }
  const lessonDir = `lesson-${String(lesson.order).padStart(2, '0')}`;

  const exercises = doc.exercises;
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return [...errors, 'exercises: non-empty array required'];
  }
  const seenOrders = new Set<number>();
  const imageRefs = new Set(
    (Array.isArray(doc.images) ? doc.images : []).map((im) => im?.ref),
  );

  exercises.forEach((ex, i) => {
    const at = `exercises[${i}]`;
    if (!Number.isInteger(ex?.order) || seenOrders.has(ex.order)) {
      errors.push(`${at}.order: duplicate or non-integer`);
    }
    seenOrders.add(ex?.order);
    if (!SECTIONS.includes(ex?.section as (typeof SECTIONS)[number])) {
      errors.push(`${at}.section: must be one of ${SECTIONS.join('|')}`);
    }
    if (!TYPE_CODES.includes(ex?.typeCode as (typeof TYPE_CODES)[number])) {
      errors.push(`${at}.typeCode: unknown "${ex?.typeCode}"`);
    }
    const payload = ex?.payload;
    if (!payload || typeof payload !== 'object') {
      errors.push(`${at}.payload: object required`);
      return;
    }
    const items = payload.items;
    if (!Array.isArray(items) || items.length === 0) {
      errors.push(`${at}.payload.items: non-empty array required`);
      return;
    }
    items.forEach((item, j) => {
      if (!item || typeof item !== 'object' || !isString((item as { label?: unknown }).label)) {
        errors.push(`${at}.payload.items[${j}].label: non-empty string required`);
      }
    });
    if (AUDIO_TYPES.has(ex?.typeCode) && !AUDIO_FILE_PATTERN.test(String(payload.audioFile))) {
      errors.push(`${at}.payload.audioFile: expected "NN-1.mp3" or "NN-2.mp3"`);
    }
    if (ex?.typeCode === 'listen_repeat_drill' && !DRILL_TYPES.includes(payload.drillType as (typeof DRILL_TYPES)[number])) {
      errors.push(`${at}.payload.drillType: must be one of ${DRILL_TYPES.join('|')}`);
    }
    if (ex?.typeCode !== 'listen_repeat_drill') {
      const answered = items.filter(
        (item) => isString((item as { answer?: unknown })?.answer) || Array.isArray((item as { answer?: unknown })?.answer),
      ).length;
      if (answered !== items.length) {
        errors.push(`${at}.payload.items: every item needs an answer (${answered}/${items.length})`);
      }
    }
  });

  for (let n = 1; n <= exercises.length; n++) {
    if (!seenOrders.has(n)) errors.push(`exercises: order ${n} missing (must be contiguous 1..N)`);
  }

  if (!Array.isArray(doc.images)) {
    errors.push('images: array required (may be empty only if no exercise uses images)');
    return errors;
  }
  doc.images.forEach((im, i) => {
    const at = `images[${i}]`;
    if (!isString(im?.ref) || !REF_PATTERN.test(im.ref)) {
      errors.push(`${at}.ref: expected "pXX-crop-N"`);
    }
    if (!Number.isInteger(im?.page) || (im?.page ?? 0) < 1) {
      errors.push(`${at}.page: int ≥ 1 required`);
    }
    if (!isString(im?.file) || !IMAGE_FILE_PATTERN.test(im.file)) {
      errors.push(`${at}.file: expected "lesson-NN/<name>.png"`);
    } else if (!im.file.startsWith(`${lessonDir}/`)) {
      errors.push(`${at}.file: must live under ${lessonDir}/`);
    }
  });

  const usedRefs = new Set(exercises.flatMap((ex) => collectPayloadRefs(ex?.payload ?? {})));
  usedRefs.forEach((ref) => {
    if (!imageRefs.has(ref)) errors.push(`payload refs "${ref}" missing from images[]`);
  });
  const allRefs = new Set(doc.images.map((im) => im?.ref));
  allRefs.forEach((ref) => {
    if (!usedRefs.has(ref)) errors.push(`images[] "${ref}" not referenced by any exercise`);
  });

  return errors;
}
