import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  targetType: string;
  reason: string;
  status: string;
  createdAt: number;
}

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/admin/reports', { headers: { 'x-admin-id': 'user_1' } })
      .then(res => res.json())
      .then(data => { if (data.success) setReports(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = (id: string, status: string) => {
    fetch(`http://localhost:3001/api/admin/reports/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'user_1' },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReports(reports.map(r => r.id === id ? { ...r, status } : r));
        }
      });
  };

  return (
    <div className="flex-1 min-h-screen bg-neutral-100 p-8 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">客诉与举报处理</h2>
        <p className="text-sm text-neutral-500 mt-1">处理玩家的不良行为举报</p>
      </header>

      {loading ? (
        <div className="text-center p-12 text-neutral-500">加载中...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center text-neutral-400">
          <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
          <p>当前没有待处理的举报。</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">举报对象</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">举报类型</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">原因与详情</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase">状态</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-neutral-50">
                  <td className="p-4 text-sm font-bold text-neutral-900">{report.targetName}</td>
                  <td className="p-4 text-sm text-neutral-500">
                    <span className="bg-neutral-100 px-2 py-1 rounded">{report.targetType}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-red-600 font-medium mb-1">{report.reason}</p>
                    <p className="text-xs text-neutral-400">举报人: {report.reporterName}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${report.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {report.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleResolve(report.id, 'dismissed')} className="text-neutral-500 hover:bg-neutral-100 p-2 rounded">驳回</button>
                        <button onClick={() => handleResolve(report.id, 'resolved')} className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded font-bold text-sm">核实并处理</button>
                      </div>
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
