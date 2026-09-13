import {
  ImportTextbookV2Dto,
  TextbookV2ConversationItemDto,
  TextbookV2LessonItemDto,
  TextbookV2VocabularyItemDto,
} from '../dto/import-textbook-v2.dto';

export interface JsonV2Issue {
  /** 0-based lesson index; -1 = course-level or global issue */
  lessonIndex: number;
  field: string;
  message: string;
}

export interface JsonV2ValidationResult {
  valid: boolean;
  errors: JsonV2Issue[];
  warnings: JsonV2Issue[];
}

const COURSE_TYPES = ['HSK', 'CUSTOM'];
// Pinyin syllable tone marks (neutral-tone syllables legitimately lack marks)
const PINYIN_TONE_RE = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

/**
 * Validates the v2 textbook payload before import. Extraction meta fields
 * beyond the documented schema are ignored (forward-compatible with the
 * offline extraction workflow).
 */
export class JsonV2Validator {
  static validate(data: unknown): JsonV2ValidationResult {
    const errors: JsonV2Issue[] = [];
    const warnings: JsonV2Issue[] = [];

    if (!this.isPlainObject(data)) {
      return {
        valid: false,
        errors: [{ lessonIndex: -1, field: 'root', message: 'Payload must be a JSON object' }],
        warnings,
      };
    }

    this.validateCourse(data.course, errors);
    this.validateLessons(data.lessons, errors, warnings);

    return { valid: errors.length === 0, errors, warnings };
  }

  private static isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private static validateCourse(course: unknown, errors: JsonV2Issue[]): void {
    const at = (field: string, message: string) => errors.push({ lessonIndex: -1, field, message });

    if (!this.isPlainObject(course)) {
      at('course', 'Course block is required');
      return;
    }
    if (typeof course.name !== 'string' || course.name.trim() === '') {
      at('course.name', 'Course name is required');
    }
    if (typeof course.type !== 'string' || !COURSE_TYPES.includes(course.type)) {
      at('course.type', `Course type must be one of: ${COURSE_TYPES.join(', ')}`);
      return;
    }
    if (course.type === 'HSK') {
      if (!Number.isInteger(course.level) || (course.level as number) < 1 || (course.level as number) > 9) {
        at('course.level', 'HSK courses require an integer level between 1 and 9');
      }
    } else if (course.level !== undefined && !Number.isInteger(course.level)) {
      at('course.level', 'Course level must be an integer when provided');
    }
  }

  private static validateLessons(
    lessons: unknown,
    errors: JsonV2Issue[],
    warnings: JsonV2Issue[]
  ): void {
    if (!Array.isArray(lessons) || lessons.length === 0) {
      errors.push({ lessonIndex: -1, field: 'lessons', message: 'At least one lesson is required' });
      return;
    }

    lessons.forEach((lesson, lessonIndex) => {
      if (!this.isPlainObject(lesson)) {
        errors.push({ lessonIndex, field: 'lessons', message: 'Lesson must be an object' });
        return;
      }
      this.validateLesson(lesson as unknown as TextbookV2LessonItemDto, lessonIndex, errors, warnings);
    });
  }

  private static validateLesson(
    lesson: TextbookV2LessonItemDto,
    lessonIndex: number,
    errors: JsonV2Issue[],
    warnings: JsonV2Issue[]
  ): void {
    const err = (field: string, message: string) => errors.push({ lessonIndex, field, message });
    const warn = (field: string, message: string) => warnings.push({ lessonIndex, field, message });

    if (typeof lesson.title !== 'string' || lesson.title.trim() === '') {
      err('title', 'Lesson title is required');
    }
    if (!Number.isInteger(lesson.order) || lesson.order < 1) {
      err('order', 'Lesson order must be a positive integer');
    }

    // Vocabulary: hanzi + pinyin required, meaning recommended
    if (lesson.vocabulary !== undefined && !Array.isArray(lesson.vocabulary)) {
      err('vocabulary', 'Vocabulary must be an array');
    } else {
      const seenHanzi = new Set<string>();
      (lesson.vocabulary || []).forEach((vocab, vocabIndex) => {
        const field = `vocabulary[${vocabIndex}]`;
        if (!this.isPlainObject(vocab)) {
          err(field, 'Vocabulary item must be an object');
          return;
        }
        const item = vocab as TextbookV2VocabularyItemDto;
        if (typeof item.hanzi !== 'string' || item.hanzi.trim() === '') {
          err(`${field}.hanzi`, 'hanzi is required');
        } else if (seenHanzi.has(item.hanzi)) {
          err(`${field}.hanzi`, `Duplicate hanzi "${item.hanzi}" within lesson`);
        } else {
          seenHanzi.add(item.hanzi);
        }
        if (typeof item.pinyin !== 'string' || item.pinyin.trim() === '') {
          err(`${field}.pinyin`, 'pinyin is required');
        } else if (!PINYIN_TONE_RE.test(item.pinyin)) {
          warn(`${field}.pinyin`, `"${item.pinyin}" has no tone marks — verify against source`);
        }
        if (
          (item.meaning === undefined || item.meaning === '') &&
          (item.vietnamese === undefined || item.vietnamese === '')
        ) {
          warn(`${field}.meaning`, 'meaning (or vietnamese) is missing');
        }
      });
    }

    // Conversations: all four display fields required, order unique per lesson
    if (lesson.conversations !== undefined && !Array.isArray(lesson.conversations)) {
      err('conversations', 'Conversations must be an array');
      return;
    }
    const seenOrders = new Set<number>();
    (lesson.conversations || []).forEach((conv, convIndex) => {
      const field = `conversations[${convIndex}]`;
      if (!this.isPlainObject(conv)) {
        err(field, 'Conversation item must be an object');
        return;
      }
      const item = conv as TextbookV2ConversationItemDto;
      if (!Number.isInteger(item.order) || item.order < 1) {
        err(`${field}.order`, 'Conversation order must be a positive integer');
      } else if (seenOrders.has(item.order)) {
        err(`${field}.order`, `Duplicate conversation order ${item.order} within lesson`);
      } else {
        seenOrders.add(item.order);
      }
      for (const textField of ['hanzi', 'pinyin', 'vietnamese'] as const) {
        const value = item[textField];
        if (typeof value !== 'string' || value.trim() === '') {
          err(`${field}.${textField}`, `${textField} is required`);
        } else if (textField === 'pinyin' && !PINYIN_TONE_RE.test(value)) {
          warn(`${field}.pinyin`, `"${value}" has no tone marks — verify against source`);
        }
      }
    });
  }
}
