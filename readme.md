# 🎙️ Hey Streamer — Notice Alert Donation

> All-in-one donation alert system untuk streamer Indonesia.  
> Gabungkan notifikasi dari Saweria, Trakteer, dan platform lainnya dalam **satu OBS Browser Source**.

![Version](https://img.shields.io/badge/version-1.0.0-32C3A6)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Stack](https://img.shields.io/badge/stack-Electron%20%2B%20React%20%2B%20Express-orange)
![Author](https://img.shields.io/badge/author-noobiiefun-purple)

---

## ✨ Fitur

- 🎯 **Multi-platform** — Saweria (v1), Trakteer & SociaBuzz (coming soon)
- 🎨 **Alert Designer** — kustomisasi layout, animasi, font, warna, durasi per platform
- ⚡ **Real-time** — Socket.IO untuk alert instan tanpa delay
- 📺 **1 OBS Source** — satu URL untuk semua platform sekaligus
- 🗂️ **Alert Queue** — antrian otomatis, tidak tumpang tindih
- 💾 **Persistent Config** — settings tersimpan otomatis
- 🖥️ **Desktop App** — bisa di-export ke `.exe` installer
- 🔔 **System Tray** — app tetap jalan di background saat streaming

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Desktop App | Electron 28 |
| UI/Dashboard | React 18 + React Router 6 |
| Backend | Express 4 + Socket.IO 4 |
| Config Storage | electron-store |
| Build | electron-builder (NSIS installer) |

---

## 🚀 Development Setup

### Prerequisites
- Node.js **v20 LTS** (jangan pakai v22/v24 karena native module issue)
- npm v8+

### Install & Run

```bash
# Clone repo
git clone https://github.com/noobiiefun/hey-streamer.git
cd hey-streamer

# Install dependencies
npm install

# Jalankan development mode
npm run dev
```

> `npm run dev` akan menjalankan React dev server (port 3000) dan Electron secara bersamaan.

---

## 📺 Cara Pakai di OBS

1. Jalankan app Hey Streamer
2. Buka menu **Overlay & OBS** di sidebar
3. Copy URL overlay: `http://localhost:5174/overlay`
4. Di OBS: **+ Source → Browser Source**
5. Paste URL tersebut, set ukuran **400×300px**
6. Klik OK — alert siap tampil!

---

## ⚙️ Konfigurasi Saweria

1. Buka menu **Saweria** di sidebar
2. Masukkan **Stream Key** dari dashboard Saweria
   - Login ke [saweria.co](https://saweria.co) → Settings → Stream Key
3. Klik **Verify** untuk tes koneksi
4. Aktifkan toggle **Enable**
5. Klik **Save Settings**
6. Buka **Alert Designer** untuk kustomisasi tampilan

---

## 🎨 Alert Designer

Setiap platform punya Alert Designer sendiri:

| Setting | Keterangan |
|---------|------------|
| **Message Template** | `{name}` = nama donatur, `{amount}` = jumlah, `{message}` = pesan |
| **Layout** | image-above-text / image-left-text / text-only |
| **Animasi** | fadeIn, slideIn, bounceIn (masuk) — fadeOut, slideOut (keluar) |
| **Duration** | Berapa detik alert tampil (3–30 detik) |
| **Font & Colors** | Font, ukuran, warna teks, warna highlight |
| **Image** | URL gambar/GIF untuk alert |

---

## 📦 Build .exe

```bash
# Build React dulu, lalu package jadi .exe
npm run build

# Output ada di folder /dist/
# File: Hey Streamer Setup 1.0.0.exe
```

> **Catatan:** Pastikan file icon ada di `build-assets/icon.ico` sebelum build.

---

## 📁 Struktur Folder

```
hey-streamer/
├── src/
│   ├── main/               # Electron main process
│   │   ├── main.js         # Entry point Electron
│   │   └── preload.js      # IPC bridge
│   ├── renderer/           # React app (Dashboard)
│   │   ├── components/     # Layout, dll
│   │   ├── pages/          # Dashboard, PlatformSettings, AlertDesigner
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── server/             # Express + Socket.IO
│   │   ├── routes/         # alerts, config, platforms
│   │   ├── services/       # saweria, alertQueue, config
│   │   └── index.js
│   └── shared/             # Constants bersama
├── overlay/                # HTML overlay (masuk ke OBS)
│   └── index.html
├── public/                 # React public assets
├── build-assets/           # Icon untuk .exe
└── package.json
```

---

## 🗺️ Roadmap

### v1.0 (Current)
- [x] Dashboard UI
- [x] Saweria integration (polling)
- [x] Alert Designer (animasi, layout, font, color)
- [x] Alert Queue dengan Socket.IO
- [x] OBS overlay
- [x] Build .exe
- [x] System tray

### v1.1 (Next)
- [ ] Trakteer integration
- [ ] SociaBuzz integration
- [ ] Sound per alert
- [ ] Alert history log
- [ ] Multiple alert variations (random)

### v2.0 (Future)
- [ ] Vercel deploy + login auth
- [ ] Webhook support (realtime, no polling)
- [ ] Mobile preview
- [ ] Streamlabs / OBS plugin

---

## 🤝 Contributing

Pull request welcome! Untuk perubahan besar, buka issue dulu ya.

---

## 📝 License

MIT © [noobiiefun](https://github.com/noobiiefun)
