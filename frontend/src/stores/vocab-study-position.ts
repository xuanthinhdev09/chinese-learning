/**
 * Giữ vị trí đang học (quiz/flashcard) qua sessionStorage để khôi phục khi reload
 * trang. Chỉ khôi phục khi đúng là reload (Navigation Timing `type === 'reload'`);
 * điều hướng SPA từ trang khác (home → study) không tạo navigation entry mới nên
 * `isPageReload()` trả false → reset về đầu như thường.
 *
 * Dùng sessionStorage (sống theo tab) chứ không phải localStorage: mở tab mới
 * luôn bắt đầu từ đầu, tránh khôi phục nhầm vị trí cũ của phiên trước.
 */

const STORAGE_KEY = 'vocab-study-position';

export type VocabStudyMode = 'flashcard' | 'quiz';

export interface VocabStudyPosition {
  level: number | null;
  lessonId: string | null;
  mode: VocabStudyMode;
  index: number;
  correctCount: number;
}

/** True chỉ khi trang được load lại (F5 / Ctrl+R / nút reload), không phải điều hướng client-side. */
export function isPageReload(): boolean {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    return nav?.type === 'reload';
  } catch {
    return false;
  }
}

export function readVocabStudyPosition(): VocabStudyPosition | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VocabStudyPosition;
    if (typeof parsed?.index !== 'number' || typeof parsed?.correctCount !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveVocabStudyPosition(position: VocabStudyPosition): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // sessionStorage bị chặn (private mode) — bỏ qua, không cản việc học
  }
}
