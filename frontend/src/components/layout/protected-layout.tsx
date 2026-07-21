import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from './header/header';
import { MobileMenu } from './mobile-menu';
import { Breadcrumbs } from './breadcrumbs/breadcrumbs';
import { cn } from '../../utils/cn';

export function ProtectedLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasBreadcrumbs, setHasBreadcrumbs] = useState(false);

  // Check if breadcrumbs should be shown for current route
  useEffect(() => {
    const pathname = location.pathname;
    const showBreadcrumbs =
      pathname !== '/dashboard' &&
      pathname !== '/' &&
      // Check if route has a parent path (not direct child of dashboard)
      (pathname.startsWith('/hsk/') ||
       pathname.startsWith('/lessons/') ||
       pathname.startsWith('/vocabulary/') ||
       pathname.includes('/'));

    setHasBreadcrumbs(showBreadcrumbs);
  }, [location.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMobileMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
      <Breadcrumbs />
      <main
        className={cn(
          'container-custom transition-all duration-200',
          hasBreadcrumbs ? 'pt-32 pb-8' : 'py-8'
        )}
      >
        <Outlet />
      </main>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </div>
  );
}
