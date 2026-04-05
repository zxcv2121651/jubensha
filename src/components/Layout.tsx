import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Users, User, Compass } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: Compass, label: '找本', path: '/discover' },
    { icon: Users, label: '组局', path: '/lobby' },
    { icon: User, label: '我的', path: '/profile' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-neutral-200 px-6 py-2 flex justify-between items-center z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-colors",
                isActive ? "text-red-600" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
