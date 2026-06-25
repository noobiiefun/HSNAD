import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './Dashboard.css';

const API = 'http://localhost:5174/api';

export default function Dashboard() {
  const [overlayUrl, setOverlayUrl]   = useState('http://localhost:5174/overlay');
  const [queueStatus, setQueue]       = useState({ isPlaying: false, queueLength: 0 });
  const [platforms, setPlatforms]     = useState([]);
  const [config, setConfig]           = useState(null);
  const [history, setHistory]         = useState([]);
  const [stats, setStats]             = useState(null);
  const [copied, setCopied]           = useState(false);
  const [sockConnected, setSockConn]  = useState(false);
  const sockRef = useRef(null);

  useEffect(() => {
    if (window.electronAPI?.getOverlayUrl) {
      window.electronAPI.getOverlayUrl().then(setOverlayUrl);
    }
    fetchAll();

    // Socket.IO realtime
    const sock = io('http://localhost:5174', { transports: ['websocket'] });
    sockRef.current = sock;
    sock.on('connect',      () => setSockConn(true));
    sock.on('disconnect',   () => setSockConn(false));
    sock.on('queue:update', (s) => setQueue(s));
    sock.on('alert:show',   () => fetchHistory());

    return () => sock.disconnect();
  }, []);

  async function fetchAll() {
    await Promise.all([fetchQueue(), fetchPlatforms(), fetchConfig(), fetchHistory(), fetchStats()]);
  }
  async function fetchQueue() {
    try { const r = await fetch(`${API}/alerts/status`); setQueue(await r.json()); } catch {}
  }
  async function fetchPlatforms() {
    try { const r = await fetch(`${API}/platforms`); setPlatforms(await r.json()); } catch {}
  }
  async function fetchConfig() {
    try { const r = await fetch(`${API}/config`); setConfig(await r.json()); } catch {}
  }
  async function fetchHistory() {
    try { const r = await fetch(`${API}/history?limit=20`); setHistory(await r.json()); } catch {}
  }
  async function fetchStats() {
    try { const r = await fetch(`${API}/history/stats`); setStats(await r.json()); } catch {}
  }

  async function testAlert(platform = 'saweria') {
    await fetch(`${API}/alerts/test`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
  }
  async function skipAlert() {
    await fetch(`${API}/alerts/skip`, { method: 'POST' });
  }
  async function clearQueue() {
    await fetch(`${API}/alerts/clear`, { method: 'DELETE' });
  }
  async function clearHistory() {
    await fetch(`${API}/history`, { method: 'DELETE' });
    setHistory([]); setStats(null);
  }

  function copyUrl() {
    navigator.clipboard.writeText(overlayUrl).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-top">
          <img src="/logo-full.png" alt="HSNAD" className="page-logo"
            onError={e => { e.target.style.display = 'none'; }} />
          <div className="header-right">
            <div className={`sock-indicator ${sockConnected ? 'on' : 'off'}`}>
              {sockConnected ? '● Live' : '○ Offline'}
            </div>
            <div className="page-header-badge">v1.0.0</div>
          </div>
        </div>
        <h1>Dashboard</h1>
        <p className="page-sub">Monitor semua alert donasi kamu dalam satu tempat</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-val">{stats.total}</div>
            <div className="stat-label">Total Donasi</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-val">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
                .format(stats.totalRp)}
            </div>
            <div className="stat-label">Total Terkumpul</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{queueStatus.queueLength}</div>
            <div className="stat-label">Di Queue</div>
          </div>
          <div className="stat-card">
            <div className={`stat-val ${queueStatus.isPlaying ? 'live' : ''}`}>
              {queueStatus.isPlaying ? '● LIVE' : '○ Idle'}
            </div>
            <div className="stat-label">Status Alert</div>
          </div>
        </div>
      )}

      {/* OBS URL */}
      <section className="card obs-card">
        <div className="card-header">
          <span className="card-icon">🎬</span>
          <div>
            <div className="card-title">OBS Browser Source URL</div>
            <div className="card-sub">Masukkan URL ini ke Browser Source di OBS / Streamlabs</div>
          </div>
        </div>
        <div className="url-row">
          <div className="url-box">{overlayUrl}</div>
          <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copyUrl}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button className="btn-open" onClick={() => {
            window.electronAPI?.openExternal
              ? window.electronAPI.openExternal(overlayUrl)
              : window.open(overlayUrl, '_blank');
          }}>🔗 Open</button>
        </div>
        <div className="obs-hint">
          <strong>OBS:</strong> + Source → Browser Source → paste URL → Width: <strong>400</strong> Height: <strong>300</strong>
        </div>
      </section>

      {/* Queue Controls */}
      <section className="card queue-card">
        <div className="card-header">
          <span className="card-icon">⚡</span>
          <div>
            <div className="card-title">Alert Queue</div>
            <div className="card-sub">
              {queueStatus.isPlaying
                ? `🔴 Menampilkan alert · ${queueStatus.queueLength} menunggu`
                : `⚪ Idle · ${queueStatus.queueLength} alert di queue`}
            </div>
          </div>
          <div className={`status-dot ${queueStatus.isPlaying ? 'on' : ''}`} />
        </div>
        <div className="queue-actions">
          <button className="btn-primary" onClick={() => testAlert('saweria')}>
            🧪 Test Saweria Alert
          </button>
          <button className="btn-secondary" onClick={skipAlert}>⏭ Skip</button>
          <button className="btn-danger" onClick={clearQueue}>🗑 Clear Queue</button>
        </div>
      </section>

      <div className="two-col-grid">
        {/* Platforms */}
        <section>
          <div className="section-header">
            <h2>Platform</h2>
          </div>
          <div className="platforms-list">
            {platforms.map(p => {
              const pc = config?.platforms?.[p.key];
              const connected = pc?.enabled && pc?.streamKey;
              return (
                <div key={p.key} className={`platform-row ${p.status}`}>
                  <div className="platform-info">
                    <div className="platform-name">{p.name}</div>
                    <div className={`platform-status ${connected ? 'connected' : p.status}`}>
                      {p.status === 'supported'
                        ? (connected ? '● Connected' : '○ Not configured')
                        : p.status === 'coming-soon' ? '⏳ Coming Soon' : '📋 Planned'}
                    </div>
                  </div>
                  {p.status === 'supported' && (
                    <a href={`#/platform/${p.key}`} className="btn-configure">⚙️ Configure</a>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* History */}
        <section>
          <div className="section-header">
            <h2>Riwayat Donasi</h2>
            {history.length > 0 && (
              <button className="btn-clear-hist" onClick={clearHistory}>🗑 Clear</button>
            )}
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">Belum ada donasi masuk sesi ini</div>
            ) : history.map(h => (
              <div key={h.id} className="history-item">
                <div className="history-left">
                  <div className="h-name">{h.donorName}</div>
                  {h.message && <div className="h-msg">"{h.message}"</div>}
                </div>
                <div className="history-right">
                  <div className="h-amount">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
                      .format(h.amount)}
                  </div>
                  <div className="h-time">{timeAgo(h.shownAt)}</div>
                  <div className={`h-badge ${h.platform}`}>{h.platform}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000)  return `${Math.floor(d/1000)}s lalu`;
  if (d < 3600000)return `${Math.floor(d/60000)}m lalu`;
  return `${Math.floor(d/3600000)}h lalu`;
}
