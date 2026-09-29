import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/auth-store';
import { Button } from '../../ui/button/button';
import {
  Dropdown,
  DropdownHeader,
  DropdownItem,
  DropdownSeparator,
} from '../../ui/dropdown/dropdown';
import { LanguageToggle } from '../language-toggle/language-toggle';
import { cn } from '../../../utils/cn';
import { UserAvatar } from '../user-avatar';

export interface HeaderProps {
  className?: string;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className = '', onMobileMenuToggle, isMobileMenuOpen = false }, ref) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isAuthenticated, user, logout } = useAuthStore();

    const handleLogout = async () => {
      await logout();
      navigate('/login');
    };

    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60',
          className
        )}
      >
        <div className="container-custom">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span className="font-display font-semibold text-xl text-foreground">
                  HSK Learning
                </span>
              </button>
            </div>

            {/* Mobile Hamburger Menu */}
            {isAuthenticated && onMobileMenuToggle && (
              <button
                onClick={onMobileMenuToggle}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={t('nav.toggleMenu')}
                aria-expanded={isMobileMenuOpen}
              >
                <div className="w-6 h-5 flex flex-col justify-center gap-1.5">
                  <span
                    className={`block h-0.5 w-6 bg-foreground transition-all ${
                      isMobileMenuOpen ? 'translate-y-2 rotate-45' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-6 bg-foreground transition-all ${
                      isMobileMenuOpen ? 'opacity-0' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-6 bg-foreground transition-all ${
                      isMobileMenuOpen ? '-translate-y-2 -rotate-45' : ''
                    }`}
                  />
                </div>
              </button>
            )}

            {/* User menu — chỉ avatar, tên + hành động trong dropdown */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <LanguageToggle />
                <Dropdown
                  align="end"
                  trigger={
                    <button
                      type="button"
                      className="rounded-full focus:outline-none"
                      aria-label={t('nav.profile')}
                    >
                      <UserAvatar user={user ?? undefined} />
                    </button>
                  }
                >
                  <DropdownHeader>{user?.email}</DropdownHeader>
                  <DropdownSeparator />
                  <DropdownItem onClick={() => navigate('/profile')}>
                    {t('nav.profile')}
                  </DropdownItem>
                  <DropdownItem danger onClick={handleLogout}>
                    {t('nav.logout')}
                  </DropdownItem>
                </Dropdown>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <LanguageToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  {t('nav.login')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  {t('nav.signUp')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';
