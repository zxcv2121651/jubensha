import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ShieldAlert, Store, Settings, LogOut, RadioReceiver } from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { name: '控制台 (Dashboard)', path: '/', icon: LayoutDashboard },
  { name: '玩家与DM管理', path: '/users', icon: Users },
  { name: '拼车监控大厅', path: '/rooms', icon: RadioReceiver },
  { name: '剧本发售与审核', path: '/scripts', icon: BookOpen },
  { name: '风控与举报处理', path: '/reports', icon: ShieldAlert },
  { name: '营销与商城配置', path: '/store', icon: Store },
  { name: '系统设置', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 min-h-screen flex flex-col transition-all duration-300" style={{ backgroundColor: '#001529' }}>
      <div className="h-16 flex items-center justify-center border-b border-[#002140] shadow-sm">
        <h1 className="text-lg font-bold text-white tracking-wider flex items-center gap-2 font-mono">
          <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs">JBS</span>
          谜案寻踪 B-End
        </h1>
      </div>

      <nav className="flex-1 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 border-r-4",
                isActive
                  ? "bg-[#1890ff] text-white border-[#1890ff] font-medium"
                  : "text-neutral-400 hover:text-white border-transparent hover:bg-[#002140]"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-neutral-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#002140] bg-[#000c17]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <img src="https://picsum.photos/seed/admin/40/40" className="w-8 h-8 rounded-full border border-neutral-600" alt="Admin" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{localStorage.getItem('adminName') || '超管_001'}</p>
            <p className="text-[10px] text-neutral-500 truncate">admin@jubensha.com</p>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-transparent border border-neutral-600 hover:border-neutral-400 text-neutral-400 hover:text-white rounded transition-colors text-xs font-medium">
          <LogOut className="w-3.5 h-3.5" />
          安全退出
        </button>
      </div>
    </div>
  );
}
