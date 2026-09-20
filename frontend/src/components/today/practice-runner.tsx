import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTtsAudio } from '../../hooks/use-tts-audio';
import { cn } from '../../utils/cn';

export interface PracticeItem {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
}

interface PracticeRunnerProps {
  title: string;
  items: PracticeItem[];
  mode: 'flashcard' | 'quiz';
  /** Record the SM-2 quality for one item, then advance */
  onRate: (item: PracticeItem, quality: number) => Promise<void>;
  onDone: () => void;
}

const RATING_OPTIONS = [
  { value: 0, labelKey: 'today.practice.again', emoji: '⏰', color: 'bg-destructive hover:bg-red-700' },
  { value: 3, labelKey: 'today.practice.hard', emoji: '💪', color: 'bg-warning hover:bg-amber-600' },
  { value: 4, labelKey: 'today.practice.good', emoji: '👍', color: 'bg-accent hover:bg-green-600' },
  { value: 5, labelKey: 'today.practice.easy', emoji: '⭐', color: 'bg-primary hover:bg-primary-dark' },
];

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Sequential practice over a vocab list. Flashcard mode: reveal + SM-2 rate.
 * Quiz mode: pick the meaning out of 4 options (correct = Good, wrong = Again).
 */
export function PracticeRunner({ title, items, mode, onRate, onDone }: PracticeRunnerProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { play, isBusy: isSpeaking } = useTtsAudio();

  const current = items[index];

  // Quiz options are stable per item while the card is visible
  const options = useMemo(() => {
    if (mode !== 'quiz' || !current) return [];
    const distractors = shuffle(items.filter((item) => item.id !== current.id))
      .slice(0, 3)
      .map((item) => item.meaning);
    return shuffle([current.meaning, ...distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, mode]);

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

  const handlePick = async (option: string) => {
    if (picked || saving) return;
    setPicked(option);
    const correct = option === current.meaning;
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

        <p className="text-4xl sm:text-5xl font-bold text-foreground chinese-text mb-3 break-words">
          {current.hanzi}
        </p>
        <p className="text-xl text-primary font-light mb-6">{current.pinyin}</p>

        {mode === 'flashcard' ? (
          revealed ? (
            <div className="animate-fade-in">
              <div className="w-16 h-0.5 bg-border rounded mx-auto mb-4" />
              <p className="text-xl font-semibold text-foreground">{current.meaning}</p>
            </div>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="px-8 py-3 rounded-lg bg-primary-light text-primary-dark hover:bg-primary hover:text-white transition-colors"
            >
              {t('today.practice.reveal')}
            </button>
          )
        ) : (
          <div className="grid gap-2">
            {options.map((option, optionIndex) => (
              <button
                // index prefix keeps keys unique when two options share the same meaning text
                key={`${optionIndex}-${option}`}
                onClick={() => handlePick(option)}
                disabled={Boolean(picked) || saving}
                className={cn(
                  'px-4 py-3 rounded-lg border text-left transition-colors',
                  picked === option && option === current.meaning
                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                    : picked === option
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border hover:bg-background-alt disabled:opacity-60'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center mt-4 animate-shake">
          {error}{' '}
          <button onClick={() => handleRate(mode === 'quiz' ? (picked === current.meaning ? 4 : 0) : 4)} className="underline">
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
