import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Reciter {
  id: string;
  name: string;
  englishName?: string;
  aliases?: string[];
  rewaya: string;
  server?: string;
  surahTotal?: number;
  badge?: string;
  letter?: string;
}

const CACHE_KEY = '@uns_mp3quran_reciters_v2';

export const COMMON_ALIASES: Record<string, string[]> = {
  'مشاري العفاسي': ['mishary', 'alafasy', 'afasy', 'alafasi', 'meshary', 'al-afasy'],
  'ناصر القطامي': ['nasser', 'qatami', 'al-qatami', 'alqatami', 'qatamy'],
  'خالد الجليل': ['khalid', 'jalil', 'jaleel', 'jileel', 'al-jalil'],
  'محمد اللحيدان': ['muhammad', 'mohammed', 'luhaidan', 'lohaidan', 'al-luhaidan'],
  'صلاح البدير': ['salah', 'budair', 'al-budair', 'albudair'],
  'عبدالباسط عبدالصمد': ['abdulbasit', 'abdul basit', 'abdelbasset', 'abdussamad', 'basit'],
  'أحمد الحذيفي': ['ahmad', 'ahmed', 'hudhaify', 'huthifi', 'al-hudhaify'],
  'ماهر المعيقلي': ['maher', 'muaiqly', 'meaqli', 'mueaqly', 'al-muaiqly'],
  'ياسر الدوسري': ['yasser', 'dosari', 'dossary', 'al-dosari', 'al-dawsari'],
  'سعد الغامدي': ['saad', 'ghamdi', 'al-ghamdi', 'el ghamidi'],
  'محمود خليل الحصري': ['mahmoud', 'khalil', 'hussary', 'hossary', 'al-hussary'],
  'محمد صديق المنشاوي': ['minshawi', 'menshawi', 'al-minshawi', 'siddiq'],
  'علي جابر': ['ali', 'jaber', 'jabar', 'ali jaber'],
  'فارس عباد': ['fares', 'abbad', 'faris', 'abbad'],
  'إدريس أبكر': ['idrees', 'idris', 'abkar', 'abker'],
  'أحمد بن علي العجمي': ['ajmi', 'al-ajmi', 'ajmy', 'alajmi'],
  'شيخ أبو بكر الشاطري': ['shatri', 'al-shatri', 'abu bakr'],
  'إبراهيم الأخضر': ['akhdar', 'al-akhdar', 'akdar'],
  'عبدالرحمن السديس': ['sudais', 'al-sudais', 'alsudais', 'soudais'],
  'سعود الشريم': ['shuraim', 'shuraym', 'al-shuraim', 'alshuraim'],
};

export const FAMOUS_RECITER_NAMES = [
  'ناصر القطامي',
  'خالد الجليل',
  'مشاري العفاسي',
  'محمد اللحيدان',
  'صلاح البدير',
  'عبدالباسط عبدالصمد',
  'عبد الباسط عبد الصمد',
  'أحمد الحذيفي',
  'ماهر المعيقلي',
  'ياسر الدوسري',
  'سعد الغامدي',
  'محمود خليل الحصري',
  'محمد صديق المنشاوي',
  'علي جابر',
  'فارس عباد',
  'إدريس أبكر',
  'أحمد بن علي العجمي',
  'شيخ أبو بكر الشاطري',
  'إبراهيم الأخضر',
  'عبدالرحمن السديس',
  'سعود الشريم',
];

