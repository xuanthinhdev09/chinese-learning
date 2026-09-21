import { ExerciseRendererProps, isItemCorrect } from './exercise-types';
import { AnswerMark, LetterButton } from './exercise-bits';

/**
 * 语音第一部分 (bài 1-2): hear one word of a near-identical pinyin pair and
 * mark which one was spoken — options are the two printed pinyin spellings.
 */
export function PinyinPairBody({ payload, answers, onAnswer, checked }: ExerciseRendererProps) {
  return (
    <div className="space-y-2">
      {payload.items.map((item) => {
        const pair = Array.isArray(item.options) ? (item.options as string[]) : [];
        const chosen = answers[item.label];
        const correct = checked && isItemCorrect(item, chosen);
        return (
          <div
            key={item.label}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 p-2.5"
          >
            <span className="w-10 shrink-0 text-sm font-semibold text-gray-600">{item.label}</span>
            <div className="flex gap-2">
              {pair.map((pinyin, i) => {
                const value = String(i + 1);
                return (
                  <LetterButton
                    key={value}
                    value={value}
                    label={<span className="italic">{pinyin}</span>}
                    selected={chosen === value}
                    correct={checked && chosen === value && item.answer === value}
                    wrong={checked && chosen === value && item.answer !== value}
                    onClick={() => onAnswer(item.label, value)}
                  />
                );
              })}
            </div>
            {checked && item.answer !== undefined && (
              <span className="flex items-center">
                <AnswerMark correct={correct} />
                <span className="ml-1 text-sm text-gray-500">
                  {pair[Number(item.answer) - 1] ?? ''}
                </span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
