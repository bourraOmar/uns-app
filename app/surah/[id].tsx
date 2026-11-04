import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Share,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import surahsData from '@/data/surahs.json';
import quranUthmaniData from '@/data/quran_uthmani.json';
import { QURAN_CHAPTERS, ChapterMeta } from '@/data/quranChapters';
import { toEasternArabicNumerals } from '@/data/quranPages';
import { SurahItem } from '@/context/AudioPlayerContext';
import AyahFrame from '@/components/quran/AyahFrame';
import VerseFloatingMenu from '@/components/quran/VerseFloatingMenu';
import TafsirModal from '@/components/quran/TafsirModal';
import IslamicBackground from '@/components/IslamicBackground';
import { useAppTheme } from '@/context/ThemeContext';

export interface V2Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  line_number: number;
  page_number: number;
  code_v1?: string;
  code_v2?: string;
  text_uthmani?: string;
}

export interface V2Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  code_v1?: string;
  code_v2?: string;
  v2_page?: number;
  words?: V2Word[];
}

interface VerseData {
  id: number;
  verse_number: number;
  text_uthmani: string;
}

const OFFLINE_FATIHA_VERSES: VerseData[] = [
  { id: 1, verse_number: 1, text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
  { id: 2, verse_number: 2, text_uthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ' },
  { id: 3, verse_number: 3, text_uthmani: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
  { id: 4, verse_number: 4, text_uthmani: 'مَـٰلِكِ يَوْمِ ٱلدِّينِ' },
  { id: 5, verse_number: 5, text_uthmani: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
  { id: 6, verse_number: 6, text_uthmani: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
  { id: 7, verse_number: 7, text_uthmani: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' },
];

function toArabicDigits(num: number | string): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (d) => digits[+d]);
}

// Global in-memory cache across surah navigation for instantaneous 0ms transitions
const v2MemoryCache = new Map<number, V2Verse[]>();

export default function SurahReaderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const webViewRef = useRef<WebView>(null);

  const surahId = parseInt(id || '1', 10);
  const currentSurah = (surahsData as SurahItem[]).find((s) => s.id === surahId) || (surahsData[0] as SurahItem);
  const nextSurah = (surahsData as SurahItem[]).find((s) => s.id === surahId + 1);

  // Chapter metadata from Quran Chapters
  const chapterMeta: ChapterMeta = useMemo(() => {
    return (
      QURAN_CHAPTERS.find((ch) => ch.id === surahId) || {
        id: currentSurah.id,
        name_arabic: currentSurah.name_arabic,
        name_simple: currentSurah.name_simple,
        verses_count: currentSurah.verses_count,
        revelation_place: currentSurah.revelation_place,
        bismillah_pre: currentSurah.id !== 1 && currentSurah.id !== 9,
        start_page: currentSurah.start_page || 1,
        end_page: currentSurah.start_page || 1,
      }
    );
  }, [surahId, currentSurah]);

  // Pages range in King Fahad Mushaf
  const pages = useMemo(() => {
    const count = Math.max(1, chapterMeta.end_page - chapterMeta.start_page + 1);
    return Array.from({ length: count }, (_, i) => chapterMeta.start_page + i);
  }, [chapterMeta.start_page, chapterMeta.end_page]);

  // Offline fallback verses helper
  const getOfflineVerses = (chapterId: number): VerseData[] => {
    const rawList = (quranUthmaniData as Record<string, string[]>)[chapterId.toString()];
    if (!rawList || rawList.length === 0) return OFFLINE_FATIHA_VERSES;
    return rawList.map((text, idx) => ({
      id: idx + 1,
      verse_number: idx + 1,
      text_uthmani: text,
    }));
  };

  // State
  const [mushafVersion, setMushafVersion] = useState<'v1' | 'v2'>('v1');
  const [v2Verses, setV2Verses] = useState<V2Verse[] | null>(() => v2MemoryCache.get(surahId) || null);
  const [isLoadingV2, setIsLoadingV2] = useState<boolean>(!v2MemoryCache.has(surahId));
  const [v2Error, setV2Error] = useState<boolean>(false);
  const [useFallbackMode, setUseFallbackMode] = useState<boolean>(false);
  const [isWebViewReady, setIsWebViewReady] = useState<boolean>(false);

  // Load saved mushaf version preference
  useEffect(() => {
    AsyncStorage.getItem('@uns_mushaf_version')
      .then((saved) => {
        if (saved === 'v1' || saved === 'v2') {
          setMushafVersion(saved);
        }
      })
      .catch(() => {});
  }, []);

  const toggleMushafVersion = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = mushafVersion === 'v1' ? 'v2' : 'v1';
    setMushafVersion(next);
    setIsWebViewReady(false);
    try {
      await AsyncStorage.setItem('@uns_mushaf_version', next);
    } catch {}
  };

  // Selected verse state for floating menu
  const [selectedVerse, setSelectedVerse] = useState<VerseData | null>(null);

  // Tafsir modal state
  const [isTafsirVisible, setIsTafsirVisible] = useState<boolean>(false);

  // Bookmarked verses list
  const [bookmarkedVerses, setBookmarkedVerses] = useState<string[]>([]);

  // Single verse audio playback state
  const versePlayerRef = useRef<AudioPlayer | null>(null);
  const [playingVerseNum, setPlayingVerseNum] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (versePlayerRef.current) {
        versePlayerRef.current.remove();
        versePlayerRef.current = null;
      }
    };
  }, []);

  const loadBookmarks = async () => {
    try {
      const saved = await AsyncStorage.getItem('@uns_verse_bookmarks');
      if (saved) setBookmarkedVerses(JSON.parse(saved));
    } catch {}
  };

  // Record reading history & load bookmarks
  useEffect(() => {
    loadBookmarks();
    if (currentSurah) {
      const item = {
        surahId: currentSurah.id,
        surahName: `سورة ${currentSurah.name_arabic}`,
        page: chapterMeta.start_page,
        versesCount: currentSurah.verses_count,
        revelationPlace: currentSurah.revelation_place,
        timeAgo: 'اليوم',
      };
      AsyncStorage.setItem('@uns_last_read', JSON.stringify(item)).catch(() => {});
      AsyncStorage.getItem('@uns_recent_readings')
        .then((saved) => {
          const list = saved ? JSON.parse(saved) : [];
          const filtered = list.filter((r: any) => r.surahId !== currentSurah.id);
          AsyncStorage.setItem(
            '@uns_recent_readings',
            JSON.stringify([{ id: currentSurah.id.toString(), ...item }, ...filtered].slice(0, 10))
          ).catch(() => {});
        })
        .catch(() => {});
    }
  }, [surahId, currentSurah, chapterMeta.start_page]);

  // Fetch or Load King Fahad Complex V2 data (Cached locally)
  useEffect(() => {
    let isCancelled = false;
    setSelectedVerse(null);
    setIsWebViewReady(false);

    // 1. In-memory check (ensure it has code_v1)
    if (v2MemoryCache.has(surahId)) {
      const cachedList = v2MemoryCache.get(surahId)!;
      if (cachedList[0]?.words?.[0]?.code_v1) {
        setV2Verses(cachedList);
        setIsLoadingV2(false);
        setV2Error(false);
        return;
      }
    }

    const cacheKey = `@uns_mushaf_v1_v2_surah_${surahId}`;

    const loadData = async () => {
      setIsLoadingV2(true);
      setV2Error(false);

      // 2. Local AsyncStorage cache check
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && !isCancelled) {
          const parsed = JSON.parse(cached) as V2Verse[];
          if (parsed[0]?.words?.[0]?.code_v1) {
            v2MemoryCache.set(surahId, parsed);
            setV2Verses(parsed);
            setIsLoadingV2(false);
            return;
          }
        }
      } catch {}

      // 3. Network fetch from Quran API (fetching both code_v1 and code_v2)
      try {
        const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?language=ar&words=true&translations=16&per_page=300&fields=text_uthmani,code_v1,code_v2,v2_page&word_fields=code_v1,code_v2,line_number,page_number&mushaf=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API fetch failed');
        const json = await res.json();
        const verses: V2Verse[] = json.verses || [];

        if (!isCancelled && verses.length > 0) {
          v2MemoryCache.set(surahId, verses);
          setV2Verses(verses);
          setIsLoadingV2(false);
          AsyncStorage.setItem(cacheKey, JSON.stringify(verses)).catch(() => {});
        }
      } catch {
        if (!isCancelled) {
          setIsLoadingV2(false);
          setV2Error(true);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [surahId]);

  const handleNextSurah = () => {
    if (nextSurah) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.replace({ pathname: '/surah/[id]', params: { id: nextSurah.id.toString() } });
    }
  };

  const handleToggleBookmark = async (verse: VerseData) => {
    const key = `${surahId}:${verse.verse_number}`;
    const isAlready = bookmarkedVerses.includes(key);
    const updated = isAlready
      ? bookmarkedVerses.filter((k) => k !== key)
      : [...bookmarkedVerses, key];
    setBookmarkedVerses(updated);
    try {
      await AsyncStorage.setItem('@uns_verse_bookmarks', JSON.stringify(updated));
    } catch {}
  };

  const handlePlayVerse = async (verse: VerseData) => {
    if (playingVerseNum === verse.verse_number && versePlayerRef.current) {
      versePlayerRef.current.pause();
      versePlayerRef.current.remove();
      versePlayerRef.current = null;
      setPlayingVerseNum(null);
      return;
    }

    try {
      setIsLoadingAudio(true);
      if (versePlayerRef.current) {
        versePlayerRef.current.remove();
        versePlayerRef.current = null;
      }
      const pad3 = (n: number) => n.toString().padStart(3, '0');
      const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${pad3(surahId)}${pad3(verse.verse_number)}.mp3`;
      const player = createAudioPlayer(audioUrl);
      versePlayerRef.current = player;
      setPlayingVerseNum(verse.verse_number);

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          player.remove();
          if (versePlayerRef.current === player) {
            versePlayerRef.current = null;
          }
          setPlayingVerseNum(null);
        }
      });

      player.play();
    } catch {
      // Keep silent
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleShareVerse = async (verse: VerseData) => {
    try {
      await Share.share({
        message: `${verse.text_uthmani}\n\n[سورة ${currentSurah.name_arabic}: الآية ${toEasternArabicNumerals(verse.verse_number)}]`,
      });
    } catch {}
  };

  const { isDark } = useAppTheme();

  const colors = {
    headerCardBg: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.94)',
    headerCardBorder: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.95)',
    backBtnBg: isDark ? '#0f172a' : 'rgba(241, 245, 249, 0.95)',
    backBtnBorder: isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 0.9)',
    backBtnIcon: isDark ? '#f8fafc' : '#0f172a',
    headerTitle: isDark ? '#f8fafc' : '#0f172a',
    headerMetaText: isDark ? '#94a3b8' : '#64748b',
    revelationBadgeBg: isDark ? 'rgba(15, 142, 93, 0.15)' : 'rgba(16, 185, 129, 0.12)',
    revelationBadgeText: isDark ? '#4ade80' : '#047857',
    mushafBadgeBg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
    mushafBadgeBorder: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)',
    mushafBadgeText: isDark ? '#34d399' : '#059669',
  };

  // Build the King Fahad Complex V2 Mushaf HTML content
  const mushafHtml = useMemo(() => {
    if (!v2Verses || v2Verses.length === 0) return '';

    // Collect all unique pages for @font-face
    const allPagesSet = new Set<number>([1, ...pages]);
    v2Verses.forEach((v) => {
      if (v.v2_page) allPagesSet.add(v.v2_page);
      v.words?.forEach((w) => {
        if (w.page_number) allPagesSet.add(w.page_number);
      });
    });
    const allRequiredPages = Array.from(allPagesSet).sort((a, b) => a - b);

    // Group words by page and line
    const pagesData: Record<number, Record<number, (V2Word & { verseKey: string; verseNumber: number })[]>> = {};
    v2Verses.forEach((v) => {
      const vKey = v.verse_key || `${surahId}:${v.verse_number}`;
      v.words?.forEach((w) => {
        const p = w.page_number;
        const l = w.line_number;
        if (!pagesData[p]) pagesData[p] = {};
        if (!pagesData[p][l]) pagesData[p][l] = [];
        pagesData[p][l].push({
          ...w,
          verseKey: vKey,
          verseNumber: v.verse_number,
        });
      });
    });

    const pageBg = isDark ? '#151d2c' : '#ffffff';
    const pageBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.95)';
    const pageShadow = isDark
      ? '0 12px 36px rgba(0, 0, 0, 0.5)'
      : '0 8px 30px rgba(0, 0, 0, 0.04)';
    const wordColor = isDark ? '#f8fafc' : '#1e293b';
    const activeColor = isDark ? '#34d399' : '#0f8e5d';
    const activeGlow = isDark ? 'rgba(52, 211, 153, 0.7)' : 'rgba(15, 142, 93, 0.45)';
    const footerNumColor = isDark ? '#94a3b8' : '#64748b';
    const bismillahColor = isDark ? '#f8fafc' : '#1e354d';

    const fontPath = mushafVersion === 'v1' ? 'v1' : 'v2';
    const fontFaces = allRequiredPages
      .map(
        (p) => `
        @font-face {
          font-family: 'p${p}';
          src: url('https://verses.quran.foundation/fonts/quran/hafs/${fontPath}/woff2/p${p}.woff2') format('woff2');
          font-display: swap;
        }`
      )
      .join('\n');

    const bismillahGlyphs = mushafVersion === 'v1'
      ? ['ﭑ', 'ﭒ', 'ﭓ', 'ﭔ']
      : ['ﱁ', 'ﱂ', 'ﱃ', 'ﱄ'];

    // Pages markup
    const pagesMarkup = pages
      .map((p) => {
        const linesMap = pagesData[p] || {};
        const lineNumbers = Object.keys(linesMap)
          .map(Number)
          .sort((a, b) => a - b);

        if (lineNumbers.length === 0) return '';

        const showBismillah = p === chapterMeta.start_page && currentSurah.id !== 1 && currentSurah.id !== 9;

        const linesHtml = lineNumbers
          .map((lNum) => {
            const lineWords = linesMap[lNum] || [];
            const isCentered = lineWords.length <= 4;

            const wordsHtml = lineWords
              .map((w) => {
                const glyph =
                  (mushafVersion === 'v1' ? (w.code_v1 || w.code_v2) : (w.code_v2 || w.code_v1)) ||
                  w.text_uthmani ||
                  '';
                return `
                  <span
                    class="mushaf-word"
                    data-verse="${w.verseKey}"
                    data-versenum="${w.verseNumber}"
                    style="font-family: 'p${w.page_number}';"
                    onclick="selectVerse(${w.verseNumber}, '${w.verseKey}')"
                  >${glyph}</span>
                `;
              })
              .join('');

            return `
              <div class="mushaf-line ${isCentered ? 'centered' : ''}">
                ${wordsHtml}
              </div>
            `;
          })
          .join('');

        return `
          <div class="mushaf-page-card" id="page-${p}">
            ${
              showBismillah
                ? `
              <div class="bismillah-header" dir="rtl">
                ${bismillahGlyphs.map((g) => `<span class="bismillah-glyph">${g}</span>`).join('')}
              </div>
            `
                : ''
            }
            <div class="mushaf-lines-container">
              ${linesHtml}
            </div>
            <div class="page-number-footer">
              ${toArabicDigits(p)}
            </div>
          </div>
        `;
      })
      .join('');

    const completionHtml = `
      <div class="completion-card">
        <div class="completion-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div class="completion-title">تمت بحمد الله قراءة سورة ${currentSurah.name_arabic}</div>
        <div class="completion-meta">
          عدد الآيات: ${toArabicDigits(currentSurah.verses_count)} • عدد الصفحات: ${toArabicDigits(pages.length)}
        </div>
        ${
          nextSurah
            ? `
          <button class="next-surah-btn" onclick="onNextSurahClick()">
            <span>السورة التالية: سورة ${nextSurah.name_arabic}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(180deg);">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        `
            : `
          <button class="next-surah-btn" onclick="onKhatmClick()">
            <span>دعاء ختم القرآن الكريم</span>
          </button>
        `
        }
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          ${fontFaces}
          * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
          }
          html, body {
            margin: 0;
            padding: 0;
            background-color: transparent !important;
            direction: rtl;
            font-family: system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
          body {
            padding: 10px 12px 140px 12px;
          }
          .mushaf-page-card {
            max-width: 580px;
            width: 100%;
            margin: 0 auto 18px auto;
            padding: 20px 12px 14px 12px;
            border-radius: 24px;
            background: ${pageBg};
            border: 1px solid ${pageBorder};
            box-shadow: ${pageShadow};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
          }
          .bismillah-header {
            width: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding-top: 4px;
            padding-bottom: 12px;
            user-select: none;
            -webkit-user-select: none;
          }
          .bismillah-glyph {
            font-family: 'p1';
            font-size: clamp(20px, 5.2vw, 28px);
            line-height: 2;
            color: ${bismillahColor};
            display: inline-block;
          }
          .mushaf-lines-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            padding: 4px 0;
          }
          .mushaf-line {
            width: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: center;
            gap: 3.5px;
            padding: 1.5px 0;
            user-select: none;
            -webkit-user-select: none;
          }
          .mushaf-line.centered {
            justify-content: center;
            gap: 6px;
          }
          .mushaf-word {
            font-size: clamp(16px, 4.4vw, 22px);
            line-height: 2.05;
            display: inline-block;
            cursor: pointer;
            transition: color 0.15s ease, text-shadow 0.15s ease;
            color: ${wordColor};
          }
          .mushaf-word.active {
            color: ${activeColor} !important;
            text-shadow: 0 0 12px ${activeGlow};
            font-weight: 700;
          }
          .page-number-footer {
            width: 100%;
            text-align: center;
            padding-top: 14px;
            padding-bottom: 4px;
            font-size: 14px;
            font-weight: 600;
            color: ${footerNumColor};
            user-select: none;
            -webkit-user-select: none;
          }
          .completion-card {
            max-width: 580px;
            width: 100%;
            margin: 8px auto 20px auto;
            padding: 24px 18px;
            border-radius: 24px;
            background: ${pageBg};
            border: 1px solid ${pageBorder};
            box-shadow: ${pageShadow};
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
          }
          .completion-icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: ${isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)'};
            border: 1px solid ${isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)'};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${isDark ? '#34d399' : '#059669'};
          }
          .completion-title {
            font-size: 17px;
            font-weight: 800;
            color: ${isDark ? '#f8fafc' : '#1e354d'};
          }
          .completion-meta {
            font-size: 13px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            font-weight: 500;
          }
          .next-surah-btn {
            margin-top: 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 22px;
            border-radius: 18px;
            background: #0f8e5d;
            color: #ffffff;
            font-weight: 700;
            font-size: 14px;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(15, 142, 93, 0.35);
            outline: none;
          }
          .next-surah-btn:active {
            transform: scale(0.97);
            background: #0c734b;
          }
          @media (max-width: 375px) {
            .mushaf-word {
              font-size: 15px !important;
            }
            .mushaf-line {
              gap: 2px !important;
            }
          }
        </style>
      </head>
      <body>
        ${pagesMarkup}
        ${completionHtml}

        <script>
          var activeVerseKey = null;

          function post(obj) {
            var str = JSON.stringify(obj);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(str);
            }
            if (window.parent && window.parent.postMessage) {
              window.parent.postMessage(str, '*');
            }
          }

          function selectVerse(verseNum, verseKey) {
            if (activeVerseKey === verseKey) {
              activeVerseKey = null;
              document.querySelectorAll('.mushaf-word').forEach(function(el) { el.classList.remove('active'); });
              post({ type: 'DESELECT' });
              return;
            }
            activeVerseKey = verseKey;
            document.querySelectorAll('.mushaf-word').forEach(function(el) { el.classList.remove('active'); });
            var words = document.querySelectorAll('[data-verse="' + verseKey + '"]');
            words.forEach(function(el) { el.classList.add('active'); });
            post({ type: 'VERSE_SELECTED', verseNumber: verseNum, verseKey: verseKey });
          }

          document.addEventListener('click', function(e) {
            if (!e.target.closest('.mushaf-word') && !e.target.closest('.next-surah-btn')) {
              if (activeVerseKey) {
                activeVerseKey = null;
                document.querySelectorAll('.mushaf-word').forEach(function(el) { el.classList.remove('active'); });
                post({ type: 'DESELECT' });
              }
            }
          });

          function onNextSurahClick() {
            post({ type: 'NEXT_SURAH' });
          }

          function onKhatmClick() {
            post({ type: 'KHATM_DUA' });
          }
        </script>
      </body>
      </html>
    `;
  }, [v2Verses, isDark, pages, chapterMeta.start_page, currentSurah, nextSurah, surahId, mushafVersion]);

  // Unified message handler for both Web iframe and Native WebView
  const handleIncomingMessage = (data: any) => {
    if (!data || !data.type) return;
    if (data.type === 'VERSE_SELECTED') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const vNum = data.verseNumber;
      const matching = v2Verses?.find((item) => item.verse_number === vNum);
      if (matching) {
        setSelectedVerse({
          id: matching.id,
          verse_number: matching.verse_number,
          text_uthmani: matching.text_uthmani,
        });
      }
    } else if (data.type === 'DESELECT') {
      setSelectedVerse(null);
    } else if (data.type === 'NEXT_SURAH') {
      handleNextSurah();
    } else if (data.type === 'KHATM_DUA') {
      router.push('/dua-khatm');
    }
  };

  // Web message listener for iframe postMessage
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onWebMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        handleIncomingMessage(data);
      } catch {}
    };
    window.addEventListener('message', onWebMessage);
    return () => window.removeEventListener('message', onWebMessage);
  }, [v2Verses]);

  // Handle messages from Native WebView
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      handleIncomingMessage(data);
    } catch {}
  };

  const isSelectedBookmark = selectedVerse
    ? bookmarkedVerses.includes(`${surahId}:${selectedVerse.verse_number}`)
    : false;

  return (
    <View style={styles.safeArea}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          translucent
          backgroundColor="transparent"
        />

        {/* HEADER BLOCK (Matching App & Website Header Block) */}
        <View
          style={[
            styles.headerCard,
            { backgroundColor: colors.headerCardBg, borderColor: colors.headerCardBorder },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.backBtnBg, borderColor: colors.backBtnBorder },
            ]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/quran' as any))}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={22} color={colors.backBtnIcon} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, { color: colors.headerTitle }]}>
                سورة {currentSurah.name_arabic}
              </Text>
              <TouchableOpacity
                style={[
                  styles.mushafBadge,
                  { backgroundColor: colors.mushafBadgeBg, borderColor: colors.mushafBadgeBorder },
                ]}
                onPress={toggleMushafVersion}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={12}
                  color={colors.mushafBadgeText}
                  style={{ marginRight: 3 }}
                />
                <Text style={[styles.mushafBadgeText, { color: colors.mushafBadgeText }]}>
                  {mushafVersion === 'v1' ? 'مجمع الملك فهد V1' : 'مجمع الملك فهد V2'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.headerMetaRow}>
              <View
                style={[
                  styles.revelationBadge,
                  { backgroundColor: colors.revelationBadgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.revelationBadgeText,
                    { color: colors.revelationBadgeText },
                  ]}
                >
                  {currentSurah.revelation_place === 'makkah' ? 'مكية' : 'مدنية'}
                </Text>
              </View>
              <Text style={[styles.headerMetaText, { color: colors.headerMetaText }]}>
                رقم {currentSurah.id} • {currentSurah.verses_count} آية •{' '}
                {chapterMeta.start_page === chapterMeta.end_page
                  ? `صفحة ${toArabicDigits(chapterMeta.start_page)}`
                  : `صفحة ${toArabicDigits(chapterMeta.start_page)} إلى ${toArabicDigits(chapterMeta.end_page)}`}
              </Text>
            </View>
          </View>
        </View>

        {/* KING FAHAD COMPLEX V2 MUSHAF READER */}
        {isLoadingV2 && !v2Verses ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0f8e5d" />
            <Text style={[styles.loadingText, { color: colors.headerTitle }]}>
              جاري تجهيز مصحف مجمع الملك فهد...
            </Text>
            <Text style={[styles.loadingSubtext, { color: colors.headerMetaText }]}>
              سورة {currentSurah.name_arabic} • بالخط والتقسيم المعتمد
            </Text>
          </View>
        ) : v2Error && !v2Verses ? (
          /* Offline Fallback when network is down and surah not cached yet */
          <View style={styles.fallbackContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#0f8e5d" />
            <Text style={[styles.fallbackTitle, { color: colors.headerTitle }]}>
              تعذر تحميل خطوط مجمع الملك فهد
            </Text>
            <Text style={[styles.fallbackSubtitle, { color: colors.headerMetaText }]}>
              يتطلب التحميل الأولي اتصالاً بالإنترنت لحفظ المصحف للعمل دون إنترنت
            </Text>
            <View style={styles.fallbackButtonsRow}>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setV2Error(false);
                  setIsLoadingV2(true);
                  // Trigger reload
                  AsyncStorage.getItem(`@uns_v2_surah_${surahId}`);
                }}
              >
                <Ionicons name="refresh" size={18} color="#ffffff" />
                <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.plainTextBtn,
                  { borderColor: colors.headerCardBorder, backgroundColor: colors.headerCardBg },
                ]}
                onPress={() => setUseFallbackMode(true)}
              >
                <Text style={[styles.plainTextBtnText, { color: colors.headerTitle }]}>
                  القراءة بالنص العادي
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : useFallbackMode ? (
          /* Plain Text ScrollView Fallback */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.plainScrollContent}
          >
            <View
              style={[
                styles.plainCard,
                { backgroundColor: colors.headerCardBg, borderColor: colors.headerCardBorder },
              ]}
            >
              {getOfflineVerses(surahId).map((v) => (
                <Text
                  key={v.id}
                  style={[styles.plainVerseText, { color: colors.headerTitle }]}
                  onPress={() => setSelectedVerse(v)}
                >
                  {v.text_uthmani} <AyahFrame number={v.verse_number} />{' '}
                </Text>
              ))}
            </View>
          </ScrollView>
        ) : Platform.OS === 'web' ? (
          /* Web Browser Support (iframe instead of native WebView) */
          <View style={styles.webViewWrapper}>
            {/* @ts-ignore */}
            <iframe
              srcDoc={mushafHtml}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: 'transparent',
              }}
              onLoad={() => setIsWebViewReady(true)}
            />
          </View>
        ) : (
          /* Official King Fahad Complex Mushaf (WebView Native Accelerated) */
          <View style={styles.webViewWrapper}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: mushafHtml }}
              style={[
                styles.webView,
                { opacity: isWebViewReady ? 1 : 0 },
              ]}
              containerStyle={{ backgroundColor: 'transparent' }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              textZoom={100}
              overScrollMode="never"
              onMessage={handleWebViewMessage}
              onLoadEnd={() => setIsWebViewReady(true)}
            />
            {!isWebViewReady && (
              <View style={styles.webViewLoader}>
                <ActivityIndicator size="small" color="#0f8e5d" />
              </View>
            )}
          </View>
        )}

        {/* Floating Verse Action Menu (Bookmark, Audio Play, Tafsir, Share) */}
        <VerseFloatingMenu
          visible={!!selectedVerse}
          onTafsir={() => setIsTafsirVisible(true)}
          onBookmark={() => selectedVerse && handleToggleBookmark(selectedVerse)}
          onPlay={() => selectedVerse && handlePlayVerse(selectedVerse)}
          onShare={() => selectedVerse && handleShareVerse(selectedVerse)}
          isBookmarked={isSelectedBookmark}
          isPlaying={playingVerseNum === selectedVerse?.verse_number}
          isLoadingAudio={isLoadingAudio}
        />

        {/* Tafsir Modal */}
        {selectedVerse && (
          <TafsirModal
            visible={isTafsirVisible}
            onClose={() => setIsTafsirVisible(false)}
            surahName={currentSurah.name_arabic}
            surahId={surahId}
            verseNumber={selectedVerse.verse_number}
            verseText={selectedVerse.text_uthmani}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 20,
  },
  mushafBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  mushafBadgeText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 10,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  revelationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  revelationBadgeText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 11,
  },
  headerMetaText: {
    fontFamily: 'Cairo-Medium',
    fontSize: 11,
  },
  webViewWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webViewLoader: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 12,
  },
  fallbackTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  fallbackButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f8e5d',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  retryBtnText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 13,
    color: '#ffffff',
  },
  plainTextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  plainTextBtnText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 13,
  },
  plainScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 140,
  },
  plainCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 10,
  },
  plainVerseText: {
    fontFamily: 'Amiri-Bold',
    fontSize: 21,
    lineHeight: 42,
    textAlign: 'justify',
  },
});
