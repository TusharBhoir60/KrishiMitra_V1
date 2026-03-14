import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { HeroSection } from '../components/sections/HeroSection';
import { StatsRow } from '../components/sections/StatsRow';
import { ScrollFarmScene } from '../components/sections/ScrollFarmScene';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { HowItWorksSection } from '../components/sections/HowItWorksSection';
import { MarketplacePreview } from '../components/sections/MarketplacePreview';
import { TestimonialsSection } from '../components/sections/TestimonialsSection';
import { CTASection } from '../components/sections/CTASection';
import { Footer } from '../components/layout/Footer';
import { getRoleHomePath } from '../utils/authRedirect';

export const LandingPage = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (!storedUser && !storedRole) return;

    try {
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const role = parsedUser?.role || storedRole;
      if (role) {
        navigate(getRoleHomePath(role), { replace: true });
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
  }, [navigate]);

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
        <ScrollFarmScene />
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
