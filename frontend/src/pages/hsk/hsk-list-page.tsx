import { useQuery } from '@tanstack/react-query';
import { hskApi } from '../../api/hsk-api';
import HskCard from '../../components/hsk/hsk-card';
import { Link } from 'react-router-dom';

export default function HskListPage() {
  const { data: hskLevels, isLoading, error } = useQuery({
    queryKey: ['hsk-levels'],
    queryFn: () => hskApi.getLevels(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer">
                  <span className="text-white font-bold text-lg chinese-text">中</span>
                </div>
              </Link>
              <span className="ml-2 font-semibold text-gray-900">HSK Levels</span>
            </div>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Quay lại Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  );
}
