import { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { HeroSection } from '../components/sections/HeroSection';
import { StatsRow } from '../components/sections/StatsRow';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { HowItWorksSection } from '../components/sections/HowItWorksSection';
import { MarketplacePreview } from '../components/sections/MarketplacePreview';
import { TestimonialsSection } from '../components/sections/TestimonialsSection';
import { CTASection } from '../components/sections/CTASection';
import { Footer } from '../components/layout/Footer';

export const LandingPage = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(Math.min(100, Math.max(0, height > 0 ? (scrollY / height) * 100 : 0)));
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-green-50 to-white overflow-x-hidden selection:bg-farm-green selection:text-white">
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 z-[60] transition-all duration-150 ease-out"
        style={{ 
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, #1B4332, #F59E0B)' 
        }}
      />
      
      <Navbar />
      <main>
        <HeroSection />
        <StatsRow />
        <FeaturesSection />
        <HowItWorksSection />
        <MarketplacePreview />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};
