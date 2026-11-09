import * as FileSystem from 'expo-file-system/legacy';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MushafWord {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  line_number: number;
  page_number: number;
  code_v1?: string;
  code_v2?: string;
  text?: string;
}

export interface MushafVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  words?: MushafWord[];
}

const FONTS_DIR = (FileSystem.documentDirectory || '') + 'quran_fonts/';

async function ensureFontsDir() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(FONTS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(FONTS_DIR, { intermediates: true });
    }
  } catch {}
}

export async function loadPageFont(pageNumber: number): Promise<boolean> {
  const fontName = `p${pageNumber}`;
  if (Font.isLoaded(fontName)) {
    return true;
  }

  try {
    await ensureFontsDir();
    const localUri = `${FONTS_DIR}v1_p${pageNumber}.ttf`;
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (!fileInfo.exists) {
      const remoteUrl = `https://verses.quran.foundation/fonts/quran/hafs/v1/ttf/p${pageNumber}.ttf`;
      const downloadRes = await FileSystem.downloadAsync(remoteUrl, localUri);
      if (downloadRes.status !== 200) {
        // Fallback to direct remote font loading
        await Font.loadAsync({ [fontName]: { uri: remoteUrl } });
        return true;
      }
    }

    await Font.loadAsync({ [fontName]: localUri });
    return true;
  } catch (error) {
    console.warn(`[QuranMushaf] Failed to load font for page ${pageNumber}:`, error);
    return false;
  }
}

export async function loadPagesFonts(pageNumbers: number[]): Promise<void> {
  const uniquePages = Array.from(new Set(pageNumbers));
  await Promise.all(uniquePages.map((p) => loadPageFont(p)));
}

export async function fetchChapterMushafWords(chapterId: number): Promise<Record<number, Record<number, (MushafWord & { verseKey: string })[]>>> {
  const cacheKey = `@uns_mushaf_ch_${chapterId}_v1`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  try {
    const url = `https://api.quran.com/api/v4/verses/by_chapter/${chapterId}?mushaf=2&words=true&per_page=300&word_fields=code_v1,code_v2,line_number,page_number`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    const verses: MushafVerse[] = data.verses || [];

    const map: Record<number, Record<number, (MushafWord & { verseKey: string })[]>> = {};
    verses.forEach((v) => {
      v.words?.forEach((w) => {
        const p = w.page_number;
        const l = w.line_number;
        if (!map[p]) map[p] = {};
        if (!map[p][l]) map[p][l] = [];
        map[p][l].push({ ...w, verseKey: v.verse_key });
      });
    });

    await AsyncStorage.setItem(cacheKey, JSON.stringify(map)).catch(() => {});
    return map;
  } catch (err) {
    console.warn(`[QuranMushaf] Error fetching chapter ${chapterId}:`, err);
    return {};
  }
}
