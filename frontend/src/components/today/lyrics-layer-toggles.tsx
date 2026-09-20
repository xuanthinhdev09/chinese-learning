import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface LyricsLayerTogglesProps {
  showPinyin: boolean;
  showVietnamese: boolean;
  onTogglePinyin: () => void;
  onToggleVietnamese: () => void;
}

/**
 * 2 nút bật/tắt layer pinyin + nghĩa Việt trên panel lyrics.
 * BẬT = layer hiện trên MỌI dòng (chuyển câu mượt), TẮT = luyện nghe thuần.
 */
export function LyricsLayerToggles({
  showPinyin,
  showVietnamese,
  onTogglePinyin,
  onToggleVietnamese,
}: LyricsLayerTogglesProps) {
  const { t } = useTranslation();
  const buttonClass = (enabled: boolean) =>
    cn(
      'rounded border px-2 py-1 text-xs transition-colors',
      enabled
        ? 'border-transparent bg-primary-light text-primary-dark'
        : 'border-border bg-background-alt text-muted',
    );

  return (
    <>
      <button
        onClick={onTogglePinyin}
        className={buttonClass(showPinyin)}
        title={t('today.lyrics.togglePinyinTitle')}
      >
        {t('today.lyrics.pinyinToggle')}
      </button>
      <button
        onClick={onToggleVietnamese}
        className={buttonClass(showVietnamese)}
        title={t('today.lyrics.toggleVietnameseTitle')}
      >
        {t('today.lyrics.meaningToggle')}
      </button>
    </>
  );
}
