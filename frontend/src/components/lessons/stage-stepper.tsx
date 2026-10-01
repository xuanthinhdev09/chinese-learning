import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

export interface StageDefinition {
  key: string;
  /** i18n key resolved via t() inside the stepper */
  label: string;
}

interface StageStepperProps {
  stages: StageDefinition[];
  currentIndex: number;
  /** completed[i] === true renders a checkmark */
  completed: boolean[];
  /** first unfinished step (recommended order) — soft "nên làm" highlight */
  recommendedIndex?: number;
  onSelect: (index: number) => void;
}

/**
 * Horizontal 3-step indicator for the lesson wizard: done steps show a
 * checkmark, the active step is highlighted. Mọi step đều bấm được — người học
 * chọn tự do thứ tự (từ vựng / luyện nghe / exercises); vẫn cần đủ 3 để mở bài
 * kế tiếp (do backend derive isCompleted). Bước chưa xong đầu tiên được gợi ý
 * mờ ("nên làm") để giữ scaffolding mà không khóa tự do chọn.
 */
export function StageStepper({
  stages,
  currentIndex,
  completed,
  recommendedIndex = -1,
  onSelect,
}: StageStepperProps) {
  const { t } = useTranslation();
  const activeRef = useRef<HTMLLIElement>(null);

  // Mobile: stepper trượt ngang → đưa step đang chọn vào khung nhìn.
  // block: 'nearest' để không kéo cả trang theo chiều dọc.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [currentIndex]);

  return (
    // Màn nhỏ: không co các step lại (vỡ UI) mà cho trượt ngang; từ sm trở lên giãn đều.
    <ol className="-mx-4 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:snap-none sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
      {stages.map((stage, index) => {
        const isDone = completed[index];
        const isActive = index === currentIndex;
        const isRecommended = index === recommendedIndex && !isDone;
        return (
          <li
            key={stage.key}
            ref={isActive ? activeRef : undefined}
            className="flex shrink-0 snap-start items-center gap-2 sm:flex-1 sm:shrink sm:gap-3"
          >
            <button
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-left transition-colors sm:px-2',
                isActive
                  ? 'border-primary bg-primary-light/40'
                  : isDone
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-background-alt/40',
                isRecommended && !isActive && 'border-primary/50 ring-1 ring-primary/30',
                'hover:bg-background-alt',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isDone ? 'bg-accent text-white' : isActive ? 'bg-primary text-white' : 'bg-border text-muted',
                )}
              >
                {isDone ? '✓' : index + 1}
              </span>
              <span
                className={cn(
                  'text-sm sm:truncate',
                  isActive ? 'font-semibold text-foreground' : isDone ? 'text-foreground' : 'text-muted',
                )}
              >
                {t(stage.label)}
              </span>
              {isRecommended && (
                <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {t('learn.recommended')}
                </span>
              )}
            </button>
            {index < stages.length - 1 && (
              <span className="h-px w-3 shrink-0 bg-border sm:w-6" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
