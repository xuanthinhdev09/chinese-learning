import { create } from 'zustand';
import { vocabularyApi, Vocabulary } from '../api/vocabulary-api';
import { getDisplayMeaning, LanguagePreference } from './language-preference-store';

type StudyMode = 'flashcard' | 'quiz' | 'fill-blank' | 'pinyin-match';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizState {
  options: QuizOption[];
  selectedOption: string | null;
  showResult: boolean;
  isCorrect: boolean | null;
}

interface VocabularyState {
  // Data
  vocabularies: Vocabulary[];
  currentLevel: number | null;
  currentIndex: number;

  // UI State
  studyMode: StudyMode;
  isFlipped: boolean;
  isLoading: boolean;
  error: string | null;

  // Language Preference
  languagePreference: LanguagePreference;

  // Quiz State
  quiz: QuizState;
  correctCount: number;
  quizCompleted: boolean;

  // Progress State
  isSavingProgress: boolean;
  progressError: string | null;

  // Actions
  loadByHSKLevel: (level: number) => Promise<void>;
  nextCard: () => void;
  previousCard: () => void;
  flipCard: () => void;
  setStudyMode: (mode: StudyMode) => void;
  startQuiz: (level: number, preference?: LanguagePreference) => Promise<void>;
  setLanguagePreference: (pref: LanguagePreference) => void;
  selectQuizOption: (optionId: string) => void;
  submitQuizAnswer: () => void;
  nextQuizQuestion: () => void;
  resetQuiz: () => void;
  clearError: () => void;

  // Progress actions
  rateCard: (vocabularyId: string, quality: number) => Promise<void>;
  loadDueVocabularies: (limit?: number) => Promise<void>;
  getProgressStats: () => Promise<ProgressStatsResponse | null>;
  clearProgressError: () => void;
}

export interface ProgressStatsResponse {
  total: number;
  new: number;
  learning: number;
  mastered: number;
  dueToday: number;
  streak: number;
}

