import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hskApi } from '../../api/hsk-api';
import LessonCard from '../../components/lessons/lesson-card';

export default function HskDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: hskLevel, isLoading, error } = useQuery({
    queryKey: ['hsk-level', id],
    queryFn: () => hskApi.getLevel(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !hskLevel) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-700">Không thể tải thông tin HSK level</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
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
      </div>
    </>
  );
}
