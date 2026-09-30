import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTtsAudio } from '../../hooks/use-tts-audio';
import { cn } from '../../utils/cn';
import {
  getDisplayMeaning,
  useContentPreference,
  type LanguagePreference,
} from '../../stores/language-preference-store';
import { buildHanziChoiceOptions } from '../../utils/build-hanzi-choice-quiz-options';
import { useHanziQuizDistractorPool } from '../../hooks/use-hanzi-quiz-distractor-pool';

export interface PracticeItem {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  /** English gloss (added 29/09); display falls back to `meaning` when empty */
  english?: string;
}

/** Display meaning for a practice item in the active content language. */
function displayMeaning(item: PracticeItem, preference: LanguagePreference): string {
  return getDisplayMeaning(item.meaning, item.english || '', preference);
}

interface PracticeRunnerProps {
  title: string;
  items: PracticeItem[];
  mode: 'flashcard' | 'quiz';
  /** Record the SM-2 quality for one item, then advance */
  onRate: (item: PracticeItem, quality: number) => Promise<void>;
  onDone: () => void;
  /** Quiz: nguồn đáp án nhiễu thêm ngoài `items` (vd toàn bộ từ của bài) */
  distractorPool?: PracticeItem[];
  /** Quiz: bài đang học — thiếu đáp án nhiễu thì lấy thêm từ level của bài */
  lessonId?: string;
}

const RATING_OPTIONS = [
  { value: 0, labelKey: 'today.practice.again', emoji: '⏰', color: 'bg-destructive hover:bg-red-700' },
  { value: 3, labelKey: 'today.practice.hard', emoji: '💪', color: 'bg-warning hover:bg-amber-600' },
  { value: 4, labelKey: 'today.practice.good', emoji: '👍', color: 'bg-accent hover:bg-green-600' },
  { value: 5, labelKey: 'today.practice.easy', emoji: '⭐', color: 'bg-primary hover:bg-primary-dark' },
];

// Chuỗi đúng liên tiếp trong quiz → mốc khen ngắn (variable reward nhẹ, không
// cần hệ điểm). Key trỏ tới today.practice.praise*.
const PRAISE_MILESTONES: Record<number, string> = {
  3: 'today.practice.praise3',
  5: 'today.practice.praise5',
  10: 'today.practice.praise10',
  20: 'today.practice.praise20',
};

/**
 * Sequential practice over a vocab list. Flashcard mode: reveal + SM-2 rate.
 * Quiz mode: show the meaning, pick the hanzi out of 4 options (correct = Good,
 * wrong = Again). Hanzi/pinyin/audio stay hidden until an option is picked.
 */
