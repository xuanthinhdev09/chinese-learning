import { useState } from 'react';
import { Vocabulary } from '../../api/vocabulary-api';

interface QuizFillBlankProps {
  vocabulary: Vocabulary;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
  showResult?: boolean;
  isCorrect?: boolean | null;
}

export function QuizFillBlank({
  vocabulary,
  onAnswer,
  onNext,
  showResult = false,
  isCorrect,
}: QuizFillBlankProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Generate fill-in-the-blank question
  // Format: "我有___个朋友" → Answer options
  const generateQuestion = () => {
    // Simple pattern: just use the character in a common phrase
    return {
      before: '这是',
      after: '什么',
      blank: vocabulary.hanzi,
    };
  };

  const question = generateQuestion();

  // Generate wrong options (similar characters)
  const generateOptions = () => {
    const similarChars = [
      '人', '大', '小', '好', '有', '我', '你', '他', '她',
      '的', '了', '吗', '呢', '吧', '啊', '哦', '嗯',
    ].filter(c => c !== vocabulary.hanzi);

    const wrongOptions = similarChars
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(char => ({
        id: `wrong-${char}`,
        text: char,
        isCorrect: false,
      }));

    const correctOption = {
      id: 'correct',
      text: vocabulary.hanzi,
      isCorrect: true,
    };

    return [...wrongOptions, correctOption]
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
          Điền vào chỗ trống
        </h2>

        <p className="text-4xl text-blue-600 dark:text-blue-400 mb-2">
          {question.before}<span className="border-b-4 border-blue-500 inline-block min-w-[80px] mx-2">
            {selectedOption ? options.find(o => o.id === selectedOption)?.text : '___'}
          </span>{question.after}
        </p>

        <p className="text-gray-600 dark:text-gray-400 mt-4">
          Pinyin: {question.before}<span className="mx-2">___</span>{question.after}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const showCorrect = displayIsCorrect && option.isCorrect;
          const showWrong = displayIsCorrect && isSelected && !option.isCorrect;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={showResult}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
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
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {option.text}
              </span>
              {showCorrect && <span className="ml-2 text-green-500">✓</span>}
              {showWrong && <span className="ml-2 text-red-500">✗</span>}
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
              ✓ Chính xác! "{vocabulary.hanzi}" nghĩa là "{vocabulary.vietnamese || vocabulary.english || vocabulary.meaning}"
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