const createQuizOptions = (
  currentVocab: Vocabulary,
  allVocab: Vocabulary[],
  preference: LanguagePreference = 'vietnamese'
): QuizOption[] => {
  // Get 3 random wrong answers
  const wrongAnswers = allVocab
    .filter((v) => v.id !== currentVocab.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((v) => ({
      id: v.id,
      text: getDisplayMeaning(v.vietnamese || '', v.english || '', preference),
      isCorrect: false,
    }));

  // Add correct answer with language preference
  const correctAnswer = {
    id: currentVocab.id,
    text: getDisplayMeaning(
      currentVocab.vietnamese || '',
      currentVocab.english || '',
      preference
    ),
    isCorrect: true,
  };

  // Shuffle and return
  return [...wrongAnswers, correctAnswer]
    .sort(() => Math.random() - 0.5)
    .map((opt, idx) => ({ ...opt, id: `option-${idx}` }));
};

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  // Initial state
  vocabularies: [],
  currentLevel: null,
  currentIndex: 0,
  studyMode: 'flashcard',
  isFlipped: false,
  isLoading: false,
  error: null,
  languagePreference: 'vietnamese',
  quiz: {
    options: [],
    selectedOption: null,
    showResult: false,
    isCorrect: null,
  },
  correctCount: 0,
  quizCompleted: false,
  isSavingProgress: false,
  progressError: null,

  // Load vocabulary by HSK level
  loadByHSKLevel: async (level: number) => {
    set({ isLoading: true, error: null, progressError: null });
    try {
      const vocabularies = await vocabularyApi.getByHSKLevel(level);
      set({
        vocabularies,
        currentLevel: level,
        currentIndex: 0,
        isFlipped: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load vocabulary',
        isLoading: false,
      });
    }
  },

  // Load due vocabularies for review
  loadDueVocabularies: async (limit: number = 20) => {
    set({ isLoading: true, error: null, progressError: null });
    try {
      const result = await vocabularyApi.getDueVocabularies(limit);
      const vocabularies = result.vocabularies.map((v) => ({
        ...v,
        lessonId: '',
        audioUrl: null,
        example: null,
        wordType: null,
        variants: v.progress?.easeFactor ? String(v.progress.easeFactor) : null,
        cedict: null,
        createdAt: '',
        updatedAt: '',
      }));

      set({
        vocabularies,
        currentLevel: null,
        currentIndex: 0,
        isFlipped: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load due vocabularies',
        isLoading: false,
      });
    }
  },

  // Get progress stats
  getProgressStats: async () => {
    try {
      const stats = await vocabularyApi.getProgressStats();
      return stats;
    } catch (error) {
      set({
        progressError: error instanceof Error ? error.message : 'Failed to fetch progress stats',
      });
      return null;
    }
  },

  // Navigation
  nextCard: () => {
    const { vocabularies, currentIndex } = get();
    if (currentIndex < vocabularies.length - 1) {
      set({ currentIndex: currentIndex + 1, isFlipped: false });
    }
  },

  previousCard: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isFlipped: false });
    }
  },

  // Flashcard
  flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),

  setStudyMode: (mode: StudyMode) => {
    set({ studyMode: mode });
    // Reset quiz state when changing modes
    if (mode !== 'quiz' && mode !== 'fill-blank' && mode !== 'pinyin-match') {
      set({
        quiz: { options: [], selectedOption: null, showResult: false, isCorrect: null },
        correctCount: 0,
        quizCompleted: false,
      });
    }
  },

  // Quiz
  startQuiz: async (level: number, preference: LanguagePreference = 'vietnamese') => {
    set({ isLoading: true, error: null, languagePreference: preference });
    try {
      const vocabularies = await vocabularyApi.getByHSKLevel(level);
      const options = createQuizOptions(vocabularies[0], vocabularies, preference);

      set({
        vocabularies,
        currentLevel: level,
        currentIndex: 0,
        studyMode: 'quiz',
        quiz: {
          options,
          selectedOption: null,
          showResult: false,
          isCorrect: null,
        },
        correctCount: 0,
        quizCompleted: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start quiz',
        isLoading: false,
      });
    }
  },

  // Set language preference
  setLanguagePreference: (pref: LanguagePreference) => {
    set({ languagePreference: pref });
  },

  selectQuizOption: (optionId: string) => {
    set((state) => ({
      quiz: { ...state.quiz, selectedOption: optionId },
    }));
  },

  submitQuizAnswer: () => {
    const { quiz, correctCount } = get();
    if (!quiz.selectedOption) return;

    const selectedOption = quiz.options.find((opt) => opt.id === quiz.selectedOption);
    const isCorrect = selectedOption?.isCorrect || false;

    set({
      quiz: { ...quiz, showResult: true, isCorrect },
      correctCount: isCorrect ? correctCount + 1 : correctCount,
    });
  },

  nextQuizQuestion: () => {
    const { vocabularies, currentIndex, languagePreference } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= vocabularies.length) {
      set({ quizCompleted: true });
    } else {
      // Generate new options for next question
      const options = createQuizOptions(vocabularies[nextIndex], vocabularies, languagePreference);
      set({
        currentIndex: nextIndex,
        quiz: {
          options,
          selectedOption: null,
          showResult: false,
          isCorrect: null,
        },
      });
    }
  },

  resetQuiz: () => {
    const { vocabularies, currentLevel, languagePreference } = get();
    if (!vocabularies.length || !currentLevel) return;

    const options = createQuizOptions(vocabularies[0], vocabularies, languagePreference);
    set({
      currentIndex: 0,
      quiz: {
        options,
        selectedOption: null,
        showResult: false,
        isCorrect: null,
      },
      correctCount: 0,
      quizCompleted: false,
    });
  },

  // Rate card and save progress
  rateCard: async (vocabularyId: string, quality: number) => {
    set({ isSavingProgress: true, progressError: null });
    try {
      await vocabularyApi.recordProgress({ vocabularyId, quality });
      set({ isSavingProgress: false });

      // Auto-advance to next card
      const { vocabularies, currentIndex } = get();
      if (currentIndex < vocabularies.length - 1) {
        set({ currentIndex: currentIndex + 1, isFlipped: false });
      }
    } catch (error) {
      set({
        isSavingProgress: false,
        progressError: error instanceof Error ? error.message : 'Failed to save progress',
      });
    }
  },

  clearError: () => set({ error: null }),
  clearProgressError: () => set({ progressError: null }),
}));
