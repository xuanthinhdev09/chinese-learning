import { useVocabularyStore } from '../../stores/vocabulary-store';

export function QuizCard() {
  const {
    vocabularies,
    currentIndex,
    quiz,
    correctCount,
    quizCompleted,
    selectQuizOption,
    submitQuizAnswer,
    nextQuizQuestion,
    resetQuiz,
  } = useVocabularyStore();

  const current = vocabularies[currentIndex];
  const progress = vocabularies.length > 0 ? `${currentIndex + 1}/${vocabularies.length}` : '0/0';
  const score = vocabularies.length > 0 ? Math.round((correctCount / vocabularies.length) * 100) : 0;

  // Quiz completed screen
  if (quizCompleted) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quiz Completed! 🎉
          </h2>

          <div className="mb-6">
            <p className="text-5xl font-bold text-blue-500 dark:text-blue-400 mb-2">
              {score}%
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {correctCount} / {vocabularies.length} correct
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={resetQuiz}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Back to Levels
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500">No quiz loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Quiz Progress</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{progress}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-lg font-semibold text-blue-500">{score}%</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / vocabularies.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Quiz Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Question */}
        <div className="text-center mb-8">
          {current.hskCode && (
            <span className="text-xs text-gray-500 mb-2 block">{current.hskCode}</span>
          )}

          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {current.hanzi}
          </h2>

          {current.traditional && current.traditional !== current.hanzi && (
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">
              {current.traditional}
            </p>
          )}

          <p className="text-2xl text-blue-600 dark:text-blue-400 mb-2">{current.pinyin}</p>

          {current.pos && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded">
              {current.pos}
            </span>
          )}

          <p className="text-gray-600 dark:text-gray-400 mt-6">What does this mean?</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {quiz.options.map((option, index) => {
            const isSelected = quiz.selectedOption === option.id;
            const showCorrect = quiz.showResult && option.isCorrect;
            const showWrong = quiz.showResult && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => !quiz.showResult && selectQuizOption(option.id)}
                disabled={quiz.showResult}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${
                  showCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : ''
                } ${
                  showWrong
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : ''
                } ${
                  quiz.showResult ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 mr-3">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-grow">{option.text}</span>

                  {showCorrect && (
                    <span className="text-green-500">✓</span>
                  )}
                  {showWrong && (
                    <span className="text-red-500">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit / Next button */}
        {!quiz.showResult ? (
          <button
            onClick={submitQuizAnswer}
            disabled={!quiz.selectedOption}
            className="w-full mt-6 px-4 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={nextQuizQuestion}
            className="w-full mt-6 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {currentIndex >= vocabularies.length - 1 ? 'See Results' : 'Next Question'}
          </button>
        )}

        {/* Result feedback */}
        {quiz.showResult && (
          <div className="mt-4 text-center">
            {quiz.isCorrect ? (
              <p className="text-green-600 dark:text-green-400 font-semibold">
                ✓ Correct! {current.hanzi} means "{current.meaning}"
              </p>
            ) : (
              <p className="text-red-600 dark:text-red-400 font-semibold">
                ✗ The correct answer is "{current.meaning}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
