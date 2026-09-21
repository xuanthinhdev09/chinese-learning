import { useTranslation } from 'react-i18next';
import { ExerciseRendererProps, payloadExamples } from './exercise-types';
import { isItemCorrect } from './exercise-types';
import { ExerciseImageSlot } from './exercise-image-slot';
import { AnswerMark, LetterButton, SentenceText } from './exercise-bits';

/**
 * √/X exercises: 听力第一部分 (listen + picture per item) and
 * 阅读第三部分 (sentence + judge sentence). Fields are optional per variant.
 */
export function TfJudgeBody({ payload, images, answers, onAnswer, checked }: ExerciseRendererProps) {
  const { t } = useTranslation();
  const examples = payloadExamples(payload);
  return (
    <div className="space-y-4">
      {examples.length > 0 && (
        <div className="space-y-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('exercises.example')}
          </p>
          {examples.map((ex, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                例
              </span>
              {ex.imageRef && images[ex.imageRef] && (
                <ExerciseImageSlot image={images[ex.imageRef]} compact />
              )}
              <div className="min-w-0 flex-1">
                <SentenceText hanzi={ex.hanzi} pinyin={ex.pinyin} />
                {ex.judgeHanzi && (
                  <div className="mt-1">
                    <p className="chinese-text text-base font-medium text-gray-800">
                      * {ex.judgeHanzi}
                    </p>
                    {ex.judgePinyin && (
                      <p className="text-[11px] italic text-blue-700">* {ex.judgePinyin}</p>
                    )}
                  </div>
                )}
              </div>
              {ex.answer && (
                <span className="chinese-text rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-700">
                  {ex.answer}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
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
            {item.imageRef && images[item.imageRef] && (
              <ExerciseImageSlot image={images[item.imageRef]} compact />
            )}
            <div className="min-w-0 flex-1">
              <SentenceText hanzi={item.hanzi} pinyin={item.pinyin} />
              {item.judgeHanzi && (
                <div className="mt-1">
                  <p className="chinese-text text-base font-medium text-gray-800">
                    * {item.judgeHanzi}
                  </p>
                  {item.judgePinyin && (
                    <p className="text-[11px] italic text-blue-700">* {item.judgePinyin}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {['√', 'X'].map((value) => (
                <LetterButton
                  key={value}
                  value={value}
                  selected={chosen === value}
                  correct={checked && chosen === value && item.answer === value}
                  wrong={checked && chosen === value && item.answer !== value}
                  onClick={() => onAnswer(item.label, value)}
                />
              ))}
            </div>
            {checked && item.answer !== undefined && (
              <span className="flex items-center">
                <AnswerMark correct={correct} />
                <span className="chinese-text ml-1 text-sm text-gray-500">= {String(item.answer)}</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
