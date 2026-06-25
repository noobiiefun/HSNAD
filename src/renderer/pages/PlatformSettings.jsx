import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PlatformSettings.css';

const API = 'http://localhost:5174/api';

const PLATFORM_META = {
  saweria: {
    name:  'Saweria',
    color: '#32C3A6',
    hint:  'Login ke saweria.co → klik foto profil → Stream Key',
    docsUrl: 'https://saweria.co',
  },
};

export default function PlatformSettings() {
  const { key }    = useParams();
  const navigate   = useNavigate();
  const meta       = PLATFORM_META[key] || { name: key, color: '#888', hint: '' };

  const [form, setForm]           = useState({ enabled: false, streamKey: '', pollingInterval: 5000, minAmount: 0 });
  const [verify, setVerify]       = useState(null);   // null | 'checking' | 'ok' | 'error'
  const [verifyMsg, setVerifyMsg] = useState('');
  const [saved, setSaved]         = useState(false);
  const [showKey, setShowKey]     = useState(false);

  useEffect(() => {
    fetch(`${API}/config/platform/${key}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          enabled:         data.enabled         || false,
          streamKey:       data.streamKey        || '',
          pollingInterval: data.pollingInterval  || 5000,
          minAmount:       data.alert?.minAmount || 0,
        });
      })
      .catch(() => {});
  }, [key]);

  async function verifyKey() {
    if (!form.streamKey) return;
    setVerify('checking');
    setVerifyMsg('');
    try {
      const r = await fetch(`${API}/platforms/${key}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamKey: form.streamKey }),
      });
      const d = await r.json();
      setVerify(d.valid ? 'ok' : 'error');
      setVerifyMsg(d.valid ? d.message : d.error);
    } catch {
      setVerify('error');
      setVerifyMsg('Tidak bisa terhubung ke server');
    }
  }

  async function save() {
    // 1. Simpan config platform
    await fetch(`${API}/config/platform/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled:         form.enabled,
        streamKey:       form.streamKey,
        pollingInterval: Number(form.pollingInterval),
      }),
    });
    // 2. Simpan minAmount ke alert config
    await fetch(`${API}/config/platform/${key}/alert`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minAmount: Number(form.minAmount) }),
    });
    // 3. Restart polling agar pakai config baru
    await fetch(`${API}/platforms/${key}/restart`, { method: 'POST' }).catch(() => {});

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="platform-settings">
      <div className="ps-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
        <h1>
          <span className="ps-dot" style={{ background: meta.color }} />
          {meta.name} — Platform Settings
        </h1>
        <p className="ps-sub">Hubungkan akun {meta.name} untuk menerima alert donasi real-time</p>
      </div>

      <div className="card">
        {/* Enable toggle */}
        <div className="field-row">
          <div>
            <div className="label">Aktifkan {meta.name}</div>
            <div className="hint">Mulai polling donasi dari {meta.name}</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
            <span className="toggle-track" />
          </label>
        </div>

        <div className="divider" />

        {/* Stream Key */}
        <div className="field-col">
          <label className="label">Stream Key</label>
          <p className="hint">{meta.hint}</p>
          <div className="key-row">
            <input
              type={showKey ? 'text' : 'password'}
              className="input"
              placeholder="Paste stream key kamu di sini..."
              value={form.streamKey}
              onChange={e => { setForm(f => ({ ...f, streamKey: e.target.value })); setVerify(null); }}
            />
            <button className="btn-eye" onClick={() => setShowKey(v => !v)} title={showKey ? 'Sembunyikan' : 'Tampilkan'}>
              {showKey ? '🙈' : '👁'}
            </button>
            <button
              className={`btn-verify ${verify || ''}`}
              onClick={verifyKey}
              disabled={verify === 'checking' || !form.streamKey}
            >
              {verify === 'checking' ? '...' : '✓ Verify'}
            </button>
          </div>
          {verifyMsg && (
            <div className={`verify-msg ${verify}`}>{verifyMsg}</div>
          )}
          {meta.docsUrl && (
            <a className="docs-link" href={meta.docsUrl} target="_blank" rel="noreferrer">
              🔗 Buka {meta.name} Dashboard →
            </a>
          )}
        </div>

        <div className="divider" />

        {/* Polling */}
        <div className="two-col">
          <div className="field-col">
            <label className="label">Polling Interval</label>
            <div className="hint">Seberapa sering cek donasi baru. Min 3000ms.</div>
            <div className="input-unit">
              <input type="number" className="input" min="3000" step="1000"
                value={form.pollingInterval}
                onChange={e => setForm(f => ({ ...f, pollingInterval: e.target.value }))} />
              <span className="unit">ms</span>
            </div>
          </div>
          <div className="field-col">
            <label className="label">Minimum Donasi</label>
            <div className="hint">Alert hanya muncul ≥ jumlah ini. Set 0 = semua.</div>
            <div className="input-unit">
              <span className="unit prefix">Rp</span>
              <input type="number" className="input" min="0" step="1000"
                value={form.minAmount}
                onChange={e => setForm(f => ({ ...f, minAmount: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Actions */}
        <div className="actions-row">
          <button className="btn-save" onClick={save}>
            {saved ? '✓ Tersimpan & Polling Diperbarui!' : '💾 Save Settings'}
          </button>
          <button className="btn-designer" onClick={() => navigate(`/platform/${key}/alert`)}>
            🎨 Buka Alert Designer →
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="info-card">
        <div className="info-title">📋 Cara mendapatkan Stream Key Saweria</div>
        <ol className="info-steps">
          <li>Login ke <strong>saweria.co</strong></li>
          <li>Klik foto profil di pojok kanan atas</li>
          <li>Pilih <strong>Settings / Pengaturan</strong></li>
          <li>Scroll ke bagian <strong>Stream Key</strong></li>
          <li>Copy dan paste ke kolom di atas</li>
        </ol>
      </div>
    </div>
  );
}
