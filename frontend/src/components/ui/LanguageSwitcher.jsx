import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageSwitcher = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 border border-farm-gold/60 rounded-full px-3 py-1.5 bg-white/90">
      <span className="text-sm" aria-hidden="true">🌐</span>
      <label htmlFor="global-language" className="sr-only">{t('language.label')}</label>
      <select
        id="global-language"
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent text-sm font-semibold text-farm-green outline-none cursor-pointer"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी</option>
        <option value="mr">मराठी</option>
      </select>
    </div>
  );
};
