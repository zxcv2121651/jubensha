import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, User, UserPlus } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { username, password } : { username, password, name };

    try {
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/', { replace: true });
      } else {
        setError(data.message || '操作失败，请重试');
      }
    } catch (err) {
      setError('无法连接到服务器');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-red-600 to-red-600/0 opacity-10"></div>

      <div className="mx-auto w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 mb-4 transform -rotate-6">
            <ShieldAlert className="w-8 h-8 text-white transform rotate-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-neutral-900">谜案寻踪</h2>
          <p className="text-sm font-bold text-neutral-500 mt-1">{isLogin ? '欢迎回来，大侦探' : '加入探案局'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">{error}</div>}

          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              required
              placeholder="账号 (用户名)"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>

          {!isLogin && (
            <div className="relative animate-in fade-in slide-in-from-top-2">
              <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                required
                placeholder="显示昵称"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="password"
              required
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? '处理中...' : isLogin ? '进入大厅' : '注册账号'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            {isLogin ? '没有账号？立即注册' : '已有账号？返回登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
