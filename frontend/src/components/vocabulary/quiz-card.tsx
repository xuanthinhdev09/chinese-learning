import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVocabularyStore } from '../../stores/vocabulary-store';
import { getDisplayMeaning, useContentPreference } from '../../stores/language-preference-store';
import { translateApiError } from '../../utils/translate-api-error';

export function QuizCard() {
  const { t } = useTranslation();
  const preference = useContentPreference();
  const {
    vocabularies,
    currentIndex,
    quiz,
    correctCount,
    quizCompleted,
    progressError,
    selectQuizOption,
    submitQuizAnswer,
    nextQuizQuestion,
    resetQuiz,
  } = useVocabularyStore();

  const current = vocabularies[currentIndex];
  const progress = vocabularies.length > 0 ? `${currentIndex + 1}/${vocabularies.length}` : '0/0';
  const score = vocabularies.length > 0 ? Math.round((correctCount / vocabularies.length) * 100) : 0;

  // Nộp bài xong tự chuyển câu tiếp sau ~1s — đủ đọc feedback, không cần click thêm.
  // Đặt trước mọi early-return (Rules of Hooks); timer bị clear khi showResult đổi nên không advance 2 lần
  useEffect(() => {
    if (!quiz.showResult) return;
    const timer = setTimeout(() => nextQuizQuestion(), 1000);
    return () => clearTimeout(timer);
  }, [quiz.showResult, nextQuizQuestion]);

  // Nghĩa theo ngôn ngữ nội dung — là đề bài của quiz chọn chữ Hán
  const meaning = current
    ? getDisplayMeaning(current.vietnamese || '', current.english || '', preference)
    : '';

  // Quiz completed screen
  if (quizCompleted) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('vocabulary.quiz.completed')}
          </h2>

          <div className="mb-6">
            <p className="text-5xl font-bold text-blue-500 dark:text-blue-400 mb-2">
              {score}%
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {t('vocabulary.quiz.scoreLine', { correct: correctCount, total: vocabularies.length })}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={resetQuiz}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t('vocabulary.quiz.retry')}
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t('vocabulary.quiz.back')}
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
          <p className="text-gray-500 dark:text-gray-400">{t('vocabulary.quiz.notLoaded')}</p>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('vocabulary.flashcard.progress')}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{progress}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('vocabulary.quiz.scoreLabel')}</p>
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
        {/* Question — đề là nghĩa; chữ Hán/phồn thể/pinyin chỉ hiện sau khi chốt đáp án */}
        <div className="text-center mb-8">
          {current.hskCode && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">{current.hskCode}</span>
          )}

          <p className="text-gray-600 dark:text-gray-400 mb-3">{t('vocabulary.quiz.question')}</p>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 break-words">
            {meaning}
          </h2>

          {current.pos && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded">
              {current.pos}
            </span>
          )}

          <div className={`mt-4 min-h-[2rem] ${quiz.showResult ? '' : 'invisible'}`}>
            <span className="text-2xl chinese-text text-gray-900 dark:text-white">{current.hanzi}</span>
            {current.traditional && current.traditional !== current.hanzi && (
              <span className="ml-2 text-lg chinese-text text-gray-500 dark:text-gray-400">({current.traditional})</span>
            )}
            <span className="ml-3 text-xl text-blue-600 dark:text-blue-400">{current.pinyin}</span>
          </div>
        </div>

        {/* Options — 4 chữ Hán */}
        <div className="grid grid-cols-2 gap-3">
          {quiz.options.map((option, index) => {
            const isSelected = quiz.selectedOption === option.id;
            const showCorrect = quiz.showResult && option.isCorrect;
            const showWrong = quiz.showResult && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => !quiz.showResult && selectQuizOption(option.id)}
                disabled={quiz.showResult}
                className={`relative w-full p-4 rounded-lg border-2 transition-all ${
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
                <span className="absolute top-1 left-2 text-xs text-gray-400">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="block text-3xl chinese-text text-gray-900 dark:text-white break-words">
                  {option.hanzi}
                </span>
                {showCorrect && <span className="absolute top-1 right-2 text-green-500">✓</span>}
                {showWrong && <span className="absolute top-1 right-2 text-red-500">✗</span>}
              </button>
            );
          })}
        </div>

        {/* Submit — nộp xong tự chuyển câu tiếp sau ~1s, không cần nút Next */}
        {!quiz.showResult && (
          <button
            onClick={submitQuizAnswer}
            disabled={!quiz.selectedOption}
            className="w-full mt-6 px-4 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {t('vocabulary.common.submit')}
          </button>
        )}

        {/* Result feedback */}
        {quiz.showResult && (
          <div className="mt-4 text-center">
            {quiz.isCorrect ? (
              <p className="text-green-600 dark:text-green-400 font-semibold">
                {t('vocabulary.quiz.correct', { hanzi: current.hanzi, meaning })}
              </p>
            ) : (
              <p className="text-red-600 dark:text-red-400 font-semibold">
                {t('vocabulary.quiz.wrong', { hanzi: current.hanzi })}
              </p>
            )}
          </div>
        )}

        {/* Progress save error (SM-2) — không chặn làm bài */}
        {progressError && (
          <p className="mt-2 text-sm text-red-500 text-center">{translateApiError(progressError, t)}</p>
        )}
      </div>
    </div>
  );
}
