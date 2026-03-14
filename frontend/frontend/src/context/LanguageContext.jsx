import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('krishi_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('krishi_lang', lang);
  }, [lang]);

  const t = (keyString) => {
    const keys = keyString.split('.');
    let value = translations[lang];
    for (const key of keys) {
      if (value[key] === undefined) return keyString;
      value = value[key];
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage: setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
