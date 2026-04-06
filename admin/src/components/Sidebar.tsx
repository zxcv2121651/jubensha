import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ShieldAlert, Store, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { name: '总览', path: '/', icon: LayoutDashboard },
  { name: '用户管理', path: '/users', icon: Users },
  { name: '剧本审批', path: '/scripts', icon: BookOpen },
  { name: '举报审核', path: '/reports', icon: ShieldAlert },
  { name: '商城与运营', path: '/store', icon: Store },
  { name: '系统设置', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-neutral-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6 border-b border-neutral-800">
        <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          谜案寻踪 后台
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <img src="https://picsum.photos/seed/admin/40/40" className="w-10 h-10 rounded-full border-2 border-neutral-700" alt="Admin" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Super Admin</p>
            <p className="text-xs text-neutral-500 truncate">admin@jubensha.com</p>
          </div>
        </div>
        <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors text-sm font-medium">
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </div>
  );
}
