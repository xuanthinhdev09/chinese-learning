import { apiClient } from '../lib/api-client';

export interface LessonExerciseImage {
  id: string;
  filePath: string;
  /** imageRef used by exercise payloads (file base name without extension) */
  ref: string;
  exists: boolean;
  contentType: string;
}

// Workbook payloads are JSON columns with per-typeCode shapes; renderers
// narrow defensively instead of trusting one rigid interface.
export interface ExerciseItem {
  label: string;
  hanzi?: string;
  pinyin?: string;
  vi?: string;
  judgeHanzi?: string;
  radical?: string;
  imageRef?: string;
  /** pinyin pair ["a","b"], letter options, or word bank — depends on typeCode */
  options?: unknown;
  answer?: string | string[];
}

export interface OptionText {
  letter: string;
  hanzi: string;
  pinyin?: string;
  vi?: string;
}

export interface ExerciseExample {
  hanzi?: string;
  pinyin?: string;
  vi?: string;
  imageRef?: string;
  answer?: string;
}

export interface ExercisePayload {
  audioFile?: string;
  drillType?: string;
  options?: unknown;
  example?: unknown;
  items: ExerciseItem[];
}

export interface LessonExercise {
  id: string;
  order: number;
  section: string;
  typeCode: string;
  instructionHanzi: string | null;
  instructionVi: string | null;
  payload: ExercisePayload;
}

export interface LessonExercisesResponse {
  lesson: { id: string; order: number; title: string };
  exercises: LessonExercise[];
  images: LessonExerciseImage[];
}

export const SECTION_ORDER = ['听力', '阅读', '语音', '汉字'] as const;

export const exercisesApi = {
  async getLessonExercises(lessonId: string): Promise<LessonExercisesResponse> {
    const response = await apiClient.get(`/exercises/lesson/${lessonId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exercises');
    }
    return response.json();
  },

  async uploadExerciseImage(imageId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    // postForm, not post: post JSON-stringifies the body, which would turn
    // the FormData into "{}" and Multer would never see a file.
    const response = await apiClient.postForm(`/exercises/images/${imageId}/file`, formData);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
      const code = typeof body?.message === 'string' ? body.message : 'UPLOAD_FAILED';
      throw new Error(code);
    }
  },

  async fetchImageBlob(imageId: string): Promise<Blob> {
    const response = await apiClient.get(`/exercises/images/${imageId}/file`);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    return response.blob();
  },

  async fetchAudioBlob(filename: string): Promise<Blob> {
    const response = await apiClient.get(`/exercises/audio/${filename}`);
    if (!response.ok) {
      throw new Error('Failed to fetch audio');
    }
    return response.blob();
  },
};
