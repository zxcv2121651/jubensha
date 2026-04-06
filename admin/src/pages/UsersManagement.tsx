import { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle, Shield } from 'lucide-react';

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  accountStatus: string;
  isAdmin: boolean;
  balance: number;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: Requires backend to be running with appropriate mock data
    fetch('http://localhost:3001/api/admin/users', {
      headers: { 'x-admin-id': 'user_1' } // Mock admin auth
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleBan = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    fetch(`http://localhost:3001/api/admin/users/${id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'user_1' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(users.map(u => u.id === id ? { ...u, accountStatus: newStatus } : u));
        }
      });
  };

  return (
    <div className="flex-1 min-h-screen bg-neutral-100 p-8 overflow-y-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">用户管理</h2>
          <p className="text-sm text-neutral-500 mt-1">查看和封禁平台用户</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索用户 ID 或昵称..."
            className="w-64 pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">加载中... (请确保后端已启动)</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">用户信息</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">身份</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">余额</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">状态</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-neutral-200" />
                      <div>
                        <p className="font-bold text-neutral-900">{user.name}</p>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                        <Shield className="w-3.5 h-3.5" /> 管理员
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-500">普通玩家</span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-sm text-neutral-700">￥{user.balance}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                      user.accountStatus === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {user.accountStatus === 'active' ? '正常' : '已封禁'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {!user.isAdmin && (
                      <button
                        onClick={() => handleBan(user.id, user.accountStatus)}
                        className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          user.accountStatus === 'active'
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {user.accountStatus === 'active' ? <><Ban className="w-4 h-4" /> 封禁</> : <><CheckCircle className="w-4 h-4" /> 解封</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
