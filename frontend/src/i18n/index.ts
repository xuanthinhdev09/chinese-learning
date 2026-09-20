import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import vi from './locales/vi.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

export type UiLanguage = 'vi' | 'en' | 'zh';

/** Display order and labels for the header language toggle. */
export const UI_LANGUAGES: { code: UiLanguage; label: string }[] = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' },
];

function isUiLanguage(value: unknown): value is UiLanguage {
  return value === 'vi' || value === 'en' || value === 'zh';
}

/**
 * Read the persisted ui-language-store value straight from localStorage so
 * i18n can init before React renders. Importing the store here would create
 * a circular import (the store calls i18n.changeLanguage), so we parse the
 * same persisted key directly. First visit (nothing persisted) stays 'vi'.
 */
function readPersistedLanguage(): UiLanguage {
  try {
    const raw = localStorage.getItem('ui-language');
    if (raw) {
      const lang: unknown = JSON.parse(raw)?.state?.lang;
      if (isUiLanguage(lang)) return lang;
    }
  } catch {
    // Malformed or unavailable storage — fall through to the default
  }
  return 'vi';
}

const initialLanguage = readPersistedLanguage();

// Keep the HTML lang attribute in sync with the restored language, not just
// the default — setLang only covers changes made during the session.
document.documentElement.lang = initialLanguage;

void i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: initialLanguage,
  fallbackLng: 'vi',
  // React escapes JSX interpolation itself; keeping i18next escaping off
  // avoids double-escaping. Never use t() output with dangerouslySetInnerHTML.
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
