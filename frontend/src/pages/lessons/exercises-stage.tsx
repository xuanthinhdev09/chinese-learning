import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  LessonExercise,
  LessonExerciseImage,
  SECTION_ORDER,
  exercisesApi,
} from '../../api/exercises-api';
import { ExerciseCard, GRADABLE_TYPES } from '../../components/exercises/exercise-card';
import { AudioPlayerProvider } from '../../components/exercises/audio-player-context';
import {
  ExerciseAudioPlayer,
  StickyAudioBar,
} from '../../components/exercises/exercise-audio-player';
import { AnswersMap, CheckedMap } from '../../components/exercises/exercise-types';
import { isExercisesStageComplete } from './completion-detection';

interface AudioGroup {
  audio: string | null;
  exercises: LessonExercise[];
}

/** Merge ADJACENT exercises sharing one audio file into a single group. */
function groupAdjacentByAudio(exercises: LessonExercise[]): AudioGroup[] {
  const groups: AudioGroup[] = [];
  for (const ex of exercises) {
    const audio = ex.payload.audioFile ?? null;
    const last = groups[groups.length - 1];
    if (last && last.audio === audio) {
      last.exercises.push(ex);
    } else {
      groups.push({ audio, exercises: [ex] });
    }
  }
  return groups;
}

/**
 * Stage 3 của wizard: exercises. Tách checkable (có nút "Kiểm tra", phải chấm
 * hết) vs view-only (drill / stroke order, mở là xong). Cả 2 nhóm render hết
 * trong một trang (không phân trang) nên view-only tính "đã mở" ngay khi load.
 */
export function ExercisesStage({
  lessonId,
  onComplete,
}: {
  lessonId: string;
  onComplete: () => void;
}) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [checkedMap, setCheckedMap] = useState<CheckedMap>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson-exercises', lessonId],
    queryFn: () => exercisesApi.getLessonExercises(lessonId),
    enabled: !!lessonId,
  });

  const images = useMemo(() => {
    const map: Record<string, LessonExerciseImage> = {};
    (data?.images ?? []).forEach((im) => {
      map[im.ref] = im;
    });
    return map;
  }, [data]);

  const grouped = useMemo(() => {
    const bySection = new Map<string, LessonExercise[]>();
    (data?.exercises ?? []).forEach((ex) => {
      const list = bySection.get(ex.section) ?? [];
      list.push(ex);
      bySection.set(ex.section, list);
    });
    return SECTION_ORDER.filter((s) => bySection.has(s)).map((s) => ({
      section: s,
      groups: groupAdjacentByAudio(bySection.get(s)!),
    }));
  }, [data]);

  const checkable = useMemo(
    () => (data?.exercises ?? []).filter((e) => GRADABLE_TYPES.has(e.typeCode)),
    [data],
  );
  const viewOnly = useMemo(
    () => (data?.exercises ?? []).filter((e) => !GRADABLE_TYPES.has(e.typeCode)),
    [data],
  );

  const complete = useMemo(
    () =>
      isExercisesStageComplete({
        checkableCheckedCount: checkable.filter((e) => checkedMap[e.id]).length,
        checkableTotal: checkable.length,
        viewOnlySeenCount: viewOnly.length, // mọi view-only đều đã render = đã mở
        viewOnlyTotal: viewOnly.length,
      }),
    [checkable, checkedMap, viewOnly],
  );

  // Chỉ gọi onComplete một lần khi đủ điều kiện (tránh re-fire mỗi render).
  const firedRef = useRef(false);
  useEffect(() => {
    if (complete && data && !firedRef.current) {
      firedRef.current = true;
      onComplete();
    }
  }, [complete, data, onComplete]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700">{t('exercises.loadError')}</p>
        </div>
      </div>
    );
  }

  const onAnswer = (exerciseId: string, itemKey: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] ?? {}), [itemKey]: value },
    }));
  };

  const renderCard = (ex: LessonExercise, hideAudio = false, nested = false) => (
    <ExerciseCard
      key={ex.id}
      exercise={ex}
      images={images}
      answers={answers}
      checkedMap={checkedMap}
      onAnswer={onAnswer}
      onCheck={(id) => setCheckedMap((prev) => ({ ...prev, [id]: true }))}
      onReset={(id) => {
        setCheckedMap((prev) => ({ ...prev, [id]: false }));
        setAnswers((prev) => ({ ...prev, [id]: {} }));
      }}
      hideAudio={hideAudio}
      nested={nested}
    />
  );

  return (
    <AudioPlayerProvider>
      {/* extra bottom padding keeps content clear of the sticky audio bar */}
      <div className="mx-auto max-w-3xl space-y-6 pb-28">
        {grouped.map(({ section, groups }) => (
          <section key={section} className="space-y-3">
            <h2 className="chinese-text text-lg font-semibold text-gray-800">{section}</h2>
            {groups.map((group) =>
              group.audio && group.exercises.length > 1 ? (
                <div
                  key={group.exercises[0].id}
                  className="space-y-3 rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-3"
                >
                  <ExerciseAudioPlayer filename={group.audio} />
                  {group.exercises.map((ex) => renderCard(ex, true, true))}
                </div>
              ) : (
                group.exercises.map((ex) => renderCard(ex))
              ),
            )}
          </section>
        ))}
      </div>
      <StickyAudioBar />
    </AudioPlayerProvider>
  );
}
