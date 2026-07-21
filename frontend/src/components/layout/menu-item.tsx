import React from 'react';
import { cn } from '../../utils/cn';

export interface MenuItemProps {
  icon?: string;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Modern minimalist menu item with card-style design
 *
 * Features:
 * - Card-style with subtle shadow and border
 * - Hover/active states with scale and background change
 * - Active route indicator (left border accent)
 * - Touch-friendly target (44px+)
 * - Icon + text layout with proper spacing
 */
export const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ icon, label, onClick, isActive = false, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          // Base layout
          'w-full text-left flex items-center gap-3',
          // Card styling
          'bg-white dark:bg-gray-800',
          'border border-gray-100 dark:border-gray-700',
          'rounded-xl',
          // Spacing (comfortable touch target)
          'px-4 py-4 min-h-[44px]',
          // Shadow
          'shadow-sm',
          // Transitions
          'transition-all duration-200 ease-out',
          // Hover state
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'hover:border-primary/20 dark:hover:border-primary/30',
          'hover:scale-[1.02]',
          'hover:shadow-md',
          // Active state
          isActive && [
            'bg-primary/5 dark:bg-primary/10',
            'border-l-4 border-l-primary',
            'border-t border-r border-b border-primary/20',
          ],
          className
        )}
        {...props}
      >
        {icon && (
          <span className="text-xl flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={cn(
          'text-base font-medium text-foreground',
          isActive && 'font-semibold text-primary'
        )}>
          {label || children}
        </span>
      </button>
    );
  }
);

MenuItem.displayName = 'MenuItem';
