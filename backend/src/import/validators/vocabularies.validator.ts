import { VocabularyItemDto } from '../dto/import-vocabularies.dto';

export interface VocabValidationError {
  index: number;
  field: string;
  message: string;
}

export class VocabulariesValidator {
  /**
   * Validate vocabularies against lesson mapping
   */
  static validate(
    vocabularies: VocabularyItemDto[],
    lessonMapping: Record<string, string>
  ): VocabValidationError[] {
    const errors: VocabValidationError[] = [];

    vocabularies.forEach((vocab, index) => {
      // Check lesson_slug exists in mapping
      if (!lessonMapping[vocab.lesson_slug]) {
        errors.push({
          index,
          field: 'lesson_slug',
          message: `Unknown lesson_slug "${vocab.lesson_slug}" at index ${index}`
        });
      }

      // Check pinyin-hanzi consistency (basic check)
      // Pinyin should have similar number of syllables as hanzi has characters
      const hanziChars = vocab.hanzi.length;
      const pinyinSyllables = vocab.pinyin.trim().split(/\s+/).length;

      // Allow some tolerance for multi-character words and possessives
      if (Math.abs(hanziChars - pinyinSyllables) > 3) {
        errors.push({
          index,
          field: 'pinyin',
          message: `Pinyin syllable count (${pinyinSyllables}) doesn't match hanzi character count (${hanziChars}) at index ${index}`
        });
      }
    });

    return errors;
  }

  /**
   * Check for duplicate vocabularies within the import batch
   */
  static checkDuplicates(
    vocabularies: VocabularyItemDto[]
  ): VocabValidationError[] {
    const errors: VocabValidationError[] = [];
    const seen = new Set<string>();

    vocabularies.forEach((vocab, index) => {
      const key = `${vocab.lesson_slug}:${vocab.hanzi}`;

      // Check duplicates in current import
      if (seen.has(key)) {
        errors.push({
          index,
          field: 'hanzi',
          message: `Duplicate vocabulary "${vocab.hanzi}" in lesson "${vocab.lesson_slug}" at index ${index}`
        });
      }
      seen.add(key);
    });

    return errors;
  }

  /**
   * Check for vocabularies that already exist in the database
   * This is called during service execution with actual DB data
   */
  static checkExistingDuplicates(
    vocabularies: VocabularyItemDto[],
    existingVocab: Array<{ hanzi: string; lessonId: string }>,
    lessonSlugToIdMap: Record<string, string>
  ): VocabValidationError[] {
    const errors: VocabValidationError[] = [];

    vocabularies.forEach((vocab, index) => {
      const lessonId = lessonSlugToIdMap[vocab.lesson_slug];
      if (!lessonId) return;

      // Check if this vocab already exists in this lesson
      const exists = existingVocab.some(
        existing => existing.hanzi === vocab.hanzi && existing.lessonId === lessonId
      );

      if (exists) {
        errors.push({
          index,
          field: 'hanzi',
          message: `Vocabulary "${vocab.hanzi}" already exists in lesson "${vocab.lesson_slug}" at index ${index}`
        });
      }
    });

    return errors;
  }
}
