import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { lessonsApi } from '../../api/lessons-api';
import { vocabularyApi } from '../../api/vocabulary-api';
import {
  CurrentLesson,
  LessonActivity,
  LessonProgress,
  completeActivity,
  getCurrentLesson,
  getLessonStatus,
  reviewDialogue,
} from '../../api/daily-session';
import { useResolveLessonId } from '../../hooks/use-resolve-lesson-id';
import { StageDefinition, StageStepper } from '../../components/lessons/stage-stepper';
import { DialogueReader } from '../../components/today/dialogue-reader';
import { PracticeItem } from '../../components/today/practice-runner';
import { VocabStage } from './vocab-stage';
import { ExercisesStage } from './exercises-stage';

const STAGES: StageDefinition[] = [
  { key: 'vocab', label: 'learn.stage.vocab' },
  { key: 'dialogue', label: 'learn.stage.dialogue' },
  { key: 'exercises', label: 'learn.stage.exercises' },
];

/**
 * Trang học lesson thống nhất: wizard 3 giai đoạn (từ vựng → luyện nghe →
 * exercises). Mỗi giai đoạn tự nhận biết hoàn thành, gọi activity-complete 1
 * lần (sticky server-side). Đủ 3 → banner hoàn thành + dẫn bài kế tiếp.
 */
