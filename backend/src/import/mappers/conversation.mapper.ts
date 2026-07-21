import { ConversationItemDto, VocabularyRefDto } from '../dto/import-conversations.dto';

export class ConversationMapper {
  /**
   * Convert DTO to Prisma create input for Conversation
   */
  static toCreateDto(conv: ConversationItemDto, lessonId: string) {
    return {
      lessonId,
      order: conv.order,
      hanzi: conv.hanzi,
      pinyin: conv.pinyin,
      vietnamese: conv.vietnamese,
      audioUrl: conv.audio_url || null,
      difficulty: conv.difficulty || null
    };
  }

  /**
   * Convert vocabulary refs to ConversationVocabulary junction records
   */
  static toConversationVocabCreateDtos(
    conversationId: string,
    vocabRefs: VocabularyRefDto[],
    vocabMapping: Record<string, string>
  ) {
    return vocabRefs.map(ref => ({
      conversationId,
      vocabularyId: vocabMapping[ref.vocab_slug],
      position: ref.position || null
    }));
  }
}
