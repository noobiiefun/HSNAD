import React, { useState, useEffect } from 'react';
import './OverlaySettings.css';

const API = 'http://localhost:5174/api';

export default function OverlaySettings() {
  const [overlayUrl, setOverlayUrl] = useState('http://localhost:5174/overlay');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.getOverlayUrl) {
      window.electronAPI.getOverlayUrl().then(setOverlayUrl);
    }
  }, []);

  function copyUrl() {
    navigator.clipboard.writeText(overlayUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="overlay-settings">
      <div className="page-header">
        <h1>🎬 Overlay & OBS Setup</h1>
        <p className="page-sub">Panduan lengkap cara menambahkan overlay ke OBS / Streamlabs OBS</p>
      </div>

      <div className="card">
        <div className="card-title">Browser Source URL</div>
        <div className="url-row">
          <div className="url-box">{overlayUrl}</div>
          <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copyUrl}>
            {copied ? '✓ Copied!' : '📋 Copy URL'}
          </button>
        </div>
      </div>

      <div className="steps-card">
        <div className="steps-title">Cara Menambahkan ke OBS</div>
        {[
          { n: 1, text: 'Buka OBS Studio' },
          { n: 2, text: 'Di panel Sources, klik tombol + (tambah source)' },
          { n: 3, text: 'Pilih Browser Source' },
          { n: 4, text: 'Beri nama (contoh: "Hey Streamer Alert") lalu klik OK' },
          { n: 5, text: 'Paste URL di atas ke kolom URL' },
          { n: 6, text: 'Set Width: 400 dan Height: 300 (bisa disesuaikan)' },
          { n: 7, text: 'Centang "Refresh browser when scene becomes active"' },
          { n: 8, text: 'Klik OK — overlay siap!' },
        ].map((s) => (
          <div key={s.n} className="step">
            <div className="step-num">{s.n}</div>
            <div className="step-text">{s.text}</div>
          </div>
        ))}
      </div>

      <div className="tips-card">
        <div className="tips-title">💡 Tips</div>
        <ul>
          <li>Posisikan Browser Source di bagian atas scene agar alert tidak tertutup game</li>
          <li>Pastikan Hey Streamer app tetap berjalan di background saat streaming</li>
          <li>App akan minimize ke system tray, bukan keluar, saat kamu klik X</li>
          <li>Bisa pakai lebih dari satu OBS pada waktu bersamaan dengan URL yang sama</li>
        </ul>
      </div>
    </div>
  );
}
