import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export const ScrollFarmScene = () => {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const scrolled = -rect.top;
      const total = sectionRef.current.offsetHeight - window.innerHeight;
      
      let p = 0;
      if (total > 0) {
        p = Math.max(0, Math.min(1, scrolled / total));
      }
      setProgress(p);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // call once on mount
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getActiveScene = () => {
    if (progress < 0.25) return 0;
    if (progress < 0.50) return 1;
    if (progress < 0.75) return 2;
    return 3;
  };

  const sceneIndex = getActiveScene();

  const farmerCard = (
    <div className="absolute top-24 left-8 lg:left-16 bg-farm-dark/85 backdrop-blur-sm rounded-2xl p-6 max-w-sm z-30 shadow-2xl">
      <h3 className="font-display text-3xl text-farm-gold mb-3">{t(`scroll.scene${sceneIndex + 1}Title`)}</h3>
      <p className="font-body text-white/80 leading-relaxed text-lg">{t(`scroll.scene${sceneIndex + 1}Body`)}</p>
    </div>
  );

  return (
    <div ref={sectionRef} style={{ height: '500vh', position: 'relative' }}>
      <div className="sticky top-0 h-screen overflow-hidden w-full">
        {/* Progress Bar */}
        <div 
          className="absolute top-0 left-0 h-1 z-50 transition-all duration-100"
          style={{ 
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #1B4332, #F59E0B)' 
          }}
        />

        {/* Scene Dots */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-3 z-50">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`transition-all duration-300 rounded-full ${i === sceneIndex ? 'w-2 h-8 bg-farm-gold' : 'w-2 h-2 bg-white/40'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {sceneIndex === 0 && (
            <motion.div 
              key="scene1"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, #F5A623 0%, #87CEEB 35%, #2D6A4F 65%, #1B4332 100%)' }}
            >
              {farmerCard}
              {/* Farm SVG Illustration */}
              <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 500" preserveAspectRatio="none">
                <rect width="1440" height="500" fill="transparent"/>
                <path d="M0 300 L300 150 L600 350 L1000 100 L1440 250 L1440 500 L0 500 Z" fill="#1B4332" opacity="0.6"/>
                <path d="M-100 400 L200 250 L500 450 L900 200 L1540 350 L1540 500 L-100 500 Z" fill="#2D6A4F" />
                <rect x="250" y="280" width="80" height="60" fill="#8B4513" />
                <polygon points="250,280 290,240 330,280" fill="#A0522D" />
                <rect x="1050" y="320" width="100" height="80" fill="#8B4513" />
                <polygon points="1050,320 1100,270 1150,320" fill="#A0522D" />
                
                {/* Perspective crop rows */}
                {[...Array(10)].map((_, i) => (
                  <line key={`l-${i}`} x1={144 * i} y1="500" x2={720} y2="400" stroke="#0F2D1F" strokeWidth="2" opacity="0.3" />
                ))}

                {/* Plants */}
                {[...Array(30)].map((_, i) => {
                  const x = 100 + (i * 40) % 1200;
                  const y = 400 + (Math.random() * 80);
                  return (
                    <motion.g 
                      key={`p-${i}`} 
                      initial={{ scale: 0, y: 20 }} 
                      animate={{ scale: 1, y: 0 }} 
                      transition={{ delay: 0.5 + i * 0.02, type: 'spring' }}
                    >
                      <line x1={x} y1={y} x2={x} y2={y-15} stroke="#52B788" strokeWidth="2"/>
                      <circle cx={x} cy={y-15} r="3" fill="#D8F3DC"/>
                    </motion.g>
                  );
                })}
              </svg>
            </motion.div>
          )}

          {sceneIndex === 1 && (
            <motion.div 
              key="scene2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{ background: 'linear-gradient(180deg, #8B9BB4 0%, #6B7A8D 40%, #3D4B5C 100%)' }}
            >
              {farmerCard}
              
              <div className="relative w-full max-w-5xl h-64 flex items-center justify-between mt-32 z-20 mx-auto px-4 lg:px-0">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-8 right-8 h-1 bg-white/20 -translate-y-1/2 -z-10" />
                
                <motion.svg className="absolute top-1/2 left-8 right-8 h-12 -translate-y-1/2 -z-10 overflow-visible w-[calc(100%-4rem)]">
                  <motion.line 
                    x1="0" y1="6" x2="100%" y2="6" 
                    stroke="white" strokeWidth="2" strokeDasharray="5,5" 
                    initial={{ strokeDashoffset: 1000 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 2, ease: "linear" }}
                  />
                </motion.svg>

                {/* Nodess */}
                {[
                  { id: 'farmer', label: 'Farmer', price: '₹18/kg', bg: 'bg-farm-green', text: 'text-farm-gold' },
                  { id: 'm1', label: 'Aggregator', price: '₹22', bg: 'bg-gray-600', text: 'text-white/60' },
                  { id: 'm2', label: 'Wholesale', price: '₹30', bg: 'bg-gray-500', text: 'text-white/70' },
                  { id: 'm3', label: 'Retailer', price: '₹38', bg: 'bg-gray-400', text: 'text-white/80' },
                  { id: 'buyer', label: 'Consumer', price: '₹45/kg', bg: 'bg-blue-700', text: 'text-red-400' }
                ].map((node, i) => (
                  <motion.div 
                    key={node.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.2, type: 'spring' }}
                    className="relative flex flex-col items-center"
                  >
                     <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 ${node.bg} rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 z-10`}>
                       <span className={`font-display font-bold text-sm sm:text-lg lg:text-xl ${node.text}`}>{node.price}</span>
                     </div>
                     <span className="absolute -bottom-8 font-body text-white text-xs sm:text-sm whitespace-nowrap">{node.label}</span>
                     
                     {/* Red X for middlemen */}
                     {i > 0 && i < 4 && (
                       <motion.div
                         initial={{ scale: 0, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1, x: [0, -5, 5, -3, 3, 0] }}
                         transition={{ delay: 1 + i * 0.2, duration: 0.5 }}
                         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 text-5xl font-black z-20 rotate-12 drop-shadow-md"
                       >
                         ✕
                       </motion.div>
                     )}
                  </motion.div>
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="mt-16 text-red-400 font-body font-semibold text-xl lg:text-2xl text-center bg-black/40 px-6 py-3 rounded-full"
              >
                {t('scroll.scene2Stat')}
              </motion.div>
            </motion.div>
          )}

          {sceneIndex === 2 && (
            <motion.div 
              key="scene3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #D8F3DC 40%, #2D6A4F 100%)' }}
            >
              {farmerCard}
              
              <div className="relative w-full max-w-4xl h-64 flex items-center justify-between mt-10 z-20 mx-auto px-4 lg:px-0">
                {/* Farmer Node */}
                <motion.div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-farm-green rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_#1B4332] z-10 border-4 border-farm-gold">
                    <span className="font-display font-bold text-xl text-white">₹22/kg</span>
                    <span className="text-[10px] text-farm-gold leading-tight text-center">+22% more</span>
                  </div>
                  <span className="mt-3 font-body font-bold text-farm-green text-lg">Farmer</span>
                </motion.div>

                {/* Direct Beam */}
                <motion.svg className="absolute top-1/2 left-24 right-24 h-12 -translate-y-1/2 z-0 w-[calc(100%-12rem)]">
                  <motion.line 
                    x1="0" y1="24" x2="100%" y2="24" 
                    stroke="#40916C" strokeWidth="8" strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 8px #52B788)' }}
                    initial={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                  
                  {/* Sliding Coin */}
                  <motion.circle 
                    r="12" fill="#F59E0B"
                    initial={{ cx: "0%", cy: "24" }}
                    animate={{ cx: "100%", cy: "24", y: [0, -5, 0] }}
                    transition={{ cx: { duration: 1.5, repeat: Infinity, ease: "linear" }, y: { duration: 0.8, repeat: Infinity } }}
                  />
                  <motion.text 
                     initial={{ x: "0%", y: 28 }}
                     animate={{ x: "100%", y: 28, y: [4, -1, 4] }}
                     transition={{ x: { duration: 1.5, repeat: Infinity, ease: "linear" }, y: { duration: 0.8, repeat: Infinity } }}
                     fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle"
                  >
                    ₹
                  </motion.text>
                </motion.svg>

                {/* Buyer Node */}
                <motion.div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_#2563EB] z-10 border-4 border-white">
                    <span className="font-display font-bold text-xl text-white">₹28/kg</span>
                    <span className="text-[10px] text-blue-200 leading-tight text-center">−38% cheaper</span>
                  </div>
                  <span className="mt-3 font-body font-bold text-blue-900 text-lg">Buyer</span>
                </motion.div>
              </div>

              {/* Phone Mockup */}
              <motion.div 
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 80 }}
                className="mt-6 w-[280px] h-[360px] bg-white rounded-[32px] border-[8px] border-gray-900 shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="h-40 bg-orange-100 flex items-center justify-center text-6xl">🍅</div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="font-display font-bold text-xl text-farm-dark">Fresh Tomatoes</h4>
                  <div className="text-farm-gold font-bold text-lg mt-1">₹22/kg</div>
                  <div className="text-sm text-gray-500 mt-2">Arjun Farmer • Pune</div>
                  <button className="mt-auto w-full bg-farm-green text-white py-3 rounded-xl font-body font-bold text-sm">Request Order</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {sceneIndex === 3 && (
            <motion.div 
              key="scene4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{ background: '#0F2D1F', backgroundImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #1B4332, #0F2D1F)' }}
            >
              {/* Confetti */}
              {typeof window !== 'undefined' && [...Array(25)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: 0, 
                    scale: Math.random() + 0.5,
                    x: (Math.random() - 0.5) * window.innerWidth * 0.8,
                    y: (Math.random() - 0.5) * window.innerHeight * 0.8 + 200
                  }}
                  transition={{ duration: 2, delay: i * 0.02, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full"
                  style={{ backgroundColor: ['#F59E0B', '#40916C', '#FFFFFF', '#52B788', '#FDE68A'][i % 5] }}
                />
              ))}

              <h2 className="font-display text-5xl lg:text-7xl text-white text-center mb-16 max-w-4xl leading-tight mt-10">
                {t('scroll.scene4Title')}
              </h2>

              <div className="flex flex-col sm:flex-row gap-8 z-10">
                {/* Farmer Card */}
                <motion.div 
                  whileHover={{ scale: 1.06, y: -8 }}
                  className="bg-farm-gold rounded-3xl p-8 w-64 text-center cursor-pointer shadow-xl flex flex-col"
                  onClick={() => window.location.href = '/register?role=farmer'}
                >
                  <div className="text-5xl mb-4">🌾</div>
                  <h3 className="font-display text-2xl text-farm-dark font-bold mb-2">Join as Farmer</h3>
                  <p className="font-body text-farm-dark/80 text-sm mb-6 flex-1">List crops, skip middlemen, and earn what you deserve.</p>
                  <button className="bg-farm-green text-white w-full rounded-xl py-3 font-body font-bold">Start Free →</button>
                </motion.div>

                {/* Buyer Card */}
                <motion.div 
                  whileHover={{ scale: 1.06, y: -8 }}
                  className="border-2 border-white/30 bg-white/5 backdrop-blur-md rounded-3xl p-8 w-64 text-center cursor-pointer shadow-xl flex flex-col"
                  onClick={() => window.location.href = '/register?role=buyer'}
                >
                  <div className="text-5xl mb-4">🛒</div>
                  <h3 className="font-display text-2xl text-white font-bold mb-2">Join as Buyer</h3>
                  <p className="font-body text-white/70 text-sm mb-6 flex-1">Source fresh produce directly from farms at lower costs.</p>
                  <button className="bg-white text-farm-green hover:bg-farm-gold hover:text-farm-dark transition-colors w-full rounded-xl py-3 font-body font-bold">Explore Market →</button>
                </motion.div>
              </div>

              {/* Coins */}
              <motion.div className="absolute left-1/4 bottom-1/4 w-8 h-8 rounded-full bg-farm-gold flex items-center justify-center font-bold text-farm-dark animate-coinFloat" style={{ animationDelay: '0s'}}>₹</motion.div>
              <motion.div className="absolute right-1/4 top-1/4 w-6 h-6 rounded-full bg-farm-gold flex items-center justify-center font-bold text-[10px] text-farm-dark animate-coinFloat" style={{ animationDelay: '0.7s'}}>₹</motion.div>
              <motion.div className="absolute right-1/3 bottom-1/3 w-10 h-10 rounded-full bg-farm-gold flex items-center justify-center font-bold text-lg text-farm-dark animate-coinFloat" style={{ animationDelay: '1.4s'}}>₹</motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
