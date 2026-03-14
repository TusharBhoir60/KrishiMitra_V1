import { useLanguage } from '../../context/LanguageContext';

export const LanguageSwitcher = () => {
  const { lang, setLanguage } = useLanguage();

  const options = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिं' },
    { code: 'mr', label: 'मर' }
  ];

  return (
    <div className="flex border-[1.5px] border-farm-gold rounded-full p-0.5">
      {options.map((opt) => (
        <button
          key={opt.code}
          onClick={() => setLanguage(opt.code)}
          className={`text-sm font-body px-3 py-1 rounded-full transition-colors ${
            lang === opt.code 
              ? 'bg-farm-gold text-white font-semibold' 
              : 'bg-transparent text-farm-green hover:bg-farm-pale'
          }`}
          aria-label={`Switch to ${opt.label}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
