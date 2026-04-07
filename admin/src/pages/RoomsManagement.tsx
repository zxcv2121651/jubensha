import { useState, useEffect } from 'react';
import { PlayCircle, ShieldAlert, Lock, Unlock, Users } from 'lucide-react';

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
    if (!confirm('风险操作：确定要强制解散该房间吗？玩家将被直接断线。')) return;

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
    <div className="flex-1 h-screen overflow-y-auto bg-[#f0f2f5] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">拼车与实况大厅</h2>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
             <span className="cursor-pointer hover:text-[#1890ff]">首页</span>
             <span>/</span>
             <span className="text-gray-800">实况监控大厅</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden mb-6 p-4 flex gap-4">
        <input placeholder="房间号搜索" className="border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#1890ff]" />
        <select className="border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#1890ff] bg-white">
          <option>全部状态</option>
          <option>等候拼车中</option>
          <option>游戏进行中</option>
        </select>
        <button className="px-4 py-1.5 bg-[#1890ff] text-white rounded text-sm hover:bg-[#40a9ff] transition-colors shadow">
          查询
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-sm border border-gray-200 p-12 text-center text-gray-400">正在同步实时数据流...</div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-sm border border-gray-200 p-24 flex flex-col items-center text-gray-400">
          <PlayCircle className="w-16 h-16 mb-4 opacity-10" />
          <p>当前服暂无运行中的房间</p>
        </div>
      ) : (
        <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden text-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#fafafa]">
              <tr>
                <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">房间标识 (Room ID)</th>
                <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">正在运行剧本</th>
                <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">房主/主持 DM</th>
                <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">人数监控</th>
                <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">权限状态</th>
                <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">对局状态</th>
                <th className="p-4 font-semibold text-gray-800 border-b border-gray-200 text-center">风险操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map(room => (
                <tr key={room.id} className="hover:bg-[#f6ffed] transition-colors cursor-default group">
                  <td className="p-4 text-xs font-mono text-gray-500">{room.id}</td>
                  <td className="p-4 font-medium text-[#1890ff]">{room.scriptName}</td>
                  <td className="p-4 text-gray-700 flex items-center gap-2">
                    <img src="https://picsum.photos/32/32" className="w-6 h-6 rounded-full" alt="avatar"/>
                    {room.hostName}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${(room.currentPlayers/room.targetPlayers)*100}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">{room.currentPlayers}/{room.targetPlayers}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {room.isPublic ? (
                      <span className="inline-flex items-center gap-1 text-[#52c41a]"><Unlock className="w-3 h-3" /> 大厅公开</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400"><Lock className="w-3 h-3" /> 私密房间</span>
                    )}
                  </td>
                  <td className="p-4">
                    {room.status === 'playing' ? (
                      <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1890ff] animate-pulse"></span> 行进中</span>
                    ) : room.status === 'waiting' ? (
                       <span className="inline-flex items-center gap-1.5 text-[#faad14]"><span className="w-2 h-2 rounded-full bg-[#faad14]"></span> 候车中</span>
                    ) : (
                       <span className="text-gray-400">已结束/被解散</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {room.status !== 'finished' && (
                      <button
                        onClick={() => handleClose(room.id)}
                        className="inline-flex items-center gap-1 text-[#ff4d4f] hover:text-[#cf1322] font-medium transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ShieldAlert className="w-4 h-4" /> 强拆
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
