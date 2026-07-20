import { apiClient } from '../lib/api-client';

// HSK 3.0 Vocabulary with new fields
export interface Vocabulary {
  id: string;
  lessonId: string;
  hanzi: string;
  traditional: string | null;
  pinyin: string;
  meaning: string;      // Legacy format: "english | vietnamese"
  english: string;     // NEW - Extracted English meaning
  vietnamese: string;  // NEW - Extracted Vietnamese meaning
  audioUrl: string | null;
  example: string | null;
  wordType: string | null;
  pos: string | null;           // Part of Speech (V, N, Adj...)
  hskCode: string | null;       // HSK 3.0 code (L1-0001)
  hskLevel: number | null;      // HSK level 1-9
  variants: string | null;      // Word variants
  cedict: string | null;        // CC-CEDICT reference
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyStats {
  total: number;
  byLevel: Array<{ hsklevel: number; count: number }>;
}

export interface ImportResult {
  imported: number;
  total: number;
}

// Progress API types
export interface CreateProgressDto {
  vocabularyId: string;
  quality: number; // 0=Again, 3=Hard, 4=Good, 5=Easy
}

export interface ProgressResponse {
  id: string;
  userId: string;
  vocabularyId: string;
  masteryLevel: number;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  isMastered: boolean;
  easeFactor: number;
  interval: number;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyWithProgress {
  id: string;
  hanzi: string;
  traditional: string | null;
  pinyin: string;
  meaning: string;
  english: string;
  vietnamese: string;
  pos: string | null;
  hskCode: string | null;
  hskLevel: number | null;
  progress?: {
    masteryLevel: number;
    nextReviewAt: string | null;
    isMastered: boolean;
    easeFactor: number;
  };
}

export interface DueVocabulariesResponse {
  vocabularies: VocabularyWithProgress[];
  total: number;
  dueCount: number;
  newCount: number;
}

export interface ProgressStatsResponse {
  total: number;
  new: number;
  learning: number;
  mastered: number;
  dueToday: number;
  streak: number;
}

// Parse meaning format "english | vietnamese" into separate fields
function parseMeaning(meaning: string): { english: string; vietnamese: string } {
  if (!meaning) {
    return { english: '', vietnamese: '' };
  }

  // Check if meaning contains the separator
  const parts = meaning.split('|').map(p => p.trim());

  if (parts.length >= 2) {
    return {
      english: parts[0],
      vietnamese: parts[1],
    };
  }

  // If no separator found, treat as English only
  return {
    english: meaning,
    vietnamese: '',
  };
}

// Process vocabulary items to add parsed fields
function processVocabulary(item: any): Vocabulary {
  const { english, vietnamese } = parseMeaning(item.meaning);
  return {
    ...item,
    english,
    vietnamese,
  };
}

export const vocabularyApi = {
  async getByLesson(lessonId: string): Promise<Vocabulary[]> {
    const response = await apiClient.get(`/vocabulary/lesson/${lessonId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary');
    }

    const items = await response.json();
    return items.map(processVocabulary);
  },

  async getByHSKLevel(level: number): Promise<Vocabulary[]> {
    const response = await apiClient.get(`/vocabulary/hsk-level/${level}`);

    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary by HSK level');
    }

    const items = await response.json();
    return items.map(processVocabulary);
  },

  async getStatistics(): Promise<VocabularyStats> {
    const response = await apiClient.get('/vocabulary/statistics');

    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary statistics');
    }

    return response.json();
  },

  async importVocabulary(
    lessonId: string,
    csvContent: string,
    maxLevel?: number
  ): Promise<ImportResult> {
    const response = await apiClient.post('/vocabulary/import', {
      lessonId,
      csvContent,
      maxLevel,
    });

    if (!response.ok) {
      throw new Error('Failed to import vocabulary');
    }

    return response.json();
  },

  async clearLesson(lessonId: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/vocabulary/lesson/${lessonId}/clear`);

    if (!response.ok) {
      throw new Error('Failed to clear lesson vocabulary');
    }

    return response.json();
  },

  // Progress API endpoints
  async recordProgress(data: CreateProgressDto): Promise<ProgressResponse> {
    const response = await apiClient.post('/vocabulary/progress', data);

    if (!response.ok) {
      throw new Error('Failed to record progress');
    }

    return response.json();
  },

  async getDueVocabularies(limit: number = 20): Promise<DueVocabulariesResponse> {
    const response = await apiClient.get(`/vocabulary/progress/due?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch due vocabularies');
    }

    const result = await response.json();
    return {
      ...result,
      vocabularies: result.vocabularies.map(processVocabulary),
    };
  },

  async getProgressStats(): Promise<ProgressStatsResponse> {
    const response = await apiClient.get('/vocabulary/progress/stats');

    if (!response.ok) {
      throw new Error('Failed to fetch progress stats');
    }

    return response.json();
  },

  async getVocabularyProgress(vocabularyId: string): Promise<ProgressResponse | null> {
    const response = await apiClient.get(`/vocabulary/progress/${vocabularyId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary progress');
    }

    const result = await response.json();
    return result.progress;
  },
};
