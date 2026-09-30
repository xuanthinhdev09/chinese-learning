import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lessonsApi } from '../api/lessons-api';
import { vocabularyApi } from '../api/vocabulary-api';
import type { PracticeItem } from '../components/today/practice-runner';
import { lacksHanziDistractors } from '../utils/build-hanzi-choice-quiz-options';

interface UseHanziQuizDistractorPoolOptions {
  /** Các từ đang quiz */
  items: PracticeItem[];
  /** Nguồn đáp án nhiễu thêm (vd toàn bộ từ của bài khi quiz chỉ có từ khóa) */
  extraPool?: PracticeItem[];
  /** Bài đang học — dùng để tìm level khi pool của bài vẫn thiếu */
  lessonId?: string;
  enabled: boolean;
  getMeaning: (item: PracticeItem) => string;
}

/** Gộp 2 danh sách, bỏ trùng theo id (giữ phần tử đầu tiên) */
function mergeById(...lists: PracticeItem[][]): PracticeItem[] {
  const seen = new Set<string>();
  return lists.flat().filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Pool ứng viên cho quiz chọn chữ Hán. Mặc định = items + extraPool; nếu còn từ
 * không đủ 3 đáp án nhiễu khác nghĩa thì tải thêm từ vựng của level (server chỉ
 * trả từ của các bài đã mở khóa). Tải lỗi → dùng pool gốc, ít đáp án hơn.
 */
export function useHanziQuizDistractorPool({
  items,
  extraPool,
  lessonId,
  enabled,
  getMeaning,
}: UseHanziQuizDistractorPoolOptions): { pool: PracticeItem[]; isLoading: boolean } {
  const basePool = useMemo(() => mergeById(items, extraPool ?? []), [items, extraPool]);

  const needsLevelPool = useMemo(
    () => enabled && Boolean(lessonId) && items.some((item) => lacksHanziDistractors(item, basePool, getMeaning)),
    [enabled, lessonId, items, basePool, getMeaning]
  );

  const levelQuery = useQuery({
    queryKey: ['vocabulary', 'hsk-level-by-lesson', lessonId],
    queryFn: async (): Promise<PracticeItem[]> => {
      const lesson = await lessonsApi.getLesson(lessonId!);
      const vocabularies = await vocabularyApi.getByHSKLevel(lesson.hskLevel.level);
      return vocabularies
        .filter((v) => v.hanzi && v.meaning)
        .map((v) => ({ id: v.id, hanzi: v.hanzi, pinyin: v.pinyin, meaning: v.meaning, english: v.english }));
    },
    enabled: needsLevelPool,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const pool = useMemo(
    () => (levelQuery.data ? mergeById(basePool, levelQuery.data) : basePool),
    [basePool, levelQuery.data]
  );

  return { pool, isLoading: needsLevelPool && levelQuery.isLoading };
}
