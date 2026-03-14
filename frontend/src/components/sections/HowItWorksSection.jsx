import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export const HowItWorksSection = () => {
  const { t } = useLanguage();
  const hw = t('howItWorks');
  const containerRef = useRef(null);
  const farmerHeight = '100%';
  const buyerHeight = '100%';

  return (
    <section className="bg-white py-24 px-6 lg:px-16 relative" id="how-it-works" ref={containerRef}>
      <h2 className="font-display text-5xl text-farm-green text-center mb-20">{hw.title}</h2>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Farmer Timeline */}
        <div className="relative">
          <div className="absolute left-[23px] top-0 bottom-0 w-1 bg-farm-pale rounded-full" />
          <motion.div 
            className="absolute left-[23px] top-0 w-1 bg-farm-green rounded-full origin-top"
            style={{ height: farmerHeight }}
          />
          
          <h3 className="font-display text-3xl text-farm-green mb-10 pl-16">🌾 {hw.farmerLabel}</h3>
          
          <div className="space-y-12 z-10 relative">
            {hw.farmerSteps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative pl-16 group"
              >
                <div className="absolute left-0 top-0 w-12 h-12 bg-farm-green text-white rounded-full flex items-center justify-center font-body font-bold text-xl z-20 shadow-lg group-hover:scale-110 transition-transform shadow-farm-green/30">
                  {step.n}
                </div>
                <h4 className="font-display text-2xl font-bold text-farm-dark mb-2">{step.title}</h4>
                <p className="font-body text-gray-600 text-lg">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Buyer Timeline */}
        <div className="relative mt-16 lg:mt-0">
          <div className="absolute left-[23px] top-0 bottom-0 w-1 bg-farm-gold/20 rounded-full" />
          <motion.div 
            className="absolute left-[23px] top-0 w-1 bg-farm-gold rounded-full origin-top"
            style={{ height: buyerHeight }}
          />

          <h3 className="font-display text-3xl text-farm-gold mb-10 pl-16">🛒 {hw.buyerLabel}</h3>
          
          <div className="space-y-12 z-10 relative">
            {hw.buyerSteps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative pl-16 group"
              >
                <div className="absolute left-0 top-0 w-12 h-12 bg-farm-gold text-farm-dark rounded-full flex items-center justify-center font-body font-bold text-xl z-20 shadow-lg group-hover:scale-110 transition-transform shadow-farm-gold/30">
                  {step.n}
                </div>
                <h4 className="font-display text-2xl font-bold text-farm-dark mb-2">{step.title}</h4>
                <p className="font-body text-gray-600 text-lg">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
