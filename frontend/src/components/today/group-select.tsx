import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogueLine } from '../../api/daily-session';
import { cn } from '../../utils/cn';

interface GroupSelectProps {
  groups: DialogueLine[][];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Dropdown chọn đoạn (danh sách phát) cho bar dưới cùng trên mobile.
 * Native <select> không style được phần danh sách khi mở nên dùng button +
 * popover (pattern của SpeedControl) — mở LÊN TRÊN vì bar nằm sát đáy màn
 * hình; backdrop vô hình đóng dropdown khi tap ngoài.
 */
export function GroupSelect({ groups, activeIndex, onSelect }: GroupSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {open && (
        // Backdrop vô hình: tap ra ngoài đóng dropdown
        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {/* Nút đóng — gọn để nằm ngang hàng các nút điều khiển; danh sách mở mới hiện đủ tên */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white dark:bg-gray-800 text-sm text-foreground transition-colors"
      >
        <span className="whitespace-nowrap">
          {t('today.group.progress', { current: activeIndex + 1, total: groups.length })}
        </span>
        <span className={cn('text-muted transition-transform', open && 'rotate-180')}>▾</span>
      </button>

      {/* Danh sách mở lên trên — đủ rộng cho tên đoạn */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-30 w-64 max-h-60 overflow-y-auto rounded-lg border border-border bg-white dark:bg-gray-800 shadow-lg animate-fade-in">
          {groups.map((group, groupIdx) => {
            const first = group[0];
            const isActive = groupIdx === activeIndex;
            return (
              <button
                key={groupIdx}
                type="button"
                onClick={() => {
                  onSelect(groupIdx);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                  'first:rounded-t-lg last:rounded-b-lg',
                  isActive ? 'bg-primary-light/40' : 'hover:bg-background-alt',
                )}
              >
                <span className="truncate text-foreground">
                  <span className="chinese-text">
                    {first.dialogueTitleHanzi ?? t('today.group.fallback', { index: groupIdx + 1 })}
                  </span>
                  {first.dialogueTitleVi && (
                    <span className="text-muted"> · {first.dialogueTitleVi}</span>
                  )}
                </span>
                <span
                  className={cn('shrink-0 text-xs', isActive ? 'text-primary' : 'text-muted')}
                >
                  {isActive ? '✓ ' : ''}
                  {t('today.group.lineCount', { count: group.length })}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
