import { useVocabularyStore } from '../../stores/vocabulary-store';

export function FlashcardCard() {
  const {
    vocabularies,
    currentIndex,
    isFlipped,
    nextCard,
    previousCard,
    flipCard,
  } = useVocabularyStore();

  const current = vocabularies[currentIndex];
  const progress = vocabularies.length > 0 ? `${currentIndex + 1}/${vocabularies.length}` : '0/0';
  const progressPercent = vocabularies.length > 0 ? ((currentIndex + 1) / vocabularies.length) * 100 : 0;

  if (!current) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500">No vocabulary loaded</p>
        </div>
      </div>
    );
  }

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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg cursor-pointer perspective-1000"
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
            {/* HSK Code */}
            {current.hskCode && (
              <span className="text-xs text-gray-500 mb-2">{current.hskCode}</span>
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

            {/* Meaning */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Meaning</p>
              <p className="text-xl text-gray-900 dark:text-white mb-4">
                {current.meaning}
              </p>
            </div>

            {/* Example */}
            {current.example && (
              <div className="text-center w-full">
                <p className="text-sm text-gray-500 mb-1">Example</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{current.example}</p>
              </div>
            )}

            {/* Variants */}
            {current.variants && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Variants</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{current.variants}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
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
