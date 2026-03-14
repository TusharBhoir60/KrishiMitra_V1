import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, User, Plus, Leaf, LogOut } from 'lucide-react';
import { AppNavbar } from './AppNavbar';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', to: '/farmer/dashboard', icon: LayoutDashboard },
  { name: 'Listings',  to: '/farmer/listings',  icon: Package },
  { name: 'Orders',    to: '/farmer/orders',    icon: ShoppingCart },
  { name: 'Profile',   to: '/farmer/profile',   icon: User },
];

export const FarmerLayout = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />

      <div className="flex pt-16 min-h-screen">
        {/* ── Left Sidebar (desktop only) ── */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 shadow-sm">

          {/* Farmer identity */}
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-farm-pale rounded-full flex items-center justify-center text-farm-green font-bold text-lg font-display shrink-0">
                {user?.name?.charAt(0) || user?.fullName?.charAt(0) || '🌾'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-farm-dark text-sm truncate">{user?.name || user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.location?.district || 'Farmer'}</p>
              </div>
            </div>
            {user?.isVerified && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-farm-green">
                <Leaf size={12} className="fill-farm-green" />
                KrishiMitra Verified
              </div>
            )}
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/farmer/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-farm-green text-white shadow-md shadow-farm-green/30'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-farm-green'
                  }`
                }
              >
                <item.icon size={19} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="px-4 pb-5 space-y-2 border-t border-gray-100 pt-4">
            <Link
              to="/farmer/listings/new"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-farm-green hover:bg-farm-dark text-white rounded-xl font-medium text-sm transition-colors shadow-md shadow-farm-green/25"
            >
              <Plus size={17} /> New Listing
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl font-medium text-sm transition-colors"
            >
              <LogOut size={17} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 md:ml-64 pb-20 md:pb-8 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
};
