import { Link } from 'react-router-dom';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useState } from 'react';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';

export const AppNavbar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'farmer': return 'bg-farm-green text-white';
      case 'buyer': return 'bg-blue-600 text-white';
      case 'transporter': return 'bg-amber-500 text-white';
      case 'admin': return 'bg-gray-800 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <nav className="h-16 bg-white border-b border-gray-200 fixed top-0 w-full z-40 flex items-center justify-between px-6 lg:px-12">
      <div className="flex items-center gap-4">
        <Link to={`/${user?.role}/dashboard`} className="font-display text-2xl font-bold text-farm-green hover:opacity-90">
          KrishiMitra
        </Link>
        {user?.role && (
          <span className={`px-2.5 py-1 rounded-md text-xs font-body font-semibold uppercase tracking-wider hidden sm:inline-block ${getRoleBadgeColor(user.role)}`}>
            {user.role}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        <Link to="/notifications" className="relative text-gray-600 hover:text-farm-green transition-colors">
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-full py-1 pr-3 pl-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-farm-pale text-farm-green flex items-center justify-center font-display font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="font-body font-medium text-gray-700 hidden sm:block">{user?.fullName?.split(' ')[0]}</span>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
              <div className="px-4 py-2 border-b border-gray-100 mb-2">
                <p className="font-body font-semibold text-gray-800 truncate">{user?.fullName}</p>
                <p className="font-body text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Link 
                to={`/${user?.role}/profile`} 
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 font-body text-gray-700 hover:bg-gray-50 hover:text-farm-green transition-colors"
              >
                <User size={18} /> {t('common.profile')}
              </Link>
              <button 
                onClick={() => {
                  setDropdownOpen(false);
                  dispatch(logout());
                }}
                className="flex items-center gap-3 px-4 py-2 font-body text-red-600 hover:bg-red-50 w-full text-left transition-colors"
              >
                <LogOut size={18} /> {t('common.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
