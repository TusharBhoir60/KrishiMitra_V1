import { Outlet } from 'react-router-dom';
import { AppNavbar } from './AppNavbar';
import { BottomNav } from './BottomNav';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 pt-16">
      <AppNavbar />
      <main className="max-w-7xl mx-auto w-full relative">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