export default function LessonLearnPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lessonId: lessonIdParam } = useParams<{ lessonId: string }>();
  const { lessonId, isResolving } = useResolveLessonId(lessonIdParam);

  const [done, setDone] = useState({ vocab: false, dialogue: false, exercises: false });
  const [stage, setStage] = useState(0);
  const [nextLesson, setNextLesson] = useState<CurrentLesson | null>(null);
  // Bài đã hoàn thành vẫn cho học lại: tắt banner để vào lại các stage (thực hành).
  const [reStudying, setReStudying] = useState(false);

  const lessonQuery = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonsApi.getLesson(lessonId!),
    enabled: !!lessonId,
  });
  const statusQuery = useQuery({
    queryKey: ['lesson-status', lessonId],
    queryFn: () => getLessonStatus(lessonId!),
    enabled: !!lessonId,
  });
  const vocabQuery = useQuery({
    queryKey: ['lesson-vocab', lessonId],
    queryFn: () => vocabularyApi.getByLesson(lessonId!),
    enabled: !!lessonId,
  });

  // Seed checkmark từ GET lesson-status khi reload; nhảy tới stage chưa xong đầu tiên.
  useEffect(() => {
    if (!statusQuery.data) return;
    const s = statusQuery.data;
    const flags = [
      !!s.vocabCompletedAt,
      !!s.dialogueCompletedAt,
      !!s.exercisesCompletedAt,
    ];
    // Bài hoàn thành theo luồng cũ (/today) có isCompleted=true nhưng 3 flag rỗng
    // → xem như đã xong để hiện banner hoàn thành thay vì mở lại từ stage đầu.
    const legacyComplete = s.isCompleted && flags.every((f) => !f);
    const doneFlags = legacyComplete ? [true, true, true] : flags;
    setDone({ vocab: doneFlags[0], dialogue: doneFlags[1], exercises: doneFlags[2] });
    const nextIdx = doneFlags.findIndex((f) => !f);
    setStage(nextIdx === -1 ? 2 : nextIdx);
  }, [statusQuery.data]);

  const allDone = done.vocab && done.dialogue && done.exercises;

  const applyProgress = useCallback((progress: LessonProgress) => {
    const flags = [
      !!progress.vocabCompletedAt,
      !!progress.dialogueCompletedAt,
      !!progress.exercisesCompletedAt,
    ];
    setDone({ vocab: flags[0], dialogue: flags[1], exercises: flags[2] });
    // Tự chuyển sang giai đoạn chưa xong kế tiếp; đủ 3 thì đứng ở exercises.
    const nextIdx = flags.findIndex((f) => !f);
    setStage(nextIdx === -1 ? 2 : nextIdx);
  }, []);

  const markDone = useCallback(
    async (activity: LessonActivity) => {
      if (!lessonId) return;
      try {
        applyProgress(await completeActivity(lessonId, activity));
      } catch {
        // best-effort — stepper giữ nguyên trạng thái cũ
      }
    },
    [lessonId, applyProgress],
  );

  const handleDialogueDone = useCallback(
    async (passed: boolean) => {
      if (!lessonId) return;
      try {
        await reviewDialogue(lessonId, passed);
      } catch {
        // SRS best-effort
      }
      // "Xong luyện nghe = pass 1 lượt shadowing" — chỉ hoàn thành khi pass.
      // Chưa trôi (fail) vẫn ghi SRS để lên lịch ôn lại, nhưng không mở khóa.
      if (passed) {
        await markDone('dialogue');
      }
    },
    [lessonId, markDone],
  );

  // Đủ 3 → resolve bài kế tiếp (recommended) cho nút chuyển bài.
  useEffect(() => {
    if (!allDone) return;
    let cancelled = false;
    getCurrentLesson()
      .then((next) => {
        if (!cancelled) setNextLesson(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [allDone]);

  const vocabItems = useMemo<PracticeItem[]>(
    () =>
      (vocabQuery.data ?? [])
        .filter((v) => v.hanzi && v.meaning)
        .map((v) => ({ id: v.id, hanzi: v.hanzi, pinyin: v.pinyin, meaning: v.meaning })),
    [vocabQuery.data],
  );

  if (isResolving || statusQuery.isLoading || lessonQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (lessonQuery.error || !lessonQuery.data) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card p-8 text-center">
          <p className="text-destructive mb-6">{t('lesson.loadError')}</p>
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

  const lesson = lessonQuery.data;
  const completed = [done.vocab, done.dialogue, done.exercises];
  // Bước nên làm kế tiếp (theo thứ tự từ vựng → luyện nghe → bài tập): gợi ý mờ
  // mà không khóa — giữ scaffolding trong khi vẫn cho chọn tự do.
  const recommendedIndex = completed.findIndex((c) => !c);
  const lessonTitle = `${t('learn.lessonLabel', { order: lesson.order })} · ${lesson.title}`;

  const renderStage = () => {
    if (stage === 0) {
      return <VocabStage items={vocabItems} onComplete={() => markDone('vocab')} />;
    }
    if (stage === 1) {
      return (
        <DialogueReader
          title={lesson.title}
          lines={lesson.conversations}
          mode="new"
          onDone={handleDialogueDone}
        />
      );
    }
    return <ExercisesStage lessonId={lessonId!} onComplete={() => markDone('exercises')} />;
  };

  return (
    <div className="space-y-6">
      <header className="mx-auto max-w-3xl space-y-3">
        <StageStepper
          stages={STAGES}
          currentIndex={stage}
          completed={completed}
          recommendedIndex={recommendedIndex}
          onSelect={setStage}
        />
        <h1 className="chinese-text text-2xl font-bold text-gray-900">{lessonTitle}</h1>
      </header>

      {allDone && !reStudying ? (
        <div className="card mx-auto max-w-3xl p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t('learn.completeTitle')}</h2>
          <p className="text-muted mb-6">{t('learn.completeDesc')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                setReStudying(true);
                setStage(0);
              }}
              className="px-6 py-3 rounded-lg border border-primary text-primary hover:bg-primary-light transition-colors"
            >
              {t('learn.reStudy')}
            </button>
            {nextLesson?.lessonId && (
              <button
                onClick={() => navigate(`/learn/${nextLesson.lessonId}`)}
                className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                {t('learn.nextLesson')}
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-lg border border-border text-foreground hover:bg-background-alt transition-colors"
            >
              {t('today.backHome')}
            </button>
          </div>
        </div>
      ) : (
        renderStage()
      )}
    </div>
  );
}
