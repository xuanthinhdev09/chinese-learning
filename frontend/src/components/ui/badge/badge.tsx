import React from 'react';

export type BadgeVariant = 'primary' | 'accent' | 'warning' | 'destructive' | 'muted';

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'badge-primary',
  accent: 'badge-accent',
  warning: 'badge-warning',
  destructive: 'bg-red-100 text-red-800',
  muted: 'bg-gray-100 text-gray-800',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', className = '', children, ...props }, ref) => {
    const classes = ['badge', variantClasses[variant], className]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
