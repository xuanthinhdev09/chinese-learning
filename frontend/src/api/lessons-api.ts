const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Lesson {
  id: string;
  hskLevelId: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  vocabularyCount: number;
  hskLevel: {
    id: string;
    level: number;
    name: string;
  };
}

export interface LessonDetail extends Lesson {
  vocabularies: {
    id: string;
    hanzi: string;
    pinyin: string;
    meaning: string;
    audioUrl: string | null;
    example: string | null;
    wordType: string | null;
  }[];
}

export interface PaginatedLessons {
  data: Lesson[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const lessonsApi = {
  async getLessons(params: {
    hskLevelId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedLessons> {
    const queryParams = new URLSearchParams();
    if (params.hskLevelId) queryParams.set('hskLevelId', params.hskLevelId);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const response = await fetch(
      `${API_URL}/lessons?${queryParams.toString()}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch lessons');
    }

    return response.json();
  },

  async getLesson(id: string): Promise<LessonDetail> {
    const response = await fetch(`${API_URL}/lessons/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lesson');
    }

    return response.json();
  },
};