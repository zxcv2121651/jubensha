/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import ScriptDetail from './pages/ScriptDetail';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import Store from './pages/Store';
import Messages from './pages/Messages';

// A simple auth guard wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="lobby" element={<Lobby />} />
          <Route path="discover" element={<Discover />} />
          <Route path="messages" element={<Messages />} />
          <Route path="store" element={<Store />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Routes without bottom nav */}
        <Route path="/script/:id" element={<ProtectedRoute><ScriptDetail /></ProtectedRoute>} />
        <Route path="/game/:id" element={<ProtectedRoute><Game /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
