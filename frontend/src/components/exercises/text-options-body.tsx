import { ExerciseExample } from '../../api/exercises-api';
import {
  ExerciseRendererProps,
  isItemCorrect,
  itemOptionsAsText,
  payloadOptionsAsText,
} from './exercise-types';
import { AnswerMark, LetterButton, SentenceText } from './exercise-bits';

function ExampleBlock({ example }: { example: ExerciseExample }) {
  return (
    <div className="rounded-xl bg-blue-50 p-3">
      <SentenceText hanzi={example.hanzi} pinyin={example.pinyin} />
      {example.answer && <span className="text-sm font-semibold text-blue-700">→ {example.answer}</span>}
    </div>
  );
}

/**
 * Text-option exercises: 听力第三部分 (per-item A/B/C options), 阅读第二部分
 * (shared word bank) and 阅读第四部分 (shared A-F question/response pool).
 */
export function TextOptionsBody({ payload, answers, onAnswer, checked }: ExerciseRendererProps) {
  const bank = payloadOptionsAsText(payload.options);
  // Letter consumed by the example (book crosses it out): strike its bank
  // entry and stop offering it as an answer choice.
  const exampleAnswer =
    payload.example != null ? (payload.example as ExerciseExample).answer : undefined;
  const usedByExample = typeof exampleAnswer === 'string' ? exampleAnswer : undefined;
  return (
    <div className="space-y-4">
      {payload.example != null && <ExampleBlock example={payload.example as ExerciseExample} />}
      {bank.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          {bank.map((opt) => {
            const used = opt.letter === usedByExample;
            return (
              <div
                key={opt.letter}
                className={
                  used
                    ? 'flex items-baseline gap-1 rounded-lg bg-white px-2 py-1 shadow-sm opacity-60'
                    : 'flex items-baseline gap-1 rounded-lg bg-white px-2 py-1 shadow-sm'
                }
              >
                <span
                  className={
                    used
                      ? 'text-xs font-bold text-gray-400 line-through decoration-red-600 decoration-2'
                      : 'text-xs font-bold text-blue-700'
                  }
                >
                  {opt.letter}
                </span>
                <span
                  className={
                    used
                      ? 'chinese-text text-sm text-gray-400 line-through decoration-red-600 decoration-2'
                      : 'chinese-text text-sm text-gray-900'
                  }
                >
                  {opt.hanzi}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {payload.items.map((item) => {
        const options = itemOptionsAsText(item.options).length > 0 ? itemOptionsAsText(item.options) : bank;
        const chosen = answers[item.label];
        const correct = checked && isItemCorrect(item, chosen);
        return (
          <div key={item.label} className="rounded-xl border border-gray-200 p-3">
            <div className="flex flex-wrap items-start gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                {item.label}
              </span>
              <div className="min-w-0 flex-1">
                <SentenceText hanzi={item.hanzi} pinyin={item.pinyin} />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {options.map((opt) => (
                <LetterButton
                  key={opt.letter}
                  value={opt.letter}
                  label={
                    // per-item lettered options (听力第三部分): 2-col grid —
                    // pinyin stacked above the hanzi (shared column, so they
                    // stay aligned), letter on the hanzi's row.
                    bank.length === 0 && opt.hanzi ? (
                      <span className="grid grid-cols-[auto_auto] items-baseline justify-center gap-x-1.5 leading-tight">
                        {opt.pinyin && (
                          <span className="col-start-2 row-start-1 truncate text-[11px] italic opacity-80">
                            {opt.pinyin}
                          </span>
                        )}
                        <span className="col-start-1 row-start-2 text-xs font-bold">
                          {opt.letter}
                        </span>
                        <span className="chinese-text col-start-2 row-start-2">
                          {opt.hanzi}
                        </span>
                      </span>
                    ) : undefined
                  }
                  className={bank.length === 0 && opt.hanzi ? 'min-w-0 flex-1' : undefined}
                  selected={chosen === opt.letter}
                  correct={checked && chosen === opt.letter && item.answer === opt.letter}
                  wrong={checked && chosen === opt.letter && item.answer !== opt.letter}
                  // Shared-bank letters are single-use (the example consumes
                  // one). Per-item A/B/C repeat every question, so the
                  // example's letter stays selectable.
                  disabled={bank.length > 0 && opt.letter === usedByExample}
                  onClick={() => onAnswer(item.label, opt.letter)}
                />
              ))}
              {checked && item.answer !== undefined && (
                <span className="flex items-center">
                  <AnswerMark correct={correct} />
                  <span className="ml-1 text-sm text-gray-500">
                    {String(item.answer)}
                    {bank.length === 0 &&
                      ` = ${options.find((o) => o.letter === item.answer)?.hanzi ?? ''}`}
                  </span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
