import type { Locale } from './types';
import type { Translations } from './typesExtra';
import { commonEn } from './common.en';
import { commonEs } from './common.es';
import { readoutsWizardEn } from './readoutsWizard.en';
import { readoutsWizardEs } from './readoutsWizard.es';
import { scienceEn } from './science.en';
import { scienceEs } from './science.es';
import { glossaryEn } from './glossary.en';
import { glossaryEs } from './glossary.es';
import { modalsEn } from './modals.en';
import { modalsEs } from './modals.es';

const TRANSLATIONS: Record<Locale, Translations> = {
  en: { ...commonEn, ...readoutsWizardEn, ...scienceEn, ...glossaryEn, ...modalsEn },
  es: { ...commonEs, ...readoutsWizardEs, ...scienceEs, ...glossaryEs, ...modalsEs },
};

let activeLocale: Locale = 'en';

export function getActiveLocale(): Locale {
  return activeLocale;
}

export function setActiveLocale(locale: Locale): void {
  activeLocale = locale;
}

export function getTranslations(locale: Locale = activeLocale): Translations {
  return TRANSLATIONS[locale];
}
