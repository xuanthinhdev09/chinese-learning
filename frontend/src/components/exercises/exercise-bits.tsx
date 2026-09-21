import { ReactNode } from 'react';

/**
 * Small presentation pieces shared by the exercise renderers: letter
 * buttons, answer marks, and the standard hanzi/pinyin text stack
 * (content sentences stay Vietnamese-free — pinyin only).
 */

export function LetterButton({
  value,
  label,
  selected,
  correct,
  wrong,
  disabled,
  className,
  onClick,
}: {
  value: string;
  label?: ReactNode;
  selected: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  /** extra classes for callers that resize/reshape the button (e.g. flex-1) */
  className?: string;
  onClick: () => void;
}) {
  let cls =
    'flex min-w-9 items-center justify-center rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors ';
  if (correct) cls += 'border-green-500 bg-green-100 text-green-800 ';
  else if (wrong) cls += 'border-red-400 bg-red-100 text-red-700 ';
  else if (selected) cls += 'border-blue-500 bg-blue-100 text-blue-800 ';
  else cls += 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 ';
  if (disabled && !correct && !wrong) cls += 'opacity-60';
  if (className) cls += className;
  return (
    <button type="button" className={cls} disabled={disabled} onClick={onClick}>
      {label ?? value}
    </button>
  );
}

export function AnswerMark({ correct }: { correct: boolean }) {
  return (
    <span className={`ml-2 text-sm font-bold ${correct ? 'text-green-600' : 'text-red-500'}`}>
      {correct ? '✓' : '✗'}
    </span>
  );
}

export function SentenceText({
  hanzi,
  pinyin,
}: {
  hanzi?: string;
  pinyin?: string;
}) {
  return (
    <div className="min-w-0">
      {hanzi && <p className="chinese-text text-base text-gray-900">{hanzi}</p>}
      {pinyin && <p className="text-sm italic text-blue-700">{pinyin}</p>}
    </div>
  );
}
