import { useQuery } from '@tanstack/react-query';
import { hskApi } from '../../api/hsk-api';
import HskCard from '../../components/hsk/hsk-card';

export default function HskListPage() {
  const { data: hskLevels, isLoading, error } = useQuery({
    queryKey: ['hsk-levels'],
    queryFn: () => hskApi.getLevels(),
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">HSK Levels</h1>
        <p className="mt-2 text-gray-600">Chọn trình độ để bắt đầu học</p>
      </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-700">Không thể tải dữ liệu HSK</p>
          </div>
        )}

        {hskLevels && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hskLevels.map((hsk) => (
              <HskCard key={hsk.id} hsk={hsk} />
            ))}
          </div>
        )}
    </>
  );
}
