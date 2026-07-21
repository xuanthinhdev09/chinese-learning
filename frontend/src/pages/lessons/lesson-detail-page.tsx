import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lessonsApi } from '../../api/lessons-api';
import { vocabularyApi } from '../../api/vocabulary-api';
import VocabularyList from '../../components/vocabulary/vocabulary-list';

export default function LessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>();

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonsApi.getLesson(lessonId!),
    enabled: !!lessonId,
  });

  const { data: vocabularies, isLoading: vocabLoading } = useQuery({
    queryKey: ['vocabulary', lessonId],
    queryFn: () => vocabularyApi.getByLesson(lessonId!),
    enabled: !!lessonId,
  });

  if (lessonLoading || vocabLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-700">Không thể tải thông tin bài học</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">{lesson.order}</span>
            </div>
            <span className="text-sm text-gray-500">Bài học</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 chinese-text">{lesson.title}</h1>
          {lesson.description && (
            <p className="mt-2 text-gray-600">{lesson.description}</p>
          )}
          <div className="mt-4 text-sm text-gray-500">
            {vocabularies?.length || 0} từ vựng
          </div>
        </div>

        {/* Vocabulary List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Từ vựng</h2>
          <VocabularyList vocabularies={vocabularies || []} loading={vocabLoading} />
        </div>
      </div>
    </>
  );
}
