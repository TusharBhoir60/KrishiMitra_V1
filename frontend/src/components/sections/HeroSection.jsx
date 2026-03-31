import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const GlobeCanvas = React.lazy(() => import('../ui/GlobeCanvas'));

export const HeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-12 items-center min-h-[calc(100vh-80px)]">
      {/* Left Column - Text */}
      <div className="flex flex-col items-start justify-center z-10 w-full max-w-xl">
        <Motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-2 border border-farm-green/30 rounded-full px-4 py-1.5 bg-farm-pale/50 mb-6"
        >
          <div className="w-2 h-2 rounded-full bg-farm-green animate-pulse"></div>
          <span className="text-sm font-body text-farm-green">{t('hero.badge')}</span>
        </Motion.div>

        <Motion.span 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body font-semibold text-lg text-farm-mid mb-2 block"
        >
          {t('hero.line1')}
        </Motion.span>

        <h1 className="text-5xl font-bold leading-tight text-farm-dark mb-2">
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.15 * 1 }}
          >
            {t('hero.line2')}
          </Motion.div>
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.15 * 2 }}
          >
            {t('hero.line3')}
          </Motion.div>
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.15 * 3 }}
          >
            {t('hero.line4')}
          </Motion.div>
        </h1>

        <Motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-lg text-gray-600 mt-4 max-w-[520px] leading-relaxed"
        >
          {t('hero.sub')}
        </Motion.p>

        <div className="flex gap-4 mt-6 flex-wrap">
          <Motion.div 
            whileHover={{ scale: 1.04 }} 
            whileTap={{ scale: 0.97 }}
            className="flex flex-col"
          >
            <button 
              onClick={() => navigate('/register?role=farmer')}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition"
            >
              {t('hero.farmerBtn')}
            </button>
            <span className="text-[13px] font-body text-farm-mid mt-2">{t('hero.farmerSub')}</span>
          </Motion.div>

          <Motion.div 
            whileHover={{ scale: 1.04 }} 
            whileTap={{ scale: 0.97 }}
            className="flex flex-col"
          >
            <button 
              onClick={() => navigate('/register?role=buyer')}
              className="border border-green-600 text-green-700 px-6 py-3 rounded-xl hover:bg-green-50 transition"
            >
              {t('hero.buyerBtn')}
            </button>
            <span className="text-[13px] font-body text-gray-500 mt-2">{t('hero.buyerSub')}</span>
            </Motion.div>
        </div>
      </div>

      {/* Right Column - Globe */}
      <div className="relative w-full h-[380px] lg:h-[520px] z-0 flex items-center justify-center">
        <GlobeCanvas />
      </div>
    </section>
  );
};
