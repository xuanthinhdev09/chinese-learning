import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from './header/header';
import { MobileMenu } from './mobile-menu';
import { Breadcrumbs, getBreadcrumb } from './breadcrumbs/breadcrumbs';
import { cn } from '../../utils/cn';

export function ProtectedLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Cùng nguồn chuẩn với thanh breadcrumb để padding khớp bar thật
  const hasBreadcrumbs = getBreadcrumb(location.pathname) !== null;

  return (
    <div className="min-h-screen bg-background">
      <Header onMobileMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
      <Breadcrumbs />
      <main
        className={cn(
          'transition-all duration-200',
          // /today breaks out to the wide container for the dialogue grid
          location.pathname.startsWith('/today') ? 'container-custom-wide' : 'container-custom',
          hasBreadcrumbs ? 'pt-32 pb-8' : 'py-8'
        )}
      >
        <Outlet />
      </main>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </div>
  );
}
