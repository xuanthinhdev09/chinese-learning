/**
 * Textbook import format v2: a single self-contained JSON file produced by the
 * offline PDF → JSON extraction workflow (content-source/extracted/).
 * Unlike the legacy 3-step slug-mapping flow, v2 resolves everything by
 * (course, lesson order, hanzi) so no mapping files are needed.
 *
 * Extra extraction meta fields (e.g. source_pages) are tolerated and ignored.
 */

export type CourseType = 'HSK' | 'CUSTOM';

export interface TextbookV2CourseDto {
  name: string;
  type: CourseType;
  /** Required for HSK (1-9); optional for CUSTOM (defaults to 0, sorts last) */
  level?: number;
  description?: string;
}

export interface TextbookV2VocabularyItemDto {
  hanzi: string;
  pinyin: string;
  meaning?: string;
  /** Vietnamese gloss — the extraction workflow emits this instead of meaning */
  vietnamese?: string;
  word_type?: string;
  example?: string;
  /** Lesson keyword flag consumed by the daily session exercises */
  is_keyword?: boolean;
}

export interface TextbookV2ConversationItemDto {
  order: number;
  /** Dialogue line speaker, e.g. 妈妈/明明 */
  speaker?: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  /** 课文 group within the lesson (book prints 3-4 titled dialogues) */
  dialogue_order?: number;
  dialogue_title_hanzi?: string;
  dialogue_title_vi?: string;
}

export interface TextbookV2LessonItemDto {
  title: string;
  order: number;
  description?: string;
  vocabulary: TextbookV2VocabularyItemDto[];
  conversations: TextbookV2ConversationItemDto[];
}

export interface ImportTextbookV2Dto {
  course: TextbookV2CourseDto;
  lessons: TextbookV2LessonItemDto[];
}

export interface TextbookV2LessonImportSummary {
  order: number;
  title: string;
  lesson_id: string;
  vocab_created: number;
  vocab_updated: number;
  keywords: number;
  conversations_replaced: number;
}

export interface TextbookV2ImportResult {
  success: boolean;
  course_id: string;
  course_name: string;
  course_type: string;
  created_lessons: number;
  skipped_lessons: number;
  vocab_created: number;
  vocab_updated: number;
  keywords_flagged: number;
  conversations_replaced: number;
  lessons: TextbookV2LessonImportSummary[];
  warnings: string[];
  errors: string[];
  imported_at: string;
}
