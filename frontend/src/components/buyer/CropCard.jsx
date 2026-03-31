import { motion as Motion } from 'framer-motion';

export const CropCard = ({ crop, index }) => {
  const getGradient = (name) => {
    if (name.includes('Tomato')) return 'from-[#FF6B6B] to-[#EE5A24]';
    if (name.includes('Wheat')) return 'from-[#F6D365] to-[#FDA085]';
    if (name.includes('Maize')) return 'from-[#FDDB92] to-[#F5AF19]';
    if (name.includes('Onion')) return 'from-[#A18CD1] to-[#FBC2EB]';
    if (name.includes('Potato')) return 'from-[#D4A574] to-[#8B6914]';
    if (name.includes('Broccoli')) return 'from-[#56AB2F] to-[#A8E063]';
    return 'from-farm-light to-farm-mid';
  };

  const getEmoji = (name) => {
    if (name.includes('Tomato')) return '🍅';
    if (name.includes('Wheat')) return '🌾';
    if (name.includes('Maize')) return '🌽';
    if (name.includes('Onion')) return '🧅';
    if (name.includes('Potato')) return '🥔';
    if (name.includes('Broccoli')) return '🥦';
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
      <div className={`h-48 bg-gradient-to-br ${getGradient(crop.name)} relative overflow-hidden flex items-center justify-center group shrink-0`}>
        <Motion.div 
          className="text-7xl transform translate-y-[10px] transition-transform duration-500 group-hover:scale-125"
        >
          {getEmoji(crop.name)}
        </Motion.div>
        
        {crop.organic && (
          <div className="absolute top-4 right-4 bg-white/90 rounded-full px-3 py-1 text-farm-green text-xs font-body font-semibold shadow-sm">
            Organic ✓
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
          <span>{crop.qty} available</span>
          <span>Posted {crop.posted}</span>
        </div>
        
        <hr className="border-gray-100 mb-4 mt-auto" />
        
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-lg border border-farm-green text-farm-green font-body font-semibold text-sm hover:bg-farm-green hover:text-white transition-colors">
            View Details
          </button>
          <button className="flex-1 py-3 rounded-lg bg-farm-green text-white font-body font-semibold text-sm hover:bg-farm-mid transition-colors">
            Request Order
          </button>
        </div>
      </div>
    </Motion.div>
  );
};
