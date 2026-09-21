import { useTranslation } from 'react-i18next';
import { ExerciseRendererProps, isRadicalGroupCorrect } from './exercise-types';
import { payloadOptionsAsText } from './exercise-types';
import { AnswerMark } from './exercise-bits';

/**
 * 汉字第一部分: classify printed characters (options A-H) into radical
 * groups. A shared pool sits on top — tapping a pool chip sorts it into
 * the active group; tapping a chip inside a group returns it to the pool.
 * Answer state: option letter -> group label ('' = back in the pool).
 */
export function RadicalGroupsBody({ payload, answers, onAnswer, checked }: ExerciseRendererProps) {
  const { t } = useTranslation();
  const options = payloadOptionsAsText(payload.options);
  const groups = payload.items;
  const activeGroupKey = `_active_${groups.map((i) => i.label).join('-')}`;
  // Default to the first group (reading order) until the user picks one.
  const active = answers[activeGroupKey] ?? groups[0]?.label;

  const poolOptions = options.filter((opt) => !answers[opt.letter]);
  const chipBase =
    'chinese-text flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-colors ';

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{t('exercises.radicalHint')}</p>
      {groups.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('exercises.radicalPool')}
          </p>
          <div className="flex flex-wrap gap-2">
            {poolOptions.map((opt) => (
              <button
                key={opt.letter}
                type="button"
                disabled={!active}
                onClick={() => active && onAnswer(opt.letter, active)}
                className={
                  chipBase +
                  (checked
                    ? 'border-gray-200 bg-white text-gray-400'
                    : 'border-gray-300 bg-white text-gray-900 hover:border-blue-400')
                }
              >
                {opt.hanzi}
              </button>
            ))}
            {poolOptions.length === 0 && (
              <p className="text-xs text-gray-400">{t('exercises.radicalPoolEmpty')}</p>
            )}
          </div>
        </div>
      )}
      {groups.map((group) => {
        const lettersInGroup = Object.entries(answers)
          .filter(([key, groupLabel]) => key !== activeGroupKey && groupLabel === group.label)
          .map(([key]) => key);
        const correct = checked && isRadicalGroupCorrect(group, lettersInGroup);
        const isActive = active === group.label;
        const groupOptions = options.filter((opt) => answers[opt.letter] === group.label);
        return (
          <div
            key={group.label}
            className={`rounded-xl border p-3 ${isActive ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200'}`}
          >
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => onAnswer(activeGroupKey, group.label)}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                {group.label}
              </span>
              <span className="chinese-text text-lg font-semibold text-gray-900">
                {group.radical}
              </span>
              {checked && <AnswerMark correct={correct} />}
            </button>
            <div className="mt-2 flex flex-wrap gap-2">
              {groupOptions.map((opt) => {
                const belongsHere =
                  checked && Array.isArray(group.answer) && group.answer.includes(opt.letter);
                return (
                  <button
                    key={opt.letter}
                    type="button"
                    onClick={() => onAnswer(opt.letter, '')}
                    className={
                      chipBase +
                      (belongsHere
                        ? 'border-green-500 bg-green-100 text-green-800'
                        : checked
                          ? 'border-red-400 bg-red-100 text-red-700'
                          : 'border-blue-500 bg-blue-100 text-blue-800')
                    }
                  >
                    {opt.hanzi}
                  </button>
                );
              })}
              {groupOptions.length === 0 && (
                <p className="text-xs text-gray-400">{t('exercises.radicalGroupEmpty')}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
