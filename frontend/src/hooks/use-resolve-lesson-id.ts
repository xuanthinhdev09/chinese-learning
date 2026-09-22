import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lessonsApi } from '../api/lessons-api';

/**
 * Route param ":lessonId" accepts either the raw lesson id (CUID) or the
 * lesson order for pretty URLs like /lessons/2/exercises. Numeric params
 * resolve through the lessons list; anything else passes through untouched
 * so existing CUID links keep working.
 */
export function useResolveLessonId(param: string | undefined): {
  lessonId: string | undefined;
  isResolving: boolean;
} {
  const isOrder = !!param && /^\d+$/.test(param);

  const { data, isLoading } = useQuery({
    queryKey: ['lessons', 'all'],
    queryFn: () => lessonsApi.getLessons({ limit: 100 }),
    enabled: isOrder,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    if (!param) return { lessonId: undefined, isResolving: false };
    if (!isOrder) return { lessonId: param, isResolving: false };
    const order = Number(param);
    const lesson = data?.data.find((l) => l.order === order);
    return { lessonId: lesson?.id, isResolving: isLoading };
  }, [param, isOrder, data, isLoading]);
}
