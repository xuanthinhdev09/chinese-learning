import { VocabularyItemDto } from '../dto/import-vocabularies.dto';

export class VocabularyMapper {
  /**
   * Generate slug for vocabulary: "vocab-hanzi-{hanzi}-lesson-{order}"
   * Composite slug prevents collision if same hanzi appears in different lessons
   */
  static generateSlug(hanzi: string, lessonOrder: number): string {
    return `vocab-hanzi-${hanzi}-lesson-${lessonOrder}`;
  }

  /**
   * Convert DTO to Prisma create input for Vocabulary
   * Note: Combines english and vietnamese into meaning field
   */
  static toCreateDto(vocab: VocabularyItemDto, lessonId: string, hskLevel: number) {
    return {
      lessonId,
      hanzi: vocab.hanzi,
      pinyin: vocab.pinyin,
      meaning: `${vocab.english} | ${vocab.vietnamese}`,
      wordType: vocab.word_type || null,
      example: vocab.example || null,
      examplePinyin: vocab.example_pinyin || null,
      exampleVietnamese: vocab.example_vietnamese || null,
      hskLevel
    };
  }
}
