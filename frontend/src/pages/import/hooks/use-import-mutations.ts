import { useMutation } from '@tanstack/react-query';
import {
  importLessons,
  importVocabularies,
  importConversations,
} from '../../../api/import-api';
import { useImportStore } from '../../../stores/import-store';

export function useImportLessonsMutation() {
  const { setLessonsResult, setCurrentStep, setIsImporting } =
    useImportStore();

  return useMutation({
    mutationFn: async (file: File) => {
      const json = await file.text();
      const data = JSON.parse(json);
      return importLessons(data);
    },
    onMutate: () => {
      setIsImporting(true);
    },
    onSuccess: (result) => {
      setLessonsResult(result);
      setCurrentStep(2);
      setIsImporting(false);
    },
    onError: (error) => {
      setIsImporting(false);
      console.error('Import failed:', error);
    },
  });
}

export function useImportVocabulariesMutation() {
  const { lessons, setVocabulariesResult, setCurrentStep, setIsImporting } =
    useImportStore();

  return useMutation({
    mutationFn: async (file: File) => {
      const json = await file.text();
      const data = JSON.parse(json);

      // Attach lesson mapping
      if (!lessons.result?.mapping) {
        throw new Error('Lesson mapping required for vocabulary import');
      }

      return importVocabularies({
        ...data,
        lesson_mapping: lessons.result.mapping,
      });
    },
    onMutate: () => {
      setIsImporting(true);
    },
    onSuccess: (result) => {
      setVocabulariesResult(result);
      setCurrentStep(3);
      setIsImporting(false);
    },
    onError: (error) => {
      setIsImporting(false);
      console.error('Import failed:', error);
    },
  });
}

export function useImportConversationsMutation() {
  const { vocabularies, lessons, setConversationsResult, setIsImporting } =
    useImportStore();

  return useMutation({
    mutationFn: async (file: File) => {
      const json = await file.text();
      const data = JSON.parse(json);

      // Attach both mappings
      if (!vocabularies.result?.mapping) {
        throw new Error('Vocabulary mapping required for conversation import');
      }

      return importConversations({
        ...data,
        lesson_mapping: lessons.result?.mapping || {},
        vocab_mapping: vocabularies.result.mapping,
      });
    },
    onMutate: () => {
      setIsImporting(true);
    },
    onSuccess: (result) => {
      setConversationsResult(result);
      setIsImporting(false);
    },
    onError: (error) => {
      setIsImporting(false);
      console.error('Import failed:', error);
    },
  });
}
