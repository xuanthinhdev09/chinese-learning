import { IsBoolean, IsString } from 'class-validator';
import { Conversation, Vocabulary } from '@prisma/client';
import { VocabularyWithProgressDto } from '../../spaced-repetition/dto/progress.dto';

export class RecordDialogueReviewDto {
  @IsString()
  lessonId: string;

  @IsBoolean()
  passed: boolean;
}

export class CompleteSessionDto {
  @IsString()
  lessonId: string;
}

export interface DialogueLineDto {
  id: string;
  order: number;
  speaker: string | null;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

export interface DueDialogueDto {
  lessonId: string;
  lessonTitle: string;
  stage: number;
  nextReviewAt: string | null;
  lines: DialogueLineDto[];
}

export interface NextLessonDto {
  lessonId: string;
  lessonTitle: string;
  order: number;
  lines: DialogueLineDto[];
  keywords: Vocabulary[];
  vocabulary: Vocabulary[];
}

export interface DailySessionResponseDto {
  /** Dialogues due for spaced review (stage 0-3), across all courses */
  dueDialogues: DueDialogueDto[];
  /** Next uncompleted lesson in the active course; null when all done */
  nextLesson: NextLessonDto | null;
  dueVocabulary: VocabularyWithProgressDto[];
  dueVocabularyTotal: number;
  streak: number;
  /** ∃ dialogue review recorded today (pinned rule — no session table) */
  completedToday: boolean;
}

export interface DialogueReviewResultDto {
  lessonId: string;
  stage: number;
  /** stage reached 4 — no further review scheduled */
  graduated: boolean;
  nextReviewAt: string | null;
}

export interface CompleteSessionResultDto {
  lessonId: string;
  isCompleted: boolean;
  completedAt: string;
  streak: number;
}
