import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth-store';
import LoginPage from './pages/auth/login-page';
import RegisterPage from './pages/auth/register-page';
import DashboardPage from './pages/dashboard/dashboard-page';
import HskListPage from './pages/hsk/hsk-list-page';
import HskDetailPage from './pages/hsk/hsk-detail-page';
import LessonLearnPage from './pages/lessons/lesson-learn-page';
import LegacyLessonRedirect from './pages/lessons/legacy-lesson-redirect';
import ProfilePage from './pages/profile/profile-page';
import { VocabularyStudyPage } from './pages/vocabulary/vocabulary-study-page';
import { ReviewDashboardPage } from './pages/vocabulary/review-dashboard-page';
import { ProtectedLayout } from './components/layout/protected-layout';
import ImportPasswordGate from './pages/import/import-password-gate';
import { TodaySessionPage } from './pages/today/today-session-page';

// Component to serve static files
function StaticFileRedirect() {
  const location = useLocation();
  // Redirect to the static file directly
  useEffect(() => {
    window.location.href = location.pathname + location.search + location.hash;
  }, [location]);
  return null;
}

// Route guard to allow static files and redirect others
function RouteGuard() {
  const location = useLocation();

  // Allow bt-demo static files to pass through
  if (location.pathname.startsWith('/bt-demo/')) {
    return <StaticFileRedirect />;
  }

  // Redirect everything else to dashboard
  return <Navigate to="/dashboard" replace />;
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper (redirect to homepage if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Check authentication on app mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading while checking auth on initial load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Public import route behind a soft passphrase gate */}
        <Route path="/import" element={<ImportPasswordGate />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="today" element={<TodaySessionPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="hsk" element={<HskListPage />} />
          <Route path="hsk/:id" element={<HskDetailPage />} />
          <Route path="lessons/:lessonId" element={<LegacyLessonRedirect />} />
          <Route path="lessons/:lessonId/exercises" element={<LegacyLessonRedirect />} />
          <Route path="learn/:lessonId" element={<LessonLearnPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="vocabulary/study" element={<VocabularyStudyPage />} />
          <Route path="vocabulary/review" element={<ReviewDashboardPage />} />
        </Route>

        {/* Catch all - redirect to dashboard, but exclude bt-demo static files */}
        <Route
          path="*"
          element={
            <RouteGuard />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
