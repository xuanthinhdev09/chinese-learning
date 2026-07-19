import React from 'react';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'accent' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  warning: 'bg-warning',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, className = '', showLabel = false, color = 'primary', size = 'md', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div ref={ref} className="w-full" {...props}>
        <div className="flex items-center justify-between mb-1">
          {showLabel && (
            <span className="text-sm font-medium text-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
        <div className={['progress-bar', sizeClasses[size], className].filter(Boolean).join(' ')} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
          <div
            className={['progress-value', colorClasses[color]].join(' ')}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: 'primary' | 'accent' | 'warning';
  showLabel?: boolean;
}

const circleColorClasses = {
  primary: '#4F46E5',
  accent: '#16A34A',
  warning: '#F59E0B',
};

export const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  (
    {
      value,
      size = 40,
      strokeWidth = 4,
      className = '',
      color = 'primary',
      showLabel = true,
      ...props
    },
    ref
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;
    const strokeColor = circleColorClasses[color];

    return (
      <div className="inline-flex items-center justify-center">
        <svg
          ref={ref}
          width={size}
          height={size}
          className={className}
          {...props}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-600 ease-out"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        {showLabel && (
          <span className="absolute text-xs font-semibold text-foreground">
            {Math.round(value)}%
          </span>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';
