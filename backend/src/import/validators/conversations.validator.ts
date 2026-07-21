import { ConversationItemDto, VocabularyRefDto } from '../dto/import-conversations.dto';

export interface ConversationValidationError {
  index: number;
  field: string;
  message: string;
}

export class ConversationsValidator {
  /**
   * Validate conversations against lesson and vocabulary mappings
   */
  static validate(
    conversations: ConversationItemDto[],
    lessonMapping: Record<string, string>,
    vocabMapping: Record<string, string>
  ): ConversationValidationError[] {
    const errors: ConversationValidationError[] = [];

    conversations.forEach((conv, index) => {
      // Check lesson_slug exists in mapping
      if (!lessonMapping[conv.lesson_slug]) {
        errors.push({
          index,
          field: 'lesson_slug',
          message: `Unknown lesson_slug "${conv.lesson_slug}" at index ${index}`
        });
      }

      // Check vocab_slugs exist
      conv.vocabularies.forEach((vocabRef, vocabIndex) => {
        if (!vocabMapping[vocabRef.vocab_slug]) {
          errors.push({
            index,
            field: `vocabularies[${vocabIndex}].vocab_slug`,
            message: `Unknown vocab_slug "${vocabRef.vocab_slug}" in conversation at index ${index}`
          });
        }
      });

      // Check for duplicate vocab_slugs within this conversation
      const vocabSlugSet = new Set<string>();
      conv.vocabularies.forEach((vocabRef, vocabIndex) => {
        if (vocabSlugSet.has(vocabRef.vocab_slug)) {
          errors.push({
            index,
            field: `vocabularies[${vocabIndex}].vocab_slug`,
            message: `Duplicate vocab_slug "${vocabRef.vocab_slug}" in conversation at index ${index}`
          });
        }
        vocabSlugSet.add(vocabRef.vocab_slug);
      });
    });

    return errors;
  }

  /**
   * Check for duplicate conversation orders within lessons
   */
  static checkOrderConflicts(
    conversations: ConversationItemDto[]
  ): ConversationValidationError[] {
    const errors: ConversationValidationError[] = [];

    // Group by lesson_slug and check for duplicate orders
    const lessonOrdersMap = new Map<string, Set<number>>();

    conversations.forEach((conv, index) => {
      if (!lessonOrdersMap.has(conv.lesson_slug)) {
        lessonOrdersMap.set(conv.lesson_slug, new Set<number>());
      }

      const orderSet = lessonOrdersMap.get(conv.lesson_slug)!;
      if (orderSet.has(conv.order)) {
        errors.push({
          index,
          field: 'order',
          message: `Duplicate order ${conv.order} in lesson "${conv.lesson_slug}" at index ${index}`
        });
      }
      orderSet.add(conv.order);
    });

    return errors;
  }

  /**
   * Validate order sequences are sequential within each lesson
   */
  static validateOrderSequences(
    conversations: ConversationItemDto[]
  ): ConversationValidationError[] {
    const errors: ConversationValidationError[] = [];

    // Group by lesson_slug
    const lessonGroups = new Map<string, ConversationItemDto[]>();

    conversations.forEach((conv) => {
      if (!lessonGroups.has(conv.lesson_slug)) {
        lessonGroups.set(conv.lesson_slug, []);
      }
      lessonGroups.get(conv.lesson_slug)!.push(conv);
    });

    // Check each lesson's conversation orders are sequential
    lessonGroups.forEach((convs, lessonSlug) => {
      const sortedOrders = convs.map(c => c.order).sort((a, b) => a - b);

      for (let i = 0; i < sortedOrders.length; i++) {
        if (sortedOrders[i] !== i + 1) {
          errors.push({
            index: -1,
            field: 'order',
            message: `Conversation orders in lesson "${lessonSlug}" must be sequential starting from 1. Gap found at position ${i + 1}`
          });
          break;
        }
      }
    });

    return errors;
  }
}
