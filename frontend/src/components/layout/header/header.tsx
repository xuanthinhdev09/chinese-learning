import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth-store';
import { Button } from '../../ui/button/button';
import { cn } from '../../../utils/cn';

export interface HeaderProps {
  className?: string;
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className = '' }, ref) => {
    const navigate = useNavigate();
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
                <span className="text-2xl">🇨🇳</span>
                <span className="font-display font-semibold text-xl text-foreground">
                  HSK Learning
                </span>
              </button>
            </div>

            {/* Navigation */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/hsk')}
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  HSK Levels
                </button>
                <button
                  onClick={() => navigate('/vocabulary/study')}
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Vocabulary
                </button>
                <button
                  onClick={() => navigate('/vocabulary/review')}
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Review
                </button>
              </nav>
            )}

            {/* User menu */}
            {isAuthenticated && (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-sm text-muted">
                  {user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
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
