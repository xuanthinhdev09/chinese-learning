import { useState } from 'react';
import { useVocabularyStore } from '../../stores/vocabulary-store';
import { useChineseTTS } from '../../hooks/use-chinese-tts';

// Quality rating options
const QUALITY_OPTIONS = [
  { value: 0, label: 'Again', emoji: '⏰', color: 'bg-red-500 hover:bg-red-600', description: 'Ôn lại sau 10 phút' },
  { value: 3, label: 'Hard', emoji: '💪', color: 'bg-orange-500 hover:bg-orange-600', description: 'Cần cố gắng' },
  { value: 4, label: 'Good', emoji: '👍', color: 'bg-green-500 hover:bg-green-600', description: 'Nhớ khá' },
  { value: 5, label: 'Easy', emoji: '⭐', color: 'bg-blue-500 hover:bg-blue-600', description: 'Nhớ tốt' },
];

export function FlashcardCard() {
  const {
    vocabularies,
    currentIndex,
    isFlipped,
    isSavingProgress,
    progressError,
    nextCard,
    previousCard,
    flipCard,
    rateCard,
  } = useVocabularyStore();

  const { speak, isSupported: ttsSupported } = useChineseTTS();

  // Speech rate state
  const [speechRate, setSpeechRate] = useState(0.8);
  const [showSpeedControl, setShowSpeedControl] = useState(false);

  const SPEED_OPTIONS = [
    { value: 0.5, label: '0.5x', desc: 'Rất chậm' },
    { value: 0.65, label: '0.65x', desc: 'Chậm' },
    { value: 0.8, label: '0.8x', desc: 'Bình thường' },
    { value: 1.0, label: '1.0x', desc: 'Tốc độ gốc' },
    { value: 1.25, label: '1.25x', desc: 'Nhanh' },
  ];

  const current = vocabularies[currentIndex];
  const progress = vocabularies.length > 0 ? `${currentIndex + 1}/${vocabularies.length}` : '0/0';
  const progressPercent = vocabularies.length > 0 ? ((currentIndex + 1) / vocabularies.length) * 100 : 0;

  // Get meanings for display
  const getDisplayMeanings = () => {
    if (!current) return { english: '', vietnamese: '' };
    return {
      english: current.english || '',
      vietnamese: current.vietnamese || current.meaning || '',
    };
  };

  const handleRate = async (quality: number) => {
    if (!current) return;
    await rateCard(current.id, quality);
  };

  const handleSpeak = () => {
    if (current) {
      speak(current.hanzi, speechRate);
    }
  };

  if (!current) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No vocabulary loaded</p>
        </div>
      </div>
    );
  }

  const { english, vietnamese } = getDisplayMeanings();

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{progress}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg cursor-pointer perspective-1000 relative"
        onClick={flipCard}
      >
        <div
          className={`relative w-full h-80 transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 backface-hidden p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Header with TTS button and speed control */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {ttsSupported && (
                <>
                  {/* Speed control dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSpeedControl(!showSpeedControl);
                      }}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      title="Tốc độ đọc"
                    >
                      {speechRate}x
                    </button>

                    {showSpeedControl && (
                      <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        <div className="p-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">Tốc độ đọc</p>
                          {SPEED_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSpeechRate(option.value);
                                setShowSpeedControl(false);
                                // Auto-speak when speed changes
                                if (current) {
                                  speak(current.hanzi, option.value);
                                }
                              }}
                              className={`w-full px-3 py-2 text-sm rounded mb-1 last:mb-0 transition-colors ${
                                speechRate === option.value
                                  ? 'bg-blue-500 text-white'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold">{option.label}</span>
                                <span className="text-xs opacity-75">{option.desc}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TTS button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak();
                    }}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Phát âm"
                  >
                    🔊
                  </button>
                </>
              )}
            </div>

            {/* HSK Code */}
            {current.hskCode && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">{current.hskCode}</span>
            )}

            {/* Simplified - Large */}
            <h2 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
              {current.hanzi}
            </h2>

            {/* Traditional - Small */}
            {current.traditional && current.traditional !== current.hanzi && (
              <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">
                {current.traditional}
              </p>
            )}

            {/* Pinyin */}
            <p className="text-2xl text-blue-600 dark:text-blue-400 mb-2">
              {current.pinyin}
            </p>

            {/* POS */}
            {current.pos && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded">
                {current.pos}
              </span>
            )}

            {/* Hint */}
            <p className="text-sm text-gray-400 mt-8">Click to flip</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 backface-hidden p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-750"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Original word */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {current.hanzi}
            </h3>

            {/* Pinyin */}
            <p className="text-lg text-blue-600 dark:text-blue-400 mb-4">
              {current.pinyin}
            </p>

            {/* Meanings */}
            <div className="text-center w-full space-y-3">
              {vietnamese && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nghĩa tiếng Việt</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {vietnamese}
                  </p>
                </div>
              )}

              {english && english !== vietnamese && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">English</p>
                  <p className="text-lg text-gray-700 dark:text-gray-300">
                    {english}
                  </p>
                </div>
              )}

              {/* Legacy meaning fallback */}
              {!vietnamese && !english && current.meaning && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Meaning</p>
                  <p className="text-xl text-gray-900 dark:text-white">
                    {current.meaning}
                  </p>
                </div>
              )}
            </div>

            {/* Example */}
            {current.example && (
              <div className="text-center w-full mt-4">
                <p className="text-sm text-gray-500 mb-1">Example</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{current.example}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons - show when flipped */}
      {isFlipped && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">
            Bạn nhớ từ này thế nào?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {QUALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate(option.value);
                }}
                disabled={isSavingProgress}
                className={`px-3 py-3 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${option.color}`}
                title={option.description}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">{option.emoji}</span>
                  <span className="text-xs font-semibold">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
          {progressError && (
            <p className="text-xs text-red-500 text-center">{progressError}</p>
          )}
        </div>
      )}

      {/* Navigation - hide when rating */}
      {!isFlipped && (
        <div className="flex justify-between mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              previousCard();
            }}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← Previous
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextCard();
            }}
            disabled={currentIndex >= vocabularies.length - 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
