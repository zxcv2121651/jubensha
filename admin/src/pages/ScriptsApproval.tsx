import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, Eye } from 'lucide-react';

interface PendingScript {
  id: string;
  title: string;
  authorId: string;
  difficulty: string;
  duration: string;
  description: string;
  tags?: string[];
  roles?: Record<string, string>[];
  acts?: Record<string, Record<string, string>>;
  clues?: Record<string, string>[];
}

export default function ScriptsApproval() {
  const [scripts, setScripts] = useState<PendingScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewScript, setPreviewScript] = useState<PendingScript | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/admin/scripts/pending', {
      headers: { 'x-admin-id': 'user_1' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setScripts(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = (id: string, approved: boolean) => {
    if (!confirm(`确定要${approved ? '通过' : '驳回'}这个剧本吗？`)) return;
    fetch(`http://localhost:3001/api/admin/scripts/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'user_1' },
      body: JSON.stringify({ approved })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setScripts(scripts.filter(s => s.id !== id));
          setPreviewScript(null);
        }
      });
  };

  const loadPreview = (id: string) => {
    fetch(`http://localhost:3001/api/admin/scripts/${id}/preview`, {
      headers: { 'x-admin-id': 'user_1' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setPreviewScript(data.data);
      });
  };

  return (
    <div className="flex-1 h-screen bg-[#f0f2f5] p-6 relative">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">剧本发售与 UGC 审核</h2>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span>首页</span>
            <span>/</span>
            <span className="text-gray-800">待审核剧本列表</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="bg-white rounded-sm border border-gray-200 p-12 text-center text-gray-400">拉取待审队列中...</div>
      ) : scripts.length === 0 ? (
        <div className="bg-white rounded-sm border border-gray-200 p-24 flex flex-col items-center text-gray-400">
          <BookOpen className="w-16 h-16 mb-4 opacity-10" />
          <p>太棒了！当前没有任何积压的待审 UGC 剧本。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
          {scripts.map(script => (
            <div key={script.id} className="bg-white rounded-sm border border-gray-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1890ff] mb-1">{script.title}</h3>
                  <p className="text-xs text-gray-400 font-mono">稿件 ID: {script.id} | 创作者 ID: {script.authorId}</p>
                </div>
                <span className="bg-[#fffbe6] text-[#fa8c16] border border-[#ffe58f] text-xs px-2 py-0.5 rounded-sm">
                  待人工审核
                </span>
              </div>

              <div className="flex gap-2 mb-4">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-sm">{script.difficulty}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-sm">{script.duration}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-sm text-sm text-gray-600 mb-4 flex-1 border border-gray-100">
                <p className="font-medium text-gray-800 mb-1">内容简介：</p>
                <p className="line-clamp-3">{script.description || '作者尚未填写剧本简介...'}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                <button
                  onClick={() => loadPreview(script.id)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#1890ff] text-[#1890ff] text-sm rounded hover:bg-[#e6f7ff] transition-colors"
                >
                  <Eye className="w-4 h-4" /> 深度阅览
                </button>
                <button
                  onClick={() => handleApprove(script.id, false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#ff4d4f] text-[#ff4d4f] text-sm rounded hover:bg-[#fff1f0] transition-colors ml-auto"
                >
                  <XCircle className="w-4 h-4" /> 打回修改
                </button>
                <button
                  onClick={() => handleApprove(script.id, true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#52c41a] text-white text-sm rounded hover:bg-[#73d13d] transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> 审核通过
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Script Preview Drawer/Modal */}
      {previewScript && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-[600px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#fafafa]">
              <div>
                 <h2 className="text-xl font-bold text-gray-800">{previewScript.title}</h2>
                 <p className="text-xs text-gray-500 mt-1">深度合规与逻辑审查模式</p>
              </div>
              <button onClick={() => setPreviewScript(null)} className="text-gray-400 hover:text-red-500 p-2"><XCircle className="w-5 h-5"/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               <section>
                 <h3 className="font-bold text-gray-800 mb-3 border-l-4 border-[#1890ff] pl-2">剧本基础参数</h3>
                 <div className="bg-gray-50 p-4 rounded text-sm grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500">作者:</span> {previewScript.authorId}</div>
                    <div><span className="text-gray-500">标签:</span> {previewScript.tags?.join(', ') || '暂无'}</div>
                    <div><span className="text-gray-500">难度:</span> {previewScript.difficulty}</div>
                    <div><span className="text-gray-500">预估时长:</span> {previewScript.duration}</div>
                 </div>
               </section>

               <section>
                 <h3 className="font-bold text-gray-800 mb-3 border-l-4 border-[#722ed1] pl-2">可扮演角色 ({previewScript.roles?.length || 0})</h3>
                 <div className="space-y-2">
                   {previewScript.roles?.map((r:Record<string, string>) => (
                     <div key={r.id} className="p-3 border border-gray-200 rounded text-sm flex justify-between bg-white shadow-sm">
                       <span className="font-bold text-gray-700">{r.name}</span>
                       <span className="text-gray-500 bg-gray-100 px-2 rounded-sm text-xs">{r.gender === 'male' ? '男' : r.gender === 'female' ? '女' : '不限'}</span>
                     </div>
                   ))}
                 </div>
               </section>

               <section>
                 <h3 className="font-bold text-gray-800 mb-3 border-l-4 border-[#52c41a] pl-2">剧情幕次</h3>
                 <div className="space-y-3">
                   {Object.keys(previewScript.acts || {}).map((actKey:string) => {
                     const act = (previewScript.acts || {})[actKey];
                     return (
                       <div key={actKey} className="p-4 border border-gray-200 rounded bg-white shadow-sm">
                         <h4 className="font-bold text-gray-800 text-sm mb-2">{act.title || actKey}</h4>
                         <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{act.content ? String(act.content).substring(0, 100) + '...' : '暂无内容'}</p>
                       </div>
                     )
                   })}
                 </div>
               </section>

               <section>
                 <h3 className="font-bold text-gray-800 mb-3 border-l-4 border-[#fa8c16] pl-2">机制与线索 ({previewScript.clues?.length || 0})</h3>
                 <div className="space-y-2">
                   {previewScript.clues?.map((c:Record<string, string>) => (
                     <div key={c.id} className="p-3 border border-gray-200 rounded text-sm bg-white shadow-sm">
                       <p className="font-bold text-gray-700 mb-1">{c.title}</p>
                       <p className="text-xs text-gray-500">{c.description}</p>
                     </div>
                   ))}
                 </div>
               </section>
            </div>

            <div className="p-5 border-t border-gray-100 bg-[#fafafa] flex gap-3 justify-end">
                <button onClick={() => handleApprove(previewScript.id, false)} className="px-6 py-2 bg-white border border-[#ff4d4f] text-[#ff4d4f] hover:bg-[#fff1f0] rounded transition-colors text-sm font-bold">打回</button>
                <button onClick={() => handleApprove(previewScript.id, true)} className="px-6 py-2 bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded transition-colors text-sm font-bold shadow-sm">通过上架</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
