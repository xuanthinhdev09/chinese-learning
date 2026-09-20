import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DailySessionPlan,
  DueDialogue,
  completeSession,
  getDailySession,
  reviewDialogue,
} from '../../api/daily-session';
import { vocabularyApi } from '../../api/vocabulary-api';
import { DialogueReader } from '../../components/today/dialogue-reader';
import { PracticeItem, PracticeRunner } from '../../components/today/practice-runner';
import { SessionSummary } from '../../components/today/session-summary';
import { translateApiError } from '../../utils/translate-api-error';

type Step =
  | { kind: 'due-dialogue'; data: DueDialogue }
  | { kind: 'new-dialogue' }
  | { kind: 'keyword-cards' }
  | { kind: 'keyword-quiz' }
  | { kind: 'vocab-cards' };

// Giá trị là key i18n — dịch lúc render (t()) để đổi ngôn ngữ giữa chừng vẫn đúng
const STEP_LABEL_KEYS: Record<Step['kind'], string> = {
  'due-dialogue': 'today.segment.dueDialogue',
  'new-dialogue': 'today.segment.newDialogue',
  'keyword-cards': 'today.segment.keywordCards',
  'keyword-quiz': 'today.segment.keywordQuiz',
  'vocab-cards': 'today.segment.vocabCards',
};

function toPracticeItems(items: Array<{ id: string; hanzi: string; pinyin: string; meaning: string }>): PracticeItem[] {
  return items
    .filter((item) => item.hanzi && item.meaning)
    .map((item) => ({ id: item.id, hanzi: item.hanzi, pinyin: item.pinyin, meaning: item.meaning }));
}

/**
 * "Học hôm nay" — one-button daily session. The server plan decides the steps;
 * empty sections are skipped automatically; refresh restarts the plan (no
 * server-side session state by design).
 */
