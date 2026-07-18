import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hskApi } from '../../api/hsk-api';
import LessonCard from '../../components/lessons/lesson-card';

export default function HskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: hskLevel, isLoading, error } = useQuery({
    queryKey: ['hsk-level', id],
    queryFn: () => hskApi.getLevel(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !hskLevel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-700">Không thể tải thông tin HSK level</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                ← Quay lại
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 chinese-text">{hskLevel.name}</h1>
          {hskLevel.description && (
            <p className="mt-2 text-gray-600">{hskLevel.description}</p>
          )}
        </div>

        {/* Lessons */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Bài học ({hskLevel.lessons.length})
          </h2>
        </div>

        {hskLevel.lessons.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <p className="text-blue-700">Chưa có bài học cho trình độ này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hskLevel.lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}