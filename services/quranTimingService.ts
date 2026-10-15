import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AyahTimingRaw {
  ayah: number;
  start_time: number;
  end_time: number;
}

export interface SyncedVerse {
  ayahNumber: number;
  verseKey: string;
  text: string;
  startTime: number;
  endTime: number;
}

const TIMING_CACHE_PREFIX = '@uns_timing_v1_';
const VERSES_CACHE_PREFIX = '@uns_verses_v1_';

const BASMALA_TEXT = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';

export const AL_FATIHAH_VERSES = [
  { id: 1, verse_key: '1:1', text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
  { id: 2, verse_key: '1:2', text_uthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ' },
  { id: 3, verse_key: '1:3', text_uthmani: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
  { id: 4, verse_key: '1:4', text_uthmani: 'مَـٰلِكِ يَوْمِ ٱلدِّينِ' },
  { id: 5, verse_key: '1:5', text_uthmani: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
  { id: 6, verse_key: '1:6', text_uthmani: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
  { id: 7, verse_key: '1:7', text_uthmani: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' },
];

/**
 * Fetch Ayah timings from mp3quran Timing API
 */
export async function fetchAyatTiming(surahId: number, readId: number): Promise<AyahTimingRaw[]> {
  const cacheKey = `${TIMING_CACHE_PREFIX}${readId}_${surahId}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // ignore cache read error
  }

  try {
    const res = await fetch(`https://www.mp3quran.net/api/v3/ayat_timing?surah=${surahId}&read=${readId}`);
    if (!res.ok) {
      return [];
    }
    const data: AyahTimingRaw[] = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => {});
      return data;
    }
    return [];
  } catch (error) {
    console.warn('Error fetching ayat timing:', error);
    return [];
  }
}

/**
 * Fetch Uthmani verses from Quran.com API
 */
export async function fetchSurahVerses(surahId: number): Promise<{ id: number; verse_key: string; text_uthmani: string }[]> {
  if (surahId === 1) {
    return AL_FATIHAH_VERSES;
  }

  const cacheKey = `${VERSES_CACHE_PREFIX}${surahId}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // ignore cache read error
  }

  try {
    const res = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahId}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (data?.verses && Array.isArray(data.verses)) {
      AsyncStorage.setItem(cacheKey, JSON.stringify(data.verses)).catch(() => {});
      return data.verses;
    }
    return [];
  } catch (error) {
    console.warn('Error fetching surah verses:', error);
    return [];
  }
}

/**
 * Combine timings and verses into Spotify-style synced verses
 */
export async function getSyncedVerses(surahId: number, readId: number, durationMillis?: number): Promise<SyncedVerse[]> {
  try {
    const [timingData, versesData] = await Promise.all([
      fetchAyatTiming(surahId, readId),
      fetchSurahVerses(surahId),
    ]);

    if (!versesData || versesData.length === 0) {
      return [];
    }

    const timingMap = new Map<number, AyahTimingRaw>();
    if (Array.isArray(timingData)) {
      timingData.forEach((t) => timingMap.set(t.ayah, t));
    }

    const syncedList: SyncedVerse[] = [];

    // Check if there is an Ayah 0 (Basmala) for surahs other than Surah 1 and Surah 9
    const ayahZero = timingMap.get(0);
    if (surahId !== 1 && surahId !== 9 && ayahZero && ayahZero.end_time > ayahZero.start_time) {
      syncedList.push({
        ayahNumber: 0,
        verseKey: `${surahId}:0`,
        text: BASMALA_TEXT,
        startTime: ayahZero.start_time,
        endTime: ayahZero.end_time,
      });
    }

    // Map each verse
    versesData.forEach((verse, index) => {
      const ayahNum = index + 1;
      const timing = timingMap.get(ayahNum);

      let startTime = 0;
      let endTime = 0;

      if (timing) {
        startTime = timing.start_time;
        endTime = timing.end_time;
      } else if (durationMillis && durationMillis > 0) {
        // Fallback approximate even distribution if timing API doesn't have this surah/read yet
        const slice = durationMillis / versesData.length;
        startTime = Math.floor(index * slice);
        endTime = Math.floor((index + 1) * slice);
      }

      syncedList.push({
        ayahNumber: ayahNum,
        verseKey: verse.verse_key,
        text: verse.text_uthmani,
        startTime,
        endTime,
      });
    });

    return syncedList;
  } catch (error) {
    console.warn('Error syncing verses:', error);
    return [];
  }
}
