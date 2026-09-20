import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { translateApiError } from '../../utils/translate-api-error';
import { Button, Input } from '../../components/ui';

/** What kind of error is currently shown — string comparison against
 * translated text would break once messages become translatable. */
type ErrorKind = '' | 'mismatch' | 'tooShort' | 'api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState<ErrorKind>('');
  const [isLoading, setIsLoading] = useState(false);

  const showApiError = (err: unknown, fallbackKey: string) => {
    setErrorKind('api');
    setError(translateApiError(err, t) || t(fallbackKey));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorKind('');

    if (password !== confirmPassword) {
      setErrorKind('mismatch');
      setError(t('auth.register.mismatch'));
      return;
    }

    if (password.length < 8) {
      setErrorKind('tooShort');
      setError(t('auth.register.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      await register(email, username, password);
      navigate('/dashboard');
    } catch (err) {
      showApiError(err, 'auth.register.failed');
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
          <p className="mt-2 text-sm text-muted">{t('auth.register.subtitle')}</p>
        </div>

        {/* Register Card */}
        <div className="card-elevated p-8 animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-6">{t('auth.register.title')}</h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="username"
              type="text"
              label={t('auth.register.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              placeholder="username"
              error={error && !username ? t('auth.register.usernameRequired') : ''}
            />

            <Input
              id="email"
              type="email"
              label={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              error={error && !email ? t('auth.register.emailRequired') : ''}
            />

            <Input
              id="password"
              type="password"
              label={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder={t('auth.register.passwordPlaceholder')}
              error={error && !password ? t('auth.register.passwordRequired') : ''}
            />

            <Input
              id="confirmPassword"
              type="password"
              label={t('auth.register.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder={t('auth.register.confirmPlaceholder')}
              error={
                error && !confirmPassword
                  ? t('auth.register.confirmRequired')
                  : errorKind !== 'tooShort' && error && password !== confirmPassword
                  ? t('auth.register.mismatchShort')
                  : ''
              }
            />

            {/* Terms agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-border text-primary focus:ring-primary"
              />
              <label className="text-sm text-muted">
                <Trans
                  i18nKey="auth.register.termsAgreement"
                  components={[
                    <Link to="/terms" className="text-primary hover:underline" />,
                    <Link to="/privacy" className="text-primary hover:underline" />,
                  ]}
                />
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
              className="mt-6"
            >
              {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
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

          {/* Login link */}
          <div className="text-center">
            <span className="text-sm text-muted">{t('auth.register.hasAccount')} </span>
            <Link
              to="/login"
              className="text-sm text-primary font-medium hover:underline ml-1"
            >
              {t('auth.register.loginLink')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            {t('auth.register.footer')}
          </p>
        </div>
      </div>
    </div>
  );
}
