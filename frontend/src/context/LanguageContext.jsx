import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import i18n, { SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY, backendLanguageToCode } from '../i18n';

const LanguageContext = createContext();

const resolveLanguage = (value) =>
  SUPPORTED_LANGUAGES.includes(value) ? value : 'en';

const resolveLanguageFromBackend = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return backendLanguageToCode[normalized] || null;
};

const resolveInitialLanguage = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const backendDefault = resolveLanguageFromBackend(storedUser?.language);
    if (backendDefault) return backendDefault;
  } catch {
    // Ignore invalid localStorage user payload and continue fallback.
  }

  const fromStorage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return resolveLanguage(fromStorage || i18n.language);
};

export const LanguageProvider = ({ children }) => {
  const userLanguage = useSelector((state) => state.auth.user?.language);
  const [currentLanguage, setCurrentLanguage] = useState(resolveInitialLanguage);

  const setLanguage = useCallback((languageCode) => {
    const nextLanguage = resolveLanguage(languageCode);
    setCurrentLanguage((prevLanguage) => (prevLanguage === nextLanguage ? prevLanguage : nextLanguage));
  }, []);

  useEffect(() => {
    i18n.changeLanguage(currentLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    const preferredLanguage = resolveLanguageFromBackend(userLanguage);
    if (preferredLanguage) {
      setLanguage(preferredLanguage);
    }
  }, [userLanguage, setLanguage]);

  const t = useCallback((key, options) => i18n.t(key, options), []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, lang: currentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
