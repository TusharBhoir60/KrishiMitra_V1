import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export const Footer = () => {
  const { t, currentLanguage } = useLanguage();
  const f = t('footer', { returnObjects: true }) || {};
  const columnHeadings = Array.isArray(f.columnHeadings) ? f.columnHeadings : [];
  const farmersLinks = Array.isArray(f.linkArrays?.farmers) ? f.linkArrays.farmers : [];
  const buyersLinks = Array.isArray(f.linkArrays?.buyers) ? f.linkArrays.buyers : [];
  const designedForLabel = currentLanguage === 'hi'
    ? 'भारतीय किसानों के लिए डिज़ाइन किया गया 🇮🇳'
    : currentLanguage === 'mr'
      ? 'भारतीय शेतकऱ्यांसाठी डिझाइन केलेले 🇮🇳'
      : 'Designed for Indian farmers 🇮🇳';

  return (
    <footer className="bg-farm-dark pt-20 pb-8 px-6 lg:px-16 relative">
      {/* Grain Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        
        {/* Brand Column */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2 mb-4 group cursor-pointer">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 2C8.686 2 6 4.686 6 8C6 11.314 12 22 12 22C12 22 18 11.314 18 8C18 4.686 15.314 2 12 2Z" />
            </svg>
            <span className="font-display text-2xl font-bold text-white group-hover:text-farm-gold transition-colors">
              KrishiMitra
            </span>
          </div>
          <p className="font-hindi text-white/60 text-sm mb-6 leading-relaxed">
            From field to table. No middlemen.<br/>
            खेत से थाली तक। बिना बिचौलिए।<br/>
            शेतातून थेट ताटात. दलाल नाही.
          </p>
          <div className="flex gap-3">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-full bg-farm-mid/20 flex items-center justify-center text-white hover:bg-farm-gold hover:text-farm-dark transition-colors">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Farmers Column */}
        <div>
          <h4 className="font-display text-lg text-white mb-6">{columnHeadings[1] || ''}</h4>
          <ul className="space-y-4">
            {farmersLinks.map((link, i) => (
              <li key={i}>
                <a href="#" className="font-body text-white/60 text-sm hover:text-farm-gold transition-colors relative inline-block group">
                  {link}
                  <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-farm-gold transition-all group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Buyers Column */}
        <div>
          <h4 className="font-display text-lg text-white mb-6">{columnHeadings[2] || ''}</h4>
          <ul className="space-y-4">
            {buyersLinks.map((link, i) => (
              <li key={i}>
                <a href="#" className="font-body text-white/60 text-sm hover:text-farm-gold transition-colors relative inline-block group">
                  {link}
                  <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-farm-gold transition-all group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Language Column */}
        <div>
          <h4 className="font-display text-lg text-white mb-6">{columnHeadings[3] || ''}</h4>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <LanguageSwitcher />
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm relative z-10 gap-4">
        <span className="font-body text-white/40">{f.copyright || ''}</span>
        <span className="font-body text-white/30">{designedForLabel}</span>
      </div>
    </footer>
  );
};
