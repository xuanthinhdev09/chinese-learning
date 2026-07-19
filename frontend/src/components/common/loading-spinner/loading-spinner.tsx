import React from 'react';
import { cn } from '../../../utils/cn';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className = '', text, ...props }, ref) => {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center gap-3" {...props}>
        <div
          className={cn(
            'spinner rounded-full border-solid border-current border-r-transparent animate-spin',
            sizeClasses[size],
            className
          )}
          aria-hidden="true"
        />
        {text && (
          <p className="text-sm text-muted">{text}</p>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export interface PageLoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export const PageLoading = React.forwardRef<HTMLDivElement, PageLoadingProps>(
  ({ text = 'Loading...', fullScreen = false }, ref) => {
    const content = (
      <div
        ref={ref}
        className={fullScreen ? 'min-h-screen flex items-center justify-center' : 'py-12'}
      >
        <LoadingSpinner size="lg" text={text} />
      </div>
    );

    return content;
  }
);

PageLoading.displayName = 'PageLoading';

export interface ButtonLoadingProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const ButtonLoading = React.forwardRef<HTMLSpanElement, ButtonLoadingProps>(
  ({ size = 'sm', className = '' }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'spinner border-current border-r-transparent',
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          className
        )}
        aria-hidden="true"
      />
    );
  }
);

ButtonLoading.displayName = 'ButtonLoading';
