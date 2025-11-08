'use client';

import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import en from '@/lib/locales/en.json';
import fr from '@/lib/locales/fr.json';

type Locale = 'en' | 'fr';

type TranslationNode = string | { readonly [key: string]: TranslationNode };

const translations: Record<Locale, TranslationNode> = {
  en,
  fr,
} as const;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return 'en';
  }
  const stored = window.localStorage.getItem('locale');
  return stored === 'fr' ? 'fr' : 'en';
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('locale', locale);
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const t = (key: string): string => {
    const segments = key.split('.');
    let value: TranslationNode | undefined = translations[locale];

    for (const segment of segments) {
      if (typeof value === 'object' && value !== null && segment in value) {
        value = value[segment];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
