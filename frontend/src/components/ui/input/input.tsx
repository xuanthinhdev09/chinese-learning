import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  size?: InputSize;
  fullWidth?: boolean;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-9 px-3 py-1.5 text-sm',
  md: 'h-10 px-3 py-2 text-sm',
  lg: 'h-11 px-4 py-2.5 text-base',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, size = 'md', fullWidth = false, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const hasLabel = Boolean(label);

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {hasLabel && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'input',
            sizeClasses[size],
            fullWidth && 'w-full',
            hasError && 'border-destructive focus-visible:ring-destructive',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          {...props}
        />
        {hasError && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
