import { useTranslation } from 'react-i18next';
import { ExerciseRendererProps } from './exercise-types';
import { ExerciseImageSlot } from './exercise-image-slot';

const DRILL_TYPE_LABELS: Record<string, string> = {
  word_stress: 'Trọng âm từ',
  sentence_stress: 'Trọng âm câu',
  sentence_intonation: 'Ngữ điệu câu',
  rising_intonation: 'Ngữ điệu lên',
  stress_and_intonation: 'Trọng âm + ngữ điệu',
};

/** 语音 drill (bài 3-15): oral practice, no gradable answer — listen & repeat. */
export function DrillBody({ payload }: ExerciseRendererProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {payload.drillType && (
        <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
          {DRILL_TYPE_LABELS[payload.drillType] ?? payload.drillType} · {t('exercises.noAnswer')}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {payload.items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center shadow-sm"
          >
            <p className="chinese-text text-base text-gray-900">{item.hanzi}</p>
            <p className="text-xs italic text-blue-700">{item.pinyin}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 汉字第三部分: stroke-order strip image + the character to copy. */
export function StrokeOrderBody({ payload, images }: ExerciseRendererProps) {
  return (
    <div className="space-y-3">
      {payload.items.map((item) => (
        <div key={item.label} className="rounded-xl border border-gray-200 p-3">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="chinese-text text-xl font-semibold text-gray-900">{item.hanzi}</span>
            <span className="text-sm italic text-blue-700">{item.pinyin}</span>
          </div>
          {item.imageRef && images[item.imageRef] && (
            <ExerciseImageSlot image={images[item.imageRef]} />
          )}
        </div>
      ))}
    </div>
  );
}
