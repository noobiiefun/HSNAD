import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PlatformSettings from './pages/PlatformSettings';
import AlertDesigner from './pages/AlertDesigner';
import OverlaySettings from './pages/OverlaySettings';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="platform/:key" element={<PlatformSettings />} />
          <Route path="platform/:key/alert" element={<AlertDesigner />} />
          <Route path="overlay" element={<OverlaySettings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
