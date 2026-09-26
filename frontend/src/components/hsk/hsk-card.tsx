import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HskLevel } from '../../api/hsk-api';
import { cn } from '../../utils/cn';
import { Progress, Badge } from '../ui';

export interface HskCardProps {
  hsk: HskLevel;
  progress?: number; // 0-100
  locked?: boolean;
  className?: string;
}

const hskColors = {
  1: { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', light: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  2: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', light: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  3: { bg: 'bg-violet-500', hover: 'hover:bg-violet-600', light: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' },
  4: { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', light: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  5: { bg: 'bg-red-500', hover: 'hover:bg-red-600', light: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  6: { bg: 'bg-gray-700', hover: 'hover:bg-gray-800', light: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
};

export default function HskCard({ hsk, progress = 0, locked = false, className = '' }: HskCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const colors = hskColors[hsk.level as keyof typeof hskColors] || hskColors[1];

  // Level chưa import nội dung (0 bài học) — hiển thị mờ, không vào được
  const isEmpty = hsk.lessonCount === 0;
  const isInactive = locked || isEmpty;

  const handleClick = () => {
    if (!isInactive) {
      navigate(`/hsk/${hsk.level}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'card-interactive relative overflow-hidden group',
        isInactive && 'opacity-60 cursor-not-allowed hover:shadow-sm hover:translate-y-0',
        className
      )}
    >
      {/* Progress indicator at top */}
      {progress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
          <div
            className={cn('h-full transition-all duration-600', colors.bg)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
          <span className="text-4xl" aria-hidden="true">🔒</span>
        </div>
      )}

      <div className="p-6">
        {/* Header with level badge */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-14 h-14 rounded-lg flex items-center justify-center transition-colors', colors.bg, colors.hover)}>
            <span className="text-white text-2xl font-bold font-display">{hsk.level}</span>
          </div>
          <Badge
            variant={isInactive ? 'muted' : 'accent'}
            className="text-xs"
          >
            {isEmpty ? t('hsk.noContent') : t('hsk.lessonCount', { count: hsk.lessonCount })}
          </Badge>
        </div>

        {/* Title and description */}
        <h3 className="text-xl font-semibold text-foreground mb-2 chinese-text group-hover:text-primary transition-colors">
          {hsk.name}
        </h3>
        {hsk.description && (
          <p className="text-muted text-sm line-clamp-2">{hsk.description}</p>
        )}

        {/* Progress info */}
        {progress > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className={cn('font-medium', colors.text)}>{t('hsk.percentComplete', { percent: progress })}</span>
              <span className="text-muted">{t('hsk.lessonsDone', { done: Math.round((hsk.lessonCount * progress) / 100), total: hsk.lessonCount })}</span>
            </div>
            <Progress value={progress} color={hsk.level <= 2 ? 'primary' : 'warning'} size="sm" />
          </div>
        )}

        {/* Start/Continue button */}
        {!isInactive && (
          <div className="mt-4 pt-4">
            <span className={cn(
              'inline-flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform',
              colors.text
            )}>
              {progress > 0 ? t('hsk.continue') : t('hsk.start')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
