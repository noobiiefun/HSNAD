import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PlatformSettings.css';

const API = 'http://localhost:5174/api';

export default function PlatformSettings() {
  const { key } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});
  const [verifyStatus, setVerifyStatus] = useState(null); // null | 'checking' | 'ok' | 'error'
  const [verifyMsg, setVerifyMsg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/config/platform/${key}`)
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setForm({
          enabled: data.enabled || false,
          streamKey: data.streamKey || '',
          pollingInterval: data.pollingInterval || 5000,
          minAmount: data.alert?.minAmount || 0,
        });
      })
      .catch(() => {});
  }, [key]);

  async function verifyKey() {
    if (!form.streamKey) return;
    setVerifyStatus('checking');
    setVerifyMsg('');
    try {
      const res = await fetch(`${API}/platforms/${key}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamKey: form.streamKey }),
      });
      const data = await res.json();
      if (data.valid) {
        setVerifyStatus('ok');
        setVerifyMsg('✓ Stream key valid!');
      } else {
        setVerifyStatus('error');
        setVerifyMsg(`✗ ${data.error}`);
      }
    } catch {
      setVerifyStatus('error');
      setVerifyMsg('✗ Tidak bisa terhubung ke server');
    }
  }

  async function save() {
    await fetch(`${API}/config/platform/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: form.enabled,
        streamKey: form.streamKey,
        pollingInterval: Number(form.pollingInterval),
      }),
    });
    // Update minAmount di alert config
    await fetch(`${API}/config/platform/${key}/alert`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minAmount: Number(form.minAmount) }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const platformLabels = {
    saweria: { name: 'Saweria', color: '#32C3A6', hint: 'Dapatkan Stream Key dari dashboard Saweria.co → Settings → Stream Key' },
  };
  const meta = platformLabels[key] || { name: key, color: '#888', hint: '' };

  return (
    <div className="platform-settings">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back</button>
        <h1>{meta.name} — Platform Settings</h1>
        <p className="page-sub">Hubungkan akun {meta.name} untuk menerima donasi alert</p>
      </div>

      <div className="card">
        {/* Enable toggle */}
        <div className="field-row">
          <div className="field-label">
            <span>Enable {meta.name}</span>
            <span className="field-hint">Aktifkan polling donasi dari {meta.name}</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.enabled || false}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            <span className="toggle-track" />
          </label>
        </div>

        <div className="divider" />

        {/* Stream Key */}
        <div className="field-col">
          <label className="label">Stream Key</label>
          <p className="field-hint">{meta.hint}</p>
          <div className="key-row">
            <input
              type="password"
              className="input"
              placeholder="Paste stream key kamu di sini..."
              value={form.streamKey || ''}
              onChange={(e) => {
                setForm((f) => ({ ...f, streamKey: e.target.value }));
                setVerifyStatus(null);
              }}
            />
            <button
              className={`btn-verify ${verifyStatus}`}
              onClick={verifyKey}
              disabled={verifyStatus === 'checking' || !form.streamKey}
            >
              {verifyStatus === 'checking' ? '...' : 'Verify'}
            </button>
          </div>
          {verifyMsg && (
            <div className={`verify-msg ${verifyStatus}`}>{verifyMsg}</div>
          )}
        </div>

        <div className="divider" />

        {/* Polling interval */}
        <div className="field-col">
          <label className="label">Polling Interval</label>
          <p className="field-hint">Seberapa sering cek donasi baru (milliseconds). Minimum 3000ms</p>
          <div className="input-unit">
            <input
              type="number"
              className="input"
              min="3000"
              step="1000"
              value={form.pollingInterval || 5000}
              onChange={(e) => setForm((f) => ({ ...f, pollingInterval: e.target.value }))}
            />
            <span className="unit">ms</span>
          </div>
        </div>

        {/* Min amount */}
        <div className="field-col">
          <label className="label">Minimum Donasi</label>
          <p className="field-hint">Alert hanya muncul jika donasi ≥ jumlah ini. Set 0 untuk semua.</p>
          <div className="input-unit">
            <span className="unit prefix">Rp</span>
            <input
              type="number"
              className="input"
              min="0"
              step="1000"
              value={form.minAmount || 0}
              onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))}
            />
          </div>
        </div>

        <div className="divider" />

        {/* Actions */}
        <div className="actions-row">
          <button className="btn-primary" onClick={save}>
            {saved ? '✓ Tersimpan!' : '💾 Save Settings'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/platform/${key}/alert`)}
          >
            🎨 Customize Alert →
          </button>
        </div>
      </div>
    </div>
  );
}
