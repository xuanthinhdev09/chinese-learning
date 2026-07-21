import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth-store';
import LoginPage from './pages/auth/login-page';
import RegisterPage from './pages/auth/register-page';
import DashboardPage from './pages/dashboard/dashboard-page';
import HskListPage from './pages/hsk/hsk-list-page';
import HskDetailPage from './pages/hsk/hsk-detail-page';
import LessonDetailPage from './pages/lessons/lesson-detail-page';
import ProfilePage from './pages/profile/profile-page';
import { VocabularyStudyPage } from './pages/vocabulary/vocabulary-study-page';
import { ReviewDashboardPage } from './pages/vocabulary/review-dashboard-page';
import { ProtectedLayout } from './components/layout/protected-layout';
import ImportPage from './pages/import/import-page';

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

// Public route wrapper (redirect to dashboard if authenticated)
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

        {/* Public import route (no auth required) */}
        <Route path="/import" element={<ImportPage />} />

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
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="hsk" element={<HskListPage />} />
          <Route path="hsk/:id" element={<HskDetailPage />} />
          <Route path="lessons/:lessonId" element={<LessonDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="vocabulary/study" element={<VocabularyStudyPage />} />
          <Route path="vocabulary/review" element={<ReviewDashboardPage />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
