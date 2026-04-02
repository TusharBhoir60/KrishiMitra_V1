import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en as enApp } from './i18n/en'
import { hi as hiApp } from './i18n/hi'
import { mr as mrApp } from './i18n/mr'
import enBase from './locales/en.json'
import hiBase from './locales/hi.json'
import mrBase from './locales/mr.json'

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'mr']
export const LANGUAGE_STORAGE_KEY = 'appLanguage'

export const backendLanguageToCode = {
  english: 'en',
  hindi: 'hi',
  marathi: 'mr',
}

const resources = {
  en: { translation: { ...enApp, ...enBase } },
  hi: { translation: { ...hiApp, ...hiBase } },
  mr: { translation: { ...mrApp, ...mrBase } },
}

const resolveStoredLanguage = () => {
  const fromStorage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return SUPPORTED_LANGUAGES.includes(fromStorage) ? fromStorage : 'en'
}

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: resolveStoredLanguage(),
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    })
}

export default i18n
