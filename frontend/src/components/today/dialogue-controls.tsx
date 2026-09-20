import { useTranslation } from 'react-i18next';
import { SpeedControl } from './speed-control';
import { LyricsLayerToggles } from './lyrics-layer-toggles';

interface PlaybackControlsProps {
  isBusy: boolean;
  isPaused: boolean;
  onPlayPause: () => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  showPinyin: boolean;
  showVietnamese: boolean;
  onTogglePinyin: () => void;
  onToggleVietnamese: () => void;
}

/**
 * Hàng nút điều khiển phát: Phát/Tạm dừng/Tiếp tục + tốc độ đọc + layer chữ.
 * Dùng chung cho cột trái (desktop) và bar dưới cùng (mobile) của DialogueReader
 * — chỉ một nơi định nghĩa, hai bố cục tái sử dụng.
 */
export function PlaybackControls({
  isBusy,
  isPaused,
  onPlayPause,
  speed,
  onSpeedChange,
  showPinyin,
  showVietnamese,
  onTogglePinyin,
  onToggleVietnamese,
}: PlaybackControlsProps) {
  const { t } = useTranslation();
  return (
    <>
      <button
        onClick={onPlayPause}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background-alt active:scale-95 transition-all"
        title={
          isBusy
            ? isPaused
              ? t('today.dialogue.resumeTitle')
              : t('today.dialogue.pauseTitle')
            : t('today.dialogue.playTitle')
        }
      >
        <span>{isBusy && !isPaused ? '⏸' : '▶'}</span>
        <span className="text-sm font-medium">
          {isBusy ? (isPaused ? t('today.dialogue.resume') : t('today.dialogue.pause')) : t('today.dialogue.play')}
        </span>
      </button>

      <SpeedControl value={speed} onChange={onSpeedChange} />

      <LyricsLayerToggles
        showPinyin={showPinyin}
        showVietnamese={showVietnamese}
        onTogglePinyin={onTogglePinyin}
        onToggleVietnamese={onToggleVietnamese}
      />
    </>
  );
}

interface DialogueActionsProps {
  /** Hết dòng của đoạn hiện tại mà còn đoạn kế → nút "Đoạn tiếp" */
  showNextGroup: boolean;
  mode: 'new' | 'review';
  onNextGroup: () => void;
  onDone: (passed: boolean) => void;
}

/**
 * Hành động cuối lượt: chuyển đoạn kế (khi hết đoạn) hoặc chấm điểm (khi hết
 * bài). Ẩn khi đang giữa đoạn — việc nhảy dòng/chọn đoạn đã có tap trên panel
 * lyrics và danh sách phát thay thế (bỏ nút Trước/Tếp theo yêu cầu).
 */
export function DialogueActions({ showNextGroup, mode, onNextGroup, onDone }: DialogueActionsProps) {
  const { t } = useTranslation();
  if (showNextGroup) {
    return (
      <div className="flex gap-3">
        <button
          onClick={onNextGroup}
          className="flex-1 px-4 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark active:scale-95 transition-all"
          title={t('today.dialogue.nextGroupTitle')}
        >
          {t('today.dialogue.nextGroup')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {mode === 'new' ? (
        <>
          <button
            onClick={() => onDone(true)}
            className="flex-1 px-3 py-3 rounded-lg bg-accent text-white hover:bg-green-600 active:scale-95 transition-all font-semibold"
            title={t('today.dialogue.passedTitle')}
          >
            {t('today.dialogue.passed')}
          </button>
          <button
            onClick={() => onDone(false)}
            className="flex-1 px-3 py-3 rounded-lg bg-warning text-white hover:bg-amber-600 active:scale-95 transition-all font-semibold"
            title={t('today.dialogue.failedTitle')}
          >
            {t('today.dialogue.failed')}
          </button>
        </>
      ) : (
        <button
          onClick={() => onDone(true)}
          className="flex-1 px-3 py-3 rounded-lg bg-accent text-white hover:bg-green-600 active:scale-95 transition-all font-semibold"
        >
          {t('today.dialogue.reviewed')}
        </button>
      )}
    </div>
  );
}
