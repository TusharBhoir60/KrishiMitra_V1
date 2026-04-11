import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, Search, PackageCheck, BrainCircuit, LayoutDashboard, Store } from 'lucide-react';

export const FeaturesSection = () => {
  const { t } = useLanguage();
  const features = t('features', { returnObjects: true }) || {};
  const featureItems = Array.isArray(features.items) ? features.items : [];

  const icons = [FileText, Search, PackageCheck, BrainCircuit, LayoutDashboard, Store];
  const bgColors = [
    'bg-farm-green text-white',
    'bg-farm-pale text-farm-dark',
    'bg-white border border-farm-pale text-farm-dark',
    'bg-farm-dark text-white',
    'bg-farm-gold/10 border border-farm-gold/30 text-farm-dark',
    'bg-farm-light/10 border border-farm-light/30 text-farm-dark'
  ];

  return (
    <section className="bg-farm-cream py-24 px-6 lg:px-16" id="features">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display text-5xl text-farm-green text-center mb-4">{features.title || ''}</h2>
        <p className="font-body text-xl text-farm-mid text-center mb-16 max-w-2xl mx-auto">{features.subtitle || ''}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureItems.map((item, index) => {
            const Icon = icons[index];
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(27,67,50,0.15)', transition: { type: 'spring', stiffness: 300 } }}
                className={`rounded-[32px] p-8 flex flex-col ${item.size === 'col-span-2' ? 'lg:col-span-2' : 'lg:col-span-1'} ${bgColors[index]}`}
              >
                <motion.div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-white/20 backdrop-blur-sm"
                  whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
                >
                  <Icon size={28} />
                </motion.div>
                <h3 className="font-display text-2xl font-bold mb-3">{item.title}</h3>
                <p className="font-body opacity-80 leading-relaxed text-lg flex-1">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
