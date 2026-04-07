import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UsersManagement from './pages/UsersManagement';
import ScriptsApproval from './pages/ScriptsApproval';
import ReportsManagement from './pages/ReportsManagement';
import StoreManagement from './pages/StoreManagement';
import RoomsManagement from './pages/RoomsManagement';
import Login from './pages/Login';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="flex bg-[#f0f2f5] min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UsersManagement /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute><RoomsManagement /></ProtectedRoute>} />
        <Route path="/scripts" element={<ProtectedRoute><ScriptsApproval /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsManagement /></ProtectedRoute>} />
        <Route path="/store" element={<ProtectedRoute><StoreManagement /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
