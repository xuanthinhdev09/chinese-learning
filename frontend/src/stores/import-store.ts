import { create } from 'zustand';
import {
  ImportLessonsResponse,
  ImportVocabulariesResponse,
  ImportConversationsResponse,
} from '../api/import-api';

interface ImportFile {
  file: File | null;
}

interface ImportStore {
  currentStep: number;
  lessons: ImportFile & { result?: ImportLessonsResponse };
  vocabularies: ImportFile & { result?: ImportVocabulariesResponse };
  conversations: ImportFile & { result?: ImportConversationsResponse };
  isImporting: boolean;

  setCurrentStep: (step: number) => void;
  setLessonsFile: (file: File | null) => void;
  setLessonsResult: (result: ImportLessonsResponse | undefined) => void;
  setVocabulariesFile: (file: File | null) => void;
  setVocabulariesResult: (result: ImportVocabulariesResponse | undefined) => void;
  setConversationsFile: (file: File | null) => void;
  setConversationsResult: (result: ImportConversationsResponse | undefined) => void;
  setIsImporting: (importing: boolean) => void;
  reset: () => void;
}

export const useImportStore = create<ImportStore>((set) => ({
  currentStep: 1,
  lessons: { file: null },
  vocabularies: { file: null },
  conversations: { file: null },
  isImporting: false,

  setCurrentStep: (step) => set({ currentStep: step }),

  setLessonsFile: (file) => set({ lessons: { file } }),
  setLessonsResult: (result) =>
    set((state) => ({ lessons: { ...state.lessons, result } })),

  setVocabulariesFile: (file) => set({ vocabularies: { file } }),
  setVocabulariesResult: (result) =>
    set((state) => ({ vocabularies: { ...state.vocabularies, result } })),

  setConversationsFile: (file) => set({ conversations: { file } }),
  setConversationsResult: (result) =>
    set((state) => ({ conversations: { ...state.conversations, result } })),

  setIsImporting: (importing) => set({ isImporting: importing }),

  reset: () =>
    set({
      currentStep: 1,
      lessons: { file: null },
      vocabularies: { file: null },
      conversations: { file: null },
      isImporting: false,
    }),
}));
