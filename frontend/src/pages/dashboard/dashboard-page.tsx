import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { PageLoading } from '../../components/common';
import { getDailySession, DailySessionPlan } from '../../api/daily-session';

/**
 * Minimal dashboard: welcome, one-tap "Học hôm nay" hero, and two live stat
 * chips — everything comes from the single getDailySession() call.
 */
export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, checkAuth, isLoading } = useAuthStore();
  const [plan, setPlan] = useState<DailySessionPlan | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Silent failure keeps the page usable — chips fall back to 0
  useEffect(() => {
    let cancelled = false;
    getDailySession()
      .then((freshPlan) => {
        if (!cancelled) setPlan(freshPlan);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <PageLoading text={t('dashboard.loading')} fullScreen />;
  }

  const streak = plan?.streak ?? 0;
  const dueVocabTotal = plan?.dueVocabularyTotal ?? 0;

  return (
    <>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display mb-2">
          {t('dashboard.greeting', { name: user?.username })}
        </h1>
        <p className="text-muted">{t('dashboard.subtitle')}</p>
      </div>

      {/* Hero — one tap to start today's session */}
      <Link to="/today" className="block mb-8 group">
        <div className="rounded-2xl bg-primary text-white px-6 py-8 shadow-lg transition-all group-hover:shadow-xl group-hover:-translate-y-0.5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-primary-light text-sm font-medium mb-1">
                {plan?.completedToday ? t('dashboard.doneToday') : t('dashboard.quickStart')}
              </p>
              <p className="text-2xl sm:text-3xl font-bold font-display">
                {t('dashboard.heroTitle')}
              </p>
            </div>
            <div className="text-right shrink-0">
              {plan && (
                <p className="text-white/90 text-sm font-semibold">{t('dashboard.streakDays', { count: streak })}</p>
              )}
              <span className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-white text-primary font-semibold group-hover:scale-105 transition-transform">
                {t('dashboard.start')}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Live stat chips */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="rounded-xl bg-background-alt px-5 py-4">
          <p className="text-2xl font-bold text-foreground">🔥 {streak}</p>
          <p className="text-sm text-muted">{t('dashboard.streakLabel')}</p>
        </div>
        <div className="rounded-xl bg-background-alt px-5 py-4">
          <p className="text-2xl font-bold text-foreground">📚 {dueVocabTotal}</p>
          <p className="text-sm text-muted">{t('dashboard.dueToday')}</p>
        </div>
      </div>
    </>
  );
}
