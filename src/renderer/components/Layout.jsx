import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import './Layout.css';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

const NAV_ITEMS = [
  { path: '/dashboard',   icon: '⚡', label: 'Dashboard' },
  { path: '/overlay',     icon: '🎬', label: 'Overlay & OBS' },
];

const PLATFORM_ITEMS = [
  { key: 'saweria',    label: 'Saweria',    emoji: '🟢', status: 'supported' },
  { key: 'trakteer',   label: 'Trakteer',   emoji: '🟡', status: 'coming-soon' },
  { key: 'sociabuzz',  label: 'SociaBuzz',  emoji: '🟡', status: 'coming-soon' },
];

export default function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = () => window.electronAPI?.maximizeWindow();
  const handleClose    = () => window.electronAPI?.closeWindow();

  return (
    <div className="app-shell">
      {/* Custom Titlebar — only in Electron */}
      {isElectron && (
        <div className="titlebar" data-electron-drag="true">
          <div className="titlebar-left">
            <span className="titlebar-logo">🎙️</span>
            <span className="titlebar-title">Hey Streamer</span>
          </div>
          <div className="titlebar-controls">
            <button onClick={handleMinimize} className="tb-btn tb-min" title="Minimize">─</button>
            <button onClick={handleMaximize} className="tb-btn tb-max" title="Maximize">□</button>
            <button onClick={handleClose}    className="tb-btn tb-close" title="Close">✕</button>
          </div>
        </div>
      )}

      <div className="app-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="sidebar-brand">
            <span className="brand-icon">🎙️</span>
            {sidebarOpen && (
              <div className="brand-text">
                <div className="brand-name">Hey Streamer</div>
                <div className="brand-sub">Notice Alert Donation</div>
              </div>
            )}
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">{sidebarOpen && 'General'}</div>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}

            <div className="nav-section-label">{sidebarOpen && 'Platforms'}</div>
            {PLATFORM_ITEMS.map((p) => (
              <NavLink
                key={p.key}
                to={`/platform/${p.key}`}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''} ${p.status !== 'supported' ? 'disabled' : ''}`
                }
                onClick={(e) => p.status !== 'supported' && e.preventDefault()}
              >
                <span className="nav-icon">{p.emoji}</span>
                {sidebarOpen && (
                  <span className="nav-label">
                    {p.label}
                    {p.status === 'coming-soon' && (
                      <span className="badge-soon">Soon</span>
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </aside>

        {/* Main content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
