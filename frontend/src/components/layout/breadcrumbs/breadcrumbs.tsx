import { useLocation, Link } from 'react-router-dom';
import { cn } from '../../../utils/cn';

// Route configuration for breadcrumbs
interface BreadcrumbConfig {
  path: string;
  label: string;
  icon?: string;
}

const breadcrumbMap: Record<string, BreadcrumbConfig> = {
  '/dashboard': { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  '/hsk': { path: '/hsk', label: 'HSK Levels', icon: '📚' },
  '/vocabulary': { path: '/vocabulary', label: 'Vocabulary', icon: '📇' },
  '/lessons': { path: '/lessons', label: 'Lessons', icon: '📖' },
  '/profile': { path: '/profile', label: 'Profile', icon: '👤' },
  '/import': { path: '/import', label: 'Import', icon: '📤' },
};

// Get parent paths for nested routes
function getParentPath(pathname: string): string[] {
  const paths: string[] = [];
  const segments = pathname.split('/').filter(Boolean);

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Check if this is a dynamic route (contains parameter like :id)
    if (segment.includes(':') || segment.match(/^\d+$/)) {
      // For dynamic routes, use the parent path
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
      if (parentPath && breadcrumbMap[parentPath]) {
        paths.push(parentPath);
      }
    } else if (breadcrumbMap[currentPath]) {
      paths.push(currentPath);
    }
  }

  return paths;
}

// Get label for dynamic routes
function getDynamicLabel(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  // HSK detail page: /hsk/:id
  if (segments[0] === 'hsk' && segments.length === 2) {
    return `HSK ${segments[1]}`;
  }

  // Lesson detail: /lessons/:lessonId
  if (segments[0] === 'lessons' && segments.length === 2) {
    return `Lesson ${segments[1]}`;
  }

  // Vocabulary sub-pages
  if (segments[0] === 'vocabulary' && segments[1] === 'study') {
    return 'Study';
  }
  if (segments[0] === 'vocabulary' && segments[1] === 'review') {
    return 'Review';
  }

  return segments[segments.length - 1] || 'Home';
}

/**
 * Fixed breadcrumbs bar below header
 *
 * Features:
 * - Fixed position below header (top-16)
 * - Full width with backdrop blur
 * - Integrated with header design
 * - Card-style breadcrumb items
 * - Dark mode support
 */
export function Breadcrumbs() {
  const location = useLocation();
  const { pathname } = location;

  // Don't show breadcrumbs on dashboard (root protected route)
  if (pathname === '/dashboard' || pathname === '/') {
    return null;
  }

  const parentPaths = getParentPath(pathname);
  const currentLabel = getDynamicLabel(pathname);

  // If we only have dashboard as parent, don't show breadcrumbs for direct children
  if (parentPaths.length === 1 && parentPaths[0] === '/dashboard') {
    return null;
  }

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
        <div className="flex items-center justify-between">
          <ol className="flex items-center gap-1.5 py-3 text-sm">
            {/* Dashboard / Home link */}
            <li>
              <Link
                to="/dashboard"
                className={cn(
                  'flex items-center gap-1.5',
                  'text-muted hover:text-foreground',
                  'transition-all duration-150',
                  'hover:scale-105',
                  'px-2 py-1.5 rounded-lg',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                )}
              >
                <span className="text-base" aria-hidden="true">🏠</span>
                <span className="font-medium">Home</span>
              </Link>
            </li>

            {/* Separator */}
            {parentPaths.length > 0 && (
              <li>
                <span
                  className="text-gray-300 dark:text-gray-600 px-0.5"
                  aria-hidden="true"
                >
                  /
                </span>
              </li>
            )}

            {/* Parent paths */}
            {parentPaths.map((path, index) => {
              const config = breadcrumbMap[path];
              if (!config || path === '/dashboard') return null;

              const isLastParent = index === parentPaths.length - 1;

              return (
                <li key={path} className="flex items-center">
                  <Link
                    to={path}
                    className={cn(
                      'flex items-center gap-1.5',
                      'text-muted hover:text-foreground',
                      'transition-all duration-150',
                      'hover:scale-105',
                      'px-2 py-1.5 rounded-lg',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                    )}
                  >
                    {config.icon && (
                      <span className="text-base" aria-hidden="true">
                        {config.icon}
                      </span>
                    )}
                    <span className="font-medium">{config.label}</span>
                  </Link>

                  {/* Separator between parent items */}
                  {!isLastParent && (
                    <span
                      className="text-gray-300 dark:text-gray-600 px-0.5 ml-0.5"
                      aria-hidden="true"
                    >
                      /
                    </span>
                  )}
                </li>
              );
            })}

            {/* Current page (non-link) */}
            {parentPaths.length > 0 && (
              <>
                <li>
                  <span
                    className="text-gray-300 dark:text-gray-600 px-0.5"
                    aria-hidden="true"
                  >
                    /
                  </span>
                </li>
                <li>
                  <span
                    className={cn(
                      'flex items-center gap-1.5',
                      'px-2.5 py-1 rounded-md',
                      'bg-primary/10 dark:bg-primary/20',
                      'border-l-2 border-l-primary',
                      'text-foreground font-semibold text-sm',
                    )}
                  >
                    {currentLabel}
                  </span>
                </li>
              </>
            )}
          </ol>
        </div>
      </div>
    </nav>
  );
}
