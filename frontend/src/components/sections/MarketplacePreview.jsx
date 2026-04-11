import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { CropCard } from '../buyer/CropCard';

export const MarketplacePreview = () => {
  const { t, currentLanguage } = useLanguage();
  const mp = t('marketplace', { returnObjects: true }) || {};

  const hardcodedCrops = currentLanguage === 'hi'
    ? [
        { type: 'tomato', name: 'लाल टमाटर', farmerName: 'Ramesh Patil', location: 'पुणे', price: 22, qty: '240kg', posted: '2 दिन पहले', organic: true },
        { type: 'wheat', name: 'प्रीमियम गेहूं', farmerName: 'Surinder Singh', location: 'अंबाला', price: 28, qty: '1200kg', posted: '5 दिन पहले', organic: false },
        { type: 'maize', name: 'ताज़ा मक्का', farmerName: 'Vijay Kumar', location: 'नागपुर', price: 14, qty: '800kg', posted: '1 दिन पहले', organic: true },
        { type: 'onion', name: 'नाशिक प्याज', farmerName: 'Priya Sharma', location: 'नाशिक', price: 12, qty: '600kg', posted: '3 दिन पहले', organic: true },
        { type: 'potato', name: 'फार्म आलू', farmerName: 'Arjun Patel', location: 'आगरा', price: 16, qty: '450kg', posted: '4 दिन पहले', organic: true },
        { type: 'broccoli', name: 'ताज़ी ब्रोकली', farmerName: 'Meena Reddy', location: 'बेंगलुरु', price: 45, qty: '120kg', posted: '1 दिन पहले', organic: true },
      ]
    : currentLanguage === 'mr'
      ? [
          { type: 'tomato', name: 'लाल टोमॅटो', farmerName: 'Ramesh Patil', location: 'पुणे', price: 22, qty: '240kg', posted: '2 दिवसांपूर्वी', organic: true },
          { type: 'wheat', name: 'प्रिमियम गहू', farmerName: 'Surinder Singh', location: 'अंबाला', price: 28, qty: '1200kg', posted: '5 दिवसांपूर्वी', organic: false },
          { type: 'maize', name: 'ताजा मका', farmerName: 'Vijay Kumar', location: 'नागपूर', price: 14, qty: '800kg', posted: '1 दिवसापूर्वी', organic: true },
          { type: 'onion', name: 'नाशिक कांदा', farmerName: 'Priya Sharma', location: 'नाशिक', price: 12, qty: '600kg', posted: '3 दिवसांपूर्वी', organic: true },
          { type: 'potato', name: 'फार्म बटाटा', farmerName: 'Arjun Patel', location: 'आग्रा', price: 16, qty: '450kg', posted: '4 दिवसांपूर्वी', organic: true },
          { type: 'broccoli', name: 'ताजी ब्रोकली', farmerName: 'Meena Reddy', location: 'बेंगळुरू', price: 45, qty: '120kg', posted: '1 दिवसापूर्वी', organic: true },
        ]
      : [
          { type: 'tomato', name: 'Red Tomatoes', farmerName: 'Ramesh Patil', location: 'Pune', price: 22, qty: '240kg', posted: '2 days ago', organic: true },
          { type: 'wheat', name: 'Premium Wheat', farmerName: 'Surinder Singh', location: 'Ambala', price: 28, qty: '1200kg', posted: '5 days ago', organic: false },
          { type: 'maize', name: 'Fresh Maize', farmerName: 'Vijay Kumar', location: 'Nagpur', price: 14, qty: '800kg', posted: '1 day ago', organic: true },
          { type: 'onion', name: 'Nashik Onion', farmerName: 'Priya Sharma', location: 'Nashik', price: 12, qty: '600kg', posted: '3 days ago', organic: true },
          { type: 'potato', name: 'Farm Potato', farmerName: 'Arjun Patel', location: 'Agra', price: 16, qty: '450kg', posted: '4 days ago', organic: true },
          { type: 'broccoli', name: 'Fresh Broccoli', farmerName: 'Meena Reddy', location: 'Bangalore', price: 45, qty: '120kg', posted: '1 day ago', organic: true },
        ];

  const tickerText = currentLanguage === 'hi'
    ? '🌽 मक्का · नागपुर · ₹14/kg | 🍅 टमाटर · पुणे · ₹22/kg | 🧅 प्याज · नाशिक · ₹12/kg | 🌾 गेहूं · अमरावती · ₹28/kg | 🍌 केला · जलगांव · ₹18/kg | 🥔 आलू · आगरा · ₹16/kg | 🌶️ मिर्च · गुंटूर · ₹85/kg | 🍇 अंगूर · नाशिक · ₹65/kg'
    : currentLanguage === 'mr'
      ? '🌽 मका · नागपूर · ₹14/kg | 🍅 टोमॅटो · पुणे · ₹22/kg | 🧅 कांदा · नाशिक · ₹12/kg | 🌾 गहू · अमरावती · ₹28/kg | 🍌 केळी · जळगाव · ₹18/kg | 🥔 बटाटा · आग्रा · ₹16/kg | 🌶️ मिरची · गुंटूर · ₹85/kg | 🍇 द्राक्षे · नाशिक · ₹65/kg'
      : '🌽 Maize · Nagpur · ₹14/kg | 🍅 Tomato · Pune · ₹22/kg | 🧅 Onion · Nashik · ₹12/kg | 🌾 Wheat · Amravati · ₹28/kg | 🍌 Banana · Jalgaon · ₹18/kg | 🥔 Potato · Agra · ₹16/kg | 🌶️ Chilli · Guntur · ₹85/kg | 🍇 Grapes · Nashik · ₹65/kg';

  return (
    <section 
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 50%, #ffffff 100%)' }}
      className="py-24"
    >
      <div className="px-6 lg:px-16 max-w-7xl mx-auto mb-20">
        <h2 className="font-display text-5xl text-farm-green text-center mb-4">{mp.title || ''}</h2>
        <p className="font-body text-xl text-gray-500 text-center mb-16">{mp.subtitle || ''}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hardcodedCrops.map((crop, index) => (
            <CropCard key={index} crop={crop} index={index} />
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <button className="group flex items-center gap-2 border-2 border-farm-green text-farm-green rounded-xl px-10 py-4 font-body font-semibold text-lg hover:bg-farm-green hover:text-white transition-colors">
            {mp.viewAll || ''}
            <ArrowRight className="transform transition-transform group-hover:translate-x-1" size={20} />
          </button>
        </div>
      </div>

      {/* Live Price Ticker */}
      <div className="bg-farm-green py-3 w-full flex items-center overflow-hidden whitespace-nowrap relative">
        <div className="absolute left-0 top-0 bottom-0 bg-farm-green z-10 px-6 flex items-center justify-center font-body font-semibold text-farm-gold shadow-[10px_0_20px_#1B4332]">
          🔴 {mp.livePrices || ''}
        </div>
        <div className="flex animate-ticker pl-[200px] hover:[animation-play-state:paused] cursor-default">
          <span className="text-white/80 font-body text-sm mr-8">{tickerText}</span>
          <span className="text-white/80 font-body text-sm mr-8">{tickerText}</span>
        </div>
      </div>
    </section>
  );
};
