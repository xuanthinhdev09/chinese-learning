import { useState, useEffect } from 'react';
import { useVocabularyStore } from '../../stores/vocabulary-store';
import { useChineseTTS } from '../../hooks/use-chinese-tts';
import { cn } from '../../utils/cn';
import { Button, Badge, CircularProgress, Progress } from '../ui';
import { EmptyStates } from '../common';

// Quality rating options
const QUALITY_OPTIONS = [
  { value: 0, label: 'Again', emoji: '⏰', color: 'bg-destructive hover:bg-red-700', description: 'Ôn lại sau 10 phút' },
  { value: 3, label: 'Hard', emoji: '💪', color: 'bg-warning hover:bg-amber-600', description: 'Cần cố gắng' },
  { value: 4, label: 'Good', emoji: '👍', color: 'bg-accent hover:bg-green-600', description: 'Nhớ khá' },
  { value: 5, label: 'Easy', emoji: '⭐', color: 'bg-primary hover:bg-primary-dark', description: 'Nhớ tốt' },
];

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x', desc: 'Rất chậm' },
  { value: 0.65, label: '0.65x', desc: 'Chậm' },
  { value: 0.8, label: '0.8x', desc: 'Bình thường' },
  { value: 1.0, label: '1.0x', desc: 'Tốc độ gốc' },
  { value: 1.25, label: '1.25x', desc: 'Nhanh' },
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

  const { speak, isSupported: ttsSupported, isSpeaking } = useChineseTTS();

  const [speechRate, setSpeechRate] = useState(0.8);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [resultAnimation, setResultAnimation] = useState<'correct' | 'wrong' | null>(null);

  const current = vocabularies[currentIndex];
  const progress = vocabularies.length > 0 ? `${currentIndex + 1}/${vocabularies.length}` : '0/0';
  const progressPercent = vocabularies.length > 0 ? ((currentIndex + 1) / vocabularies.length) * 100 : 0;

  // Reset animation when card changes
  useEffect(() => {
    setResultAnimation(null);
  }, [currentIndex]);

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

    // Show feedback animation
    setResultAnimation(quality >= 4 ? 'correct' : 'wrong');

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
        <div className="card p-8 text-center">
          <EmptyStates.NoVocabulary />
        </div>
      </div>
    );
  }

  const { english, vietnamese } = getDisplayMeanings();

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      {/* Progress header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted">Tiến trình</span>
          <div className="flex items-center gap-2">
            <CircularProgress value={progressPercent} size={32} showLabel={false} />
            <span className="text-sm font-medium text-foreground">{progress}</span>
          </div>
        </div>
        <Progress value={progressPercent} color="primary" size="md" />
      </div>

      {/* Flashcard */}
      <div className="relative">
        {/* Result animation overlay */}
        {resultAnimation && (
          <div className={cn(
            'absolute inset-0 z-20 flex items-center justify-center rounded-lg pointer-events-none animate-bounce-in',
            resultAnimation === 'correct' ? 'bg-accent/20' : 'bg-destructive/20'
          )}>
            <div className="text-6xl">
              {resultAnimation === 'correct' ? '✅' : '❌'}
            </div>
          </div>
        )}

        {/* Card */}
        <div
          onClick={flipCard}
          className={cn(
            'card cursor-pointer relative overflow-hidden',
            'transition-all duration-300 ease-out',
            'hover:shadow-lg'
          )}
          style={{ minHeight: '320px', perspective: '1000px' }}
        >
          <div
            className={cn(
              'relative w-full transition-transform duration-300',
              isFlipped ? 'rotate-y-180' : ''
            )}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 backface-hidden p-6 sm:p-8 flex flex-col items-center justify-center"
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
                        className="px-2 py-1 text-xs bg-primary-light text-primary-dark rounded hover:bg-primary hover:text-white transition-colors"
                        title="Tốc độ đọc"
                      >
                        {speechRate}x
                      </button>

                      {showSpeedControl && (
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-border z-10 animate-fade-in">
                          <div className="p-2">
                            <p className="text-xs text-muted mb-2 text-center">Tốc độ đọc</p>
                            {SPEED_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSpeechRate(option.value);
                                  setShowSpeedControl(false);
                                  if (current) {
                                    speak(current.hanzi, option.value);
                                  }
                                }}
                                className={cn(
                                  'w-full px-3 py-2 text-sm rounded mb-1 last:mb-0 transition-colors text-left',
                                  speechRate === option.value
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-background-alt text-foreground'
                                )}
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
                      className={cn(
                        'p-2.5 rounded-lg transition-all duration-150',
                        'bg-gray-100 hover:bg-gray-200 active:scale-95',
                        isSpeaking && 'animate-pulse bg-primary-light'
                      )}
                      title="Phát âm"
                    >
                      <span className="text-lg">{isSpeaking ? '🔊' : '🔈'}</span>
                    </button>
                  </>
                )}
              </div>

              {/* HSK Code */}
              {current.hskCode && (
                <Badge variant="muted" className="mb-3">
                  {current.hskCode}
                </Badge>
              )}

              {/* Simplified - Large */}
              <h2 className="text-5xl sm:text-6xl font-bold text-foreground mb-4 chinese-text tracking-wide">
                {current.hanzi}
              </h2>

              {/* Traditional - Small */}
              {current.traditional && current.traditional !== current.hanzi && (
                <p className="text-lg text-muted mb-4 chinese-text">
                  {current.traditional}
                </p>
              )}

              {/* Pinyin */}
              <p className="text-xl sm:text-2xl text-primary mb-3 font-light">
                {current.pinyin}
              </p>

              {/* POS */}
              {current.pos && (
                <Badge variant="muted" className="text-xs">
                  {current.pos}
                </Badge>
              )}

              {/* Hint */}
              <p className="text-sm text-muted mt-8 flex items-center gap-2">
                <span>👆</span>
                <span>Click để lật thẻ</span>
              </p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 backface-hidden p-6 sm:p-8 flex flex-col items-center justify-center bg-background-alt"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Original word */}
              <h3 className="text-xl font-bold text-foreground mb-3 chinese-text">
                {current.hanzi}
              </h3>

              {/* Pinyin */}
              <p className="text-lg text-primary mb-4 font-light">
                {current.pinyin}
              </p>

              {/* Divider */}
              <div className="w-16 h-0.5 bg-border rounded mb-4" />

              {/* Meanings */}
              <div className="text-center w-full space-y-4">
                {vietnamese && (
                  <div className="animate-slide-up">
                    <p className="text-xs text-muted mb-1 uppercase tracking-wide">Nghĩa tiếng Việt</p>
                    <p className="text-xl font-semibold text-foreground chinese-text">
                      {vietnamese}
                    </p>
                  </div>
                )}

                {english && english !== vietnamese && (
                  <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
                    <p className="text-xs text-muted mb-1 uppercase tracking-wide">English</p>
                    <p className="text-lg text-foreground">
                      {english}
                    </p>
                  </div>
                )}

                {!vietnamese && !english && current.meaning && (
                  <div className="animate-slide-up">
                    <p className="text-xs text-muted mb-1 uppercase tracking-wide">Meaning</p>
                    <p className="text-xl font-semibold text-foreground chinese-text">
                      {current.meaning}
                    </p>
                  </div>
                )}
              </div>

              {/* Example */}
              {current.example && (
                <div className="w-full mt-4 pt-4 border-t border-border animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <p className="text-xs text-muted mb-2 uppercase tracking-wide">Example</p>
                  <p className="text-foreground text-sm chinese-text leading-relaxed">
                    {current.example}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons - show when flipped */}
      {isFlipped && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <p className="text-sm text-center text-muted font-medium">
            Bạn nhớ từ này thế nào?
          </p>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {QUALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate(option.value);
                }}
                disabled={isSavingProgress}
                className={cn(
                  'px-3 py-3 sm:px-4 sm:py-4 rounded-lg text-white transition-all duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                  'hover:shadow-md active:scale-95 hover:-translate-y-0.5',
                  option.color
                )}
                title={option.description}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <span className="text-xl sm:text-2xl">{option.emoji}</span>
                  <span className="text-xs sm:text-sm font-semibold">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
          {progressError && (
            <p className="text-sm text-destructive text-center animate-shake">{progressError}</p>
          )}
        </div>
      )}

      {/* Navigation - hide when rating */}
      {!isFlipped && (
        <div className="flex justify-between gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              previousCard();
            }}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            ← Trước
          </Button>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              nextCard();
            }}
            disabled={currentIndex >= vocabularies.length - 1}
            className="flex-1"
          >
            Tiếp →
          </Button>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted">
          Phím tắt: <kbd className="px-1.5 py-0.5 bg-background-alt rounded text-foreground">Space</kbd> lật thẻ •
          <kbd className="px-1.5 py-0.5 bg-background-alt rounded text-foreground ml-1">1-4</kbd> đánh giá
        </p>
      </div>
    </div>
  );
}
