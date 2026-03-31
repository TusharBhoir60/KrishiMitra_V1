import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import heroBg from '../../assets/hero-bg.png';

export const HeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <section 
      style={{ backgroundImage: `url(${heroBg})` }}
      className="max-w-7xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-12 items-center min-h-[calc(100vh-80px)] bg-cover bg-center bg-no-repeat rounded-b-[40px] overflow-hidden relative"
    >
      {/* Optional dark overlay for legibility if needed */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none rounded-b-[40px]"></div>

      {/* Left Column - Text */}
      <div className="flex flex-col items-start justify-center z-10 w-full max-w-xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-2 border border-white/40 rounded-full px-4 py-1.5 bg-black/20 backdrop-blur-sm mb-6 shadow-sm"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-sm font-body text-green-50">{t('hero.badge')}</span>
        </motion.div>

        <motion.span 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body font-semibold text-lg text-green-100 mb-2 block drop-shadow-md"
        >
          {t('hero.line1')}
        </motion.span>

        <h1 className="text-5xl font-bold leading-tight text-white mb-2 drop-shadow-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.15 * 1 }}
          >
            {t('hero.line2')}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.15 * 2 }}
          >
            {t('hero.line3')}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.15 * 3 }}
          >
            {t('hero.line4')}
          </motion.div>
        </h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-lg text-gray-100 mt-4 max-w-[520px] leading-relaxed drop-shadow-md font-medium"
        >
          {t('hero.sub')}
        </motion.p>

        <div className="flex gap-4 mt-8 flex-wrap">
          <motion.div 
            whileHover={{ scale: 1.04 }} 
            whileTap={{ scale: 0.97 }}
            className="flex flex-col"
          >
            <button 
              onClick={() => navigate('/register?role=farmer')}
              className="bg-green-600 text-white shadow-lg border border-green-500/50 px-6 py-3 rounded-xl hover:bg-green-500 transition"
            >
              {t('hero.farmerBtn')}
            </button>
            <span className="text-[14px] font-body text-green-100 mt-2 font-medium drop-shadow-sm">{t('hero.farmerSub')}</span>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.04 }} 
            whileTap={{ scale: 0.97 }}
            className="flex flex-col"
          >
            <button 
              onClick={() => navigate('/register?role=buyer')}
              className="bg-white/10 backdrop-blur-md border border-white text-white shadow-lg px-6 py-3 rounded-xl hover:bg-white/20 transition"
            >
              {t('hero.buyerBtn')}
            </button>
            <span className="text-[14px] font-body text-gray-200 mt-2 font-medium drop-shadow-sm">{t('hero.buyerSub')}</span>
          </motion.div>
        </div>
      </div>

      {/* Right Column - Spacer for background imagery */}
      <div className="relative w-full h-[380px] lg:h-[520px] z-0 flex items-center justify-center pointer-events-none">
        {/* Globe canvas removed so the background's right side (tractor) acts as the subject */}
      </div>
    </section>
  );
};
