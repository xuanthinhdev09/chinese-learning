import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { MenuItem } from './menu-item';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modern minimalist mobile menu with card-style items
 *
 * Structure:
 * - User Section (top): Profile card with avatar
 * - Main Navigation: Grouped menu items
 * - Secondary Section: Profile and settings
 * - Close Action: Bottom close button
 */
export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  // Check if route is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Navigation items grouped by section
  const mainNavItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/hsk', icon: '📚', label: 'HSK Levels' },
    { path: '/vocabulary/study', icon: '📇', label: 'Vocabulary' },
    { path: '/vocabulary/review', icon: '🔄', label: 'Review' },
    { path: '/import', icon: '📤', label: 'Import Data' },
  ];

  const secondaryNavItems = [
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed top-16 left-0 right-0 bottom-0 bg-gray-50 dark:bg-gray-900 z-40',
          'transform transition-transform duration-300 ease-in-out md:hidden',
          'overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="container-custom py-6 px-4">
          <nav className="flex flex-col gap-6">
            {/* User Section */}
            <section>
              <button
                onClick={() => handleNavigate('/profile')}
                className={cn(
                  'w-full flex items-center gap-4',
                  'bg-white dark:bg-gray-800',
                  'border border-gray-100 dark:border-gray-700',
                  'rounded-xl px-4 py-4',
                  'shadow-sm',
                  'transition-all duration-200 ease-out',
                  'hover:bg-gray-50 dark:hover:bg-gray-700',
                  'hover:scale-[1.01] hover:shadow-md'
                )}
              >
                {/* Avatar placeholder */}
                <div className={cn(
                  'w-12 h-12 rounded-full',
                  'bg-gradient-to-br from-primary to-secondary',
                  'flex items-center justify-center',
                  'text-white font-semibold text-lg',
                  'flex-shrink-0'
                )}>
                  U
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">
                    Welcome back
                  </p>
                  <p className="text-xs text-muted">
                    View your profile
                  </p>
                </div>
                <span className="text-muted" aria-hidden="true">→</span>
              </button>
            </section>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Main Navigation */}
            <section className="flex flex-col gap-2">
              {mainNavItems.map((item) => (
                <MenuItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => handleNavigate(item.path)}
                  isActive={isActive(item.path)}
                />
              ))}
            </section>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Secondary Navigation */}
            <section className="flex flex-col gap-2">
              {secondaryNavItems.map((item) => (
                <MenuItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => handleNavigate(item.path)}
                  isActive={isActive(item.path)}
                />
              ))}
            </section>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={cn(
                'w-full mt-4',
                'px-4 py-3',
                'text-sm font-medium text-muted',
                'hover:text-foreground',
                'transition-colors duration-150'
              )}
            >
              Close Menu
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
