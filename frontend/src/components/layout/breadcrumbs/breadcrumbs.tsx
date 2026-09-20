import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils/cn';

export interface BreadcrumbConfig {
  /** i18n key cho nhãn crumb — dịch lúc render, không lưu text tĩnh */
  labelKey: string;
  icon?: string;
  /** Đích liên kết của crumb; không set = crumb của trang hiện tại (không bấm được) */
  to?: string;
}

/**
 * Cấu hình breadcrumb theo tiền tố route — tối đa 2 cấp: Home + 1 crumb.
 *
 * Route không nằm trong danh sách → không hiện breadcrumb (trang cấp cao nhất,
 * h1 của trang đã tự định danh — cùng quy ước với /dashboard).
 *
 * Chỉ trỏ link tới route có thật trong App.tsx: /vocabulary và /lessons KHÔNG
 * phải route — trỏ vào đó sẽ rơi vào catch-all và bị đá về dashboard.
 * Trang detail (/hsk/:id, /lessons/:lessonId) quay về danh sách HSK vì lesson
 * luôn thuộc một course HSK.
 */
const crumbByPrefix: Array<{ prefix: string } & BreadcrumbConfig> = [
  { prefix: '/vocabulary/study', labelKey: 'nav.vocabulary', icon: '📇' },
  { prefix: '/vocabulary/review', labelKey: 'nav.review', icon: '🔁' },
  { prefix: '/hsk/', labelKey: 'nav.hskLevels', icon: '📚', to: '/hsk' },
  { prefix: '/lessons/', labelKey: 'nav.hskLevels', icon: '📚', to: '/hsk' },
];

/** Crumb cho pathname, hoặc null nếu trang không có breadcrumb. Nguồn chuẩn duy nhất — ProtectedLayout cũng dùng để tính padding. */
export function getBreadcrumb(pathname: string): BreadcrumbConfig | null {
  return crumbByPrefix.find((c) => pathname.startsWith(c.prefix)) ?? null;
}

const linkChipClass = cn(
  'flex items-center gap-1.5',
  'text-muted hover:text-foreground',
  'transition-all duration-150',
  'hover:scale-105',
  'px-2 py-1.5 rounded-lg',
  'hover:bg-gray-100 dark:hover:bg-gray-700'
);

/**
 * Breadcrumbs bar cố định dưới header (top-16)
 *
 * Tối đa 2 chip: Home + crumb của route. Crumb là link nếu route hiện tại là
 * trang detail, còn với trang leaf (study/review) là chip highlight không bấm.
 */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const crumb = getBreadcrumb(pathname);

  if (!crumb) return null;

  return (
    <nav
      className={cn(
        'fixed top-16 left-0 right-0 z-40',
        'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md',
        'border-b border-gray-100 dark:border-gray-700',
        'transition-all duration-200'
      )}
      aria-label="Breadcrumb"
    >
      <div className="container-custom">
        <ol className="flex items-center gap-1.5 py-3 text-sm">
          {/* Home */}
          <li>
            <Link to="/dashboard" className={linkChipClass}>
              <span className="text-base" aria-hidden="true">🏠</span>
              <span className="font-medium">{t('nav.home')}</span>
            </Link>
          </li>

          {/* Separator */}
          <li>
            <span className="text-gray-300 dark:text-gray-600 px-0.5" aria-hidden="true">
              /
            </span>
          </li>

          {/* Crumb của route — link về section hoặc chip hiện tại */}
          <li>
            {crumb.to ? (
              <Link to={crumb.to} className={linkChipClass}>
                {crumb.icon && (
                  <span className="text-base" aria-hidden="true">
                    {crumb.icon}
                  </span>
                )}
                <span className="font-medium">{t(crumb.labelKey)}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  'flex items-center gap-1.5',
                  'px-2.5 py-1 rounded-md',
                  'bg-primary/10 dark:bg-primary/20',
                  'border-l-2 border-l-primary',
                  'text-foreground font-semibold'
                )}
              >
                {crumb.icon && (
                  <span className="text-base" aria-hidden="true">
                    {crumb.icon}
                  </span>
                )}
                {t(crumb.labelKey)}
              </span>
            )}
          </li>
        </ol>
      </div>
    </nav>
  );
}
