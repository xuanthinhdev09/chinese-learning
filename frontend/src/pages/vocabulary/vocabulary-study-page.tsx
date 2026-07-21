import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVocabularyStore } from '../../stores/vocabulary-store';
import { useLanguagePreference } from '../../stores/language-preference-store';
import { FlashcardCard } from '../../components/vocabulary/flashcard-card';
import { QuizCard } from '../../components/vocabulary/quiz-card';
import { QuizFillBlank } from '../../components/vocabulary/quiz-fill-blank';
import { QuizPinyinMatch } from '../../components/vocabulary/quiz-pinyin-match';

export function VocabularyStudyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showStart, setShowStart] = useState(true);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizResults, setQuizResults] = useState<Array<{ isCorrect: boolean }>>([]);

  const {
    vocabularies,
    currentLevel,
    studyMode,
    isLoading,
    error,
    loadByHSKLevel,
    setStudyMode,
    startQuiz,
    clearError,
  } = useVocabularyStore();

  const { preference, togglePreference } = useLanguagePreference();

  const hskLevels = [
    { level: 1, name: 'HSK 1', words: 150, description: 'Cơ bản - 150 từ vựng' },
  ];

  const studyModes = [
    { id: 'flashcard', name: 'Flashcards', emoji: '📇', description: 'Ôn tập với thẻ từ', color: 'bg-blue-500' },
    { id: 'quiz', name: 'Quiz Meaning', emoji: '🎯', description: 'Chọn nghĩa đúng', color: 'bg-green-500' },
    { id: 'fill-blank', name: 'Fill Blank', emoji: '✏️', description: 'Điền vào chỗ trống', color: 'bg-purple-500' },
    { id: 'pinyin-match', name: 'Pinyin Match', emoji: '🔊', description: 'Chọn Pinyin đúng', color: 'bg-orange-500' },
  ] as const;

  const handleStartStudying = async (mode: 'flashcard' | 'quiz' | 'fill-blank' | 'pinyin-match', level?: number) => {
    const levelToUse = level ?? selectedLevel ?? currentLevel ?? 1;

    setSelectedLevel(levelToUse);
    setShowStart(false);
    setCurrentQuizIndex(0);
    setQuizResults([]);
    setStudyMode(mode);

    setSearchParams({ level: levelToUse.toString(), mode });

    if (mode === 'flashcard') {
      await loadByHSKLevel(levelToUse);
    } else {
      await startQuiz(levelToUse, preference);
    }
  };

  const handleQuizAnswer = (isCorrect: boolean) => {
    setQuizResults([...quizResults, { isCorrect }]);
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < vocabularies.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    }
  };

  const getLanguageLabel = () => {
    switch (preference) {
      case 'vietnamese': return '🇻🇳 Tiếng Việt';
      case 'english': return '🇬🇧 English';
      case 'both': return '🌐 Cả hai';
      default: return '🇻🇳 Tiếng Việt';
    }
  };

  const currentVocabulary = vocabularies[currentQuizIndex];

  // Restore state from URL params
  useEffect(() => {
    const levelParam = searchParams.get('level');
    const modeParam = searchParams.get('mode');

    if (levelParam && modeParam) {
      const level = parseInt(levelParam, 10);
      const mode = modeParam as 'flashcard' | 'quiz' | 'fill-blank' | 'pinyin-match';

      setSelectedLevel(level);
      setShowStart(false);
      setStudyMode(mode);

      if (mode === 'flashcard') {
        loadByHSKLevel(level);
      } else {
        startQuiz(level, preference);
      }
    }
  }, [searchParams, setStudyMode, loadByHSKLevel, startQuiz, preference]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Level selection screen
  if (showStart) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              HSK Vocabulary Study
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Learn Chinese vocabulary with multiple study modes
            </p>
          </div>

          <button
            onClick={togglePreference}
            className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center gap-2"
            title="Change language preference"
          >
            <span className="text-lg">{getLanguageLabel()}</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {hskLevels.map((hsk) => (
            <div
              key={hsk.level}
              onClick={() => setSelectedLevel(hsk.level)}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl ${
                selectedLevel === hsk.level ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hsk.name}
                </h2>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                  {hsk.words} words
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hsk.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {studyModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartStudying(mode.id, hsk.level);
                    }}
                    disabled={isLoading}
                    className={`px-4 py-3 ${mode.color} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1`}
                  >
                    <span className="text-2xl">{mode.emoji}</span>
                    <span className="text-sm font-semibold">{mode.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Study mode screen
  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading vocabulary...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {studyMode === 'flashcard' && <FlashcardCard />}
          {studyMode === 'quiz' && <QuizCard />}
          {studyMode === 'fill-blank' && currentVocabulary && (
            <QuizFillBlank
              vocabulary={currentVocabulary}
              onAnswer={handleQuizAnswer}
              onNext={handleNextQuizQuestion}
            />
          )}
          {studyMode === 'pinyin-match' && currentVocabulary && (
            <QuizPinyinMatch
              vocabulary={currentVocabulary}
              onAnswer={handleQuizAnswer}
              onNext={handleNextQuizQuestion}
            />
          )}
        </>
      )}
    </div>
  );
}
