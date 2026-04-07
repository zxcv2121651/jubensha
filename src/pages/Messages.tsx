import { useState, useEffect } from 'react';
import { MessageSquare, BellRing, Users } from 'lucide-react';

export default function Messages() {
  const [friends, setFriends] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'notifs'>('chats');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    Promise.all([
      fetch(`http://localhost:3001/api/users/${user.id}/friends`).then(r => r.json()),
      fetch(`http://localhost:3001/api/users/${user.id}/notifications`).then(r => r.json())
    ]).then(([fData, nData]) => {
      if (fData.success) setFriends(fData.data);
      if (nData.success) setNotifs(nData.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white px-4 py-4 sticky top-0 z-40 shadow-sm border-b border-neutral-100 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">消息</h1>
        <div className="flex gap-3">
          <button className="text-neutral-400 hover:text-neutral-900 transition-colors relative">
            <BellRing className="w-6 h-6" />
            {notifs.filter(n => !n.read).length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-neutral-100 flex p-1 m-4 rounded-xl bg-neutral-100/50">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'chats' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
        >
          会话
        </button>
        <button
          onClick={() => setActiveTab('notifs')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'notifs' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
        >
          通知
        </button>
      </div>

      <div className="p-4 pt-0">
        {loading ? (
          <div className="text-center py-12 text-neutral-400 font-bold text-sm">加载联系人中...</div>
        ) : activeTab === 'chats' ? (
          friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <Users className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-bold">还没有任何好友，快去大厅拼车吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {friends.map(friend => (
                <div key={friend.id} className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4 hover:bg-neutral-50 transition-colors cursor-pointer relative overflow-hidden">
                  <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full border-2 border-neutral-100 object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-black text-neutral-900 truncate">{friend.name}</h3>
                      <span className="text-[10px] font-bold text-neutral-400">在线</span>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">{friend.bio || '这个人很懒，什么都没写'}</p>
                  </div>
                  <MessageSquare className="w-5 h-5 text-neutral-300 group-hover:text-red-500" />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            {notifs.length === 0 ? (
               <div className="text-center py-12 text-neutral-400 font-bold">没有新的通知</div>
            ) : notifs.map(n => (
              <div key={n.id} className={`p-4 rounded-2xl border text-sm ${n.read ? 'bg-white border-neutral-100' : 'bg-red-50 border-red-100'}`}>
                <p className={`font-bold ${n.read ? 'text-neutral-900' : 'text-red-900'} mb-1`}>{n.type === 'friend_request' ? '好友申请' : '系统消息'}</p>
                <p className={n.read ? 'text-neutral-500' : 'text-red-700'}>{n.message}</p>
                <p className="text-[10px] text-neutral-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
