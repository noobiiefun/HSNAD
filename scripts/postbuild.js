/**
 * HSNAD Postbuild Info
 * Dijalankan setelah build .exe selesai
 */

const fs   = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '../dist');

console.log('\n🎉 HSNAD Build Selesai!\n' + '─'.repeat(50));

if (!fs.existsSync(DIST)) {
  console.log('⚠️  Folder /dist tidak ditemukan.');
  process.exit(0);
}

// Cari file .exe
const files = fs.readdirSync(DIST).filter(f => f.endsWith('.exe'));

if (files.length === 0) {
  console.log('⚠️  Tidak ada file .exe di /dist');
} else {
  files.forEach(f => {
    const fullPath = path.join(DIST, f);
    const size     = fs.statSync(fullPath).size;
    const sizeMB   = (size / 1024 / 1024).toFixed(1);
    console.log(`📦  ${f}`);
    console.log(`    Ukuran : ${sizeMB} MB`);
    console.log(`    Path   : ${fullPath}`);
  });
}

console.log('\n─'.repeat(50));
console.log('📋 Cara install:');
console.log('   1. Jalankan HSNAD-Setup-x.x.x.exe');
console.log('   2. Ikuti wizard installer');
console.log('   3. Double-click shortcut HSNAD di Desktop');
console.log('   4. Masukkan Stream Key Saweria di dashboard');
console.log('   5. Copy overlay URL ke OBS Browser Source');
console.log('\n🚀 Selamat streaming!\n');
