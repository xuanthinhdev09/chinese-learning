import { apiClient } from '../lib/api-client';

export interface HskLevel {
  id: string;
  level: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lessonCount: number;
}

export interface HskDetail extends HskLevel {
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: string;
  title: string;
  description: string | null;
  order: number;
  vocabularyCount: number;
}

export const hskApi = {
  async getLevels(): Promise<HskLevel[]> {
    const response = await apiClient.get('/hsk');

    if (!response.ok) {
      throw new Error('Failed to fetch HSK levels');
    }

    return response.json();
  },

  async getLevel(id: string): Promise<HskDetail> {
    const response = await apiClient.get(`/hsk/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch HSK level');
    }

    return response.json();
  },
};
