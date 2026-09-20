import { apiClient } from '../lib/api-client';

export interface DialogueLine {
  id: string;
  order: number;
  speaker: string | null;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  /** 课文 group within the lesson (3-4 titled dialogues per lesson); null on legacy data */
  dialogueOrder: number | null;
  dialogueTitleHanzi: string | null;
  dialogueTitleVi: string | null;
}

export interface VocabItem {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example?: string | null;
  wordType?: string | null;
  isKeyword?: boolean;
}

export interface DueDialogue {
  lessonId: string;
  lessonTitle: string;
  stage: number;
  nextReviewAt: string | null;
  lines: DialogueLine[];
}

export interface NextLesson {
  lessonId: string;
  lessonTitle: string;
  order: number;
  lines: DialogueLine[];
  keywords: VocabItem[];
  vocabulary: VocabItem[];
}

export interface DueVocabularyItem {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  progress: {
    masteryLevel: number;
    nextReviewAt: string | null;
    isMastered: boolean;
  };
}

export interface DailySessionPlan {
  dueDialogues: DueDialogue[];
  nextLesson: NextLesson | null;
  dueVocabulary: DueVocabularyItem[];
  dueVocabularyTotal: number;
  streak: number;
  completedToday: boolean;
}

export interface DialogueReviewResult {
  lessonId: string;
  stage: number;
  graduated: boolean;
  nextReviewAt: string | null;
}

export interface CompleteSessionResult {
  lessonId: string;
  isCompleted: boolean;
  completedAt: string;
  streak: number;
}

/** Lightweight next-lesson lookup for study-page pre-selection; all fields null when every lesson is completed */
export interface CurrentLesson {
  lessonId: string | null;
  lessonTitle: string | null;
  order: number | null;
  courseId: string | null;
}

export async function getCurrentLesson(): Promise<CurrentLesson> {
  const response = await apiClient.get('/daily-session/current-lesson');
  if (!response.ok) throw new Error('Failed to load current lesson');
  return response.json();
}

export async function getDailySession(courseId?: string): Promise<DailySessionPlan> {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
  const response = await apiClient.get(`/daily-session${query}`);
  if (!response.ok) throw new Error('Failed to load study plan');
  return response.json();
}

export async function reviewDialogue(
  lessonId: string,
  passed: boolean
): Promise<DialogueReviewResult> {
  const response = await apiClient.post('/daily-session/dialogue-review', { lessonId, passed });
  if (!response.ok) throw new Error('Failed to save dialogue review');
  return response.json();
}

export async function completeSession(lessonId: string): Promise<CompleteSessionResult> {
  const response = await apiClient.post('/daily-session/complete', { lessonId });
  if (!response.ok) throw new Error('Failed to record session completion');
  return response.json();
}
