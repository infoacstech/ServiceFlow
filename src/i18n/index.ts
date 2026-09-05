import { AppLanguage, LanguageOption, SUPPORTED_APP_LANGUAGES } from './types';
import { en } from './translations/en';
import { hi } from './translations/hi';
import { mr } from './translations/mr';

export * from './types';
export { en, hi, mr };

const dictionaries: Record<AppLanguage, Record<string, any>> = {
  en,
  hi,
  mr,
};

/**
 * Resolves a nested object key path like 'common.save' or 'dashboard.todayJobs'
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

/**
 * Translates a key for a given language with parameter substitution and English fallback.
 */
export function translate(
  lang: AppLanguage,
  key: string,
  params?: Record<string, string | number>,
  fallbackText?: string
): string {
  const currentDict = dictionaries[lang] || dictionaries.en;
  let text = getNestedValue(currentDict, key);

  // Fallback to English if translation is missing in the current language
  if (text === undefined && lang !== 'en') {
    text = getNestedValue(dictionaries.en, key);
  }

  // Fallback to explicitly supplied fallbackText or key itself
  if (text === undefined) {
    if (fallbackText !== undefined) {
      text = fallbackText;
    } else {
      // In dev mode, log missing translation key
      const isDev = Boolean(import.meta.env?.DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'));
      if (typeof window !== 'undefined' && isDev) {
        console.warn(`[i18n] Missing translation for key: "${key}" in language: "${lang}"`);
      }
      text = key.split('.').pop() || key;
    }
  }

  if (typeof text !== 'string') {
    return String(text ?? fallbackText ?? key);
  }

  // Interpolate parameters, supporting both {param} and {{param}}
  if (params) {
    for (const [pKey, pValue] of Object.entries(params)) {
      const valStr = String(pValue);
      text = text.replace(new RegExp(`\\{\\{${pKey}\\}\\}`, 'g'), valStr);
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), valStr);
    }
  }

  return text;
}

/**
 * Gets storage key for user-specific language
 */
export function getUserLanguageStorageKey(userId?: string): string {
  return userId ? `serviflow_user_lang_${userId}` : 'serviflow_guest_lang';
}

/**
 * Loads the language preference for an individual user:
 * 1. Checks user.language from profile/database
 * 2. Checks localStorage per-user key (serviflow_user_lang_<userId>)
 * 3. Fallbacks to 'en'
 */
export function resolveUserLanguage(userId?: string, profileLanguage?: AppLanguage): AppLanguage {
  if (profileLanguage && (profileLanguage === 'en' || profileLanguage === 'hi' || profileLanguage === 'mr')) {
    return profileLanguage;
  }

  if (typeof localStorage !== 'undefined' && userId) {
    const saved = localStorage.getItem(getUserLanguageStorageKey(userId)) as AppLanguage | null;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) {
      return saved;
    }
  }

  return 'en';
}

/**
 * Persists the user language to localStorage per-user
 */
export function persistUserLanguageLocally(userId: string | undefined, lang: AppLanguage): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(getUserLanguageStorageKey(userId), lang);
  }
}
