import { motion as Motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export const CropCard = ({ crop, index }) => {
  const { currentLanguage } = useLanguage();

  const uiText = currentLanguage === 'hi'
    ? {
        organic: 'जैविक',
        available: 'उपलब्ध',
        posted: 'पोस्ट किया',
        viewDetails: 'विवरण देखें',
        requestOrder: 'ऑर्डर अनुरोध',
      }
    : currentLanguage === 'mr'
      ? {
          organic: 'सेंद्रिय',
          available: 'उपलब्ध',
          posted: 'पोस्ट केले',
          viewDetails: 'तपशील पहा',
          requestOrder: 'ऑर्डर विनंती',
        }
      : {
          organic: 'Organic',
          available: 'available',
          posted: 'Posted',
          viewDetails: 'View Details',
          requestOrder: 'Request Order',
        };

  const getGradient = (type = '', name = '') => {
    const kind = String(type || '').toLowerCase();
    const label = String(name || '').toLowerCase();

    if (kind === 'tomato' || label.includes('tomato') || label.includes('टमाटर') || label.includes('टोमॅटो')) return 'from-[#FF6B6B] to-[#EE5A24]';
    if (kind === 'wheat' || label.includes('wheat') || label.includes('गेहूं') || label.includes('गहू')) return 'from-[#F6D365] to-[#FDA085]';
    if (kind === 'maize' || label.includes('maize') || label.includes('मक्का') || label.includes('मका')) return 'from-[#FDDB92] to-[#F5AF19]';
    if (kind === 'onion' || label.includes('onion') || label.includes('प्याज') || label.includes('कांदा')) return 'from-[#A18CD1] to-[#FBC2EB]';
    if (kind === 'potato' || label.includes('potato') || label.includes('आलू') || label.includes('बटाटा')) return 'from-[#D4A574] to-[#8B6914]';
    if (kind === 'broccoli' || label.includes('broccoli') || label.includes('ब्रोकली')) return 'from-[#56AB2F] to-[#A8E063]';
    return 'from-farm-light to-farm-mid';
  };

  const getEmoji = (type = '', name = '') => {
    const kind = String(type || '').toLowerCase();
    const label = String(name || '').toLowerCase();

    if (kind === 'tomato' || label.includes('tomato') || label.includes('टमाटर') || label.includes('टोमॅटो')) return '🍅';
    if (kind === 'wheat' || label.includes('wheat') || label.includes('गेहूं') || label.includes('गहू')) return '🌾';
    if (kind === 'maize' || label.includes('maize') || label.includes('मक्का') || label.includes('मका')) return '🌽';
    if (kind === 'onion' || label.includes('onion') || label.includes('प्याज') || label.includes('कांदा')) return '🧅';
    if (kind === 'potato' || label.includes('potato') || label.includes('आलू') || label.includes('बटाटा')) return '🥔';
    if (kind === 'broccoli' || label.includes('broccoli') || label.includes('ब्रोकली')) return '🥦';
    return '🌱';
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, rotateX: -3, rotateY: 4, scale: 1.02, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
      style={{ transformPerspective: 1000 }}
      className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 cursor-pointer shimmer-card flex flex-col h-full"
    >
      <div className={`h-48 bg-gradient-to-br ${getGradient(crop.type, crop.name)} relative overflow-hidden flex items-center justify-center group shrink-0`}>
        <Motion.div 
          className="text-7xl transform translate-y-[10px] transition-transform duration-500 group-hover:scale-125"
        >
          {getEmoji(crop.type, crop.name)}
        </Motion.div>
        
        {crop.organic && (
          <div className="absolute top-4 right-4 bg-white/90 rounded-full px-3 py-1 text-farm-green text-xs font-body font-semibold shadow-sm">
            {uiText.organic} ✓
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-display text-2xl text-farm-dark">{crop.name}</h3>
          <span className="font-body font-bold text-farm-gold text-xl whitespace-nowrap">₹{crop.price}/kg</span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-farm-pale text-farm-green flex items-center justify-center text-xs font-bold font-body">
            {crop.farmerName.charAt(0)}
          </div>
          <span className="font-body text-sm text-gray-700">{crop.farmerName} • {crop.location}</span>
        </div>
        
        <div className="font-body text-sm text-gray-500 mb-4 flex justify-between">
          <span>{crop.qty} {uiText.available}</span>
          <span>{uiText.posted} {crop.posted}</span>
        </div>
        
        <hr className="border-gray-100 mb-4 mt-auto" />
        
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-lg border border-farm-green text-farm-green font-body font-semibold text-sm hover:bg-farm-green hover:text-white transition-colors">
            {uiText.viewDetails}
          </button>
          <button className="flex-1 py-3 rounded-lg bg-farm-green text-white font-body font-semibold text-sm hover:bg-farm-mid transition-colors">
            {uiText.requestOrder}
          </button>
        </div>
      </div>
    </Motion.div>
  );
};
