import { useTranslation } from 'react-i18next';
import { ExerciseExample, LessonExerciseImage } from '../../api/exercises-api';
import { ExerciseRendererProps, isItemCorrect, payloadOptionsAsRefs } from './exercise-types';
import { ExerciseImageSlot } from './exercise-image-slot';
import { AnswerMark, LetterButton, SentenceText } from './exercise-bits';

const POOL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Badge over a pool picture: example-consumed letters get a red strikethrough. */
function PoolLetterBadge({ letter, usedByExample }: { letter: string; usedByExample?: string }) {
  const used = letter === usedByExample;
  return (
    <span
      className={
        used
          ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500 line-through decoration-red-600 decoration-2'
          : 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white'
      }
    >
      {letter}
    </span>
  );
}

function ExampleBlock({ example, images }: { example: ExerciseExample; images: Record<string, LessonExerciseImage> }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl bg-blue-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {t('exercises.example')}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {example.imageRef && images[example.imageRef] && (
          <ExerciseImageSlot image={images[example.imageRef]} compact />
        )}
        <SentenceText hanzi={example.hanzi} pinyin={example.pinyin} />
        {example.answer && <span className="chinese-text text-sm font-semibold text-blue-700">→ {example.answer}</span>}
      </div>
    </div>
  );
}

/**
 * Shared picture-pool exercises: 听力第二部分, 阅读第一部分 (sentence → pick
 * A-F) and 汉字第二部分 (word → pick A-F). Item text is optional per variant.
 */
export function PicturePoolBody({ payload, images, answers, onAnswer, checked }: ExerciseRendererProps) {
  const refs = payloadOptionsAsRefs(payload.options);
  // Letter consumed by the example (book crosses it out): strike its picture
  // badge and stop offering it as an answer choice.
  const exampleAnswer =
    payload.example != null ? (payload.example as ExerciseExample).answer : undefined;
  const usedByExample =
    typeof exampleAnswer === 'string' && POOL_LETTERS.includes(exampleAnswer) ? exampleAnswer : undefined;
  return (
    <div className="space-y-4">
      {payload.example != null && (
        <ExampleBlock example={payload.example as ExerciseExample} images={images} />
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {refs.map((ref, i) => (
          <div key={ref} className="space-y-1">
            <PoolLetterBadge letter={POOL_LETTERS[i]} usedByExample={usedByExample} />
            {images[ref] ? (
              <ExerciseImageSlot image={images[ref]} compact />
            ) : (
              <p className="text-xs text-red-500">{ref}</p>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {payload.items.map((item) => {
          const chosen = answers[item.label];
          const correct = checked && isItemCorrect(item, chosen);
          return (
            <div
              key={item.label}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                {item.label}
              </span>
              {(item.hanzi || item.pinyin) && (
                <div className="min-w-0 flex-1">
                  <SentenceText hanzi={item.hanzi} pinyin={item.pinyin} />
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {POOL_LETTERS.slice(0, refs.length).map((letter) => (
                  <LetterButton
                    key={letter}
                    value={letter}
                    label={
                      letter === usedByExample ? (
                        <span className="line-through decoration-red-600 decoration-2">{letter}</span>
                      ) : undefined
                    }
                    selected={chosen === letter}
                    correct={checked && chosen === letter && item.answer === letter}
                    wrong={checked && chosen === letter && item.answer !== letter}
                    disabled={letter === usedByExample}
                    onClick={() => onAnswer(item.label, letter)}
                  />
                ))}
              </div>
              {checked && item.answer !== undefined && (
                <span className="flex items-center">
                  <AnswerMark correct={correct} />
                  <span className="ml-1 text-sm text-gray-500">{String(item.answer)}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
