import { useState, useCallback } from 'react';

export interface ValidationError {
  row?: number;
  field?: string;
  message: string;
  type: 'structure' | 'data' | 'constraint';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export function useJsonValidation() {
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
  });

  const validateJson = useCallback((jsonContent: string): ValidationResult => {
    try {
      const data = JSON.parse(jsonContent);
      const errors: ValidationError[] = [];
      const warnings: string[] = [];

      // Structure validation (basic)
      if (!data.hsk_level || typeof data.hsk_level !== 'number') {
        errors.push({
          type: 'structure',
          message: 'Missing or invalid hsk_level field',
        });
      } else if (data.hsk_level < 1 || data.hsk_level > 6) {
        errors.push({
          type: 'structure',
          message: 'HSK level must be between 1 and 6',
        });
      }

      if (
        !Array.isArray(data.lessons) &&
        !Array.isArray(data.vocabularies) &&
        !Array.isArray(data.conversations)
      ) {
        errors.push({
          type: 'structure',
          message: 'Missing lessons, vocabularies, or conversations array',
        });
      }

      // Data validation for lessons
      if (Array.isArray(data.lessons)) {
        data.lessons.forEach((lesson: any, index: number) => {
          if (!lesson.order || typeof lesson.order !== 'number') {
            errors.push({
              row: index + 1,
              field: 'order',
              type: 'data',
              message: `Lesson at row ${index + 1}: Missing or invalid 'order' field`,
            });
          }
          if (!lesson.title || typeof lesson.title !== 'string') {
            errors.push({
              row: index + 1,
              field: 'title',
              type: 'data',
              message: `Lesson at row ${index + 1}: Missing or invalid 'title' field`,
            });
          }
        });
      }

      // Data validation for vocabularies
      if (Array.isArray(data.vocabularies)) {
        data.vocabularies.forEach((vocab: any, index: number) => {
          if (!vocab.lesson_slug || typeof vocab.lesson_slug !== 'string') {
            errors.push({
              row: index + 1,
              field: 'lesson_slug',
              type: 'data',
              message: `Vocabulary at row ${index + 1}: Missing or invalid 'lesson_slug' field`,
            });
          }
          if (!vocab.hanzi || typeof vocab.hanzi !== 'string') {
            errors.push({
              row: index + 1,
              field: 'hanzi',
              type: 'data',
              message: `Vocabulary at row ${index + 1}: Missing or invalid 'hanzi' field`,
            });
          }
          if (!vocab.pinyin || typeof vocab.pinyin !== 'string') {
            errors.push({
              row: index + 1,
              field: 'pinyin',
              type: 'data',
              message: `Vocabulary at row ${index + 1}: Missing or invalid 'pinyin' field`,
            });
          }
          if (!vocab.english || typeof vocab.english !== 'string') {
            errors.push({
              row: index + 1,
              field: 'english',
              type: 'data',
              message: `Vocabulary at row ${index + 1}: Missing or invalid 'english' field`,
            });
          }
          if (!vocab.vietnamese || typeof vocab.vietnamese !== 'string') {
            errors.push({
              row: index + 1,
              field: 'vietnamese',
              type: 'data',
              message: `Vocabulary at row ${index + 1}: Missing or invalid 'vietnamese' field`,
            });
          }
        });
      }

      // Data validation for conversations
      if (Array.isArray(data.conversations)) {
        data.conversations.forEach((conv: any, index: number) => {
          if (!conv.lesson_slug || typeof conv.lesson_slug !== 'string') {
            errors.push({
              row: index + 1,
              field: 'lesson_slug',
              type: 'data',
              message: `Conversation at row ${index + 1}: Missing or invalid 'lesson_slug' field`,
            });
          }
          if (!conv.order || typeof conv.order !== 'number') {
            errors.push({
              row: index + 1,
              field: 'order',
              type: 'data',
              message: `Conversation at row ${index + 1}: Missing or invalid 'order' field`,
            });
          }
          if (!conv.hanzi || typeof conv.hanzi !== 'string') {
            errors.push({
              row: index + 1,
              field: 'hanzi',
              type: 'data',
              message: `Conversation at row ${index + 1}: Missing or invalid 'hanzi' field`,
            });
          }
          if (!conv.pinyin || typeof conv.pinyin !== 'string') {
            errors.push({
              row: index + 1,
              field: 'pinyin',
              type: 'data',
              message: `Conversation at row ${index + 1}: Missing or invalid 'pinyin' field`,
            });
          }
          if (!conv.vietnamese || typeof conv.vietnamese !== 'string') {
            errors.push({
              row: index + 1,
              field: 'vietnamese',
              type: 'data',
              message: `Conversation at row ${index + 1}: Missing or invalid 'vietnamese' field`,
            });
          }
          if (conv.difficulty !== undefined && (typeof conv.difficulty !== 'number' || conv.difficulty < 1 || conv.difficulty > 5)) {
            warnings.push(`Conversation at row ${index + 1}: Difficulty should be between 1 and 5`);
          }
        });
      }

      const result: ValidationResult = {
        valid: errors.length === 0,
        errors,
        warnings,
      };

      setValidation(result);
      return result;
    } catch (error) {
      const parseError: ValidationResult = {
        valid: false,
        errors: [
          {
            type: 'structure',
            message: 'Invalid JSON format',
          },
        ],
        warnings: [],
      };
      setValidation(parseError);
      return parseError;
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidation({ valid: true, errors: [], warnings: [] });
  }, []);

  return {
    validation,
    validateJson,
    clearValidation,
  };
}
