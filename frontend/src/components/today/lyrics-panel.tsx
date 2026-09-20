import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogueLine } from '../../api/daily-session';
import { cn } from '../../utils/cn';

interface LyricsPanelProps {
  lines: DialogueLine[];
  index: number;
  /** Tap một dòng — component cha quyết định nhảy/ phát audio. */
  onSelectLine: (index: number) => void;
  /** Pinyin hiện trên MỌI dòng (tắt = chỉ hanzi) — tránh chèn/xóa nội dung gây giật khi chuyển câu. */
  showPinyin: boolean;
  /** Nghĩa Việt hiện trên MỌI dòng — cùng lý do. */
  showVietnamese: boolean;
  /** Ghi đè chiều cao container (mặc định 55vh/60vh) — mobile frame truyền "h-full sm:h-full" để panel co giãn theo flex. */
  className?: string;
}

/**
 * Panel lời hội thoại kiểu trình phát nhạc: mọi câu trong MỘT vùng cuộn,
 * câu active phóng to + đổi màu. Pinyin/nghĩa hiển thị ĐỒNG NHẤT theo toggle
 * trên mọi dòng — nếu chỉ hiện ở dòng active, việc chèn/xóa đột ngột gây
 * giật panel khi chuyển câu. Padding các dòng đồng nhất, khác biệt giữa
 * active/inactive chỉ còn cỡ chữ + màu + nền (đều transition được).
 */
export function LyricsPanel({ lines, index, onSelectLine, showPinyin, showVietnamese, className }: LyricsPanelProps) {
  const { t } = useTranslation();
  // Re-attach on index change so the NEW active line scrolls into view
  // (ref callback identity must change, same trick as the old sidebar list).
  const activeLineRef = useCallback(
    (element: HTMLButtonElement | null) => {
      if (!element) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({
        block: 'center',
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    },
    // re-attach on index change so the new active item scrolls into view
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index],
  );

  const renderLine = (line: DialogueLine, lineIndex: number) => {
    const isActive = lineIndex === index;
    const isPast = lineIndex < index;
    // Header nhóm 课文: in khi dialogueOrder đổi so với dòng trước (dữ liệu
    // legacy không có nhóm → không header). Nội dung gắn với vị trí dòng,
    // không đổi theo active → height panel ổn định khi chuyển câu.
    const showGroupHeader =
      line.dialogueOrder !== null &&
      (lineIndex === 0 || lines[lineIndex - 1].dialogueOrder !== line.dialogueOrder);
    return (
      <div key={line.id}>
        {showGroupHeader && (
          <p className="mb-2 mt-4 flex items-baseline justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted first:mt-0">
            <span className="chinese-text normal-case">
              {t('today.lyrics.groupHeader', { order: line.dialogueOrder, title: line.dialogueTitleHanzi })}
            </span>
            {line.dialogueTitleVi && <span className="font-normal normal-case">({line.dialogueTitleVi})</span>}
          </p>
        )}
        <button
          type="button"
          ref={isActive ? activeLineRef : undefined}
          aria-current={isActive ? 'true' : undefined}
          onClick={() => onSelectLine(lineIndex)}
          className={cn(
            // border giữ transparent để height không nhảy khi active đổi trạng thái
            'w-full rounded-xl border border-transparent px-4 py-4 text-center transition-all duration-300',
            isActive ? 'bg-primary-light/40' : 'cursor-pointer hover:bg-background-alt',
          )}
        >
          {isActive && line.speaker && (
            <span className="mb-2 block text-xs uppercase tracking-wide text-muted">{line.speaker}</span>
          )}
        <span
          className={cn(
            'chinese-text block break-words font-bold leading-snug transition-colors',
            isActive ? 'text-2xl text-primary sm:text-3xl' : 'text-base',
            !isActive && (isPast ? 'text-primary/60' : 'text-muted/50'),
          )}
        >
          {line.hanzi}
        </span>
        {showPinyin && (
          <span
            className={cn(
              'block break-words font-light text-muted',
              isActive ? 'mt-2 text-base sm:text-lg' : 'mt-1 text-xs opacity-80',
            )}
          >
            {line.pinyin}
          </span>
        )}
        {showVietnamese && (
          <span
            className={cn(
              'block break-words',
              isActive ? 'mt-2 text-sm text-foreground sm:text-base' : 'mt-1 text-xs text-muted/70',
            )}
          >
            {line.vietnamese}
          </span>
        )}
        </button>
      </div>
    );
  };

  return (
    // Padding dọc trong scroll content để dòng đầu/cuối cũng căn giữa được;
    // fade mask trên/dưới tạo cảm giác "lời bài hát" trôi qua.
    // className (nếu có) ghi đè chiều cao qua twMerge.
    <div
      className={cn(
        'h-[55vh] overflow-y-auto sm:h-[60vh] [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]',
        className,
      )}
    >
      <div className="space-y-1 py-[20vh]">{lines.map(renderLine)}</div>
    </div>
  );
}
