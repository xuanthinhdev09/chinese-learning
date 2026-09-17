import {
  TextbookV2ConversationItemDto,
  TextbookV2CourseDto,
  TextbookV2LessonItemDto,
  TextbookV2VocabularyItemDto,
} from '../dto/import-textbook-v2.dto';

/**
 * Maps validated v2 textbook JSON onto Prisma create/update payloads.
 */
export class JsonV2Mapper {
  static toCourseCreate(course: TextbookV2CourseDto) {
    return {
      name: course.name,
      type: course.type,
      // CUSTOM courses without an explicit level sort after HSK bands
      level: course.type === 'HSK' ? (course.level as number) : (course.level ?? 0),
      description: course.description || null,
    };
  }

  static toLessonCreate(lesson: TextbookV2LessonItemDto, courseId: string) {
    return {
      courseId,
      title: lesson.title,
      description: lesson.description || null,
      order: lesson.order,
    };
  }

  static toVocabularyCreate(
    vocab: TextbookV2VocabularyItemDto,
    lessonId: string,
    hskLevel: number | null
  ) {
    return {
      lessonId,
      hanzi: vocab.hanzi,
      pinyin: vocab.pinyin,
      // extraction workflow emits vietnamese; meaning kept for spec symmetry
      meaning: vocab.meaning || vocab.vietnamese || '',
      wordType: vocab.word_type || null,
      example: vocab.example || null,
      isKeyword: vocab.is_keyword === true,
      hskLevel,
    };
  }

  /** Re-import refreshes content fields; hanzi is the identity key */
  static toVocabularyUpdate(vocab: TextbookV2VocabularyItemDto) {
    return {
      pinyin: vocab.pinyin,
      meaning: vocab.meaning || vocab.vietnamese || '',
      wordType: vocab.word_type || null,
      example: vocab.example || null,
      isKeyword: vocab.is_keyword === true,
    };
  }

  static toConversationCreate(
    conv: TextbookV2ConversationItemDto,
    lessonId: string
  ) {
    return {
      lessonId,
      order: conv.order,
      speaker: conv.speaker || null,
      hanzi: conv.hanzi,
      pinyin: conv.pinyin,
      vietnamese: conv.vietnamese,
      dialogueOrder: conv.dialogue_order ?? null,
      dialogueTitleHanzi: conv.dialogue_title_hanzi || null,
      dialogueTitleVi: conv.dialogue_title_vi || null,
    };
  }
}
