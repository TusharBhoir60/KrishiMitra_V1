import { Link, useLocation } from 'react-router-dom';
import { Home, List, ShoppingCart, User, Map, Clock, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

export const BottomNav = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  if (!user || user.role === 'admin') return null;

  const getLinks = () => {
    switch (user.role) {
      case 'farmer':
        return [
          { name: t('farmer.nav.dashboard'), path: '/farmer/dashboard', icon: Home },
          { name: t('farmer.nav.listings'), path: '/farmer/listings', icon: List },
          { name: t('farmer.nav.orders'), path: '/farmer/orders', icon: ShoppingCart, badge: unreadCount > 0 },
          { name: t('farmer.nav.profile'), path: '/farmer/profile', icon: User },
        ];
      case 'buyer':
        return [
          { name: t('farmer.nav.dashboard'), path: '/buyer/dashboard', icon: Home },
          { name: t('common.marketplace'), path: '/buyer/marketplace', icon: Search },
          { name: t('common.orders'), path: '/buyer/orders', icon: ShoppingCart, badge: unreadCount > 0 },
          { name: t('common.profile'), path: '/buyer/profile', icon: User },
        ];
      case 'transporter':
        return [
          { name: t('home'), path: '/transporter/dashboard', icon: Home },
          { name: t('transporter.jobs'), path: '/transporter/jobs', icon: Map },
          { name: t('transporter.history'), path: '/transporter/history', icon: Clock },
          { name: t('profile'), path: '/transporter/profile', icon: User },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();
  
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe md:hidden z-40">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex flex-col items-center justify-center w-full h-full relative ${isActive ? 'text-farm-green' : 'text-gray-500'}`}
            >
              {isActive && <div className="absolute top-0 w-8 h-1 bg-farm-green rounded-b-full"></div>}
              <div className="relative mt-1">
                <Icon size={24} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                {link.badge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                )}
              </div>
              <span className={`text-[10px] font-body mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
