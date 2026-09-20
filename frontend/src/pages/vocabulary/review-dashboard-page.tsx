import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatsCard } from '../../components/vocabulary/stats-card';
import { useVocabularyStore } from '../../stores/vocabulary-store';
import { translateApiError } from '../../utils/translate-api-error';

export function ReviewDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getProgressStats, loadDueVocabularies, setStudyMode } =
    useVocabularyStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getProgressStats();
      setStats(result);
    } catch (err) {
      setError(translateApiError(err, t));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = async () => {
    try {
      // Switch to flashcard mode
      setStudyMode('flashcard');
      // Load due vocabularies
      await loadDueVocabularies(20);
      // Navigate to study page
      navigate('/vocabulary/study');
    } catch (err) {
      setError(translateApiError(err, t));
    }
  };

  const handleStartNew = async () => {
    try {
      // Navigate to study page to select level
      navigate('/vocabulary/study');
    } catch (err) {
      setError(translateApiError(err, t));
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('vocabulary.dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('vocabulary.dashboard.subtitle')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadStats}
              className="mt-2 text-sm underline text-red-600 dark:text-red-400"
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Stats Card */}
        <div className="mb-6">
          <StatsCard
            stats={stats}
            isLoading={isLoading}
            onStartReview={stats?.dueToday > 0 ? handleStartReview : undefined}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={handleStartNew}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {t('vocabulary.dashboard.newWords')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('vocabulary.dashboard.newWordsDesc')}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/hsk')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">📖</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {t('vocabulary.dashboard.viewLessons')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('vocabulary.dashboard.viewLessonsDesc')}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/vocabulary/study')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {t('vocabulary.dashboard.quiz')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('vocabulary.dashboard.quizDesc')}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={loadStats}
            disabled={isLoading}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition-shadow disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {t('vocabulary.dashboard.refresh')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('vocabulary.dashboard.refreshDesc')}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Learning Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {t('vocabulary.dashboard.tipsTitle')}
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• {t('vocabulary.dashboard.tip1')}</li>
            <li>• {t('vocabulary.dashboard.tip2')}</li>
            <li>• {t('vocabulary.dashboard.tip3')}</li>
            <li>• {t('vocabulary.dashboard.tip4')}</li>
          </ul>
        </div>
      </div>
    </>
  );
}
