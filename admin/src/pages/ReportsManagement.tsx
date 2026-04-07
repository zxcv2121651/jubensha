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

interface ModLog {
  id: string;
  action: string;
  targetId: string;
  reason: string;
  createdAt: number;
}

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<ModLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'logs'>('pending');

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/admin/reports', { headers: { 'x-admin-id': 'user_1' } }).then(r => r.json()),
      fetch('http://localhost:3001/api/admin/logs', { headers: { 'x-admin-id': 'user_1' } }).then(r => r.json())
    ]).then(([reportData, logData]) => {
      if (reportData.success) setReports(reportData.data);
      if (logData.success) setLogs(logData.data);
    }).finally(() => setLoading(false));
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
          // Refresh logs after action
          fetch('http://localhost:3001/api/admin/logs', { headers: { 'x-admin-id': 'user_1' } })
            .then(res => res.json())
            .then(data => { if (data.success) setLogs(data.data); });
        }
      });
  };

  const pendingReports = reports.filter(r => r.status === 'pending');

  return (
    <div className="flex-1 min-h-screen bg-[#f0f2f5] p-8 overflow-y-auto">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">风控与举报处理</h2>
        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <span className="cursor-pointer hover:text-[#1890ff]">首页</span>
          <span>/</span>
          <span className="text-gray-800">风控中心</span>
        </div>
      </header>

      <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'pending' ? 'text-[#1890ff] border-b-2 border-[#1890ff]' : 'text-gray-500 hover:text-[#1890ff]'}`}
          >
            待处理举报 ({pendingReports.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'logs' ? 'text-[#1890ff] border-b-2 border-[#1890ff]' : 'text-gray-500 hover:text-[#1890ff]'}`}
          >
            历史操作日志
          </button>
        </div>

        {loading ? (
          <div className="text-center p-12 text-gray-400">加载数据中...</div>
        ) : activeTab === 'pending' ? (
          pendingReports.length === 0 ? (
            <div className="p-24 flex flex-col items-center justify-center text-gray-400">
              <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
              <p>当前没有待处理的举报工单。</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-[#fafafa]">
                <tr>
                  <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">被举报对象</th>
                  <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">违规类型</th>
                  <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">描述与截图证据</th>
                  <th className="p-4 font-semibold text-gray-800 border-b border-gray-200">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingReports.map(report => (
                  <tr key={report.id} className="hover:bg-[#f6ffed]">
                    <td className="p-4 font-medium text-[#1890ff]">{report.targetName}</td>
                    <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded">{report.targetType}</span></td>
                    <td className="p-4">
                      <p className="text-[#cf1322] font-medium mb-1">{report.reason}</p>
                      <p className="text-xs text-gray-400">举报人: {report.reporterName}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleResolve(report.id, 'dismissed')} className="text-gray-500 border border-gray-300 hover:text-[#1890ff] hover:border-[#1890ff] px-3 py-1 rounded">驳回</button>
                        <button onClick={() => handleResolve(report.id, 'resolved')} className="text-white bg-[#ff4d4f] hover:bg-[#cf1322] px-3 py-1 rounded">封禁警告</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <div className="p-6 space-y-4">
            {logs.map(log => (
              <div key={log.id} className="flex gap-4 p-4 border border-gray-200 rounded-sm bg-gray-50 items-start">
                <ShieldAlert className={`w-5 h-5 mt-0.5 ${log.action.includes('Ban') ? 'text-[#ff4d4f]' : 'text-gray-400'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{log.action}: <span className="font-mono text-[#1890ff]">{log.targetId}</span></p>
                  <p className="text-xs text-gray-500 mt-1">处理原因/证据：{log.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <div className="text-center text-gray-400 p-8">暂无操作日志。</div>}
          </div>
        )}
      </div>
    </div>
  );
}
