import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AnimatedCounter } from '../ui/AnimatedCounter';

export const StatsRow = () => {
  const { t } = useLanguage();
  const stats = t('stats', { returnObjects: true });

  return (
    <div className="bg-farm-green py-14 px-6 lg:px-16 w-full relative z-10 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-farm-mid/40">
        {Array.isArray(stats) && stats.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex-1 flex flex-col items-center justify-center pt-8 md:pt-0 w-full"
          >
            <div className="font-display text-5xl font-bold text-farm-gold flex items-center">
              {stat.prefix}
              <AnimatedCounter value={stat.value} decimals={stat.value % 1 !== 0 ? 1 : 0} />
              {stat.suffix}
            </div>
            <div className="font-body text-farm-light text-sm mt-1 uppercase tracking-wider font-semibold">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
