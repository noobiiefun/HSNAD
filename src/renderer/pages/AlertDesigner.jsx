import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AlertDesigner.css';

const API = 'http://localhost:5174/api';

const ANIMATIONS_IN  = ['fadeIn', 'slideIn', 'bounceIn'];
const ANIMATIONS_OUT = ['fadeOut', 'slideOut'];
const TEXT_ANIMS     = ['none', 'wiggle'];
const LAYOUTS        = ['image-above-text', 'image-left-text', 'text-only'];
const FONTS          = ['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Montserrat', 'Bebas Neue'];

export default function AlertDesigner() {
  const { key } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch(`${API}/config/platform/${key}`)
      .then((r) => r.json())
      .then((data) => setAlert(data.alert || {}))
      .catch(() => {});
  }, [key]);

  function set(field, value) {
    setAlert((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    await fetch(`${API}/config/platform/${key}/alert`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testAlert() {
    setTesting(true);
    await fetch(`${API}/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: key }),
    });
    setTimeout(() => setTesting(false), 1500);
  }

  if (!alert) return <div className="loading">Loading...</div>;

  const platformName = key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <div className="alert-designer">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(`/platform/${key}`)}>← Back to {platformName}</button>
        <h1>🎨 Alert Designer — {platformName}</h1>
        <p className="page-sub">Customisasi tampilan, animasi, dan teks notifikasi donasi</p>
      </div>

      <div className="designer-layout">
        {/* Left: Settings panels */}
        <div className="designer-panels">

          {/* Enable */}
          <div className="panel">
            <div className="panel-title">General</div>
            <div className="field-row">
              <div>
                <div className="label">Enable Alert</div>
                <div className="hint">Tampilkan notifikasi saat ada donasi</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={alert.enabled ?? true}
                  onChange={(e) => set('enabled', e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>
          </div>

          {/* Message */}
          <div className="panel">
            <div className="panel-title">Message</div>
            <div className="field-col">
              <label className="label">Message Template</label>
              <div className="hint">Gunakan <code>{'{name}'}</code> <code>{'{amount}'}</code> <code>{'{message}'}</code></div>
              <input className="input" type="text" value={alert.messageTemplate || ''}
                onChange={(e) => set('messageTemplate', e.target.value)} />
            </div>
          </div>

          {/* Image & Layout */}
          <div className="panel">
            <div className="panel-title">Image & Layout</div>
            <div className="field-col">
              <label className="label">Layout</label>
              <select className="input select" value={alert.layout || 'image-above-text'}
                onChange={(e) => set('layout', e.target.value)}>
                {LAYOUTS.map((l) => (
                  <option key={l} value={l}>{l.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="field-col">
              <label className="label">Image URL</label>
              <input className="input" type="text" placeholder="https://... atau kosongkan"
                value={alert.imageUrl || ''}
                onChange={(e) => set('imageUrl', e.target.value)} />
            </div>
            <div className="field-col">
              <label className="label">Image Size — {alert.imageSize || 50}%</label>
              <input type="range" min="20" max="100" value={alert.imageSize || 50}
                onChange={(e) => set('imageSize', Number(e.target.value))} />
            </div>
          </div>

          {/* Duration */}
          <div className="panel">
            <div className="panel-title">Timing</div>
            <div className="field-col">
              <label className="label">Alert Duration — {alert.duration || 8}s</label>
              <input type="range" min="3" max="30" value={alert.duration || 8}
                onChange={(e) => set('duration', Number(e.target.value))} />
            </div>
            <div className="field-col">
              <label className="label">Text Delay — {alert.textDelay || 1}s</label>
              <div className="hint">Jeda sebelum teks muncul setelah alert</div>
              <input type="range" min="0" max="5" step="0.5" value={alert.textDelay || 1}
                onChange={(e) => set('textDelay', Number(e.target.value))} />
            </div>
          </div>

          {/* Animation */}
          <div className="panel">
            <div className="panel-title">Animation</div>
            <div className="field-row">
              <div className="field-col" style={{ flex: 1 }}>
                <label className="label">Animasi Masuk</label>
                <select className="input select" value={alert.animationIn || 'fadeIn'}
                  onChange={(e) => set('animationIn', e.target.value)}>
                  {ANIMATIONS_IN.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="field-col" style={{ flex: 1 }}>
                <label className="label">Animasi Keluar</label>
                <select className="input select" value={alert.animationOut || 'fadeOut'}
                  onChange={(e) => set('animationOut', e.target.value)}>
                  {ANIMATIONS_OUT.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="field-col">
              <label className="label">Text Animation</label>
              <select className="input select" value={alert.textAnimation || 'wiggle'}
                onChange={(e) => set('textAnimation', e.target.value)}>
                {TEXT_ANIMS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Font & Color */}
          <div className="panel">
            <div className="panel-title">Font & Colors</div>
            <div className="field-col">
              <label className="label">Font</label>
              <select className="input select" value={alert.font || 'Inter'}
                onChange={(e) => set('font', e.target.value)}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field-col" style={{ flex: 1 }}>
                <label className="label">Font Size — {alert.fontSize || 32}px</label>
                <input type="range" min="16" max="80" value={alert.fontSize || 32}
                  onChange={(e) => set('fontSize', Number(e.target.value))} />
              </div>
              <div className="field-col" style={{ flex: 1 }}>
                <label className="label">Font Weight</label>
                <select className="input select" value={alert.fontWeight || '700'}
                  onChange={(e) => set('fontWeight', e.target.value)}>
                  {['400','500','600','700','800','900'].map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="colors-row">
              <div className="color-field">
                <label className="label">Text Color</label>
                <div className="color-row">
                  <input type="color" value={alert.textColor || '#FFFFFF'}
                    onChange={(e) => set('textColor', e.target.value)} />
                  <input className="input" type="text" value={alert.textColor || '#FFFFFF'}
                    onChange={(e) => set('textColor', e.target.value)} />
                </div>
              </div>
              <div className="color-field">
                <label className="label">Highlight Color</label>
                <div className="color-row">
                  <input type="color" value={alert.highlightColor || '#32C3A6'}
                    onChange={(e) => set('highlightColor', e.target.value)} />
                  <input className="input" type="text" value={alert.highlightColor || '#32C3A6'}
                    onChange={(e) => set('highlightColor', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview panel */}
        <div className="preview-panel">
          <div className="preview-title">Live Preview</div>
          <div className="preview-frame">
            <iframe
              src="http://localhost:5174/overlay"
              title="Alert Preview"
              className="preview-iframe"
            />
          </div>
          <div className="preview-hint">
            Preview ini adalah overlay asli yang sama dengan yang di OBS
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="bottom-actions">
        <button className="btn-primary" onClick={save}>
          {saved ? '✓ Tersimpan!' : '💾 Save Alert Settings'}
        </button>
        <button
          className={`btn-test ${testing ? 'active' : ''}`}
          onClick={testAlert}
          disabled={testing}
        >
          {testing ? '⏳ Sending...' : '🧪 Test Alert'}
        </button>
      </div>
    </div>
  );
}
