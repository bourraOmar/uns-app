const fs = require('fs');
const path = require('path');

const fontsDir = 'D:/Documents/projects/uns-app/assets/fonts/quran_v2';
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

async function downloadFont(p) {
  const filePath = path.join(fontsDir, `p${p}.woff2`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
    return; // Already downloaded
  }
  const url = `https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p${p}.woff2`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buf));
      return;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function main() {
  console.log('Starting download of all 604 King Fahd Complex V2 fonts...');
  const BATCH_SIZE = 20;
  let totalDownloaded = 0;

  for (let i = 1; i <= 604; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE - 1, 604);
    const batch = [];
    for (let p = i; p <= end; p++) {
      batch.push(downloadFont(p));
    }
    await Promise.all(batch);
    totalDownloaded += (end - i + 1);
    process.stdout.write(`Downloaded up to page ${end} / 604...\r`);
  }
  console.log('\nAll 604 fonts downloaded successfully!');
  
  // Calculate total size
  const files = fs.readdirSync(fontsDir);
  let totalBytes = 0;
  files.forEach(f => {
    totalBytes += fs.statSync(path.join(fontsDir, f)).size;
  });
  console.log(`Total fonts: ${files.length}, Total size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('Download error:', err);
  process.exit(1);
});
