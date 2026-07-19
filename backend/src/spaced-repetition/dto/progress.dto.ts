import { IsNotEmpty, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

/**
 * DTO for recording vocabulary learning progress
 */
export class CreateProgressDto {
  @IsNotEmpty()
  @IsString()
  vocabularyId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(5)
  quality: number; // 0=Again, 3=Hard, 4=Good, 5=Easy
}

/**
 * DTO for updating existing progress
 */
export class UpdateProgressDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(5)
  quality: number;
}

/**
 * Response DTO for vocabulary progress
 */
export interface ProgressResponseDto {
  id: string;
  userId: string;
  vocabularyId: string;
  masteryLevel: number; // 0-5
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

/**
 * DTO for vocabulary with progress
 */
export interface VocabularyWithProgressDto {
  id: string;
  hanzi: string;
  traditional: string | null;
  pinyin: string;
  meaning: string;
  pos: string | null;
  hskCode: string | null;
  hskLevel: number | null;

  // Progress fields (if exists)
  progress?: {
    masteryLevel: number;
    nextReviewAt: string | null;
    isMastered: boolean;
    easeFactor: number;
  };
}

/**
 * Response DTO for due vocabularies
 */
export interface DueVocabulariesResponseDto {
  vocabularies: VocabularyWithProgressDto[];
  total: number;
  dueCount: number;
  newCount: number; // Never reviewed before
}

/**
 * Response DTO for progress statistics
 */
export interface ProgressStatsResponseDto {
  total: number;
  new: number; // Never reviewed
  learning: number; // In progress (masteryLevel 1-4)
  mastered: number; // Mastered (masteryLevel 5)
  dueToday: number; // Due for review today
  streak: number; // Consecutive days of learning
}
