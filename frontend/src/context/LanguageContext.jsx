import { createContext, useContext, useState, useEffect } from 'react';
import { languageMap, SUPPORTED_LANGUAGES } from '../i18n';

const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = 'appLanguage';

const resolveLanguage = (value) =>
  SUPPORTED_LANGUAGES.includes(value) ? value : 'en';

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return resolveLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (languageCode) => {
    setCurrentLanguage(resolveLanguage(languageCode));
  };

  const t = (keyString) => {
    const keys = keyString.split('.');
    let value = languageMap[currentLanguage];
    for (const key of keys) {
      if (value == null || value[key] === undefined) return keyString;
      value = value[key];
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, lang: currentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
