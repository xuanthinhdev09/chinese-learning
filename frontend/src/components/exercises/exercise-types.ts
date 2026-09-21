import { LessonExerciseImage, OptionText } from '../../api/exercises-api';

/** Answers state: exerciseId -> itemKey -> chosen value ("√"|"X"|letter|"1"|"2"|group label) */
export type AnswersMap = Record<string, Record<string, string>>;
/** Exercises whose "Kiểm tra" was pressed: exerciseId -> true */
export type CheckedMap = Record<string, boolean>;

export interface ExerciseRendererProps {
  /** narrowed by typeCode before dispatch — renderers cast defensively */
  payload: ExerciseRendererPayload;
  /** imageRef -> image row (existence + upload slot) */
  images: Record<string, LessonExerciseImage>;
  answers: Record<string, string>;
  onAnswer: (itemKey: string, value: string) => void;
  checked: boolean;
}

/** Loose payload view shared by all renderers; exact fields per typeCode. */
export interface ExerciseRendererPayload {
  audioFile?: string;
  drillType?: string;
  options?: unknown;
  example?: unknown;
  items: Array<{
    label: string;
    hanzi?: string;
    pinyin?: string;
    vi?: string;
    judgeHanzi?: string;
    judgePinyin?: string;
    radical?: string;
    imageRef?: string;
    options?: unknown;
    answer?: string | string[];
  }>;
}

export function payloadOptionsAsText(payloadOptions: unknown): OptionText[] {
  return Array.isArray(payloadOptions) ? (payloadOptions as OptionText[]) : [];
}

export function payloadOptionsAsRefs(payloadOptions: unknown): string[] {
  return Array.isArray(payloadOptions) ? (payloadOptions as string[]) : [];
}

export function itemOptionsAsText(itemOptions: unknown): OptionText[] {
  return Array.isArray(itemOptions) ? (itemOptions as OptionText[]) : [];
}

/** Shape of payload.example rows: demo sentences shown above the answerable items. */
export interface ExampleJudgeItem {
  label?: string;
  hanzi?: string;
  pinyin?: string;
  vi?: string;
  judgeHanzi?: string;
  judgePinyin?: string;
  imageRef?: string;
  answer?: string;
}

/** Narrows payload.example (typed unknown) to demo rows; [] when absent. */
export function payloadExamples(payload: ExerciseRendererPayload): ExampleJudgeItem[] {
  return Array.isArray(payload.example) ? (payload.example as ExampleJudgeItem[]) : [];
}

/** True when the chosen value matches the item's answer (letters, √/X, 1/2). */
export function isItemCorrect(item: ExerciseRendererPayload['items'][number], chosen?: string): boolean {
  if (item.answer === undefined || chosen === undefined) return false;
  if (Array.isArray(item.answer)) return false;
  return chosen === item.answer;
}

/** Compare the letters collected in a radical group with the answer set. */
export function isRadicalGroupCorrect(
  item: ExerciseRendererPayload['items'][number],
  lettersInGroup: string[],
): boolean {
  if (!Array.isArray(item.answer)) return false;
  const want = [...item.answer].sort().join(',');
  return [...lettersInGroup].sort().join(',') === want;
}
