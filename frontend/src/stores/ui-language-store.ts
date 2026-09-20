import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import i18n from '../i18n';
import type { UiLanguage } from '../i18n';

interface UiLanguageState {
  lang: UiLanguage;
  setLang: (lang: UiLanguage) => void;
}

/**
 * UI language (app chrome text) — NOT the lesson-content language, which is
 * language-preference-store (vietnamese/english/both meanings). Persisted as
 * 'ui-language'; i18n/index.ts reads the same key at startup to set the
 * initial language before React renders.
 */
export const useUiLanguage = create<UiLanguageState>()(
  persist(
    (set) => ({
      lang: 'vi',
      setLang: (lang) => {
        set({ lang });
        void i18n.changeLanguage(lang);
        document.documentElement.lang = lang;
      },
    }),
    {
      name: 'ui-language',
    }
  )
);
