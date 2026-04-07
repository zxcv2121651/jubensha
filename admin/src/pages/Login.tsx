import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.user.isAdmin) {
          localStorage.setItem('adminToken', data.data.user.id);
          localStorage.setItem('adminName', data.data.user.name);
          window.location.href = '/';
        } else {
          setError('Invalid credentials or not an admin');
        }
      });
  };

  return (
    <div className="min-h-screen bg-[#001529] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#1890ff] rounded-lg flex items-center justify-center shadow-lg mb-4">
             <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">谜案寻踪 B-End</h1>
          <p className="text-gray-500 text-sm mt-1">管理员安全登录中心</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-3 bg-[#fff2f0] border border-[#ffccc7] text-[#ff4d4f] text-sm rounded">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">管理员账号</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-[#1890ff] focus:ring-2 focus:ring-[#1890ff]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">通行密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-[#1890ff] focus:ring-2 focus:ring-[#1890ff]/20 transition-all"
            />
          </div>

          <button type="submit" className="w-full bg-[#1890ff] hover:bg-[#40a9ff] text-white font-bold py-3 rounded text-sm transition-colors shadow-md shadow-[#1890ff]/30">
            授权登录
          </button>
        </form>
      </div>
    </div>
  );
}
