const fs = require('fs');
const path = require('path');

const MUSHAF_PAGES_PATH = path.join(__dirname, '../data/mushaf_v2_pages.json');
const AYAH_GLYPHS_PATH = path.join(__dirname, '../data/ayah_glyphs.json');

const page1Ends = ['ﱅ', 'ﱊ', 'ﱍ', 'ﱑ', 'ﱖ', 'ﱚ', 'ﱤ'];
const page2Ends = ['ﱂ', 'ﱌ', 'ﱕ', 'ﱢ', 'ﱬ'];

async function fetchPageEnds(p) {
  if (p === 1) return page1Ends;
  if (p === 2) return page2Ends;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(
        `https://api.quran.com/api/v4/verses/by_page/${p}?words=true&word_fields=code_v2,char_type_name&mushaf=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const ends = [];
      (json.verses || []).forEach(v => {
        (v.words || []).forEach(w => {
          if (w.char_type_name === 'end' && w.code_v2) {
            if (!ends.includes(w.code_v2)) ends.push(w.code_v2);
          }
        });
      });
      return ends;
    } catch (err) {
      if (attempt === 4) {
        console.error(`Failed page ${p} after 4 attempts:`, err.message);
        return [];
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return [];
}

async function main() {
  console.log('Loading existing mushaf_v2_pages.json...');
  const pagesData = JSON.parse(fs.readFileSync(MUSHAF_PAGES_PATH, 'utf8'));

  const ayahGlyphsMap = {};
  const queue = Array.from({ length: 604 }, (_, i) => i + 1);
  const total = queue.length;
  let completed = 0;

  const CONCURRENCY = 20;

  async function worker() {
    while (queue.length > 0) {
      const p = queue.shift();
      const ends = await fetchPageEnds(p);
      ayahGlyphsMap[p] = ends;
      if (pagesData[p]) {
        pagesData[p].ayahGlyphs = ends;
      }
      completed++;
      if (completed % 50 === 0 || completed === total) {
        console.log(`Progress: ${completed} / ${total} pages fetched (${Math.round((completed / total) * 100)}%)`);
      }
    }
  }

  const startTime = Date.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`All 604 pages fetched in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  // Write ayah_glyphs.json
  fs.writeFileSync(AYAH_GLYPHS_PATH, JSON.stringify(ayahGlyphsMap, null, 2), 'utf8');
  console.log(`Saved ${AYAH_GLYPHS_PATH}`);

  // Write updated mushaf_v2_pages.json
  fs.writeFileSync(MUSHAF_PAGES_PATH, JSON.stringify(pagesData), 'utf8');
  console.log(`Updated ${MUSHAF_PAGES_PATH}`);
}

main().catch(console.error);
