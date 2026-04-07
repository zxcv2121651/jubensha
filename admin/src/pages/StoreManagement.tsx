import { useState, useEffect } from 'react';
import { Store,Gift, Trash2, Plus } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  type: string;
  price: number;
}

export default function StoreManagement() {
  const [promoCode, setPromoCode] = useState('');
  const [reward, setReward] = useState(100);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<StoreItem[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/store/items')
      .then(res => res.json())
      .then(data => { if (data.success) setItems(data.data); });
  }, []);

  const generatePromoCode = () => {
    fetch('http://localhost:3001/api/admin/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'user_1' },
      body: JSON.stringify({ code: promoCode || `PROMO_${Math.floor(Math.random()*10000)}`, reward, type: 'balance', maxUses: 100 })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setMessage(`✅ 兑换码生成成功：${data.data.code}`);
        else setMessage(`❌ ${data.message}`);
      });
  };

  const handleDeleteItem = (id: string) => {
    if(!confirm('确定下架此道具？')) return;
    fetch(`http://localhost:3001/api/admin/store/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-id': 'user_1' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setItems(items.filter(i => i.id !== id));
      });
  };

  return (
    <div className="flex-1 min-h-screen bg-neutral-100 p-8 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">商城与运营系统</h2>
        <p className="text-sm text-neutral-500 mt-1">管理商城在售道具、盲盒和营销活动</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Col: Promo */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 h-fit">
          <h3 className="font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <Gift className="w-5 h-5 text-red-500" />
            生成营销兑换码
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-2">自定义 Code (选填)</label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="例如: NEWYEAR2024"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-2">奖励金额 (金币)</label>
              <input
                type="number"
                value={reward}
                onChange={(e) => setReward(Number(e.target.value))}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={generatePromoCode}
              className="w-full bg-neutral-900 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition-colors"
            >
              生成并激活兑换码
            </button>
            {message && <p className="text-sm font-medium p-3 rounded-xl border border-neutral-100 bg-neutral-50">{message}</p>}
          </div>
        </div>

        {/* Right Col: Store Items */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-500" />
              在售道具管理
            </h3>
            <button className="text-sm bg-white border border-neutral-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:bg-neutral-50">
              <Plus className="w-4 h-4" /> 上架新道具
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-neutral-100">
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">道具名称</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">类型</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">价格 (金币)</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-neutral-50">
                  <td className="p-4 text-sm font-bold text-neutral-900">{item.name}</td>
                  <td className="p-4 text-sm text-neutral-500">
                    <span className="bg-neutral-100 px-2 py-1 rounded-md font-mono">{item.type}</span>
                  </td>
                  <td className="p-4 text-sm font-bold text-amber-500">{item.price} 🪙</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-neutral-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="强制下架"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-400 text-sm">
                    商城为空，请添加商品。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