export function PracticeRunner({ title, items, mode, onRate, onDone, distractorPool, lessonId }: PracticeRunnerProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  /** id của đáp án đã chọn (quiz) */
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [praiseKey, setPraiseKey] = useState<string | null>(null);
  const { play, isBusy: isSpeaking } = useTtsAudio();
  const preference = useContentPreference();

  const current = items[index];

  const getMeaning = useCallback((item: PracticeItem) => displayMeaning(item, preference), [preference]);
  const { pool, isLoading: isPoolLoading } = useHanziQuizDistractorPool({
    items,
    extraPool: distractorPool,
    lessonId,
    enabled: mode === 'quiz',
    getMeaning,
  });

  // Quiz options are stable per item while the card is visible; pool.length (not
  // identity) so parent re-renders don't reshuffle — it only grows when the level pool arrives
  const options = useMemo(() => {
    if (mode !== 'quiz' || !current) return [];
    return buildHanziChoiceOptions(current, pool, getMeaning);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, mode, getMeaning, pool.length]);

  if (!current) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto">
        <p className="text-muted mb-4">{t('today.practice.empty')}</p>
        <button onClick={onDone} className="px-6 py-2 rounded-lg bg-primary text-white">
          {t('today.practice.continue')}
        </button>
      </div>
    );
  }

  const advance = () => {
    setRevealed(false);
    setPicked(null);
    setError(null);
    if (index >= items.length - 1) {
      onDone();
    } else {
      setIndex((current2) => current2 + 1);
    }
  };

  const handleRate = async (quality: number) => {
    setSaving(true);
    setError(null);
    try {
      await onRate(current, quality);
      advance();
    } catch {
      setError(t('today.practice.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePick = async (optionId: string) => {
    if (picked || saving) return;
    setPicked(optionId);
    const correct = optionId === current.id;
    const newStreak = correct ? correctStreak + 1 : 0;
    setCorrectStreak(newStreak);
    // Mốc chuỗi đúng → khen ngắn; trả lời sai reset chuỗi (xóa khen).
    setPraiseKey(correct ? PRAISE_MILESTONES[newStreak] ?? null : null);
    setSaving(true);
    try {
      await onRate(current, correct ? 4 : 0);
      // brief feedback pause so the user sees correct/wrong coloring
      // (buttons stay disabled via `picked` until advance() clears it)
      setTimeout(advance, 700);
    } catch {
      setError(t('today.practice.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <p className="text-sm text-muted mb-2">
        {title} • {index + 1}/{items.length}
      </p>
      <div className="h-1.5 bg-background-alt rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((index + 1) / items.length) * 100}%` }}
        />
      </div>

      <div className="card p-6 sm:p-8 text-center" style={{ minHeight: '280px' }}>
        {/* Quiz: nút loa ẩn tới khi đã chọn — nghe âm là lộ đáp án */}
        {(mode === 'flashcard' || picked) && (
          <button
            onClick={() => play(current.hanzi)}
            disabled={isSpeaking}
            className={cn(
              'float-right p-2 rounded-lg transition-all',
              isSpeaking ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 active:scale-95'
            )}
            title={t('today.practice.speak')}
          >
            <span className={cn(isSpeaking && 'animate-pulse')}>{isSpeaking ? '🔊' : '🔈'}</span>
          </button>
        )}

        {mode === 'flashcard' ? (
          <>
            {/* Mặt trước chỉ chữ Hán; pinyin + nghĩa hiện sau khi lật */}
            <p className="text-4xl sm:text-5xl font-bold text-foreground chinese-text mb-6 break-words">
              {current.hanzi}
            </p>
            {revealed ? (
              <div className="animate-fade-in">
                <p className="text-xl text-primary font-light mb-4">{current.pinyin}</p>
                <div className="w-16 h-0.5 bg-border rounded mx-auto mb-4" />
                <p className="text-xl font-semibold text-foreground">{displayMeaning(current, preference)}</p>
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="px-8 py-3 rounded-lg bg-primary-light text-primary-dark hover:bg-primary hover:text-white transition-colors"
              >
                {t('today.practice.reveal')}
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted mb-2">{t('today.practice.pickHanzi')}</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words">
              {displayMeaning(current, preference)}
            </p>
            {/* Đáp án đúng chỉ hiện sau khi chọn */}
            <p className={cn('text-lg text-primary mb-6 min-h-[1.75rem]', !picked && 'invisible')}>
              <span className="chinese-text">{current.hanzi}</span> · {current.pinyin}
            </p>

            {isPoolLoading ? (
              <p className="text-muted py-8">{t('common.loading')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handlePick(option.id)}
                    disabled={Boolean(picked) || saving}
                    className={cn(
                      'px-4 py-4 rounded-lg border text-3xl chinese-text transition-colors break-words',
                      picked && option.isCorrect
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : picked === option.id
                          ? 'border-destructive bg-destructive/10 text-destructive'
                          : 'border-border hover:bg-background-alt disabled:opacity-60'
                    )}
                  >
                    {option.hanzi}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {praiseKey && (
        <p className="text-center mt-4 text-lg font-bold text-accent animate-fade-in" role="status">
          {t(praiseKey)}
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive text-center mt-4 animate-shake">
          {error}{' '}
          <button onClick={() => handleRate(mode === 'quiz' ? (picked === current.id ? 4 : 0) : 4)} className="underline">
            {t('common.retry')}
          </button>
        </p>
      )}

      {mode === 'flashcard' && revealed && (
        <div className="grid grid-cols-4 gap-2 mt-6 animate-fade-in">
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleRate(option.value)}
              disabled={saving}
              className={cn(
                'px-2 py-3 rounded-lg text-white transition-all active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                option.color
              )}
            >
              <span className="block text-xl mb-1">{option.emoji}</span>
              <span className="text-xs font-semibold">{t(option.labelKey)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
