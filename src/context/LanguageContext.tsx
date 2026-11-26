'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';

export type Language = 'hi' | 'en';

type TranslationDictionary = typeof enTranslations;

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (keyOrEn: string, fallbackOrHi?: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries: Record<Language, any> = {
  en: enTranslations,
  hi: hiTranslations,
};

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  // Synchronize <html> attributes
  const applyLanguageToDom = (selectedLang: Language) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = selectedLang;
      if (selectedLang === 'hi') {
        document.documentElement.classList.add('lang-hi');
      } else {
        document.documentElement.classList.remove('lang-hi');
      }
    }
  };

  useEffect(() => {
    // 1. Initial read from cookie or localStorage
    let savedLang: Language = 'en';
    try {
      const stored = localStorage.getItem('moldins_lang') as Language | null;
      if (stored === 'hi' || stored === 'en') {
        savedLang = stored;
      } else {
        const cookieMatch = document.cookie.match(/(?:^|;\s*)moldins_lang=(en|hi)/);
        if (cookieMatch && (cookieMatch[1] === 'hi' || cookieMatch[1] === 'en')) {
          savedLang = cookieMatch[1] as Language;
        }
      }
    } catch {}

    setLangState(savedLang);
    applyLanguageToDom(savedLang);

    // 2. Synchronize across tabs and custom events
    const handleSync = () => {
      const current = localStorage.getItem('moldins_lang') as Language | null;
      if (current === 'hi' || current === 'en') {
        setLangState(current);
        applyLanguageToDom(current);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('languageChange', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('languageChange', handleSync);
    };
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLangState(newLang);
    applyLanguageToDom(newLang);
    try {
      localStorage.setItem('moldins_lang', newLang);
      document.cookie = `moldins_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new Event('languageChange'));
    } catch (e) {
      console.warn('Unable to persist language:', e);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const next: Language = lang === 'hi' ? 'en' : 'hi';
    setLanguage(next);
  }, [lang, setLanguage]);

  // Universal translation function
  // Supports:
  // 1. t('common.save') -> looks up key in en.json / hi.json
  // 2. legacy direct English/Hindi pairs
  // 3. t('common.save', 'Save') -> key with fallback
  const t = useCallback(
    (keyOrEn: string, fallbackOrHi?: string): string => {
      if (!keyOrEn) return '';

      // Check if key exists in active language dictionary
      const activeDict = dictionaries[lang];
      const translated = getNestedValue(activeDict, keyOrEn);
      if (translated) {
        return translated;
      }

      // If active is Hindi and fallback is English dictionary
      if (lang === 'hi') {
        if (fallbackOrHi && !fallbackOrHi.includes('.')) {
          // It's a direct (en, hi) pair where fallbackOrHi is Hindi!
          return fallbackOrHi;
        }
        // Fallback to English dictionary value if key was a dictionary path
        const enVal = getNestedValue(dictionaries.en, keyOrEn);
        if (enVal) return enVal;
      } else {
        // Active is English
        const enVal = getNestedValue(dictionaries.en, keyOrEn);
        if (enVal) return enVal;
        if (fallbackOrHi && !keyOrEn.includes('.')) {
          // Direct pair: keyOrEn is English
          return keyOrEn;
        }
      }

      // If keyOrEn was plain text (not dictionary path), return it according to language
      if (fallbackOrHi && fallbackOrHi !== keyOrEn) {
        return lang === 'hi' ? fallbackOrHi : keyOrEn;
      }

      return keyOrEn;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
