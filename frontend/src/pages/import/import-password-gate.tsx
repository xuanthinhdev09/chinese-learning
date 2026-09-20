import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImportPage from './import-page';

// Soft client-side gate: importing is the owner's job, so the page asks for
// a shared passphrase once per browser session before revealing the wizard
const GATE_PASSPHRASE = 'chichicungduoc';
const UNLOCKED_KEY = 'importGateUnlocked';

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCKED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function ImportPasswordGate() {
  const { t } = useTranslation();
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState(false);

  if (unlocked) {
    return <ImportPage />;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === GATE_PASSPHRASE) {
      try {
        sessionStorage.setItem(UNLOCKED_KEY, '1');
      } catch {
        // storage unavailable — stay unlocked for this mount only
      }
      setUnlocked(true);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-foreground mb-2">{t('import.gate.title')}</h1>
        <p className="text-sm text-muted mb-6">
          {t('import.gate.description')}
        </p>
        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setHasError(false);
          }}
          placeholder={t('auth.password')}
          autoFocus
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {hasError && (
          <p className="text-sm text-destructive mb-3 animate-shake">{t('import.gate.wrongPassword')}</p>
        )}
        <button
          type="submit"
          className="w-full px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-dark active:scale-95 transition-all font-semibold"
        >
          {t('import.gate.unlock')}
        </button>
      </form>
    </div>
  );
}
