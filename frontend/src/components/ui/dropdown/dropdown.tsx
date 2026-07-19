import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  className?: string;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ trigger, children, align = 'end', className = '' }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => {
      setIsOpen(!isOpen);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    const alignClasses = {
      start: 'left-0',
      end: 'right-0',
      center: 'left-1/2 -translate-x-1/2',
    };

    return (
      <div ref={ref} className={cn('relative', className)}>
        <div
          ref={triggerRef}
          onClick={handleToggle}
          className="cursor-pointer"
        >
          {trigger}
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              'absolute z-50 mt-2 min-w-[8rem] bg-white rounded-md shadow-lg border border-border',
              'animate-bounce-in',
              alignClasses[align]
            )}
          >
            <div className="py-1">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
}

export const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ children, onClick, disabled = false, danger = false, className = '' }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          'w-full text-left px-4 py-2 text-sm transition-colors',
          'focus:outline-none focus:bg-background-alt',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          danger
            ? 'text-destructive hover:bg-destructive/10'
            : 'text-foreground hover:bg-background-alt',
          className
        )}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

interface DropdownSeparatorProps {
  className?: string;
}

export const DropdownSeparator = React.forwardRef<HTMLDivElement, DropdownSeparatorProps>(
  ({ className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('my-1 border-t border-border', className)}
        role="separator"
      />
    );
  }
);

DropdownSeparator.displayName = 'DropdownSeparator';

interface DropdownHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const DropdownHeader = React.forwardRef<HTMLDivElement, DropdownHeaderProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-4 py-2 text-xs font-semibold text-muted uppercase', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownHeader.displayName = 'DropdownHeader';
