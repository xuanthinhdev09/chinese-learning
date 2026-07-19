import React from 'react';
import { cn } from '../../../utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  className?: string;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center',
          className
        )}
      >
        {icon && (
          <div className="mb-4 text-muted text-6xl" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted max-w-sm mb-6">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150',
              'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              action.variant === 'primary' && 'bg-primary text-white hover:bg-primary-dark px-4 py-2',
              action.variant === 'secondary' && 'bg-secondary text-white hover:bg-opacity-90 px-4 py-2',
              (!action.variant || action.variant === 'ghost') && 'bg-transparent text-foreground hover:bg-background-alt px-4 py-2'
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// Preset empty states for common use cases
export const EmptyStates = {
  NoData: ({ action, className, ...rest }: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="📭"
      title="No data found"
      description="There's nothing here yet. Check back later!"
      action={action}
      className={className}
      {...rest}
    />
  ),

  NoResults: ({ action, className, ...rest }: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="🔍"
      title="No results found"
      description="We couldn't find what you're looking for."
      action={action}
      className={className}
      {...rest}
    />
  ),

  Error: ({ action, className, ...rest }: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description="An error occurred while loading this content."
      action={action}
      className={className}
      {...rest}
    />
  ),

  NoLessons: ({ action, className, ...rest }: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="📚"
      title="No lessons yet"
      description="Lessons will appear here once they're added."
      action={action}
      className={className}
      {...rest}
    />
  ),

  NoVocabulary: ({ action, className, ...rest }: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="📝"
      title="No vocabulary to study"
      description="Start learning to see vocabulary words here."
      action={action}
      className={className}
      {...rest}
    />
  ),
};
