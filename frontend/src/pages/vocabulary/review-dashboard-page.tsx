import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '../../components/vocabulary/stats-card';
import { useVocabularyStore } from '../../stores/vocabulary-store';

export function ReviewDashboardPage() {
  const navigate = useNavigate();
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
      setError(err instanceof Error ? err.message : 'Failed to load stats');
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
      setError(err instanceof Error ? err.message : 'Failed to load review cards');
    }
  };

  const handleStartNew = async () => {
    try {
      // Navigate to study page to select level
      navigate('/vocabulary/study');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Navigation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bảng điều khiển học tập
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Theo dõi tiến độ và ôn tập từ vựng
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
              Thử lại
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
                  Học từ mới
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bắt đầu học từ vựng HSK
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
                  Xem bài học
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duyệt danh sách bài HSK
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
                  Làm trắc nghiệm
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kiểm tra kiến thức
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
                  Làm mới dữ liệu
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cập nhật thống kê
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Learning Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            💡 Mẹo học tập hiệu quả
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Ôn tập ngay khi từ hết hạn (spaced repetition)</li>
            <li>• Học mỗi ngày để duy trì streak 🔥</li>
            <li>• Sử dụng cả Flashcard và Quiz để đa dạng hóa</li>
            <li>• Tập trung vào từ "Hard" và "Again"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
