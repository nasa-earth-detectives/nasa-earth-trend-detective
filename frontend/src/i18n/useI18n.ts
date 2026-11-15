import { createContext, useContext } from 'react';
import { getTranslations } from './dictionaries';
import type { Locale } from './types';
import type { Translations } from './typesExtra';

export const LOCALE_STORAGE_KEY = 'nasa_trend_locale';

function parseLocale(value: string | null | undefined): Locale | null {
  return value === 'en' || value === 'es' ? value : null;
}

/** Resolves the starting locale from URL `?lang=`, localStorage, or `'en'` default. */
export function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const queryLang = parseLocale(new URLSearchParams(window.location.search).get('lang'));
  if (queryLang) {
    try { localStorage.setItem(LOCALE_STORAGE_KEY, queryLang); } catch { /* Optional storage */ }
    return queryLang;
  }
  try {
    const saved = parseLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    if (saved) return saved;
  } catch { /* Optional storage */ }
  return 'en';
}

export interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Translations;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: getTranslations('en'),
});

/** Reads the active locale, setter, and UI translation dictionary. */
export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
