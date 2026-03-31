import { motion as Motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const TestimonialsSection = () => {
  const { t } = useLanguage();
  const testData = t('testimonials');
  
  if (!testData || !testData.items) return null;

  return (
    <section className="bg-farm-dark py-24 px-6 lg:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display text-5xl text-white text-center mb-4">{testData.title}</h2>
        <p className="font-body text-xl text-farm-light text-center mb-16">{testData.subtitle}</p>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testData.items.map((item, index) => (
            <Motion.div
              key={index}
              initial={{ rotateY: 15, opacity: 0 }}
              whileInView={{ rotateY: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              style={{ transformPerspective: 800 }}
              className="bg-white/95 rounded-2xl p-7 break-inside-avoid border border-white/10 shadow-xl"
            >
              <span className="font-display text-7xl text-farm-gold leading-none float-left mr-3 mt-[-10px]">&ldquo;</span>
              <p className="font-body text-base text-farm-dark leading-relaxed italic mb-6 relative z-10">
                {item.quote}
              </p>
              
              <div className="flex items-center gap-4 mt-6 clear-both">
                <div className="w-12 h-12 rounded-full bg-farm-pale text-farm-green flex items-center justify-center font-display font-bold text-xl shrink-0">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-body font-semibold text-farm-dark">{item.name}</h4>
                  <p className="font-body text-sm text-gray-500">{item.role} • {item.location}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 mt-4 pl-16">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < item.rating ? 'fill-farm-gold text-farm-gold' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
