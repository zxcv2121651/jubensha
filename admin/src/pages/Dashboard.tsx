import { useState, useEffect } from 'react';
import { Users, Activity, PlayCircle, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatData { value: number; change: string; }
interface DashboardStats { totalUsers: StatData; activeRooms: StatData; totalDms: StatData; dailyRevenue: StatData; }

// Mock Chart Data
const chartData = [
  { name: 'Mon', DAU: 4000, Revenue: 2400 },
  { name: 'Tue', DAU: 3000, Revenue: 1398 },
  { name: 'Wed', DAU: 2000, Revenue: 9800 },
  { name: 'Thu', DAU: 2780, Revenue: 3908 },
  { name: 'Fri', DAU: 1890, Revenue: 4800 },
  { name: 'Sat', DAU: 2390, Revenue: 3800 },
  { name: 'Sun', DAU: 3490, Revenue: 4300 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/admin/stats', { headers: { 'x-admin-id': localStorage.getItem('adminToken') || 'user_1' } })
      .then(res => res.json())
      .then(data => { if (data.success) setStats(data.data); });
  }, []);

  const STATS_CONFIG = stats ? [
    { title: '正在进行的对局', value: stats.activeRooms.value, change: stats.activeRooms.change, icon: PlayCircle, color: '#52c41a' },
    { title: '平台活跃玩家', value: stats.totalUsers.value, change: stats.totalUsers.change, icon: Users, color: '#1890ff' },
    { title: '全服注册 DM', value: stats.totalDms.value, change: stats.totalDms.change, icon: Activity, color: '#722ed1' },
    { title: '全站剩余虚拟币', value: `￥${stats.dailyRevenue.value}`, change: stats.dailyRevenue.change, icon: DollarSign, color: '#fa8c16' },
  ] : [];

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#f0f2f5] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">控制台</h2>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span>首页</span>
            <span>/</span>
            <span className="text-gray-800">实时数据监控</span>
          </div>
        </div>
        <div className="space-x-3">
          <button className="px-4 py-1.5 bg-white border border-gray-300 rounded text-sm hover:text-[#1890ff] hover:border-[#1890ff] transition-colors">导出今日报表</button>
          <button className="px-4 py-1.5 bg-[#1890ff] text-white border border-[#1890ff] rounded text-sm hover:bg-[#40a9ff] hover:border-[#40a9ff] transition-colors">刷新数据</button>
        </div>
      </div>

      {!stats ? (
        <div className="p-12 text-center text-gray-500">加载数据中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {STATS_CONFIG.map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">{stat.title}</span>
                <div className="p-1.5 rounded-sm" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <span className={`text-sm flex items-center mb-1 ${stat.change.startsWith('+') ? 'text-[#f5222d]' : 'text-[#52c41a]'}`}>
                  {stat.change.startsWith('+') ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5 rotate-180" />}
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-sm border border-gray-200 p-5 shadow-sm min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
            <h3 className="font-bold text-gray-800">平台趋势图 (近7天)</h3>
            <select className="text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#1890ff]">
              <option>DAU 活跃用户</option>
              <option>营收总额</option>
            </select>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#8c8c8c'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#8c8c8c'}} dx={-10} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="DAU" stroke="#1890ff" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              系统告警中心 <span className="bg-[#fff1f0] border border-[#ffa39e] text-[#f5222d] text-xs px-2 py-0.5 rounded-full">1</span>
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-[#faad14]" />
              <div>
                <p className="text-sm text-gray-800 font-medium">跳车率异常偏高 (剧本ID: 1002)</p>
                <p className="text-xs text-gray-400 mt-1">2026-04-06 14:32:11</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
