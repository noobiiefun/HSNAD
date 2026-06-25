/**
 * HSNAD Prebuild Checker
 * Validasi semua yang dibutuhkan sebelum npm run build
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const CHECKS = [
  // Assets wajib ada
  { path: 'build-assets/icon.ico',      desc: 'App icon (.ico) untuk Windows' },
  { path: 'build-assets/icon.png',      desc: 'App icon (.png)' },
  { path: 'build-assets/tray-icon.png', desc: 'Tray icon (32x32 PNG)' },
  { path: 'build-assets/splash.png',    desc: 'Splash screen image' },

  // Overlay
  { path: 'overlay/index.html',         desc: 'Overlay HTML untuk OBS' },

  // Sounds
  { path: 'public/sounds/default.wav',  desc: 'Default sound alert' },

  // Main process
  { path: 'src/main/main.js',           desc: 'Electron main process' },
  { path: 'src/main/preload.js',        desc: 'Preload script' },
  { path: 'src/main/splash.html',       desc: 'Splash screen HTML' },

  // Server
  { path: 'src/server/index.js',        desc: 'Express server' },

  // React source
  { path: 'src/renderer/App.jsx',       desc: 'React App component' },
  { path: 'public/index.html',          desc: 'React public/index.html' },

  // Config
  { path: 'electron-builder.yml',       desc: 'electron-builder config' },
];

let allOk = true;
let passCount = 0;

console.log('\n🔍 HSNAD — Prebuild Check\n' + '─'.repeat(50));

CHECKS.forEach(({ path: relPath, desc }) => {
  const fullPath = path.join(ROOT, relPath);
  const exists   = fs.existsSync(fullPath);
  const icon     = exists ? '✅' : '❌';
  console.log(`${icon}  ${relPath.padEnd(40)} ${exists ? '' : `← ${desc} TIDAK ADA!`}`);
  if (exists) passCount++;
  else allOk = false;
});

console.log('─'.repeat(50));
console.log(`\n${passCount}/${CHECKS.length} checks passed.\n`);

if (!allOk) {
  console.error('❌ Build dibatalkan — ada file yang kurang!\n');
  process.exit(1);
} else {
  console.log('✅ Semua file lengkap. Siap build .exe!\n');
  process.exit(0);
}
