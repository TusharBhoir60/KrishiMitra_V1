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
  const fromStorage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (SUPPORTED_LANGUAGES.includes(fromStorage)) {
    return fromStorage;
  }

  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const backendDefault = resolveLanguageFromBackend(storedUser?.language);
    if (backendDefault) return backendDefault;
  } catch {
    // Ignore invalid localStorage user payload and continue fallback.
  }

  return resolveLanguage(i18n.language);
};

export const LanguageProvider = ({ children }) => {
  const userLanguage = useSelector((state) => state.auth.user?.language);
  const [currentLanguage, setCurrentLanguage] = useState(resolveInitialLanguage);

  const setLanguage = useCallback(async (languageCode) => {
    const nextLanguage = resolveLanguage(languageCode);
    if (resolveLanguage(i18n.resolvedLanguage || i18n.language) === nextLanguage) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      return;
    }

    await i18n.changeLanguage(nextLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  useEffect(() => {
    const syncLanguage = (languageCode) => {
      const normalized = resolveLanguage(languageCode);
      setCurrentLanguage((prevLanguage) => (prevLanguage === normalized ? prevLanguage : normalized));
    };

    syncLanguage(i18n.resolvedLanguage || i18n.language);
    i18n.on('languageChanged', syncLanguage);

    return () => {
      i18n.off('languageChanged', syncLanguage);
    };
  }, []);

  useEffect(() => {
    const preferredLanguage = resolveLanguageFromBackend(userLanguage);
    const hasStoredPreference = SUPPORTED_LANGUAGES.includes(
      localStorage.getItem(LANGUAGE_STORAGE_KEY)
    );

    // Use backend language only as a first-time default. Do not override explicit user choice.
    if (preferredLanguage && !hasStoredPreference) {
      setLanguage(preferredLanguage);
    }
  }, [userLanguage, setLanguage]);

  const t = useCallback((key, options) => i18n.t(key, options), [currentLanguage]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, lang: currentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
