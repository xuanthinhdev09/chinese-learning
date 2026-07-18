import { create } from 'zustand';
import { vocabularyApi, Vocabulary } from '../api/vocabulary-api';

type StudyMode = 'flashcard' | 'quiz';

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

  // Quiz State
  quiz: QuizState;
  correctCount: number;
  quizCompleted: boolean;

  // Actions
  loadByHSKLevel: (level: number) => Promise<void>;
  nextCard: () => void;
  previousCard: () => void;
  flipCard: () => void;
  setStudyMode: (mode: StudyMode) => void;
  startQuiz: (level: number) => Promise<void>;
  selectQuizOption: (optionId: string) => void;
  submitQuizAnswer: () => void;
  nextQuizQuestion: () => void;
  resetQuiz: () => void;
  clearError: () => void;
}

const createQuizOptions = (
  currentVocab: Vocabulary,
  allVocab: Vocabulary[]
): QuizOption[] => {
  // Get 3 random wrong answers
  const wrongAnswers = allVocab
    .filter((v) => v.id !== currentVocab.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((v) => ({
      id: v.id,
      text: v.meaning,
      isCorrect: false,
    }));

  // Add correct answer
  const correctAnswer = {
    id: currentVocab.id,
    text: currentVocab.meaning,
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
  quiz: {
    options: [],
    selectedOption: null,
    showResult: false,
    isCorrect: null,
  },
  correctCount: 0,
  quizCompleted: false,

  // Load vocabulary by HSK level
  loadByHSKLevel: async (level: number) => {
    set({ isLoading: true, error: null });
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
    if (mode === 'flashcard') {
      set({
        quiz: { options: [], selectedOption: null, showResult: false, isCorrect: null },
        correctCount: 0,
        quizCompleted: false,
      });
    }
  },

  // Quiz
  startQuiz: async (level: number) => {
    set({ isLoading: true, error: null });
    try {
      const vocabularies = await vocabularyApi.getByHSKLevel(level);
      const options = createQuizOptions(vocabularies[0], vocabularies);

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
    const { vocabularies, currentIndex } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= vocabularies.length) {
      set({ quizCompleted: true });
    } else {
      const options = createQuizOptions(vocabularies[nextIndex], vocabularies);
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
    const { vocabularies, currentLevel } = get();
    if (!vocabularies.length || !currentLevel) return;

    const options = createQuizOptions(vocabularies[0], vocabularies);
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

  clearError: () => set({ error: null }),
}));
