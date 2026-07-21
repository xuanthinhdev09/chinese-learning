import { apiClient } from '../lib/api-client';

export interface ImportLessonsRequest {
  hsk_level: number;
  hsk_version?: string;
  lessons: Array<{
    order: number;
    title: string;
    description?: string;
  }>;
}

export interface ImportLessonsResponse {
  success: boolean;
  hsk_level: number;
  created_count: number;
  skipped_count: number;
  errors: string[];
  mapping: Record<string, string>;
  exported_at: string;
}

export interface ImportVocabulariesRequest {
  hsk_level: number;
  vocabularies: Array<{
    lesson_slug: string;
    hanzi: string;
    pinyin: string;
    english: string;
    vietnamese: string;
    word_type?: string;
    example?: string;
  }>;
  lesson_mapping: Record<string, string>;
}

export interface ImportVocabulariesResponse {
  success: boolean;
  hsk_level: number;
  created_count: number;
  skipped_count: number;
  errors: string[];
  mapping: Record<string, string>;
  exported_at: string;
}

export interface ImportConversationsRequest {
  hsk_level: number;
  conversations: Array<{
    lesson_slug: string;
    order: number;
    hanzi: string;
    pinyin: string;
    vietnamese: string;
    difficulty?: number;
    vocabularies: Array<{
      vocab_slug: string;
      position?: number;
    }>;
  }>;
  lesson_mapping: Record<string, string>;
  vocab_mapping: Record<string, string>;
}

export interface ImportConversationsResponse {
  success: boolean;
  hsk_level: number;
  conversations_imported: number;
  conversations_skipped: number;
  vocabulary_links_created: number;
  errors: string[];
  imported_at: string;
}

export async function importLessons(
  data: ImportLessonsRequest
): Promise<ImportLessonsResponse> {
  const response = await apiClient.post('/import/lessons', data);
  return response.json();
}

export async function importVocabularies(
  data: ImportVocabulariesRequest
): Promise<ImportVocabulariesResponse> {
  const response = await apiClient.post('/import/vocabularies', data);
  return response.json();
}

export async function importConversations(
  data: ImportConversationsRequest
): Promise<ImportConversationsResponse> {
  const response = await apiClient.post('/import/conversations', data);
  return response.json();
}
