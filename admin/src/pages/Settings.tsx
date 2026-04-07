import { useState, useEffect } from 'react';
import { Save, Server, Shield, BellRing } from 'lucide-react';

interface SysSettings {
  maintenanceMode: boolean;
  globalMute: boolean;
  maxQueueSize: number;
  signupBonus: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<SysSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/admin/settings', { headers: { 'x-admin-id': localStorage.getItem('adminToken') || 'user_1' } })
      .then(res => res.json())
      .then(data => { if (data.success) setSettings(data.data); });
  }, []);

  const handleSave = () => {
    setSaving(true);
    fetch('http://localhost:3001/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': localStorage.getItem('adminToken') || 'user_1' },
      body: JSON.stringify(settings)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) alert('设置已生效！');
      })
      .finally(() => setSaving(false));
  };

  if (!settings) return <div className="p-12 text-center text-gray-500">加载系统配置中...</div>;

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#f0f2f5] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">系统全局设置</h2>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span>首页</span>
            <span>/</span>
            <span className="text-gray-800">系统设置</span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#1890ff] text-white border border-[#1890ff] rounded hover:bg-[#40a9ff] transition-colors flex items-center gap-2 font-medium shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存所有更改'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Core Server Config */}
        <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
             <Server className="w-5 h-5 text-[#1890ff]" />
             服务器底层配置
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800 text-sm">停机维护模式</p>
                <p className="text-xs text-gray-500 mt-1">开启后，除超管外所有玩家无法登录 App，并提示服务器维护。</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} />
                <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#f5222d] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              </label>
            </div>

            <div>
              <p className="font-bold text-gray-800 text-sm mb-2">匹配队列上限 (高并发保护)</p>
              <input type="number" value={settings.maxQueueSize} onChange={e => setSettings({...settings, maxQueueSize: Number(e.target.value)})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1890ff]" />
              <p className="text-xs text-gray-400 mt-1">防止大流量冲垮 Redis 或 Matchmaking 服务。</p>
            </div>
          </div>
        </div>

        {/* Security & Moderation */}
        <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
             <Shield className="w-5 h-5 text-[#faad14]" />
             全局合规与风控
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800 text-sm">全服强制禁言 (Global Mute)</p>
                <p className="text-xs text-gray-500 mt-1">紧急按钮。一键掐断所有 LiveKit 语音推流及大厅文字聊天。</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.globalMute} onChange={e => setSettings({...settings, globalMute: e.target.checked})} />
                <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#f5222d] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              </label>
            </div>
          </div>
        </div>

        {/* Game Economy Config */}
        <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
             <BellRing className="w-5 h-5 text-[#52c41a]" />
             运营数值调控
          </h3>

          <div className="space-y-6">
            <div>
              <p className="font-bold text-gray-800 text-sm mb-2">新人注册奖励 (虚拟金币)</p>
              <input type="number" value={settings.signupBonus} onChange={e => setSettings({...settings, signupBonus: Number(e.target.value)})} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1890ff]" />
              <p className="text-xs text-gray-400 mt-1">新注册玩家初始附赠的资金。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
