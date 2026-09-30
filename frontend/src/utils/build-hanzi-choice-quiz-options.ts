/**
 * Quiz "cho nghĩa → chọn chữ Hán": tạo 4 đáp án chữ Hán cho một từ.
 * Dùng chung cho PracticeRunner (Today / lesson wizard) và vocabulary-store (QuizCard).
 */

export interface HanziChoiceOption {
  /** id của từ vựng — chấm đúng/sai theo id, không so chuỗi */
  id: string;
  hanzi: string;
  isCorrect: boolean;
}

interface HanziCandidate {
  id: string;
  hanzi: string;
}

export const HANZI_CHOICE_OPTION_COUNT = 4;
const DISTRACTOR_COUNT = HANZI_CHOICE_OPTION_COUNT - 1;

/** Fisher–Yates shuffle, trả mảng mới */
export function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const normalizeMeaning = (meaning: string) => meaning.trim().toLowerCase();

/**
 * Chọn tối đa 3 đáp án nhiễu. Loại từ trùng nghĩa với từ đúng (vd 你/您 cùng
 * "bạn" → 2 đáp án cùng đúng) và không cho 2 đáp án trùng chữ Hán hoặc trùng nghĩa.
 */
export function pickHanziDistractors<T extends HanziCandidate>(
  current: T,
  candidates: T[],
  getMeaning: (item: T) => string,
  /** false = duyệt theo thứ tự gốc → kết quả cố định (dùng cho lacksHanziDistractors) */
  randomize = true
): T[] {
  const usedHanzi = new Set([current.hanzi]);
  const usedMeanings = new Set([normalizeMeaning(getMeaning(current))]);
  const usedIds = new Set([current.id]);
  const picked: T[] = [];

  for (const candidate of randomize ? shuffle(candidates) : candidates) {
    if (picked.length >= DISTRACTOR_COUNT) break;
    const meaning = normalizeMeaning(getMeaning(candidate));
    if (
      !candidate.hanzi ||
      !meaning ||
      usedIds.has(candidate.id) ||
      usedHanzi.has(candidate.hanzi) ||
      usedMeanings.has(meaning)
    ) {
      continue;
    }
    usedIds.add(candidate.id);
    usedHanzi.add(candidate.hanzi);
    usedMeanings.add(meaning);
    picked.push(candidate);
  }
  return picked;
}

/** true nếu pool không đủ 3 đáp án nhiễu hợp lệ cho từ này → cần lấy thêm từ level */
export function lacksHanziDistractors<T extends HanziCandidate>(
  current: T,
  candidates: T[],
  getMeaning: (item: T) => string
): boolean {
  return pickHanziDistractors(current, candidates, getMeaning, false).length < DISTRACTOR_COUNT;
}

/** Tối đa 4 đáp án đã xáo trộn, đúng 1 đáp án isCorrect */
export function buildHanziChoiceOptions<T extends HanziCandidate>(
  current: T,
  candidates: T[],
  getMeaning: (item: T) => string
): HanziChoiceOption[] {
  const distractors = pickHanziDistractors(current, candidates, getMeaning);
  return shuffle([
    { id: current.id, hanzi: current.hanzi, isCorrect: true },
    ...distractors.map((item) => ({ id: item.id, hanzi: item.hanzi, isCorrect: false })),
  ]);
}
