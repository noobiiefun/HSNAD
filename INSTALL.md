# 🛠 HSNAD — Panduan Install & Build

## Cara 1: Pakai .exe Installer (untuk end-user)

Langsung download `HSNAD-Setup-1.0.0.exe` dari folder `dist/` dan jalankan.

- Tidak perlu install Node.js
- Ikuti wizard installer
- Double-click shortcut HSNAD di Desktop

---

## Cara 2: Development dari Source Code

### Prerequisites

| Software | Versi | Link |
|----------|-------|------|
| **Node.js** | **v20 LTS** ⚠️ (jangan v22/v24) | https://nodejs.org/en/download |
| Git | Latest | https://git-scm.com |

> ⚠️ **Wajib pakai Node.js v20 LTS!** Node v22/v24 menyebabkan masalah pada native modules (`electron-store`).

### Langkah Install

```bash
# 1. Clone repo
git clone https://github.com/noobiiefun/hey-streamer.git
cd hey-streamer

# 2. Install dependencies
npm install

# 3. Jalankan dev mode
npm run dev
```

App akan terbuka — React di port 3000, server di port 5174.

---

## Cara 3: Build .exe sendiri

### Persiapan

Pastikan ada semua file ini sebelum build:

```
build-assets/
  ├── icon.ico        ← wajib! (app icon Windows)
  ├── icon.png        ← wajib! (512x512)
  ├── tray-icon.png   ← wajib! (32x32)
  └── splash.png      ← wajib!

public/sounds/
  ├── default.wav
  ├── coin.wav
  ├── chime.wav
  └── pop.wav

overlay/
  └── index.html
```

### Perintah Build

```bash
# Step 1: Install dependencies (kalau belum)
npm install

# Step 2: Build (otomatis: check → React build → .exe)
npm run build
```

Output ada di folder `dist/`:
```
dist/
  └── HSNAD-Setup-1.0.0.exe   ← installer siap distribusi
```

Ukuran file sekitar **60–90 MB**.

### Build hanya React (tanpa .exe)

```bash
npm run build:react
# Output: folder /build
```

### Pack tanpa installer (untuk testing)

```bash
npm run pack
# Output: dist/win-unpacked/ — folder app tanpa installer
```

---

## Troubleshooting Build

### ❌ Error: `better-sqlite3` atau native module

```bash
# Pastikan pakai Node.js v20 LTS
node --version   # harus v20.x.x

# Rebuild native modules
npm run postinstall
# atau
./node_modules/.bin/electron-rebuild
```

### ❌ Error: `icon.ico` tidak ditemukan

Pastikan file `build-assets/icon.ico` ada dan berukuran >10KB (multi-size ICO).

### ❌ Port 5174 sudah dipakai

Cek apakah ada proses lain:
```bash
# Windows
netstat -ano | findstr :5174
```

Jika ada, matikan proses tersebut dulu sebelum jalankan HSNAD.

### ❌ App tidak bisa konek ke Saweria

1. Cek internet connection
2. Pastikan Stream Key benar (verify di Platform Settings)
3. Cek apakah Saweria sedang maintenance

---

## Struktur Folder

```
hey-streamer/
├── src/
│   ├── main/                  # Electron main process
│   │   ├── main.js            # Entry point + window management
│   │   ├── preload.js         # IPC bridge (aman, contextIsolation)
│   │   └── splash.html        # Splash screen HTML
│   ├── renderer/              # React dashboard app
│   │   ├── App.jsx            # Router
│   │   ├── components/        # Layout, sidebar
│   │   └── pages/             # Dashboard, AlertDesigner, dll
│   └── server/                # Express + Socket.IO backend
│       ├── index.js           # Server entry
│       ├── routes/            # REST API endpoints
│       └── services/          # Saweria, AlertQueue, Config, History
├── overlay/                   # OBS Browser Source HTML
│   └── index.html
├── public/
│   └── sounds/                # Sound files (.wav)
├── build-assets/              # Icon + splash untuk installer
├── scripts/                   # Build helper scripts
├── electron-builder.yml       # Build config
└── package.json
```

---

## Port yang Digunakan

| Port | Fungsi |
|------|--------|
| `3000` | React dev server (hanya saat development) |
| `5174` | Express server + Socket.IO + OBS overlay URL |

---

## FAQ

**Q: Apakah end-user perlu install Node.js?**
A: Tidak. File `.exe` sudah include semua yang dibutuhkan.

**Q: Apakah aman memasukkan Stream Key?**
A: Stream Key disimpan lokal di komputer kamu sendiri (via electron-store), tidak dikirim ke server manapun kecuali ke API Saweria.

**Q: Bagaimana cara update app?**
A: Download versi baru dan jalankan installer — otomatis replace versi lama.

**Q: Bisa dipakai di Mac/Linux?**
A: Source code bisa dijalankan, tapi belum ada build config untuk Mac/Linux. Coming soon di v2.0.
