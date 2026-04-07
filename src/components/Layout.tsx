import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Compass, User, Users, Store, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/lobby', label: '组局', icon: Users },
  { path: '/discover', label: '发现', icon: Compass },
  { path: '/messages', label: '消息', icon: MessageSquare },
  { path: '/store', label: '珍宝', icon: Store },
  { path: '/profile', label: '我的', icon: User },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-neutral-50 font-sans antialiased text-neutral-900 pb-safe">
      <main className="pb-16 max-w-md mx-auto relative shadow-2xl min-h-screen bg-white">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-neutral-200/50 pb-safe z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center justify-center w-16 h-full gap-1 group relative overflow-hidden"
              >
                <div className={cn(
                  "p-1.5 rounded-full transition-all duration-300",
                  isActive ? "bg-red-50 scale-110" : "group-hover:bg-neutral-50"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive ? "text-red-600 stroke-[2.5]" : "text-neutral-400 group-hover:text-neutral-600"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] transition-all duration-300",
                  isActive ? "font-bold text-red-600" : "font-medium text-neutral-400 group-hover:text-neutral-600"
                )}>
                  {label}
                </span>

                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-red-600 rounded-b-full shadow-[0_2px_8px_rgba(220,38,38,0.5)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
