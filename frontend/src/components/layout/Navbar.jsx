import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        scrolled ? 'bg-white/95 shadow-md backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-farm-green flex items-center justify-center text-white transform transition-transform group-hover:scale-105">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.686 2 6 4.686 6 8C6 11.314 12 22 12 22C12 22 18 11.314 18 8C18 4.686 15.314 2 12 2Z" />
            </svg>
          </div>
          <span className="font-display text-[22px] font-bold text-farm-green group-hover:scale-[1.02] origin-left transition-transform">
            KrishiMitra
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/marketplace" className="font-body font-medium text-farm-green relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-farm-gold after:transition-all hover:after:w-full hover:text-farm-gold">
            {t('nav.marketplace')}
          </Link>
          <a href="#how-it-works" className="font-body font-medium text-farm-green relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-farm-gold after:transition-all hover:after:w-full hover:text-farm-gold">
            {t('nav.howItWorks')}
          </a>
          <a href="#farmers" className="font-body font-medium text-farm-green relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-farm-gold after:transition-all hover:after:w-full hover:text-farm-gold">
            {t('nav.forFarmers')}
          </a>
          <a href="#buyers" className="font-body font-medium text-farm-green relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-farm-gold after:transition-all hover:after:w-full hover:text-farm-gold">
            {t('nav.forBuyers')}
          </a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <button 
            onClick={() => navigate('/login')}
            className="border-[1.5px] border-farm-green text-farm-green rounded-lg px-5 py-2 font-body font-medium hover:bg-farm-green hover:text-white transition-colors"
          >
            {t('nav.login')}
          </button>
          <button 
            onClick={() => navigate('/register')}
            style={{ clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)' }}
            className="bg-farm-green text-white px-6 py-2 font-body font-semibold hover:bg-farm-gold hover:text-farm-dark transition-colors"
          >
            {t('nav.getStarted')}
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-farm-green p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white shadow-xl flex flex-col p-6 gap-4 md:hidden border-t border-gray-100"
          >
            <LanguageSwitcher />
            <Link to="/marketplace" onClick={() => setMobileMenuOpen(false)} className="font-body font-medium text-farm-dark text-lg py-2 border-b border-gray-100">
              {t('nav.marketplace')}
            </Link>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="font-body font-medium text-farm-dark text-lg py-2 border-b border-gray-100">
              {t('nav.howItWorks')}
            </a>
            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full border-[1.5px] border-farm-green text-farm-green rounded-lg px-5 py-3 font-body font-medium hover:bg-farm-green hover:text-white transition-colors"
              >
                {t('nav.login')}
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
                className="w-full bg-farm-green text-white rounded-lg px-6 py-3 font-body font-semibold hover:bg-farm-gold hover:text-farm-dark transition-colors"
              >
                {t('nav.getStarted')}
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
