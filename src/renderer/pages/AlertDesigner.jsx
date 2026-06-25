import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AlertDesigner.css';

const API = 'http://localhost:5174/api';

const ANIMATIONS_IN  = [
  { value: 'fadeIn',       label: '✨ Fade In' },
  { value: 'slideIn',      label: '⬇ Slide Down' },
  { value: 'slideInLeft',  label: '⬅ Slide Left' },
  { value: 'slideInRight', label: '➡ Slide Right' },
  { value: 'bounceIn',     label: '🏀 Bounce In' },
  { value: 'zoomIn',       label: '🔍 Zoom In' },
  { value: 'flipInX',      label: '🔄 Flip In' },
  { value: 'rollIn',       label: '🎲 Roll In' },
];
const ANIMATIONS_OUT = [
  { value: 'fadeOut',      label: '✨ Fade Out' },
  { value: 'slideOut',     label: '⬆ Slide Up' },
  { value: 'slideOutLeft', label: '⬅ Slide Left' },
  { value: 'slideOutRight',label: '➡ Slide Right' },
  { value: 'zoomOut',      label: '🔍 Zoom Out' },
  { value: 'flipOutX',     label: '🔄 Flip Out' },
];
const TEXT_ANIMS = [
  { value: 'none',       label: 'None' },
  { value: 'wiggle',     label: '〰 Wiggle' },
  { value: 'bounce',     label: '⬆ Bounce' },
  { value: 'shake',      label: '↔ Shake' },
  { value: 'flash',      label: '⚡ Flash' },
  { value: 'pulse',      label: '💓 Pulse' },
  { value: 'rubberBand', label: '🪤 Rubber Band' },
];
const LAYOUTS = [
  { value: 'image-above-text', label: '📷 Image di atas teks' },
  { value: 'image-left-text',  label: '◀ Image kiri teks' },
  { value: 'text-only',        label: '📝 Teks saja' },
];
const FONTS = [
  'Inter','Poppins','Roboto','Open Sans','Montserrat',
  'Bebas Neue','Oswald','Raleway','Nunito','Exo 2','Orbitron',
];
const SOUNDS = [
  { value: 'none',    label: '🔇 Tidak ada' },
  { value: 'default', label: '🔔 Bell (Default)' },
  { value: 'coin',    label: '🪙 Coin' },
  { value: 'chime',   label: '🎵 Chime' },
  { value: 'pop',     label: '💥 Pop' },
  { value: 'custom',  label: '🎵 Custom URL' },
];