export function TodaySessionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'loading' | 'empty' | 'active' | 'summary' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DailySessionPlan | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [counts, setCounts] = useState({ dialoguesReviewed: 0, newDialogueDone: false, keywordsPracticed: 0, vocabReviewed: 0 });
  const [finalStreak, setFinalStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDailySession()
      .then((freshPlan) => {
        if (cancelled) return;
        const built: Step[] = [
          ...freshPlan.dueDialogues.map((d) => ({ kind: 'due-dialogue' as const, data: d })),
          ...(freshPlan.nextLesson && freshPlan.nextLesson.lines.length > 0
            ? [{ kind: 'new-dialogue' as const }]
            : []),
          ...(freshPlan.nextLesson && toPracticeItems(freshPlan.nextLesson.keywords).length > 0
            ? [{ kind: 'keyword-cards' as const }, { kind: 'keyword-quiz' as const }]
            : []),
          ...(toPracticeItems(freshPlan.dueVocabulary).length > 0 ? [{ kind: 'vocab-cards' as const }] : []),
        ];
        setPlan(freshPlan);
        // Nothing due and nothing new (or course finished) → friendly done state
        if (built.length === 0) {
          setPhase('empty');
        } else {
          setSteps(built);
          setPhase('active');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? translateApiError(e, t) : t('errors.unknown'));
          setPhase('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recordVocabQuality = async (item: PracticeItem, quality: number) => {
    await vocabularyApi.recordProgress({ vocabularyId: item.id, quality });
  };

  const finish = async () => {
    if (plan?.nextLesson) {
      try {
        const result = await completeSession(plan.nextLesson.lessonId);
        setFinalStreak(result.streak);
      } catch {
        // completion is best-effort; the summary still shows
        setFinalStreak(plan.streak);
      }
    } else {
      setFinalStreak(plan?.streak ?? 0);
    }
    setPhase('summary');
  };

  const handleStepDone = async (step: Step, passed?: boolean) => {
    try {
      if (step.kind === 'due-dialogue') {
        await reviewDialogue(step.data.lessonId, passed ?? true);
        setCounts((c) => ({ ...c, dialoguesReviewed: c.dialoguesReviewed + 1 }));
      } else if (step.kind === 'new-dialogue') {
        if (plan?.nextLesson) {
          await reviewDialogue(plan.nextLesson.lessonId, passed ?? true);
        }
        setCounts((c) => ({ ...c, newDialogueDone: true }));
      }
    } catch {
      // review persistence failures should not trap the user mid-session
    }
    setStepIndex((i) => i + 1);
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🎯</div>
          <p className="text-muted">{t('today.loading')}</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">😕</div>
          <p className="text-destructive mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">🌿</div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {plan?.completedToday ? t('today.emptyDone') : t('today.emptyNothing')}
          </h2>
          <p className="text-muted mb-6">
            {plan?.completedToday
              ? t('today.emptyDoneDesc')
              : t('today.emptyNothingDesc')}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {t('today.backHome')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <SessionSummary
        streak={finalStreak}
        counts={counts}
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  // Active session
  const step = steps[stepIndex];
  const nextLesson = plan?.nextLesson ?? null;

  // Session header (Bước + streak): với bước hội thoại, header được nhúng
  // vào cột trái của DialogueReader trên desktop thay vì nằm trên cùng.
  const sessionHeader = (
    <div className="flex items-center justify-between gap-3 px-1">
      <p className="text-sm font-medium text-muted">
        {t('today.stepHeader', { current: stepIndex + 1, total: steps.length, label: t(STEP_LABEL_KEYS[step.kind]) })}
      </p>
      <span className="text-sm font-semibold text-foreground">🔥 {plan?.streak ?? 0}</span>
    </div>
  );
  const isDialogueStep = step.kind === 'due-dialogue' || step.kind === 'new-dialogue';

  return (
    <div className="mx-auto">
      {!isDialogueStep && (
        <div className="mb-6 px-1">{sessionHeader}</div>
      )}

      {step.kind === 'due-dialogue' && (
        <DialogueReader
          title={step.data.lessonTitle}
          lines={step.data.lines}
          mode="review"
          sessionHeader={sessionHeader}
          onDone={(passed) => handleStepDone(step, passed)}
        />
      )}

      {step.kind === 'new-dialogue' && nextLesson && (
        <DialogueReader
          title={nextLesson.lessonTitle}
          lines={nextLesson.lines}
          mode="new"
          sessionHeader={sessionHeader}
          onDone={(passed) => handleStepDone(step, passed)}
        />
      )}

      {step.kind === 'keyword-cards' && nextLesson && (
        <PracticeRunner
          title={t('today.keywordCardsTitle')}
          items={toPracticeItems(nextLesson.keywords)}
          mode="flashcard"
          onRate={async (item, quality) => {
            await recordVocabQuality(item, quality);
            setCounts((c) => ({ ...c, keywordsPracticed: c.keywordsPracticed + 1 }));
          }}
          onDone={() => setStepIndex((i) => i + 1)}
        />
      )}

      {step.kind === 'keyword-quiz' && nextLesson && (
        <PracticeRunner
          title={t('today.keywordQuizTitle')}
          items={toPracticeItems(nextLesson.keywords)}
          mode="quiz"
          onRate={recordVocabQuality}
          onDone={() => setStepIndex((i) => i + 1)}
        />
      )}

      {step.kind === 'vocab-cards' && plan && (
        <PracticeRunner
          title={
            plan.dueVocabularyTotal > plan.dueVocabulary.length
              ? t('today.vocabDueTitleWithCount', { current: plan.dueVocabulary.length, total: plan.dueVocabularyTotal })
              : t('today.vocabDueTitle')
          }
          items={toPracticeItems(plan.dueVocabulary)}
          mode="flashcard"
          onRate={async (item, quality) => {
            await recordVocabQuality(item, quality);
            setCounts((c) => ({ ...c, vocabReviewed: c.vocabReviewed + 1 }));
          }}
          onDone={() => {
            void finish();
          }}
        />
      )}
    </div>
  );
}

export default TodaySessionPage;
