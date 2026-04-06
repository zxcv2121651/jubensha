import { Users, Activity, PlayCircle, DollarSign } from 'lucide-react';

const STATS = [
  { title: '总用户数', value: '12,450', change: '+12%', icon: Users, color: 'bg-blue-500 text-blue-50' },
  { title: '正在进行的对局', value: '342', change: '+5%', icon: PlayCircle, color: 'bg-emerald-500 text-emerald-50' },
  { title: '今日活跃用户', value: '4,192', change: '-2%', icon: Activity, color: 'bg-amber-500 text-amber-50' },
  { title: '今日流水 (RMB)', value: '￥24,500', change: '+18%', icon: DollarSign, color: 'bg-rose-500 text-rose-50' },
];

export default function Dashboard() {
  return (
    <div className="flex-1 min-h-screen bg-neutral-100 p-8 overflow-y-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">数据总览</h2>
          <p className="text-sm text-neutral-500 mt-1">欢迎回来，这是今天平台的核心数据表现。</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium shadow-sm hover:bg-neutral-50 transition-colors">导出报表</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium shadow-md shadow-red-600/20 hover:bg-red-700 transition-colors">系统公告</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-neutral-900 tracking-tight">{stat.value}</p>
              <p className="text-sm text-neutral-500 font-medium mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
          <Activity className="w-12 h-12 text-neutral-200 mb-4" />
          <p className="text-neutral-500 font-medium">此处未来接入 ECharts / Recharts 渲染日活曲线图</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
          <h3 className="font-bold text-neutral-900 mb-4">最新服务器告警</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">节点负载过高 (LiveKit Node 3)</p>
                  <p className="text-xs text-neutral-500 mt-1">10 分钟前</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
