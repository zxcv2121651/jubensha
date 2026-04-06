import { useState } from 'react';
import { Tag, Gift } from 'lucide-react';

export default function StoreManagement() {
  const [promoCode, setPromoCode] = useState('');
  const [reward, setReward] = useState(100);
  const [message, setMessage] = useState('');

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

  return (
    <div className="flex-1 min-h-screen bg-neutral-100 p-8 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">商城与运营系统</h2>
        <p className="text-sm text-neutral-500 mt-1">管理充值、道具和营销活动</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
          <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-red-500" />
            生成兑换码
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1">自定义 Code (选填)</label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="例如: NEWYEAR2024"
                className="w-full border border-neutral-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1">奖励金额 (金币)</label>
              <input
                type="number"
                value={reward}
                onChange={(e) => setReward(Number(e.target.value))}
                className="w-full border border-neutral-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              onClick={generatePromoCode}
              className="w-full bg-neutral-900 text-white font-bold text-sm py-2.5 rounded-lg shadow-sm hover:bg-neutral-800 transition-colors"
            >
              生成兑换码
            </button>
            {message && <p className="text-sm text-green-600 font-bold bg-green-50 p-2 rounded">{message}</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col items-center justify-center text-neutral-400 min-h-[300px]">
           <Tag className="w-12 h-12 mb-4 opacity-20" />
           <p>道具管理功能开发中...</p>
        </div>
      </div>
    </div>
  );
}
