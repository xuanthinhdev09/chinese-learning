import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVocabularyStore } from '../../stores/vocabulary-store';
import { useLanguagePreference } from '../../stores/language-preference-store';
import { hskApi, LessonSummary } from '../../api/hsk-api';
import { FlashcardCard } from '../../components/vocabulary/flashcard-card';
import { QuizCard } from '../../components/vocabulary/quiz-card';
import { QuizFillBlank } from '../../components/vocabulary/quiz-fill-blank';
import { QuizPinyinMatch } from '../../components/vocabulary/quiz-pinyin-match';

type StudyModeId = 'flashcard' | 'quiz' | 'fill-blank' | 'pinyin-match';

export function VocabularyStudyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  /** null = cả level; set = ôn riêng một bài */
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showStart, setShowStart] = useState(true);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizResults, setQuizResults] = useState<Array<{ isCorrect: boolean }>>([]);

  const {
    vocabularies,
    studyMode,
    isLoading,
    error,
    loadByHSKLevel,
    setStudyMode,
    startQuiz,
    clearError,
  } = useVocabularyStore();

  const { preference, togglePreference } = useLanguagePreference();

  // Real course list from the API; word counts stay out because the levels
  // endpoint does not aggregate them (lesson count shown instead)
  const [hskLevels, setHskLevels] = useState<
    Array<{ id: string; level: number; name: string; description: string | null; lessonCount: number }>
  >([]);

  // Lessons of the selected level — powers the per-lesson chips
  const [lessons, setLessons] = useState<LessonSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    hskApi
      .getLevels()
      .then((levels) => {
        if (cancelled) return;
        setHskLevels(
          levels.map((hsk) => ({
            id: hsk.id,
            level: hsk.level,
            name: hsk.name,
            description: hsk.description,
            lessonCount: hsk.lessonCount,
          }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedLevel == null) {
      setLessons([]);
      return;
    }
    const hsk = hskLevels.find((l) => l.level === selectedLevel);
    if (!hsk) return;
    let cancelled = false;
    hskApi
      .getLevel(hsk.id)
      .then((detail) => {
        if (!cancelled) setLessons(detail.lessons);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedLevel, hskLevels]);

  /** Level chưa có bài học nào (lessonCount = 0) — chỉ hiển thị, không chọn học được */
  const hasLessonContent = (hsk: { lessonCount: number }) => hsk.lessonCount > 0;

  // Giá trị là key i18n — dịch lúc render để đổi ngôn ngữ giữa chừng vẫn đúng
  const studyModes = [
    { id: 'flashcard', nameKey: 'vocabulary.modes.flashcard', emoji: '📇', descKey: 'vocabulary.modeDesc.flashcard', color: 'bg-blue-500' },
    { id: 'quiz', nameKey: 'vocabulary.modes.quiz', emoji: '🎯', descKey: 'vocabulary.modeDesc.quiz', color: 'bg-green-500' },
    { id: 'fill-blank', nameKey: 'vocabulary.modes.fillBlank', emoji: '✏️', descKey: 'vocabulary.modeDesc.fillBlank', color: 'bg-purple-500' },
    { id: 'pinyin-match', nameKey: 'vocabulary.modes.pinyinMatch', emoji: '🔊', descKey: 'vocabulary.modeDesc.pinyinMatch', color: 'bg-orange-500' },
  ] as const;

  /**
   * Chỉ đặt state + URL; việc load dữ liệu do effect đồng bộ URL đảm nhiệm
   * (một đường load duy nhất, tránh double-fetch).
   */
  const handleStartStudying = (mode: StudyModeId, level: number) => {
    const lessonForLevel = selectedLevel === level ? selectedLessonId : null;

    setSelectedLevel(level);
    setShowStart(false);
    setCurrentQuizIndex(0);
    setQuizResults([]);
    setStudyMode(mode);

    setSearchParams({
      level: level.toString(),
      mode,
      ...(lessonForLevel ? { lesson: lessonForLevel } : {}),
    });
  };

  const handleBackToStart = () => {
    setShowStart(true);
    setSelectedLessonId(null);
    setCurrentQuizIndex(0);
    setQuizResults([]);
    setSearchParams({});
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
      case 'vietnamese': return '🇻🇳 ' + t('vocabulary.contentLang.vietnamese');
      case 'english': return '🇬🇧 ' + t('vocabulary.contentLang.english');
      case 'both': return '🌐 ' + t('vocabulary.contentLang.both');
      default: return '🇻🇳 ' + t('vocabulary.contentLang.vietnamese');
    }
  };

  const currentVocabulary = vocabularies[currentQuizIndex];

  // Restore state from URL params — also the single load path when starting
  useEffect(() => {
    const levelParam = searchParams.get('level');
    const modeParam = searchParams.get('mode');
    const lessonParam = searchParams.get('lesson');

    if (levelParam && modeParam) {
      const level = parseInt(levelParam, 10);
      const mode = modeParam as StudyModeId;

      setSelectedLevel(level);
      setSelectedLessonId(lessonParam);
      setShowStart(false);
      setStudyMode(mode);

      if (mode === 'flashcard') {
        loadByHSKLevel(level, lessonParam);
      } else {
        startQuiz(level, preference, lessonParam);
      }
    }
  }, [searchParams, setStudyMode, loadByHSKLevel, startQuiz, preference]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const selectedHsk = hskLevels.find((l) => l.level === selectedLevel);
  const studiedLesson = lessons.find((l) => l.id === selectedLessonId);

  // Level selection screen
  if (showStart) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('vocabulary.study.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('vocabulary.study.subtitle')}
            </p>
          </div>

          <button
            onClick={togglePreference}
            className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center gap-2"
            title={t('vocabulary.contentLang.title')}
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
              onClick={() => {
                if (!hasLessonContent(hsk)) return;
                setSelectedLevel(hsk.level);
                setSelectedLessonId(null);
              }}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all ${
                hasLessonContent(hsk)
                  ? `cursor-pointer hover:shadow-xl ${
                      selectedLevel === hsk.level ? 'ring-2 ring-blue-500' : ''
                    }`
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hsk.name}
                </h2>
                {hasLessonContent(hsk) ? (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                    {t('hsk.lessonCount', { count: hsk.lessonCount })}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-sm">
                    {t('hsk.noContent')}
                  </span>
                )}
              </div>

              {hsk.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {hsk.description}
                </p>
              )}

              {hasLessonContent(hsk) && selectedLevel === hsk.level && (
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {t('vocabulary.study.scopeLabel')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLessonId(null);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedLessonId === null
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {t('vocabulary.study.allWords')}
                    </button>
                    {lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLessonId(lesson.id);
                        }}
                        title={lesson.title}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          selectedLessonId === lesson.id
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {t('vocabulary.study.lessonChip', { order: lesson.order, count: lesson.vocabularyCount })}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {selectedLessonId
                      ? (studiedLesson
                          ? t('vocabulary.study.scopeSelected', { order: studiedLesson.order })
                          : t('vocabulary.study.scopeSelectedUnknown'))
                      : t('vocabulary.study.scopeAllSelected')}
                  </p>
                </div>
              )}

              {hasLessonContent(hsk) ? (
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
                      <span className="text-sm font-semibold">{t(mode.nameKey)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('vocabulary.study.noLessonsData')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Study mode screen
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedHsk?.name}</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {selectedLessonId
              ? (studiedLesson?.title ?? t('vocabulary.study.lessonFallback'))
              : t('vocabulary.study.allVocabTitle', { count: vocabularies.length })}
          </h1>
        </div>
        <button
          onClick={handleBackToStart}
          className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-sm"
        >
          {t('vocabulary.study.changeLesson')}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-sm underline"
          >
            {t('vocabulary.study.dismiss')}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('vocabulary.study.loading')}</p>
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
