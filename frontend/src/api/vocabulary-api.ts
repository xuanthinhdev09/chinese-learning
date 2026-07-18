const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// HSK 3.0 Vocabulary with new fields
export interface Vocabulary {
  id: string;
  lessonId: string;
  hanzi: string;
  traditional: string | null;
  pinyin: string;
  meaning: string;
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

export const vocabularyApi = {
  async getByLesson(lessonId: string): Promise<Vocabulary[]> {
    const response = await fetch(
      `${API_URL}/vocabulary/lesson/${lessonId}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary');
    }

    return response.json();
  },

  async getByHSKLevel(level: number): Promise<Vocabulary[]> {
    const response = await fetch(
      `${API_URL}/vocabulary/hsk-level/${level}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary by HSK level');
    }

    return response.json();
  },

  async getStatistics(): Promise<VocabularyStats> {
    const response = await fetch(
      `${API_URL}/vocabulary/statistics`,
      { credentials: 'include' }
    );

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
    const response = await fetch(`${API_URL}/vocabulary/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        lessonId,
        csvContent,
        maxLevel,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to import vocabulary');
    }

    return response.json();
  },

  async clearLesson(lessonId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${API_URL}/vocabulary/lesson/${lessonId}/clear`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to clear lesson vocabulary');
    }

    return response.json();
  },
};