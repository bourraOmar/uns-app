import { Image } from 'react-native';
import surahsData from '@/data/surahs.json';
import quranApiV4Data from '@/data/quran_api_v4.json';

export interface PageMetadata {
  page: number;
  surahId: number;
  surahName: string;
  juz: number;
  hizb: number;
}

// Generate static map from quran_api_v4.json
const PAGE_META_MAP: Record<number, PageMetadata> = {};

(() => {
  const surahNameMap: Record<number, string> = {};
  (surahsData as any[]).forEach((s) => {
    surahNameMap[s.id] = s.name_arabic;
  });

  const allVersesData = quranApiV4Data as Record<string, any[]>;
  for (const chId of Object.keys(allVersesData)) {
    const verses = allVersesData[chId] || [];
    for (const v of verses) {
      const p = v.page_number;
      if (p && !PAGE_META_MAP[p]) {
        PAGE_META_MAP[p] = {
          page: p,
          surahId: parseInt(chId, 10),
          surahName: surahNameMap[parseInt(chId, 10)] || `سورة ${chId}`,
          juz: v.juz_number || 1,
          hizb: v.hizb_number || 1,
        };
      }
    }
  }
})();

export function getMushafPageUrl(pageNumber: number): string {
  const padded = Math.max(1, Math.min(604, pageNumber)).toString().padStart(3, '0');
  return `https://files.quran.app/hafs/madani/width_1260/page${padded}.png`;
}

export function getPageMetadata(pageNumber: number): PageMetadata {
  const p = Math.max(1, Math.min(604, pageNumber));
  return (
    PAGE_META_MAP[p] || {
      page: p,
      surahId: 1,
      surahName: 'الفاتحة',
      juz: 1,
      hizb: 1,
    }
  );
}

const prefetchedPages = new Set<number>();

export function preloadNearbyPages(centerPage: number): void {
  const targets = [
    centerPage - 2,
    centerPage - 1,
    centerPage,
    centerPage + 1,
    centerPage + 2,
    centerPage + 3,
  ];

  targets.forEach((p) => {
    if (p >= 1 && p <= 604 && !prefetchedPages.has(p)) {
      prefetchedPages.add(p);
      Image.prefetch(getMushafPageUrl(p)).catch(() => {});
    }
  });
}
