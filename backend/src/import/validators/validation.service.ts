import { Injectable } from '@nestjs/common';
import { LessonsValidator, LessonValidationError } from './lessons.validator';
import { VocabulariesValidator, VocabValidationError } from './vocabularies.validator';
import { ConversationsValidator, ConversationValidationError } from './conversations.validator';
import { ImportLessonsDto } from '../dto/import-lessons.dto';
import { ImportVocabulariesDto } from '../dto/import-vocabularies.dto';
import { ImportConversationsDto } from '../dto/import-conversations.dto';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  index: number;
  field: string;
  message: string;
}

@Injectable()
export class ValidationService {
  /**
   * Validate lessons import data
   */
  validateLessons(dto: ImportLessonsDto): ValidationResult {
    const errors: ValidationError[] = LessonsValidator.validate(dto.lessons);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate vocabularies import data with lesson mapping
   */
  validateVocabularies(
    dto: ImportVocabulariesDto,
    lessonMapping: Record<string, string>
  ): ValidationResult {
    const errors: ValidationError[] = [
      ...VocabulariesValidator.validate(dto.vocabularies, lessonMapping),
      ...VocabulariesValidator.checkDuplicates(dto.vocabularies)
    ];

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate vocabularies against existing database records
   */
  validateVocabulariesAgainstDb(
    dto: ImportVocabulariesDto,
    existingVocab: Array<{ hanzi: string; lessonId: string }>,
    lessonSlugToIdMap: Record<string, string>
  ): ValidationResult {
    const errors: ValidationError[] = VocabulariesValidator.checkExistingDuplicates(
      dto.vocabularies,
      existingVocab,
      lessonSlugToIdMap
    );

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate conversations import data with lesson and vocabulary mappings
   */
  validateConversations(
    dto: ImportConversationsDto,
    lessonMapping: Record<string, string>,
    vocabMapping: Record<string, string>
  ): ValidationResult {
    const errors: ValidationError[] = [
      ...ConversationsValidator.validate(dto.conversations, lessonMapping, vocabMapping),
      ...ConversationsValidator.checkOrderConflicts(dto.conversations),
      ...ConversationsValidator.validateOrderSequences(dto.conversations)
    ];

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format validation errors for user-friendly output
   */
  formatErrors(errors: ValidationError[]): string[] {
    return errors.map(error => {
      const indexStr = error.index >= 0 ? `[Row ${error.index + 1}]` : '[Global]';
      return `${indexStr} ${error.field}: ${error.message}`;
    });
  }

  /**
   * Create a validation error summary
   */
  createErrorSummary(validationResult: ValidationResult): {
    valid: boolean;
    errorCount: number;
    formattedErrors: string[];
  } {
    return {
      valid: validationResult.valid,
      errorCount: validationResult.errors.length,
      formattedErrors: this.formatErrors(validationResult.errors)
    };
  }
}
