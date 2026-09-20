import { useProfileStats } from './hooks/use-profile-hooks';

/**
 * The four learning-stat cards, replacing the old hardcoded zeros.
 * Numbers come from GET /users/me/stats.
 */
export function ProfileStatsGrid() {
  const { data: stats, isLoading, isError } = useProfileStats();

  const cards = [
    {
      label: 'Từ vựng đã học',
      value: stats?.vocabularyLearned,
      color: 'text-blue-600',
    },
    {
      label: 'Bài hoàn thành',
      value: stats?.lessonsCompleted,
      color: 'text-green-600',
    },
    {
      label: 'Chuỗi ngày học',
      value: stats?.streakDays,
      color: 'text-orange-600',
    },
    {
      label: 'Ngày hoạt động',
      value: stats?.activeDays,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center"
        >
          <p className="text-sm text-gray-600 mb-1">{card.label}</p>
          <p className={`text-3xl font-bold ${card.color}`}>
            {isLoading ? '…' : isError ? '—' : card.value ?? 0}
          </p>
        </div>
      ))}
      {isError && (
        <p className="col-span-2 text-sm text-red-600 text-center" role="alert">
          Không tải được thống kê. Thử tải lại trang.
        </p>
      )}
    </div>
  );
}
