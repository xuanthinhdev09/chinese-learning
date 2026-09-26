import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { LanguageToggle } from './language-toggle/language-toggle';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile menu: hồ sơ + language toggle. 3 nút nav chính đã bỏ theo thiết kế
 * luồng học mới (trang chủ là điểm vào duy nhất).
 */
export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed top-16 left-0 right-0 bottom-0 bg-gray-50 dark:bg-gray-900 z-50',
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
                    {t('nav.welcomeBack')}
                  </p>
                  <p className="text-xs text-muted">
                    {t('nav.viewProfile')}
                  </p>
                </div>
                <span className="text-muted" aria-hidden="true">→</span>
              </button>
            </section>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Language Switcher */}
            <section className="flex flex-col gap-2">
              <LanguageToggle className="self-start" />
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
              {t('nav.closeMenu')}
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
