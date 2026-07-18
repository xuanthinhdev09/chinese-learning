import { useState, useEffect } from 'react';
import { useVocabularyStore } from '../../stores/vocabulary-store';
import { FlashcardCard } from '../../components/vocabulary/flashcard-card';
import { QuizCard } from '../../components/vocabulary/quiz-card';

export function VocabularyStudyPage() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showStart, setShowStart] = useState(true);

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

  const hskLevels = [
    { level: 1, name: 'HSK 1', words: 500, description: 'Cơ bản - 500 từ vựng' },
    { level: 2, name: 'HSK 2', words: 772, description: 'Sơ cấp - 772 từ vựng' },
  ];

  const handleStartStudying = async (mode: 'flashcard' | 'quiz') => {
    if (!selectedLevel) return;

    setShowStart(false);
    setStudyMode(mode);

    if (mode === 'flashcard') {
      await loadByHSKLevel(selectedLevel);
    } else {
      await startQuiz(selectedLevel);
    }
  };

  const handleBackToLevels = () => {
    setShowStart(true);
    setSelectedLevel(null);
  };

  const handleChangeLevel = () => {
    setShowStart(true);
  };

  // Clear error on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Level selection screen
  if (showStart) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            HSK Vocabulary Study
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            Learn Chinese vocabulary with flashcards and quizzes
          </p>

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
                  selectedLevel === hsk.level
                    ? 'ring-2 ring-blue-500'
                    : ''
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

                <div className="space-y-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartStudying('flashcard');
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>📇</span>
                    <span>Study Flashcards</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartStudying('quiz');
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>🎯</span>
                    <span>Take Quiz</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Study mode screen
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToLevels}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← Back to Levels
          </button>

          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">
              {currentLevel && `HSK ${currentLevel}`}
            </span>

            {!vocabularies.length && !isLoading && (
              <button
                onClick={handleChangeLevel}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Change Level
              </button>
            )}
          </div>
        </div>

        {/* Error */}
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

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading vocabulary...</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {studyMode === 'flashcard' ? <FlashcardCard /> : <QuizCard />}
          </>
        )}
      </div>
    </div>
  );
}
