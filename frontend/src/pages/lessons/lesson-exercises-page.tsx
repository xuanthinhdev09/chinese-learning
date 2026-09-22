import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  LessonExercise,
  LessonExerciseImage,
  SECTION_ORDER,
  exercisesApi,
} from '../../api/exercises-api';
import { useResolveLessonId } from '../../hooks/use-resolve-lesson-id';
import { ExerciseCard } from '../../components/exercises/exercise-card';
import { AudioPlayerProvider } from '../../components/exercises/audio-player-context';
import {
  ExerciseAudioPlayer,
  StickyAudioBar,
} from '../../components/exercises/exercise-audio-player';
import {
  ImageSlotSelectionContext,
  ImageSlotSelection,
} from '../../components/exercises/image-slot-selection-context';
import {
  AnswersMap,
  CheckedMap,
} from '../../components/exercises/exercise-types';

type UploadRegistry = Map<string, (file: File) => void>;

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

export default function LessonExercisesPage() {
  const { t } = useTranslation();
  const { lessonId: lessonIdParam } = useParams<{ lessonId: string }>();
  // Route param may be a lesson order (pretty URL /lessons/2/exercises) or raw id
  const { lessonId, isResolving } = useResolveLessonId(lessonIdParam);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [checkedMap, setCheckedMap] = useState<CheckedMap>({});
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const uploadRegistry = useRef<UploadRegistry>(new Map());

  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson-exercises', lessonId],
    queryFn: () => exercisesApi.getLessonExercises(lessonId!),
    enabled: !!lessonId,
  });

  // imageRef -> image row, for payload resolution
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

  // Window-level paste: an image on the clipboard goes to the selected slot.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!selectedImageId) return;
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith('image/'),
      );
      const file = item?.getAsFile();
      if (!file) return;
      uploadRegistry.current.get(selectedImageId)?.(file);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [selectedImageId]);

  const registerUpload = useCallback(
    (id: string, upload: ((file: File) => void) | null) => {
      if (upload) {
        uploadRegistry.current.set(id, upload);
      } else {
        uploadRegistry.current.delete(id);
      }
    },
    [],
  );

  const selection = useMemo<ImageSlotSelection>(
    () => ({
      selectedId: selectedImageId,
      onSelect: (id) => setSelectedImageId((prev) => (prev === id ? null : id)),
      registerUpload,
    }),
    [selectedImageId, registerUpload],
  );

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

  if (isResolving || isLoading) {
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
        <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center">
          <p className="text-red-700">{t('exercises.loadError')}</p>
        </div>
      </div>
    );
  }

  const pendingUploads = data.images.filter((im) => !im.exists).length;

  return (
    <AudioPlayerProvider>
      <ImageSlotSelectionContext.Provider value={selection}>
        {/* extra bottom padding keeps content clear of the sticky audio bar */}
        <div className="mx-auto max-w-3xl space-y-6 pb-28">
          <header>
            <Link
              to={`/lessons/${data.lesson.order}`}
              className="text-sm text-blue-600 hover:underline"
            >
              ← {data.lesson.title}
            </Link>
            <h1 className="chinese-text mt-1 text-2xl font-bold text-gray-900">
              {t('exercises.title', { lesson: data.lesson.order })} · {data.lesson.title}
            </h1>
            {pendingUploads > 0 && (
              <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                <p className="text-xs text-amber-800">
                  {t('exercises.pendingUploads', { count: pendingUploads })}
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  {t('exercises.pasteBanner')}
                </p>
              </div>
            )}
          </header>

          {grouped.map(({ section, groups }) => (
            <section key={section} className="space-y-3">
              <h2 className="chinese-text text-lg font-semibold text-gray-800">{section}</h2>
              {groups.map((group) =>
                group.audio && group.exercises.length > 1 ? (
                  // shared-track group: one border, one player for the whole run
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
      </ImageSlotSelectionContext.Provider>
    </AudioPlayerProvider>
  );
}
