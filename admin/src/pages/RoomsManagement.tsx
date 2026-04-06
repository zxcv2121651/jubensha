import { useState, useEffect } from 'react';
import { PlayCircle, ShieldAlert } from 'lucide-react';

interface Room {
  id: string;
  scriptName: string;
  hostName: string;
  status: string;
  currentPlayers: number;
  targetPlayers: number;
  isPublic: boolean;
}

export default function RoomsManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/admin/rooms', { headers: { 'x-admin-id': 'user_1' } })
      .then(res => res.json())
      .then(data => { if (data.success) setRooms(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleClose = (id: string) => {
    if (!confirm('确定要强制解散该房间吗？玩家将被踢出。')) return;

    fetch(`http://localhost:3001/api/admin/rooms/${id}/close`, {
      method: 'POST',
      headers: { 'x-admin-id': 'user_1' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRooms(rooms.map(r => r.id === id ? { ...r, status: 'finished' } : r));
        }
      });
  };

  return (
    <div className="flex-1 min-h-screen bg-neutral-100 p-8 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">实况对局监控</h2>
        <p className="text-sm text-neutral-500 mt-1">监控当前全服正在进行的剧本杀房间</p>
      </header>

      {loading ? (
        <div className="text-center p-12 text-neutral-500">加载中...</div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center text-neutral-400">
          <PlayCircle className="w-12 h-12 mb-4 opacity-20" />
          <p>当前没有正在进行的对局。</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">房间 ID</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">剧本名称</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">房主 (DM)</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">人数状态</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">公开性</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">对局状态</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-right">操作 (超管权限)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rooms.map(room => (
                <tr key={room.id} className="hover:bg-neutral-50">
                  <td className="p-4 text-xs font-mono text-neutral-500">{room.id}</td>
                  <td className="p-4 text-sm font-bold text-neutral-900">{room.scriptName}</td>
                  <td className="p-4 text-sm font-medium text-neutral-700">{room.hostName}</td>
                  <td className="p-4 text-sm text-neutral-600 font-mono">
                    {room.currentPlayers} / {room.targetPlayers}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${room.isPublic ? 'bg-blue-50 text-blue-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      {room.isPublic ? '公开大厅' : '私密上锁'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${room.status === 'playing' ? 'bg-green-50 text-green-600' : room.status === 'waiting' ? 'bg-amber-50 text-amber-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      {room.status === 'playing' ? '游戏中' : room.status === 'waiting' ? '等候中' : '已结束'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {room.status !== 'finished' && (
                      <button
                        onClick={() => handleClose(room.id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded font-medium text-sm transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" /> 强行解散
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
