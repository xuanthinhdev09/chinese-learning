import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { translateApiError } from '../../utils/translate-api-error';
import { Button, Input } from '../../components/ui';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(translateApiError(err, t) || t('auth.login.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-light via-white to-background-alt">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-4xl chinese-text">中</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground font-display">Chinese Learning</h1>
          <p className="mt-2 text-sm text-muted">{t('auth.login.tagline')}</p>
        </div>

        {/* Login Card */}
        <div className="card-elevated p-8 animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-6">{t('auth.login.title')}</h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              type="email"
              label={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              error={error && !email ? t('auth.login.emailRequired') : ''}
            />

            <Input
              id="password"
              type="password"
              label={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              error={error && !password ? t('auth.login.passwordRequired') : ''}
            />

            <div className="flex justify-end text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline">
                {t('auth.login.forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
              className="mt-6"
            >
              {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted">{t('auth.or')}</span>
            </div>
          </div>

          {/* Register link */}
          <div className="text-center">
            <span className="text-sm text-muted">{t('auth.login.noAccount')} </span>
            <Link
              to="/register"
              className="text-sm text-primary font-medium hover:underline ml-1"
            >
              {t('auth.login.registerLink')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            <Trans
              i18nKey="auth.continueAgreement"
              components={[
                <Link to="/terms" className="text-primary hover:underline" />,
                <Link to="/privacy" className="text-primary hover:underline" />,
              ]}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
