import { useState, useEffect } from 'react';
import { Gift, Wallet, PackageOpen, Sparkles, PlusCircle } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  type: string;
  price: number;
}

export default function Store() {
  const [balance, setBalance] = useState(0);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [gachaResult, setGachaResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    fetch(`http://localhost:3001/api/users/${user.id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setBalance(data.data.balance || 0); });
  };

  useEffect(() => {
    fetchUserData();
    fetch('http://localhost:3001/api/store/items')
      .then(res => res.json())
      .then(data => { if (data.success) setItems(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = (itemId: string, price: number) => {
    if (balance < price) return alert('余额不足，请先充值');
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    fetch('http://localhost:3001/api/store/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, itemId })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setBalance(data.data.balance);
        alert('购买成功！已加入背包。');
      } else {
        alert(data.message || '购买失败');
      }
    });
  };

  const handleTopup = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    // Simulate Topup (In reality this calls WeChat Pay SDK)
    fetch('http://localhost:3001/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, amount: 648 }) // Mock 648 RMB -> 648 coins
    }).then(res => res.json()).then(data => {
      if (data.success) setBalance(data.data.balance);
      alert('模拟充值 ¥648 成功！');
    });
  };

  const handleGacha = () => {
    if (balance < 150) return alert('余额不足，盲盒需要 150 币');
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    setGachaResult(null); // Reset

    fetch('http://localhost:3001/api/store/gacha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setBalance(data.data.balance);
        // Show result after a small fake animation delay
        setTimeout(() => setGachaResult(data.data.wonItem), 600);
      } else {
        alert(data.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header & Wallet */}
      <header className="bg-white px-4 py-4 sticky top-0 z-40 shadow-sm border-b border-neutral-100">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 mb-4">珍宝阁</h1>

        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-5 text-white shadow-lg shadow-red-600/20 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-20">
            <Wallet className="w-24 h-24" />
          </div>
          <p className="text-red-100 text-xs font-bold mb-1">我的金币余额 (🪙)</p>
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black tracking-tighter">{balance}</h2>
            <button
              onClick={handleTopup}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 border border-white/20"
            >
              <PlusCircle className="w-4 h-4" /> 模拟充值
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Gacha Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              惊奇盲盒
            </h3>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

             {!gachaResult ? (
               <>
                 <PackageOpen className="w-16 h-16 text-purple-200 mb-3" />
                 <h4 className="font-black text-xl text-neutral-800 mb-1">典藏入场特效盲盒</h4>
                 <p className="text-xs text-neutral-500 mb-6 px-4">抽取传说级入场动画「龙游九天」，概率 UP！包含史诗级头像框与改名卡。</p>
                 <button
                   onClick={handleGacha}
                   className="w-full max-w-[200px] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                 >
                   <Sparkles className="w-4 h-4" /> 150 🪙 开启一次
                 </button>
               </>
             ) : (
               <div className="animate-in zoom-in-50 duration-300">
                 <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl shadow-yellow-500/40 ring-4 ring-yellow-100">
                   <Gift className="w-10 h-10 text-white" />
                 </div>
                 <p className="text-xs font-bold text-yellow-600 mb-1">恭喜获得</p>
                 <h4 className="font-black text-2xl text-neutral-900 mb-6">{gachaResult.name}</h4>
                 <button
                   onClick={() => setGachaResult(null)}
                   className="px-6 py-2 bg-neutral-100 text-neutral-600 font-bold rounded-full text-sm hover:bg-neutral-200 transition-colors"
                 >
                   继续抽取
                 </button>
               </div>
             )}
          </div>
        </section>

        {/* Direct Buy Items */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-red-500" />
              直售道具
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-neutral-400 text-sm font-bold">同步货架中...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between">
                  <div className="w-12 h-12 bg-neutral-50 rounded-xl mb-3 flex items-center justify-center border border-neutral-100">
                    <span className="text-2xl">{item.type.includes('avatar') ? '🖼️' : item.type.includes('sub') ? '👑' : '💬'}</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">{item.name}</h4>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-black text-amber-500 text-sm flex items-center gap-1">
                       {item.price} 🪙
                    </span>
                    <button
                      onClick={() => handleBuy(item.id, item.price)}
                      className="bg-neutral-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      兑换
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
