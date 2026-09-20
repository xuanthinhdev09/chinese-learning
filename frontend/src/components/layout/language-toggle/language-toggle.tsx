import { useTranslation } from 'react-i18next';

import { cn } from '../../../utils/cn';
import { UI_LANGUAGES } from '../../../i18n';
import { useUiLanguage } from '../../../stores/ui-language-store';

interface LanguageToggleProps {
  className?: string;
}

/** Segmented VI/EN/ZH control that switches the whole UI language. */
export function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { t } = useTranslation();
  const lang = useUiLanguage((state) => state.lang);
  const setLang = useUiLanguage((state) => state.setLang);

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5',
        className
      )}
      role="group"
      aria-label={t('common.language')}
    >
      {UI_LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            'px-2 py-1 text-xs font-semibold rounded-md transition-colors',
            lang === code
              ? 'bg-primary text-white'
              : 'text-muted hover:text-foreground hover:bg-gray-100'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
