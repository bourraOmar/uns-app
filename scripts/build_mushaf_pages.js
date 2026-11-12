const fs = require('fs');
const path = require('path');

const surahs = JSON.parse(fs.readFileSync('D:/Documents/projects/uns-app/data/surahs.json', 'utf8'));
const SURAH_NAMES = {};
surahs.forEach(s => { SURAH_NAMES[s.id] = s.name_arabic; });

const NEXT_PAGES_WITH_WORDS = new Set([120, 121, 122, 531, 532, 533, 564, 567, 569, 575, 583]);

const page1Data = {
  isOpening: true,
  surahStarts: {
    2: { id: 1, name: 'الفاتحة', hasBasmalah: false }
  },
  lines: {
    2: ["ﱁ", "ﱂ", "ﱃ", "ﱄ", "ﱅ"],
    3: ["ﱆ", "ﱇ", "ﱈ", "ﱉ", "ﱊ"],
    4: ["ﱋ", "ﱌ", "ﱍ", "ﱎ", "ﱏ", "ﱐ", "ﱑ"],
    5: ["ﱒ", "ﱓ", "ﱔ", "ﱕ", "ﱖ", "ﱗ"],
    6: ["ﱘ", "ﱙ", "ﱚ", "ﱛ", "ﱜ", "ﱝ"],
    7: ["ﱞ", "ﱟ", "ﱠ", "ﱡ"],
    8: ["ﱢ", "ﱣ", "ﱤ"]
  }
};

const page2Data = {
  isOpening: true,
  surahStarts: {
    3: { id: 2, name: 'البقرة', hasBasmalah: true }
  },
  lines: {
    3: ["ﱁ", "ﱂ", "ﱃ", "ﱄ", "ﱅ", "ﱆﱇ", "ﱈﱉ", "ﱊ"],
    4: ["ﱋ", "ﱌ", "ﱍ", "ﱎ", "ﱏ", "ﱐ", "ﱑ"],
    5: ["ﱒ", "ﱓ", "ﱔ", "ﱕ", "ﱖ", "ﱗ", "ﱘ", "ﱙ"],
    6: ["ﱚ", "ﱛ", "ﱜ", "ﱝ", "ﱞ", "ﱟ", "ﱠ", "ﱡ", "ﱢ"],
    7: ["ﱣ", "ﱤ", "ﱥ", "ﱦ", "ﱧﱨ", "ﱩ"],
    8: ["ﱪ", "ﱫ", "ﱬ"]
  }
};

const page525Data = {
  page: 525,
  isOpening: false,
  surahStarts: {},
  lines: {
    1: ["ﱁ", "ﱂ", "ﱃ", "ﱄﱅ", "ﱆ", "ﱇ", "ﱈ", "ﱉ", "ﱊ", "ﱋ", "ﱌ"],
    2: ["ﱍﱎ", "ﱏ", "ﱐ", "ﱑ", "ﱒ", "ﱓ", "ﱔ", "ﱕ", "ﱖ", "ﱗ"],
    3: ["ﱘ", "ﱙ", "ﱚ", "ﱛ", "ﱜ", "ﱝ", "ﱞ", "ﱟ", "ﱠ", "ﱡ", "ﱢ"],
    4: ["ﱣ", "ﱤ", "ﱥ", "ﱦﱧ", "ﱨ", "ﱩ", "ﱪ", "ﱫ", "ﱬ", "ﱭ"],
    5: ["ﱮ", "ﱯ", "ﱰ", "ﱱ", "ﱲ", "ﱳ", "ﱴ", "ﱵ", "ﱶ"],
    6: ["ﱷ", "ﱸﱹ", "ﱺ", "ﱻ", "ﱼ", "ﱽ", "ﱾ"],
    7: ["ﱿ", "ﲀ", "ﲁ", "ﲂ", "ﲃ", "ﲄ", "ﲅ", "ﲆ", "ﲇ", "ﲈ", "ﲉ", "ﲊ"],
    8: ["ﲋ", "ﲌ", "ﲍ", "ﲎ", "ﲏ", "ﲐ", "ﲑ", "ﲒ"],
    9: ["ﲓ", "ﲔ", "ﲕﲖ", "ﲗ", "ﲘ", "ﲙ", "ﲚ", "ﲛ"],
    10: ["ﲜ", "ﲝ", "ﲞ", "ﲟ", "ﲠﲡ", "ﲢ", "ﲣ", "ﲤ", "ﲥ", "ﲦ", "ﲧ", "ﲨ", "ﲩ"],
    11: ["ﲪ", "ﲫ", "ﲬ", "ﲭ", "ﲮ", "ﲯ", "ﲰ", "ﲱ", "ﲲ", "ﲳ"],
    12: ["ﲴ", "ﲵ", "ﲶ", "ﲷ", "ﲸ", "ﲹ", "ﲺ", "ﲻ", "ﲼ", "ﲽ", "ﲾ"],
    13: ["ﲿ", "ﳀ", "ﳁ", "ﳂ", "ﳃ", "ﳄ", "ﳅ", "ﳆ", "ﳇ", "ﳈ", "ﳉ"],
    14: ["ﳊ", "ﳋ", "ﳌ", "ﳍ", "ﳎ", "ﳏ", "ﳐ", "ﳑ", "ﳒﳓ", "ﳔ", "ﳕ"],
    15: ["ﳖ", "ﳗ", "ﳘ", "ﳙ", "ﳚ", "ﳛ", "ﳜ", "ﳝ", "ﳞ", "ﳟ"]
  }
};

