// Translation service using Google Translate API (free tier)
// Using unofficial Google Translate API endpoint

const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

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
  "Chinese (Simplified)": "zh",
  "Chinese (Traditional)": "zt",
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

interface TranslationCache {
  [key: string]: {
    [text: string]: string;
  };
}

// Cache translations in localStorage
const CACHE_KEY = 'translation-cache';

function getCache(): TranslationCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function setCache(cache: TranslationCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to cache translation:', e);
  }
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  // If English, return as-is
  if (targetLanguage === 'English' || !text) return text;

  const targetCode = LANGUAGE_CODES[targetLanguage];
  if (!targetCode) return text;

  // Check cache first
  const cache = getCache();
  if (cache[targetLanguage]?.[text]) {
    return cache[targetLanguage][text];
  }

  try {
    // Use Google Translate's free API endpoint
    const params = new URLSearchParams({
      client: 'gtx',
      sl: 'en',
      tl: targetCode,
      dt: 't',
      q: text
    });

    const response = await fetch(`${GOOGLE_TRANSLATE_API}?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status);
      return text;
    }

    const data = await response.json();
    // Google Translate returns: [[[translated_text, original_text, null, null, 10]]]
    const translated = data[0]?.[0]?.[0] || text;

    // Cache the translation
    if (!cache[targetLanguage]) {
      cache[targetLanguage] = {};
    }
    cache[targetLanguage][text] = translated;
    setCache(cache);

    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

export async function translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
  if (targetLanguage === 'English') return texts;

  const promises = texts.map(text => translateText(text, targetLanguage));
  return Promise.all(promises);
}

export function clearTranslationCache() {
  localStorage.removeItem(CACHE_KEY);
}
