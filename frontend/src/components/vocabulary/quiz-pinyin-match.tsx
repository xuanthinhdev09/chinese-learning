import { useState } from 'react';
import { Vocabulary } from '../../api/vocabulary-api';

interface QuizPinyinMatchProps {
  vocabulary: Vocabulary;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
  showResult?: boolean;
  isCorrect?: boolean | null;
}

export function QuizPinyinMatch({
  vocabulary,
  onAnswer,
  onNext,
  showResult = false,
  isCorrect,
}: QuizPinyinMatchProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Generate pinyin options with similar sounds
  const generateOptions = () => {
    const basePinyin = vocabulary.pinyin;

    // Create wrong options by changing tone
    const tones = ['ā', 'á', 'ǎ', 'à'];
    const getBaseChar = (pinyin: string) => {
      const match = pinyin.match(/^([a-zA-Z]+)/);
      return match ? match[1] : pinyin;
    };

    const getToneVariant = (base: string, toneChar: string) => {
      return base.charAt(0) + toneChar + base.slice(1);
    };

    const wrongOptions: Array<{ id: string; text: string; isCorrect: boolean }> = [];

    // Generate tone variations
    const base = getBaseChar(basePinyin);
    tones.forEach((tone, idx) => {
      const variant = getToneVariant(base, tone);
      if (variant !== basePinyin && wrongOptions.length < 3) {
        wrongOptions.push({
          id: `wrong-${idx}`,
          text: variant,
          isCorrect: false,
        });
      }
    });

    // Fill remaining wrong options if needed
    while (wrongOptions.length < 3) {
      wrongOptions.push({
        id: `wrong-${wrongOptions.length + 1}`,
        text: basePinyin + (wrongOptions.length + 1),
        isCorrect: false,
      });
    }

    const correctOption = {
      id: 'correct',
      text: basePinyin,
      isCorrect: true,
    };

    return [...wrongOptions.slice(0, 3), correctOption]
      .sort(() => Math.random() - 0.5)
      .map((opt, idx) => ({ ...opt, id: `option-${idx}` }));
  };

  const options = generateOptions();

  const handleSubmit = () => {
    if (!selectedOption) return;
    const selected = options.find(opt => opt.id === selectedOption);
    onAnswer(selected?.isCorrect || false);
  };

  const handleSelect = (id: string) => {
    if (showResult) return;
    setSelectedOption(id);
  };

  const displayIsCorrect = showResult && isCorrect !== null;
  const correctOption = options.find(opt => opt.isCorrect);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      {/* Question */}
      <div className="text-center mb-8">
        {vocabulary.hskCode && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">{vocabulary.hskCode}</span>
        )}

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Chọn Pinyin đúng
        </h2>

        <div className="mb-6">
          <p className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {vocabulary.hanzi}
          </p>

          {vocabulary.traditional && vocabulary.traditional !== vocabulary.hanzi && (
            <p className="text-xl text-gray-500 dark:text-gray-400">
              {vocabulary.traditional}
            </p>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Pinyin của từ này là gì?
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const showCorrect = displayIsCorrect && option.isCorrect;
          const showWrong = displayIsCorrect && isSelected && !option.isCorrect;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={showResult}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${
                showCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : ''
              } ${
                showWrong
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : ''
              } ${
                showResult ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {option.text}
                </span>
                {showCorrect && <span className="text-green-500 text-2xl">✓</span>}
                {showWrong && <span className="text-red-500 text-2xl">✗</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit / Next button */}
      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={!selectedOption}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
        >
          Gửi câu trả lời
        </button>
      ) : (
        <button
          onClick={onNext}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Câu tiếp theo →
        </button>
      )}

      {/* Result feedback */}
      {displayIsCorrect && (
        <div className="mt-4 text-center">
          {isCorrect ? (
            <p className="text-green-600 dark:text-green-400 font-semibold">
              ✓ Chính xác! {vocabulary.hanzi} đọc là "{correctOption?.text}" - {vocabulary.vietnamese || vocabulary.english || vocabulary.meaning}
            </p>
          ) : (
            <p className="text-red-600 dark:text-red-400 font-semibold">
              ✗ Đáp án đúng là "{correctOption?.text}" - {vocabulary.hanzi} ({vocabulary.vietnamese || vocabulary.english || vocabulary.meaning})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
