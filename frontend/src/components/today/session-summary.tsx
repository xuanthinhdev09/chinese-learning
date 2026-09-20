import { useTranslation } from 'react-i18next';

interface SessionSummaryProps {
  streak: number;
  counts: {
    dialoguesReviewed: number;
    newDialogueDone: boolean;
    keywordsPracticed: number;
    vocabReviewed: number;
  };
  onBack: () => void;
}

/**
 * End-of-session recap: streak, per-section counts, and the way out.
 */
export function SessionSummary({ streak, counts, onBack }: SessionSummaryProps) {
  const { t } = useTranslation();
  const totalActions =
    counts.dialoguesReviewed +
    (counts.newDialogueDone ? 1 : 0) +
    counts.keywordsPracticed +
    counts.vocabReviewed;

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <div className="card p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('today.summary.title')}
        </h2>
        <p className="text-muted mb-8">
          {t('today.summary.completed', { count: totalActions })}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="rounded-lg bg-background-alt px-4 py-5">
            <p className="text-3xl mb-1">🔥</p>
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted">{t('today.summary.streak')}</p>
          </div>
          <div className="rounded-lg bg-background-alt px-4 py-5">
            <p className="text-3xl mb-1">🗣️</p>
            <p className="text-2xl font-bold text-foreground">{counts.dialoguesReviewed}</p>
            <p className="text-xs text-muted">{t('today.summary.dialoguesReviewed')}</p>
          </div>
          <div className="rounded-lg bg-background-alt px-4 py-5">
            <p className="text-3xl mb-1">📖</p>
            <p className="text-2xl font-bold text-foreground">
              {counts.newDialogueDone ? '✓' : '—'}
            </p>
            <p className="text-xs text-muted">{t('today.summary.newLesson')}</p>
          </div>
          <div className="rounded-lg bg-background-alt px-4 py-5">
            <p className="text-3xl mb-1">🃏</p>
            <p className="text-2xl font-bold text-foreground">
              {counts.keywordsPracticed + counts.vocabReviewed}
            </p>
            <p className="text-xs text-muted">{t('today.summary.wordsPracticed')}</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full px-6 py-4 rounded-lg bg-primary text-white hover:bg-primary-dark active:scale-95 transition-all font-semibold text-lg"
        >
          {t('today.backHome')}
        </button>

        <p className="text-sm text-muted mt-6">
          {t('today.summary.seeYouTomorrow')}
        </p>
      </div>
    </div>
  );
}
