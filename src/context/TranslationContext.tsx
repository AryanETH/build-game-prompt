import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (text: string) => string;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Russian", "Japanese", "Korean", "Chinese (Simplified)", "Chinese (Traditional)",
  "Arabic", "Hindi", "Bengali", "Turkish", "Vietnamese", "Thai", "Indonesian",
  "Dutch", "Polish", "Swedish", "Norwegian", "Danish", "Finnish",
  "Greek", "Hebrew", "Czech", "Romanian", "Hungarian", "Ukrainian"
];

// Language code mapping
const LANGUAGE_CODES: Record<string, string> = {
  "English": "en",
  "Spanish": "es",
  "French": "fr",
  "German": "de",
  "Italian": "it",
  "Portuguese": "pt",
  "Russian": "ru",
  "Japanese": "ja",
  "Korean": "ko",
  "Chinese (Simplified)": "zh-CN",
  "Chinese (Traditional)": "zh-TW",
  "Arabic": "ar",
  "Hindi": "hi",
  "Bengali": "bn",
  "Turkish": "tr",
  "Vietnamese": "vi",
  "Thai": "th",
  "Indonesian": "id",
  "Dutch": "nl",
  "Polish": "pl",
  "Swedish": "sv",
  "Norwegian": "no",
  "Danish": "da",
  "Finnish": "fi",
  "Greek": "el",
  "Hebrew": "he",
  "Czech": "cs",
  "Romanian": "ro",
  "Hungarian": "hu",
  "Ukrainian": "uk"
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('app-language') || 'English';
  });
  const [translationCache, setTranslationCache] = useState<Record<string, Record<string, string>>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const setLanguage = (lang: string) => {
    localStorage.setItem('app-language', lang);
    setLanguageState(lang);
    
    // Apply RTL for Arabic and Hebrew
    if (lang === 'Arabic' || lang === 'Hebrew') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = LANGUAGE_CODES[lang];
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = LANGUAGE_CODES[lang] || 'en';
    }
  };

  useEffect(() => {
    // Set initial direction and lang
    if (language === 'Arabic' || language === 'Hebrew') {
      document.documentElement.dir = 'rtl';
    }
    document.documentElement.lang = LANGUAGE_CODES[language] || 'en';
  }, [language]);

  const t = async (text: string): Promise<string> => {
    // If English, return as-is
    if (language === 'English') return text;

    // Check cache first
    if (translationCache[language]?.[text]) {
      return translationCache[language][text];
    }

    // Use LibreTranslate API
    try {
      setIsTranslating(true);
      const { translateText } = await import('@/lib/translation');
      const translated = await translateText(text, language);
      
      // Update cache
      setTranslationCache(prev => ({
        ...prev,
        [language]: {
          ...prev[language],
          [text]: translated
        }
      }));
      
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}

export { SUPPORTED_LANGUAGES, LANGUAGE_CODES };