export default function AlertDesigner() {
  const { key }    = useParams();
  const navigate   = useNavigate();
  const [cfg, setCfg]         = useState(null);
  const [saved, setSaved]     = useState(false);
  const [testing, setTesting] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/config/platform/${key}`)
      .then(r => r.json())
      .then(data => setCfg(data.alert || {}))
      .catch(() => {});
  }, [key]);

  function set(field, value) {
    setCfg(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    await fetch(`${API}/config/platform/${key}/alert`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
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
    setTimeout(() => setTesting(false), 2000);
  }

  if (!cfg) return <div className="ad-loading">Loading...</div>;

  const name = key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <div className="alert-designer">
      <div className="ad-header">
        <button className="btn-back" onClick={() => navigate(`/platform/${key}`)}>
          ← Back to {name}
        </button>
        <div className="ad-title-row">
          <h1>🎨 Alert Designer — {name}</h1>
          <div className="ad-actions">
            <button className={`btn-test ${testing ? 'active' : ''}`} onClick={testAlert} disabled={testing}>
              {testing ? '⏳ Sending...' : '🧪 Test Alert'}
            </button>
            <button className="btn-save" onClick={save}>
              {saved ? '✓ Tersimpan!' : '💾 Save'}
            </button>
          </div>
        </div>
        <p className="ad-sub">Kustomisasi tampilan alert per platform. Klik "Test Alert" untuk preview langsung di overlay.</p>
      </div>

      <div className="ad-layout">
        {/* ── LEFT: Settings panels ── */}
        <div className="ad-panels">

          {/* Enable */}
          <div className="panel">
            <div className="panel-title">⚙️ General</div>
            <FieldRow label="Aktifkan Alert" hint="Tampilkan notifikasi saat donasi masuk">
              <Toggle checked={cfg.enabled ?? true} onChange={v => set('enabled', v)} />
            </FieldRow>
          </div>

          {/* Message */}
          <div className="panel">
            <div className="panel-title">💬 Pesan</div>
            <FieldCol label="Message Template"
              hint={<>Gunakan <code>{'{name}'}</code> <code>{'{amount}'}</code> <code>{'{message}'}</code></>}>
              <input className="input" type="text"
                value={cfg.messageTemplate || ''}
                onChange={e => set('messageTemplate', e.target.value)} />
            </FieldCol>
          </div>

          {/* Layout & Image */}
          <div className="panel">
            <div className="panel-title">🖼 Layout & Gambar</div>
            <FieldCol label="Layout">
              <select className="input select" value={cfg.layout || 'image-above-text'}
                onChange={e => set('layout', e.target.value)}>
                {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </FieldCol>
            <FieldCol label="Image URL" hint="URL gambar/GIF — kosongkan jika tidak ada">
              <input className="input" type="text" placeholder="https://..."
                value={cfg.imageUrl || ''}
                onChange={e => set('imageUrl', e.target.value)} />
            </FieldCol>
            <FieldCol label={`Ukuran Image — ${cfg.imageSize || 50}%`}>
              <input type="range" min="20" max="100" value={cfg.imageSize || 50}
                onChange={e => set('imageSize', Number(e.target.value))} />
            </FieldCol>
          </div>

          {/* Timing */}
          <div className="panel">
            <div className="panel-title">⏱ Timing</div>
            <FieldCol label={`Durasi Alert — ${cfg.duration || 8}s`}
              hint="Berapa detik alert tampil di layar">
              <input type="range" min="3" max="30" value={cfg.duration || 8}
                onChange={e => set('duration', Number(e.target.value))} />
            </FieldCol>
            <FieldCol label={`Text Delay — ${cfg.textDelay || 0.5}s`}
              hint="Jeda sebelum teks muncul">
              <input type="range" min="0" max="5" step="0.5" value={cfg.textDelay || 0.5}
                onChange={e => set('textDelay', Number(e.target.value))} />
            </FieldCol>
          </div>

          {/* Animation */}
          <div className="panel">
            <div className="panel-title">✨ Animasi</div>
            <div className="two-col">
              <FieldCol label="Animasi Masuk">
                <select className="input select" value={cfg.animationIn || 'bounceIn'}
                  onChange={e => set('animationIn', e.target.value)}>
                  {ANIMATIONS_IN.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </FieldCol>
              <FieldCol label="Animasi Keluar">
                <select className="input select" value={cfg.animationOut || 'fadeOut'}
                  onChange={e => set('animationOut', e.target.value)}>
                  {ANIMATIONS_OUT.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </FieldCol>
            </div>
            <FieldCol label="Animasi Teks Highlight">
              <select className="input select" value={cfg.textAnimation || 'wiggle'}
                onChange={e => set('textAnimation', e.target.value)}>
                {TEXT_ANIMS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </FieldCol>
          </div>

          {/* Sound */}
          <div className="panel">
            <div className="panel-title">🔊 Suara</div>
            <FieldCol label="Sound Alert">
              <select className="input select" value={cfg.sound || 'default'}
                onChange={e => set('sound', e.target.value)}>
                {SOUNDS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FieldCol>
            {cfg.sound === 'custom' && (
              <FieldCol label="Custom Sound URL" hint="Link langsung ke file .ogg / .mp3 / .wav">
                <input className="input" type="text" placeholder="https://... atau /sounds/custom.ogg"
                  value={cfg.soundUrl || ''}
                  onChange={e => set('soundUrl', e.target.value)} />
              </FieldCol>
            )}
            {cfg.sound !== 'none' && (
              <FieldCol label={`Volume — ${cfg.soundVolume ?? 70}%`}>
                <input type="range" min="0" max="100" value={cfg.soundVolume ?? 70}
                  onChange={e => set('soundVolume', Number(e.target.value))} />
              </FieldCol>
            )}
          </div>

          {/* Font */}
          <div className="panel">
            <div className="panel-title">🔤 Font</div>
            <FieldCol label="Font Family">
              <select className="input select" value={cfg.font || 'Inter'}
                onChange={e => set('font', e.target.value)}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </FieldCol>
            <div className="two-col">
              <FieldCol label={`Ukuran — ${cfg.fontSize || 28}px`}>
                <input type="range" min="14" max="80" value={cfg.fontSize || 28}
                  onChange={e => set('fontSize', Number(e.target.value))} />
              </FieldCol>
              <FieldCol label="Ketebalan">
                <select className="input select" value={cfg.fontWeight || '700'}
                  onChange={e => set('fontWeight', e.target.value)}>
                  {['400','500','600','700','800','900'].map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </FieldCol>
            </div>
          </div>

          {/* Colors */}
          <div className="panel">
            <div className="panel-title">🎨 Warna</div>
            <div className="colors-grid">
              <ColorField label="Warna Teks"     value={cfg.textColor      || '#FFFFFF'}  onChange={v => set('textColor', v)} />
              <ColorField label="Warna Highlight" value={cfg.highlightColor || '#32C3A6'} onChange={v => set('highlightColor', v)} />
            </div>
            <FieldCol label="Background" hint="Gunakan 'transparent' agar OBS tidak ada kotak">
              <div className="bg-options">
                <button
                  className={`bg-opt ${(!cfg.backgroundColor || cfg.backgroundColor === 'transparent') ? 'active' : ''}`}
                  onClick={() => set('backgroundColor', 'transparent')}
                >Transparent</button>
                <button
                  className={`bg-opt ${cfg.backgroundColor === 'rgba(15,15,23,0.88)' ? 'active' : ''}`}
                  onClick={() => set('backgroundColor', 'rgba(15,15,23,0.88)')}
                >Dark</button>
                <button
                  className={`bg-opt ${cfg.backgroundColor === 'rgba(0,0,0,0.7)' ? 'active' : ''}`}
                  onClick={() => set('backgroundColor', 'rgba(0,0,0,0.7)')}
                >Black</button>
                <input className="input" type="text" placeholder="rgba(...) atau #hex"
                  value={cfg.backgroundColor || 'transparent'}
                  onChange={e => set('backgroundColor', e.target.value)}
                  style={{ flex: 1, minWidth: 0 }} />
              </div>
            </FieldCol>
          </div>

        </div>

        {/* ── RIGHT: Live Preview ── */}
        <div className="ad-preview">
          <div className="preview-header">
            <span className="preview-label">🔴 Live Overlay Preview</span>
            <button className="btn-refresh" onClick={() => {
              if (iframeRef.current) iframeRef.current.src += '';
            }}>↺ Refresh</button>
          </div>
          <div className="preview-frame">
            <iframe
              ref={iframeRef}
              src="http://localhost:5174/overlay"
              title="Overlay Preview"
              className="preview-iframe"
            />
          </div>
          <div className="preview-hint">
            Ini adalah overlay asli yang sama persis dengan yang tampil di OBS
          </div>
          <div className="preview-obssize">
            Rekomendasi OBS Browser Source: <strong>400 × 300 px</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  );
}

function FieldRow({ label, hint, children }) {
  return (
    <div className="field-row">
      <div>
        <div className="label">{label}</div>
        {hint && <div className="hint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function FieldCol({ label, hint, children }) {
  return (
    <div className="field-col">
      <label className="label">{label}</label>
      {hint && <div className="hint">{hint}</div>}
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="color-field">
      <label className="label">{label}</label>
      <div className="color-row">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} />
        <input className="input" type="text" value={value} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
}
