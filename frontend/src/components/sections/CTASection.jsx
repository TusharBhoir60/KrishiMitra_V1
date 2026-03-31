import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const CTASection = () => {
  const { t } = useLanguage();
  const cta = t('cta');
  const navigate = useNavigate();

  return (
    <section className="min-h-[70vh] relative overflow-hidden flex flex-col items-center justify-center py-24 px-6">
      {/* Animated SVG background */}
      <div className="absolute inset-0 z-0">
        <svg preserveAspectRatio="none" viewBox="0 0 1440 800" className="w-full h-full object-cover">
          <Motion.path 
            fill="#2D6A4F" 
            animate={{ translateY: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            d="M0,400 C320,300 420,500 720,400 C1020,300 1120,500 1440,400 L1440,800 L0,800 Z"
          />
          <Motion.path 
            fill="#1B4332" 
            animate={{ translateY: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            d="M0,500 C220,600 520,400 820,500 C1120,600 1320,400 1440,500 L1440,800 L0,800 Z"
          />
          <Motion.path 
            fill="#0F2D1F" 
            animate={{ translateY: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            d="M0,600 C420,500 620,700 1020,600 C1220,550 1320,650 1440,600 L1440,800 L0,800 Z"
          />
        </svg>
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(180deg, rgba(15,45,31,0.7) 0%, rgba(15,45,31,0.4) 100%)' }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        <h2 className="font-display text-5xl lg:text-7xl text-white text-center max-w-4xl tracking-tight leading-tight">
          {cta.title}
        </h2>
        <p className="font-body text-xl text-farm-light text-center mt-6 mb-16 max-w-2xl">
          {cta.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-stretch w-full">
          {/* Farmer Card */}
          <Motion.div 
            whileHover={{ y: -12, scale: 1.03, boxShadow: '0 30px 60px rgba(245,158,11,0.4)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-full sm:w-72 bg-farm-gold rounded-3xl p-10 text-center flex flex-col cursor-pointer"
            onClick={() => navigate('/register?role=farmer')}
          >
            <Motion.div 
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl mb-6"
            >
              🌾
            </Motion.div>
            <h3 className="font-display text-2xl text-farm-dark font-bold mb-3">{cta.farmerCard.title}</h3>
            <p className="font-body text-farm-dark/80 mb-8 flex-1">{cta.farmerCard.desc}</p>
            <button className="bg-farm-green text-white w-full rounded-xl py-4 font-body font-bold text-lg hover:bg-farm-dark transition-colors">
              {cta.farmerCard.btn}
            </button>
          </Motion.div>

          {/* Buyer Card */}
          <Motion.div 
            whileHover={{ y: -12, scale: 1.03, boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-full sm:w-72 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-3xl p-10 text-center flex flex-col cursor-pointer"
            onClick={() => navigate('/register?role=buyer')}
          >
            <Motion.div 
              animate={{ rotate: [10, -10, 10] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="text-6xl mb-6"
            >
              🛒
            </Motion.div>
            <h3 className="font-display text-2xl text-white font-bold mb-3">{cta.buyerCard.title}</h3>
            <p className="font-body text-white/80 mb-8 flex-1">{cta.buyerCard.desc}</p>
            <button className="bg-white text-farm-green w-full rounded-xl py-4 font-body font-bold text-lg hover:bg-farm-gold hover:text-farm-dark transition-colors">
              {cta.buyerCard.btn}
            </button>
          </Motion.div>
        </div>
      </div>
    </section>
  );
};
