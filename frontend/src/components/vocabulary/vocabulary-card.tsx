import { useState } from 'react';
import { Vocabulary } from '../../api/vocabulary-api';
import { useChineseTTS } from '../../hooks/use-chinese-tts';
import { cn } from '../../utils/cn';
import { Badge } from '../ui';

export interface VocabularyCardProps {
  vocabulary: Vocabulary;
  showExample?: boolean;
  onSpeak?: (vocabulary: Vocabulary) => void;
  className?: string;
}

export default function VocabularyCard({
  vocabulary,
  showExample = true,
  onSpeak,
  className = ''
}: VocabularyCardProps) {
  const { speak, isSpeaking } = useChineseTTS();
  const [hasSpoken, setHasSpoken] = useState(false);

  const handleSpeak = () => {
    if (vocabulary.hanzi) {
      speak(vocabulary.hanzi);
      setHasSpoken(true);
      onSpeak?.(vocabulary);
    }
  };

  const wordTypeBadge = vocabulary.wordType ? (
    <Badge variant="muted" className="text-xs">
      {vocabulary.wordType}
    </Badge>
  ) : null;

  return (
    <div className={cn('card-interactive p-6', className)}>
      <div className="text-center">
        {/* Hanzi - Large, prominent */}
        <div className="text-6xl font-bold text-foreground mb-4 chinese-text tracking-wide">
          {vocabulary.hanzi}
        </div>

        {/* Pinyin with tone marks */}
        <div className="text-2xl text-muted mb-3 font-light">
          {vocabulary.pinyin}
        </div>

        {/* Meaning - Vietnamese */}
        <div className="text-xl text-foreground font-semibold mb-4">
          {vocabulary.meaning}
        </div>

        {/* Word type badge */}
        {wordTypeBadge && (
          <div className="mb-4">
            {wordTypeBadge}
          </div>
        )}

        {/* Example sentence */}
        {showExample && vocabulary.example && (
          <div className="mt-4 p-4 bg-background-alt rounded-lg text-left border border-border">
            <div className="text-sm text-foreground chinese-text leading-relaxed">
              {vocabulary.example}
            </div>
          </div>
        )}

        {/* Audio button */}
        <div className="mt-5">
          <button
            onClick={handleSpeak}
            disabled={isSpeaking || !vocabulary.hanzi}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-150',
              'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              vocabulary.hanzi
                ? 'bg-primary-light text-primary-dark hover:bg-primary hover:text-white active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <span className={cn('text-lg', isSpeaking && 'animate-pulse')}>
              {isSpeaking ? '🔊' : '🔈'}
            </span>
            <span>
              {isSpeaking ? 'Đang phát...' : hasSpoken ? 'Nghe lại' : 'Nghe phát âm'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact version for lists
export interface VocabularyCardCompactProps {
  vocabulary: Vocabulary;
  className?: string;
}

export function VocabularyCardCompact({ vocabulary, className = '' }: VocabularyCardCompactProps) {
  const { speak, isSpeaking } = useChineseTTS();

  return (
    <div className={cn('card p-4 hover:shadow-md transition-shadow', className)}>
      <div className="flex items-center gap-4">
        {/* Hanzi */}
        <div className="text-3xl font-bold text-foreground chinese-text min-w-[3rem] text-center">
          {vocabulary.hanzi}
        </div>

        {/* Middle section */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted">{vocabulary.pinyin}</div>
          <div className="text-base font-medium text-foreground truncate">{vocabulary.meaning}</div>
          {vocabulary.wordType && (
            <span className="inline-block mt-1 text-xs text-muted">
              • {vocabulary.wordType}
            </span>
          )}
        </div>

        {/* Audio button */}
        <button
          onClick={() => vocabulary.hanzi && speak(vocabulary.hanzi)}
          disabled={isSpeaking || !vocabulary.hanzi}
          className={cn(
            'p-2 rounded-lg transition-colors',
            vocabulary.hanzi
              ? 'hover:bg-primary-light text-primary'
              : 'text-gray-300 cursor-not-allowed'
          )}
        >
          <span className={cn(isSpeaking && 'animate-pulse')}>
            {isSpeaking ? '🔊' : '🔈'}
          </span>
        </button>
      </div>
    </div>
  );
}
