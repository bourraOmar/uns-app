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
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buf));
      return;
    } catch (e) {
      if (attempt === 5) {
        console.warn(`Failed p${p}: ${e.message}`);
        return;
      }
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
}

async function main() {
  const missing = [];
  for (let p = 1; p <= 604; p++) {
    const filePath = path.join(fontsDir, `p${p}.woff2`);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size <= 1000) {
      missing.push(p);
    }
  }

  console.log(`Remaining fonts to download: ${missing.length} / 604`);
  if (missing.length === 0) {
    console.log('All 604 fonts are already downloaded!');
    return;
  }

  const BATCH_SIZE = 10;
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const chunk = missing.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(p => downloadFont(p)));
    process.stdout.write(`Downloaded ${Math.min(i + BATCH_SIZE, missing.length)} / ${missing.length} remaining...\r`);
    await new Promise(r => setTimeout(r, 300));
  }

  const files = fs.readdirSync(fontsDir).filter(f => f.endsWith('.woff2'));
  let totalBytes = 0;
  files.forEach(f => {
    totalBytes += fs.statSync(path.join(fontsDir, f)).size;
  });
  console.log(`\nCompleted! Total fonts: ${files.length} / 604, Total size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('Download error:', err);
});
