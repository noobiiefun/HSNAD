import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const API = 'http://localhost:5174/api';

export default function Dashboard() {
  const [overlayUrl, setOverlayUrl] = useState('http://localhost:5174/overlay');
  const [queueStatus, setQueueStatus] = useState({ isPlaying: false, queueLength: 0 });
  const [platforms, setPlatforms] = useState([]);
  const [config, setConfig] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get overlay URL (Electron)
    if (window.electronAPI?.getOverlayUrl) {
      window.electronAPI.getOverlayUrl().then(setOverlayUrl);
    }

    // Fetch data
    fetchStatus();
    fetchPlatforms();
    fetchConfig();

    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch(`${API}/alerts/status`);
      const data = await res.json();
      setQueueStatus(data);
    } catch {}
  }

  async function fetchPlatforms() {
    try {
      const res = await fetch(`${API}/platforms`);
      const data = await res.json();
      setPlatforms(data);
    } catch {}
  }

  async function fetchConfig() {
    try {
      const res = await fetch(`${API}/config`);
      const data = await res.json();
      setConfig(data);
    } catch {}
  }

  async function testAlert(platform = 'saweria') {
    await fetch(`${API}/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
  }

  async function skipAlert() {
    await fetch(`${API}/alerts/skip`, { method: 'POST' });
    fetchStatus();
  }

  async function clearQueue() {
    await fetch(`${API}/alerts/clear`, { method: 'DELETE' });
    fetchStatus();
  }

  function copyUrl() {
    navigator.clipboard.writeText(overlayUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const saweriaCfg = config?.platforms?.saweria;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="page-header-top">
          <img
            src="/logo-full.png"
            alt="HSNAD"
            className="page-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="page-header-badge">v1.0.0</div>
        </div>
        <h1>Dashboard</h1>
        <p className="page-sub">Monitor semua alert donasi kamu dalam satu tempat</p>
      </div>

      {/* OBS Source URL Card */}
      <section className="card obs-card">
        <div className="card-header">
          <span className="card-icon">🎬</span>
          <div>
            <div className="card-title">OBS Browser Source URL</div>
            <div className="card-sub">Masukkan URL ini ke Browser Source di OBS</div>
          </div>
        </div>
        <div className="url-row">
          <div className="url-box">{overlayUrl}</div>
          <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copyUrl}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button
            className="btn-open"
            onClick={() => {
              if (window.electronAPI?.openExternal) {
                window.electronAPI.openExternal(overlayUrl);
              } else {
                window.open(overlayUrl, '_blank');
              }
            }}
          >
            🔗 Open
          </button>
        </div>
        <div className="obs-hint">
          <strong>Cara pakai:</strong> OBS → + Source → Browser Source → paste URL di atas.
          Rekomendasi ukuran: <strong>400 × 300px</strong>
        </div>
      </section>

      {/* Alert Queue Status */}
      <section className="card queue-card">
        <div className="card-header">
          <span className="card-icon">⚡</span>
          <div>
            <div className="card-title">Alert Queue</div>
            <div className="card-sub">
              {queueStatus.isPlaying
                ? `Sedang menampilkan alert • ${queueStatus.queueLength} menunggu`
                : `Idle • ${queueStatus.queueLength} alert di queue`}
            </div>
          </div>
          <div className="status-dot" data-active={queueStatus.isPlaying} />
        </div>
        <div className="queue-actions">
          <button className="btn-primary" onClick={() => testAlert('saweria')}>
            🧪 Test Saweria Alert
          </button>
          <button className="btn-secondary" onClick={skipAlert}>
            ⏭ Skip
          </button>
          <button className="btn-danger-outline" onClick={clearQueue}>
            🗑 Clear Queue
          </button>
        </div>
      </section>

      {/* Platforms Overview */}
      <section className="section-header">
        <h2>Platform</h2>
      </section>
      <div className="platforms-grid">
        {platforms.map((p) => {
          const pConfig = config?.platforms?.[p.key];
          const isEnabled = pConfig?.enabled && pConfig?.streamKey;
          return (
            <div key={p.key} className={`platform-card ${p.status}`}>
              <div className="platform-top">
                <div className="platform-name">{p.name}</div>
                <div className={`platform-status ${isEnabled ? 'connected' : p.status}`}>
                  {p.status === 'supported'
                    ? (isEnabled ? '● Connected' : '○ Not configured')
                    : p.status === 'coming-soon' ? '⏳ Coming Soon' : '📋 Planned'}
                </div>
              </div>
              {p.status === 'supported' && (
                <a href={`#/platform/${p.key}`} className="btn-configure">
                  ⚙️ Configure
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
