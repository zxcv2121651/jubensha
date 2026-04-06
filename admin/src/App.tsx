import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UsersManagement from './pages/UsersManagement';
import ScriptsApproval from './pages/ScriptsApproval';
import ReportsManagement from './pages/ReportsManagement';
import StoreManagement from './pages/StoreManagement';
import RoomsManagement from './pages/RoomsManagement';

function App() {
  return (
    <BrowserRouter>
      <div className="flex bg-neutral-100 min-h-screen font-sans">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/rooms" element={<RoomsManagement />} />
            <Route path="/scripts" element={<ScriptsApproval />} />
            <Route path="/reports" element={<ReportsManagement />} />
            <Route path="/store" element={<StoreManagement />} />
            <Route path="*" element={<div className="p-8 text-neutral-500 font-bold">模块正在开发中...</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
