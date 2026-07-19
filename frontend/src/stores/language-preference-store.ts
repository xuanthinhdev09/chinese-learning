import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
