import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Reciter {
  id: string;
  name: string;
  rewaya: string;
  server?: string;
  surahTotal?: number;
  badge?: string;
  letter?: string;
}

const CACHE_KEY = '@uns_mp3quran_reciters_v1';

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
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server6.mp3quran.net/qtm/',
  },
  {
    id: '20',
    name: 'خالد الجليل',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server10.mp3quran.net/jleel/',
  },
  {
    id: '123',
    name: 'مشاري العفاسي',
    rewaya: 'روايتان متاحتان',
    server: 'https://server8.mp3quran.net/afs/',
  },
  {
    id: '107',
    name: 'محمد اللحيدان',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server8.mp3quran.net/lhdan/',
  },
  {
    id: '43',
    name: 'صلاح البدير',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server6.mp3quran.net/s_bud/',
  },
  {
    id: '51',
    name: 'عبدالباسط عبدالصمد',
    rewaya: '3 روايات متاحة',
    badge: 'أهم التطبيقات',
    server: 'https://server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad/',
  },
  {
    id: '205',
    name: 'أحمد الحذيفي',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server12.mp3quran.net/huthifi/',
  },
  {
    id: '102',
    name: 'ماهر المعيقلي',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server12.mp3quran.net/maher/',
  },
  {
    id: '92',
    name: 'ياسر الدوسري',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server11.mp3quran.net/yasser/',
  },
  {
    id: '30',
    name: 'سعد الغامدي',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server7.mp3quran.net/s_gmd/',
  },
  {
    id: '118',
    name: 'محمود خليل الحصري',
    rewaya: '4 روايات متاحة',
    server: 'https://server13.mp3quran.net/husr/',
  },
  {
    id: '112',
    name: 'محمد صديق المنشاوي',
    rewaya: 'روايتان متاحتان',
    server: 'https://server10.mp3quran.net/minsh/',
  },
  {
    id: '61',
    name: 'علي جابر',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server11.mp3quran.net/a_jbr/',
  },
  {
    id: '68',
    name: 'فارس عباد',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server8.mp3quran.net/frs_a/',
  },
  {
    id: '12',
    name: 'إدريس أبكر',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server6.mp3quran.net/abkr/',
  },
  {
    id: '4',
    name: 'أحمد بن علي العجمي',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server10.mp3quran.net/ajm/',
  },
  {
    id: '3',
    name: 'شيخ أبو بكر الشاطري',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server11.mp3quran.net/shatri/',
  },
  {
    id: '1',
    name: 'إبراهيم الأخضر',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server6.mp3quran.net/akdr/',
  },
  {
    id: '54',
    name: 'عبدالرحمن السديس',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server11.mp3quran.net/sds/',
  },
  {
    id: '32',
    name: 'سعود الشريم',
    rewaya: 'حفص عن عاصم - مرتل',
    server: 'https://server7.mp3quran.net/shur/',
  },
];

/**
 * Fetch reciters from official MP3Quran.net API v3
 * with local caching and offline fallback
 */
export async function fetchRecitersFromMp3Quran(): Promise<Reciter[]> {
  try {
    const res = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    if (data && Array.isArray(data.reciters) && data.reciters.length > 0) {
      const parsed: Reciter[] = data.reciters.map((r: any) => {
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

        return {
          id: String(r.id),
          name: r.name,
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
