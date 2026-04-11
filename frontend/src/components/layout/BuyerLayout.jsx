import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Truck, User, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useBuyerCart } from '../../context/BuyerCartContext';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../store/slices/authSlice';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';

export const BuyerLayout = () => {
  const { cartCount, orders } = useBuyerCart();
  const { t } = useLanguage();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const displayName = user?.name || user?.fullName || user?.businessName || t('buyer.profile.title');
  const initials = (displayName || 'B')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'B';

  const profileRows = [
    { label: t('buyer.profile.fullName'), value: user?.name || user?.fullName },
    { label: t('auth.email'), value: user?.email },
    { label: t('buyer.profile.phone'), value: user?.phone },
    { label: t('buyer.profile.businessName'), value: user?.businessName },
    { label: t('buyer.profile.businessType'), value: user?.businessType },
    { label: t('buyer.profile.district'), value: user?.location?.district },
    { label: t('buyer.profile.state'), value: user?.location?.state },
    { label: t('buyer.profile.deliveryAddress'), value: user?.deliveryAddress },
  ].filter((item) => item.value);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fbf4] via-white to-[#f4efe4] text-farm-dark">
      <header className="sticky top-0 z-40 border-b border-green-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/buyer/marketplace" className="min-w-0">
            <p className="font-display text-2xl font-bold text-farm-green">KrishiMitra</p>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#8c7a5a]">{t('farmer.nav.farmToHome')}</p>
          </NavLink>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <NavLink
              to="/buyer/cart"
              className={({ isActive }) =>
                `relative flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-farm-green bg-farm-green text-white'
                    : 'border-green-100 bg-[#f7fbf4] text-farm-dark hover:bg-green-50'
                }`
              }
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">{t('common.cart')}</span>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8a5a2b] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/buyer/orders"
              className={({ isActive }) =>
                `relative flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-farm-green bg-farm-green text-white'
                    : 'border-green-100 bg-[#f7fbf4] text-farm-dark hover:bg-green-50'
                }`
              }
            >
              <Truck size={18} />
              <span className="hidden sm:inline">{t('farmer.nav.trackOrders')}</span>
              {orders.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-farm-gold px-1 text-[10px] font-bold text-farm-dark">
                  {orders.length}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/buyer/profile"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-blue-100 bg-[#f4f8ff] text-farm-dark hover:bg-blue-50'
                }`
              }
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
              <span className="hidden sm:inline">{t('common.profile')}</span>
            </NavLink>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-73px)]">
        <Outlet />
      </main>
    </div>
  );
};