import { AppLanguage } from '../types';

export type { AppLanguage };

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  tagline: string;
}

export const SUPPORTED_APP_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    tagline: 'Default System Language',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    tagline: 'भारत की राजभाषा',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    tagline: 'महाराष्ट्राची राज्यभाषा',
  },
];

export type TranslationDictionary = Record<string, any>;
