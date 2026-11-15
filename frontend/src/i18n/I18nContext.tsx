import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getTranslations, setActiveLocale } from './dictionaries';
import type { Locale } from './types';
import { getInitialLocale, I18nContext, LOCALE_STORAGE_KEY } from './useI18n';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const initial = getInitialLocale();
    setActiveLocale(initial);
    return initial;
  });

  const setLocale = useCallback((next: Locale) => {
    setActiveLocale(next);
    setLocaleState(next);
    try { localStorage.setItem(LOCALE_STORAGE_KEY, next); } catch { /* Optional storage */ }
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
