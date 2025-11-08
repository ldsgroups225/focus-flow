
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import en from '@/lib/locales/en.json';
import fr from '@/lib/locales/fr.json';

const translations = {
  en,
  fr,
};

type Locale = 'en' | 'fr';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('fr');

  const t = useCallback((key: string) => {
    const keys = key.split('.');
    let result: unknown = translations[locale];
    for (const k of keys) {
      result = (result as Record<string, unknown>)?.[k];
      if (result === undefined) {
        // Fallback to English if key not found in current locale
        let fallbackResult: unknown = translations.en;
        for (const fk of keys) {
            fallbackResult = (fallbackResult as Record<string, unknown>)?.[fk];
        }
        return (fallbackResult as string) || key;
      }
    }
    return (result as string) || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
