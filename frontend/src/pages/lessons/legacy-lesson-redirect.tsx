import { Navigate, useParams } from 'react-router-dom';
import { useResolveLessonId } from '../../hooks/use-resolve-lesson-id';

/**
 * Route cũ /lessons/:order (và /lessons/:order/exercises) → redirect về wizard
 * /learn/:id. Param có thể là order (số, resolve qua danh sách lesson) hoặc CUID.
 */
export default function LegacyLessonRedirect() {
  const { lessonId: param } = useParams<{ lessonId: string }>();
  const { lessonId, isResolving } = useResolveLessonId(param);

  if (isResolving || !lessonId) return null;

  return <Navigate to={`/learn/${lessonId}`} replace />;
}
