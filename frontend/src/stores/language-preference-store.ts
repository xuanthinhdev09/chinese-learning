import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UiLanguage } from '../i18n';
import { useUiLanguage } from './ui-language-store';

export type LanguagePreference = 'vietnamese' | 'english' | 'both';

interface LanguagePreferenceState {
  preference: LanguagePreference;
  setPreference: (pref: LanguagePreference) => void;
  togglePreference: () => void;
}

export const useLanguagePreference = create<LanguagePreferenceState>()(
  persist(
    (set) => ({
      preference: 'vietnamese', // Default: Vietnamese first
      setPreference: (pref) => set({ preference: pref }),
      togglePreference: () =>
        set((state) => {
          const cycle: LanguagePreference[] = ['vietnamese', 'english', 'both'];
          const currentIndex = cycle.indexOf(state.preference);
          const nextIndex = (currentIndex + 1) % cycle.length;
          return { preference: cycle[nextIndex] };
        }),
    }),
    {
      name: 'language-preference',
    }
  )
);

// Helper to get display meaning based on preference
export const getDisplayMeaning = (
  vietnamese: string,
  english: string,
  preference: LanguagePreference
): string => {
  switch (preference) {
    case 'vietnamese':
      return vietnamese || english;
    case 'english':
      return english || vietnamese;
    case 'both':
      return vietnamese && english
        ? `${vietnamese} (${english})`
        : vietnamese || english;
    default:
      return vietnamese || english;
  }
};

/** Derive the content (meaning) language from the UI language. */
export function preferenceForUiLanguage(lang: UiLanguage): LanguagePreference {
  return lang === 'en' ? 'english' : 'vietnamese';
}

/** Content meaning language follows the UI language (en → English gloss, vi →
 * Vietnamese). Replaces the old separate vi/en/both preference for meanings. */
export function useContentPreference(): LanguagePreference {
  return preferenceForUiLanguage(useUiLanguage((s) => s.lang));
}
