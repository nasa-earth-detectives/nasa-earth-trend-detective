import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from './types';
import type { Translations } from './typesExtra';
import { getTranslations, setActiveLocale } from './dictionaries';

const STORAGE_KEY = 'nasa_trend_locale';

function parseLocale(value: string | null | undefined): Locale | null {
  return value === 'en' || value === 'es' ? value : null;
}

export function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const queryLang = parseLocale(new URLSearchParams(window.location.search).get('lang'));
  if (queryLang) {
    try { localStorage.setItem(STORAGE_KEY, queryLang); } catch { /* Optional storage */ }
    return queryLang;
  }
  try {
    const saved = parseLocale(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch { /* Optional storage */ }
  return 'en';
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: getTranslations('en'),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const initial = getInitialLocale();
    setActiveLocale(initial);
    return initial;
  });

  const setLocale = useCallback((next: Locale) => {
    setActiveLocale(next);
    setLocaleState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Optional storage */ }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', next);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  const t = useMemo(() => getTranslations(locale), [locale]);

  useEffect(() => {
    setActiveLocale(locale);
    document.documentElement.lang = locale;
    document.title = t.meta.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.pageDescription);
  }, [locale, t]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
