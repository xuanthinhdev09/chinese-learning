import { ProgressStatsResponse } from '../../api/vocabulary-api';

interface StatsCardProps {
  stats: ProgressStatsResponse | null;
  isLoading?: boolean;
  onStartReview?: () => void;
}

export function StatsCard({ stats, isLoading, onStartReview }: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-gray-500 dark:text-gray-400">Unable to load statistics</p>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Tổng số từ',
      value: stats.total,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-700/50',
    },
    {
      label: 'Mới',
      value: stats.new,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Đang học',
      value: stats.learning,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Đã thành thạo',
      value: stats.mastered,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header with streak */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Tiến độ học tập
        </h2>
        {stats.streak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <span>🔥</span>
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              {stats.streak} ngày
            </span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`${item.bgColor} rounded-lg p-4 text-center`}
          >
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {item.value}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Due Today section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hôm nay cần ôn</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.dueToday} từ
            </p>
          </div>
          {stats.dueToday > 0 && (
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">📝</span>
            </div>
          )}
        </div>

        {stats.dueToday > 0 && onStartReview && (
          <button
            onClick={onStartReview}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Bắt đầu ôn tập
          </button>
        )}

        {stats.dueToday === 0 && (
          <div className="text-center py-3 px-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-green-600 dark:text-green-400 font-semibold">
              🎉 Không có từ cần ôn hôm nay!
            </p>
            <p className="text-sm text-green-500 dark:text-green-500 mt-1">
              Học từ mới để tiếp tục
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
