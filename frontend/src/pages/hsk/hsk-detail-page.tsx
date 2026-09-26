import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { hskApi } from '../../api/hsk-api';
import { useResolveHskLevelId } from '../../hooks/use-resolve-hsk-level-id';
import { getCurrentLesson, CurrentLesson } from '../../api/daily-session';
import { useAuthStore } from '../../stores/auth-store';
import LessonCard from '../../components/lessons/lesson-card';

export default function HskDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  // Route param có thể là level number (pretty URL /hsk/2) hoặc id CUID cũ
  const { levelId, isResolving } = useResolveHskLevelId(id);

  // Admin (theo ADMIN_EMAILS) mở mọi bài — bỏ lock tuần tự
  const isAdmin = useAuthStore((s) => s.user?.isAdmin);

  // Bài đang học = ranh giới mở khóa tuần tự (cùng nguồn với modal học từ vựng)
  const [currentLesson, setCurrentLesson] = useState<CurrentLesson | null>(null);
  useEffect(() => {
    let cancelled = false;
    getCurrentLesson()
      .then((current) => {
        if (!cancelled) setCurrentLesson(current);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { data: hskLevel, isLoading, error } = useQuery({
    queryKey: ['hsk-level', levelId],
    queryFn: () => hskApi.getLevel(levelId!),
    enabled: !!levelId,
  });

  if (isResolving || isLoading) {
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
          <p className="text-red-700">{t('hsk.levelLoadError')}</p>
        </div>
      </div>
    );
  }

  // Bài bị khóa = nằm SAU bài đang học trong cùng course (giống modal học từ vựng)
  const isLessonLocked = (order: number) =>
    !isAdmin &&
    currentLesson?.courseId === hskLevel.id &&
    currentLesson.order !== null &&
    order > currentLesson.order;

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
            {t('hsk.lessons', { count: hskLevel.lessons.length })}
          </h2>
        </div>

        {hskLevel.lessons.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <p className="text-blue-700">{t('hsk.noLessons')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hskLevel.lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                locked={isLessonLocked(lesson.order)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
