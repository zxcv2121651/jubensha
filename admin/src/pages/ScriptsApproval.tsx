import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';

interface PendingScript {
  id: string;
  title: string;
  authorId: string;
  difficulty: string;
  duration: string;
  description: string;
}

export default function ScriptsApproval() {
  const [scripts, setScripts] = useState<PendingScript[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/admin/scripts/pending', {
      headers: { 'x-admin-id': 'user_1' } // Mock admin auth
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setScripts(data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = (id: string, approved: boolean) => {
    fetch(`http://localhost:3001/api/admin/scripts/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'user_1' },
      body: JSON.stringify({ approved })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setScripts(scripts.filter(s => s.id !== id));
        }
      });
  };

  return (
    <div className="flex-1 min-h-screen bg-neutral-100 p-8 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">剧本审批 (UGC)</h2>
        <p className="text-sm text-neutral-500 mt-1">审核玩家投稿的自创剧本</p>
      </header>

      {loading ? (
        <div className="text-center p-12 text-neutral-500">加载中... (请确保后端已启动并有待审剧本)</div>
      ) : scripts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-12 flex flex-col items-center justify-center text-neutral-400">
          <BookOpen className="w-12 h-12 mb-4 opacity-20" />
          <p>太棒了！当前没有任何积压的待审核剧本。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {scripts.map(script => (
            <div key={script.id} className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 tracking-tight">{script.title}</h3>
                  <p className="text-xs font-mono text-neutral-400 mt-1">ID: {script.id} | 作者: {script.authorId}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                  待审核
                </span>
              </div>

              <div className="flex gap-2 mb-4">
                <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md font-medium">{script.difficulty}</span>
                <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md font-medium">{script.duration}</span>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl text-sm text-neutral-600 mb-6">
                <p className="font-bold text-neutral-800 mb-2">简介：</p>
                <p className="line-clamp-3">{script.description || '无简介内容...'}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-100">
                <button
                  onClick={() => handleApprove(script.id, false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold text-neutral-600 bg-white border border-neutral-200 px-4 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
                >
                  <XCircle className="w-4 h-4 text-red-500" />
                  打回修改
                </button>
                <button
                  onClick={() => handleApprove(script.id, true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-neutral-900 px-4 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors shadow-md shadow-neutral-900/20"
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  审核通过并上架
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
