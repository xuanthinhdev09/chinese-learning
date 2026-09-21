import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LessonExercise } from '../../api/exercises-api';
import { ExerciseAudioPlayer } from './exercise-audio-player';
import {
  AnswersMap,
  CheckedMap,
  ExerciseRendererProps,
} from './exercise-types';
import { TfJudgeBody } from './tf-judge-body';
import { PicturePoolBody } from './picture-pool-body';
import { TextOptionsBody } from './text-options-body';
import { PinyinPairBody } from './pinyin-pair-body';
import { RadicalGroupsBody } from './radical-groups-body';
import { DrillBody, StrokeOrderBody } from './drill-and-stroke-order-bodies';

const TYPE_RENDERERS: Record<string, (props: ExerciseRendererProps) => ReactNode> = {
  listen_judge_picture_tf: TfJudgeBody,
  read_judge_tf: TfJudgeBody,
  listen_dialogue_choose_picture: PicturePoolBody,
  read_picture_for_sentence: PicturePoolBody,
  hanzi_guess_meaning_picture: PicturePoolBody,
  listen_dialogue_choose_answer: TextOptionsBody,
  read_fill_blank_word: TextOptionsBody,
  read_match_qa: TextOptionsBody,
  listen_choose_word: PinyinPairBody,
  hanzi_classify_radical: RadicalGroupsBody,
  listen_repeat_drill: DrillBody,
  hanzi_write_stroke_order: StrokeOrderBody,
};

/** Gradable answer types: everything except the oral drill (no answers) and
 * stroke order (the answer is the character the learner copies by hand). */
const GRADABLE_TYPES = new Set(
  Object.keys(TYPE_RENDERERS).filter(
    (t) => t !== 'listen_repeat_drill' && t !== 'hanzi_write_stroke_order',
  ),
);

/** i18n key suffix per book section (听力/阅读/语音/汉字). */
const SECTION_KEYS: Record<string, string> = {
  听力: 'listen',
  阅读: 'read',
  语音: 'phonetics',
  汉字: 'hanzi',
};

export function ExerciseCard({
  exercise,
  images,
  answers,
  checkedMap,
  onAnswer,
  onCheck,
  onReset,
  hideAudio = false,
  nested = false,
}: {
  exercise: LessonExercise;
  images: ExerciseRendererProps['images'];
  answers: AnswersMap;
  checkedMap: CheckedMap;
  onAnswer: (exerciseId: string, itemKey: string, value: string) => void;
  onCheck: (exerciseId: string) => void;
  onReset: (exerciseId: string) => void;
  /** group header owns the player — card shares the same audio file */
  hideAudio?: boolean;
  /** rendered inside an audio-group border — lighter chrome */
  nested?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const Renderer = TYPE_RENDERERS[exercise.typeCode];
  if (!Renderer) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        {t('exercises.unknownType', { type: exercise.typeCode })}
      </div>
    );
  }
  const checked = !!checkedMap[exercise.id];
  const exerciseAnswers = answers[exercise.id] ?? {};
  const gradable = GRADABLE_TYPES.has(exercise.typeCode);
  const gradableItems = exercise.payload.items.filter((i) => i.answer !== undefined);
  const correctCount = gradableItems.filter((item) => {
    if (exercise.typeCode === 'hanzi_classify_radical') return undefined; // scored in-card below
    return exerciseAnswers[item.label] === String(item.answer);
  }).length;
  const score =
    exercise.typeCode === 'hanzi_classify_radical'
      ? countRadicalScore(exerciseAnswers, exercise)
      : correctCount;
  // Hybrid instructions: hanzi line always from DB (book text); the
  // translation line uses the per-typeCode i18n template, hidden for zh,
  // falling back to the DB vi string for unknown typeCodes.
  const instrKey = `exercises.instr.${exercise.typeCode}`;
  const instructionLine = i18n.language.startsWith('zh')
    ? undefined
    : i18n.exists(instrKey)
      ? t(instrKey)
      : exercise.instructionVi;
  const sectionKey = SECTION_KEYS[exercise.section];
  const sectionLabel = sectionKey ? t(`exercises.section.${sectionKey}`) : exercise.section;

  return (
    <article
      className={
        nested
          ? 'rounded-xl border border-gray-100 bg-white p-3'
          : 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'
      }
    >
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          {sectionLabel} · {exercise.order}
        </span>
        {exercise.instructionHanzi && (
          <span className="chinese-text text-sm font-medium text-gray-800">
            {exercise.instructionHanzi}
          </span>
        )}
        {instructionLine && (
          <span className="w-full text-xs text-gray-500">{instructionLine}</span>
        )}
      </header>
      {exercise.payload.audioFile && !hideAudio && (
        <div className="mb-3">
          <ExerciseAudioPlayer filename={exercise.payload.audioFile} />
        </div>
      )}
      <Renderer
        payload={exercise.payload}
        images={images}
        answers={exerciseAnswers}
        onAnswer={(itemKey, value) => onAnswer(exercise.id, itemKey, value)}
        checked={checked}
      />
      {gradable && (
        <footer className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
          {!checked ? (
            <button
              type="button"
              onClick={() => onCheck(exercise.id)}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('exercises.check')}
            </button>
          ) : (
            <>
              <span className="text-sm font-semibold text-gray-700">
                {t('exercises.score', { correct: score, total: gradableItems.length })}
              </span>
              <button
                type="button"
                onClick={() => onReset(exercise.id)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                {t('exercises.redo')}
              </button>
            </>
          )}
        </footer>
      )}
    </article>
  );
}

function countRadicalScore(
  exerciseAnswers: Record<string, string>,
  exercise: LessonExercise,
): number {
  let correct = 0;
  for (const item of exercise.payload.items) {
    if (!Array.isArray(item.answer)) continue;
    const lettersInGroup = Object.entries(exerciseAnswers)
      .filter(([key, value]) => !key.startsWith('_active_') && value === item.label)
      .map(([key]) => key)
      .sort()
      .join(',');
    if (lettersInGroup === [...item.answer].sort().join(',')) correct += 1;
  }
  return correct;
}
