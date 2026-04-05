/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ScriptDetail from './pages/ScriptDetail';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Discover from './pages/Discover';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="lobby" element={<Lobby />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Routes without bottom nav */}
        <Route path="/script/:id" element={<ScriptDetail />} />
        <Route path="/game/:id" element={<Game />} />
      </Routes>
    </Router>
  );
}