const pageCache = {};

async function fetchPageApi(p) {
  if (p < 1 || p > 604) return [];
  if (pageCache[p]) return pageCache[p];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_page/${p}?words=true&word_fields=code_v2,text_uthmani,line_number,page_number&mushaf=1`);
      const json = await res.json();
      pageCache[p] = json.verses || [];
      return pageCache[p];
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return [];
}

async function processPage(p) {
  if (p === 1) return page1Data;
  if (p === 2) return page2Data;
  if (p === 525) return page525Data;

  const verses = await fetchPageApi(p);
  const surahStarts = {};
  const lineWords = {};

  function ingest(vList) {
    (vList || []).forEach(v => {
      if (v.verse_number === 1) {
        const sId = parseInt(v.verse_key.split(':')[0], 10);
        const w1 = v.words ? v.words.find(w => w.page_number === p) : null;
        if (w1) {
          surahStarts[w1.line_number] = {
            id: sId,
            name: SURAH_NAMES[sId] || '',
            hasBasmalah: sId !== 1 && sId !== 9
          };
        }
      }

      if (v.words && v.words.length > 0) {
        v.words.forEach(w => {
          if (w.page_number === p) {
            const l = w.line_number;
            if (!lineWords[l]) lineWords[l] = [];
            if (w.code_v2 && !lineWords[l].some(item => item.id === w.id)) {
              lineWords[l].push({ id: w.id, code: w.code_v2 });
            }
          }
        });
      }
    });
  }

  ingest(verses);

  let hasStartGlyph = false;
  Object.values(lineWords).forEach(arr => {
    if (arr.some(w => w.code && w.code.startsWith('ﱁ'))) {
      hasStartGlyph = true;
    }
  });

  if (p > 1 && !hasStartGlyph) {
    const prevVerses = await fetchPageApi(p - 1);
    ingest(prevVerses);
  }

  if (p < 604 && NEXT_PAGES_WITH_WORDS.has(p)) {
    const nextVerses = await fetchPageApi(p + 1);
    ingest(nextVerses);
  }

  const lines = {};
  Object.keys(lineWords).forEach(l => {
    lineWords[l].sort((a, b) => a.id - b.id);
    lines[l] = lineWords[l].map(x => x.code);
  });

  return {
    page: p,
    isOpening: false,
    lines: lines,
    surahStarts: surahStarts
  };
}

async function main() {
  console.log('Starting full Quran page compilation (Pages 1 to 604)...');
  const allPages = {};
  const BATCH_SIZE = 15;

  for (let i = 1; i <= 604; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE - 1, 604);
    const batch = [];
    for (let p = i; p <= end; p++) {
      batch.push(
        processPage(p).then(data => {
          allPages[p] = data;
        })
      );
    }
    await Promise.all(batch);
    console.log(`Compiled pages ${i} to ${end}...`);
  }

  const outPath = 'D:/Documents/projects/uns-app/data/mushaf_v2_pages.json';
  fs.writeFileSync(outPath, JSON.stringify(allPages), 'utf8');
  const stats = fs.statSync(outPath);
  console.log(`SUCCESS! Saved complete mushaf data to ${outPath} (${Math.round(stats.size / 1024)} KB)`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