export const RECITERS_DATA: Reciter[] = [
  {
    id: '86',
    name: 'ناصر القطامي',
    englishName: 'Nasser Alqatami',
    aliases: ['qatami', 'al-qatami', 'nasser'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server6.mp3quran.net/qtm/',
  },
  {
    id: '20',
    name: 'خالد الجليل',
    englishName: 'Khalid Al-Jileel',
    aliases: ['khalid', 'jalil', 'jaleel', 'al-jalil'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server10.mp3quran.net/jleel/',
  },
  {
    id: '123',
    name: 'مشاري العفاسي',
    englishName: 'Mishary Alafasi',
    aliases: ['mishary', 'alafasy', 'afasy', 'alafasi'],
    rewaya: 'روايتان متاحتان',
    server: 'https://server8.mp3quran.net/afs/',
  },
  {
    id: '107',
    name: 'محمد اللحيدان',
    englishName: 'Mohammed Al-Lohaidan',
    aliases: ['luhaidan', 'lohaidan', 'al-luhaidan'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server8.mp3quran.net/lhdan/',
  },
  {
    id: '43',
    name: 'صلاح البدير',
    englishName: 'Salah Albudair',
    aliases: ['salah', 'budair', 'al-budair'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server6.mp3quran.net/s_bud/',
  },
  {
    id: '51',
    name: 'عبدالباسط عبدالصمد',
    englishName: 'Abdulbasit Abdulsamad',
    aliases: ['abdulbasit', 'abdul basit', 'abdelbasset', 'basit'],
    rewaya: '3 روايات متاحة',
    badge: 'أهم التطبيقات',
    server: 'https://server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad/',
  },
  {
    id: '205',
    name: 'أحمد الحذيفي',
    englishName: 'Ahmed Al-Huthaifi',
    aliases: ['ahmed', 'hudhaify', 'huthifi'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server12.mp3quran.net/huthifi/',
  },
  {
    id: '102',
    name: 'ماهر المعيقلي',
    englishName: 'Maher Al Meaqli',
    aliases: ['maher', 'muaiqly', 'meaqli'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server12.mp3quran.net/maher/',
  },
  {
    id: '92',
    name: 'ياسر الدوسري',
    englishName: 'Yasser Al-Dosari',
    aliases: ['yasser', 'dosari', 'dossary'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server11.mp3quran.net/yasser/',
  },
  {
    id: '30',
    name: 'سعد الغامدي',
    englishName: 'Saad Al-Ghamdi',
    aliases: ['saad', 'ghamdi', 'al-ghamdi'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server7.mp3quran.net/s_gmd/',
  },
  {
    id: '118',
    name: 'محمود خليل الحصري',
    englishName: 'Mahmoud Khalil Al-Hussary',
    aliases: ['hussary', 'hossary', 'al-hussary'],
    rewaya: '4 روايات متاحة',
    server: 'https://server13.mp3quran.net/husr/',
  },
  {
    id: '112',
    name: 'محمد صديق المنشاوي',
    englishName: 'Mohamed Siddiq Al-Minshawi',
    aliases: ['minshawi', 'menshawi', 'al-minshawi'],
    rewaya: 'روايتان متاحتان',
    server: 'https://server10.mp3quran.net/minsh/',
  },
  {
    id: '61',
    name: 'علي جابر',
    englishName: 'Ali Jaber',
    aliases: ['ali jaber', 'jaber'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server11.mp3quran.net/a_jbr/',
  },
  {
    id: '68',
    name: 'فارس عباد',
    englishName: 'Fares Abbad',
    aliases: ['fares', 'abbad'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server8.mp3quran.net/frs_a/',
  },
  {
    id: '12',
    name: 'إدريس أبكر',
    englishName: 'Idrees Abkar',
    aliases: ['idris', 'abkar'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server6.mp3quran.net/abkr/',
  },
  {
    id: '4',
    name: 'أحمد بن علي العجمي',
    englishName: 'Ahmed Al-Ajmi',
    aliases: ['ajmi', 'al-ajmi'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server10.mp3quran.net/ajm/',
  },
  {
    id: '3',
    name: 'شيخ أبو بكر الشاطري',
    englishName: 'Abu Bakr Al-Shatri',
    aliases: ['shatri', 'al-shatri'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server11.mp3quran.net/shatri/',
  },
  {
    id: '1',
    name: 'إبراهيم الأخضر',
    englishName: 'Ibrahim Al-Akdar',
    aliases: ['akhdar', 'al-akhdar'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server6.mp3quran.net/akdr/',
  },
  {
    id: '54',
    name: 'عبدالرحمن السديس',
    englishName: 'Abdulrahman Al-Sudais',
    aliases: ['sudais', 'al-sudais', 'alsudais'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server11.mp3quran.net/sds/',
  },
  {
    id: '32',
    name: 'سعود الشريم',
    englishName: 'Saoud Al-Shuraim',
    aliases: ['shuraim', 'al-shuraim'],
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server7.mp3quran.net/shur/',
  },
];

/**
 * Text normalization for Arabic search:
 * removes diacritics/tashkeel, standardizes alefs, taa marbouta, and yaa
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel/diacritics
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Text normalization for English search:
 * lowercases, removes hyphens, apostrophes, and extra spaces
 */
export function normalizeEnglish(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[-_'.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Multi-lingual search matcher:
 * checks query in both Arabic and English names, aliases, and narrations
 */
export function matchesReciter(reciter: Reciter, query: string): boolean {
  if (!query || !query.trim()) return true;
  const rawQ = query.trim();

  // 1. Arabic matching (normalized)
  const normQAr = normalizeArabic(rawQ);
  const normNameAr = normalizeArabic(reciter.name);
  const normRewayaAr = normalizeArabic(reciter.rewaya);

  if (normNameAr.includes(normQAr) || normRewayaAr.includes(normQAr)) {
    return true;
  }

  // 2. English matching (normalized and space-insensitive)
  const normQEn = normalizeEnglish(rawQ);
  const compactQEn = normQEn.replace(/\s+/g, '');

  if (reciter.englishName) {
    const normEngName = normalizeEnglish(reciter.englishName);
    const compactEngName = normEngName.replace(/\s+/g, '');

    if (
      normEngName.includes(normQEn) ||
      compactEngName.includes(compactQEn) ||
      normEngName.split(' ').some((w) => w.startsWith(normQEn))
    ) {
      return true;
    }
  }

  // 3. Aliases matching
  const aliases = reciter.aliases || COMMON_ALIASES[reciter.name] || [];
  for (const alias of aliases) {
    const normAlias = normalizeEnglish(alias);
    const compactAlias = normAlias.replace(/\s+/g, '');

    if (
      normAlias.includes(normQEn) ||
      compactAlias.includes(compactQEn) ||
      compactQEn.includes(compactAlias)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Fetch reciters from MP3Quran.net API v3 in both Arabic and English
 * with local caching and offline fallback
 */
export async function fetchRecitersFromMp3Quran(): Promise<Reciter[]> {
  try {
    const [arRes, engRes] = await Promise.all([
      fetch('https://www.mp3quran.net/api/v3/reciters?language=ar'),
      fetch('https://www.mp3quran.net/api/v3/reciters?language=eng'),
    ]);

    if (!arRes.ok) throw new Error(`HTTP error ${arRes.status}`);

    const [arData, engData] = await Promise.all([
      arRes.json(),
      engRes.ok ? engRes.json().catch(() => null) : null,
    ]);

    // Build map of English reciter names by ID
    const englishNameMap = new Map<number, string>();
    if (engData && Array.isArray(engData.reciters)) {
      engData.reciters.forEach((er: any) => {
        if (er.id && er.name) {
          englishNameMap.set(er.id, er.name);
        }
      });
    }

    if (arData && Array.isArray(arData.reciters) && arData.reciters.length > 0) {
      const parsed: Reciter[] = arData.reciters.map((r: any) => {
        const count = r.moshaf?.length || 0;
        let rewaya = 'حفص عن عاصم - مرتل';
        if (count > 2) {
          rewaya = `${count} روايات متاحة`;
        } else if (count === 2) {
          rewaya = 'روايتان متاحتان';
        } else if (count === 1) {
          rewaya = r.moshaf[0]?.name || 'حفص عن عاصم - مرتل';
        }

        const isAbdulbasit = r.name.includes('عبدالباسط') || r.name.includes('عبد الباسط');
        const englishName = englishNameMap.get(r.id) || undefined;
        const aliases = COMMON_ALIASES[r.name] || undefined;

        return {
          id: String(r.id),
          name: r.name,
          englishName,
          aliases,
          rewaya,
          server: r.moshaf?.[0]?.server,
          surahTotal: r.moshaf?.[0]?.surah_total,
          badge: isAbdulbasit ? 'أهم التطبيقات' : undefined,
          letter: r.letter,
        };
      });

      // Sort prioritizing famous reciters matching design screenshot, then alphabetically
      parsed.sort((a, b) => {
        const iA = FAMOUS_RECITER_NAMES.findIndex((n) => a.name.includes(n));
        const iB = FAMOUS_RECITER_NAMES.findIndex((n) => b.name.includes(n));
        if (iA !== -1 && iB !== -1) return iA - iB;
        if (iA !== -1) return -1;
        if (iB !== -1) return 1;
        return a.name.localeCompare(b.name, 'ar');
      });

      // Save to cache asynchronously
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed)).catch(() => {});

      return parsed;
    }
  } catch (err) {
    console.warn('Could not fetch reciters from mp3quran API, attempting cache...', err);
  }

  // Fallback to cache if network fails
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Fallback to initial static data
  return RECITERS_DATA;
}
