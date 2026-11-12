import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  BackHandler,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPageMetadata } from '@/services/mushafPageService';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import surahsData from '@/data/surahs.json';
import { SURAH_FRAME_BASE64 } from '@/constants/surahFrameBase64';

interface MushafV2ReaderProps {
  initialPage: number;
  isDark: boolean;
  onBack: () => void;
}

export default function MushafV2Reader({
  initialPage,
  isDark,
  onBack,
}: MushafV2ReaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const audioPlayer = useAudioPlayer();
  const webViewRef = useRef<WebView>(null);

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState<boolean>(false);

  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const audioPlayerRef = useRef(audioPlayer);
  audioPlayerRef.current = audioPlayer;

  // Sync Audio Playing state to WebView HTML
  useEffect(() => {
    const isPlaying = audioPlayer.isPlaying;
    const js = `
      if (window.setAudioPlaying) {
        window.setAudioPlaying(${isPlaying});
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(js);
  }, [audioPlayer.isPlaying]);

  // Handle hardware Android back button
  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  // Handle messages on Web / Desktop platform via window message listener
  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android' && typeof window !== 'undefined') {
      const handleWebMessage = (e: MessageEvent) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (data && data.type === 'pageChange') {
            const pageNum = Number(data.page);
            if (pageNum >= 1 && pageNum <= 604) {
              setCurrentPage(pageNum);
              const meta = getPageMetadata(pageNum);
              const item = {
                surahId: meta.surahId,
                surahName: `سورة ${meta.surahName}`,
                page: pageNum,
                versesCount: 0,
                revelationPlace: 'makkah',
                timeAgo: 'الآن',
              };
              AsyncStorage.setItem('@uns_last_read', JSON.stringify(item)).catch(() => {});
            }
          } else if (data && data.type === 'controlAction') {
            if (data.action === 'close') {
              onBack();
            } else if (data.action === 'search') {
              router.push('/(tabs)/quran');
            } else if (data.action === 'play') {
              const meta = getPageMetadata(currentPageRef.current);
              if (audioPlayerRef.current.isPlaying) {
                audioPlayerRef.current.togglePlay();
              } else {
                audioPlayerRef.current.playSurah(meta.surahId);
              }
            } else if (data.action === 'settings') {
              setIsSettingsModalVisible(true);
            }
          }
        } catch {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [onBack, router]);

  // Handle messages from WebView on Mobile (iOS / Android)
  const handleMessage = useCallback(
    async (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'pageChange') {
          const pageNum = Number(data.page);
          if (pageNum >= 1 && pageNum <= 604) {
            setCurrentPage(pageNum);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const meta = getPageMetadata(pageNum);
            const item = {
              surahId: meta.surahId,
              surahName: `سورة ${meta.surahName}`,
              page: pageNum,
              versesCount: 0,
              revelationPlace: 'makkah',
              timeAgo: 'الآن',
            };
            await AsyncStorage.setItem('@uns_last_read', JSON.stringify(item));
          }
        } else if (data.type === 'controlAction') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (data.action === 'close') {
            onBack();
          } else if (data.action === 'search') {
            router.push('/(tabs)/quran');
          } else if (data.action === 'play') {
            const meta = getPageMetadata(currentPageRef.current);
            if (audioPlayerRef.current.isPlaying) {
              await audioPlayerRef.current.togglePlay();
            } else {
              await audioPlayerRef.current.playSurah(meta.surahId);
            }
          } else if (data.action === 'settings') {
            setIsSettingsModalVisible(true);
          }
        }
      } catch {}
    },
    [onBack, router]
  );

  const pageMetaJson = useMemo(() => {
    const map: Record<number, { s: string; j: number; h: number }> = {};
    for (let p = 1; p <= 604; p++) {
      const m = getPageMetadata(p);
      map[p] = {
        s: m.surahName,
        j: m.juz,
        h: m.hizb,
      };
    }
    return JSON.stringify(map);
  }, []);

  const surahNamesJson = useMemo(() => {
    const map: Record<number, string> = {};
    (surahsData as any[]).forEach((s) => {
      map[s.id] = s.name_arabic;
    });
    return JSON.stringify(map);
  }, []);

  const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>King Fahd Complex V2</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;700&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: ${isDark ? '#222825' : '#fcfbfa'};
    color: ${isDark ? '#ffffff' : '#1e293b'};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    -webkit-user-select: none;
  }

  #mushaf-viewport {
    width: 100vw;
    height: 100vh;
    display: flex;
    position: relative;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .mushaf-page {
    width: 100vw;
    height: 100vh;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding-top: ${Math.max(insets.top, 8)}px;
    padding-bottom: ${Math.max(insets.bottom, 8)}px;
    padding-left: 10px;
    padding-right: 10px;
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform: translate3d(0, 0, 0);
    touch-action: none;
  }

  .page-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Cairo', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: ${isDark ? '#e2e8f0' : '#475569'};
    padding: 0 12px;
  }

  .content-container {
    width: 100%;
    max-width: 540px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: auto 0;
  }

  /* Balanced vertical placement for Opening Pages (Pages 1 & 2) exactly matching Image 1 layout */
  .content-container.opening-container {
    justify-content: center;
    margin: auto 0;
  }

  .surah-banner-wrap {
    position: relative;
    width: 88%;
    max-width: 340px;
    height: clamp(38px, 6vh, 46px);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 4px auto 2px auto;
    background: ${isDark ? 'rgba(38, 64, 48, 0.45)' : 'rgba(16, 185, 129, 0.08)'};
    border-radius: 8px;
  }

  .surah-banner-wrap.opening-banner {
    width: 88%;
    max-width: 360px;
    height: 60px;
    margin: 0 auto;
  }

  /* On Page 1 (Al-Fatihah), graceful space between Surah Banner and Line 1 */
  .surah-banner-wrap.page-1-banner {
    margin-bottom: clamp(18px, 3vh, 26px);
  }

  /* On Page 2 (Al-Baqarah), tight margin before Basmalah row */
  .surah-banner-wrap.page-2-banner {
    margin-bottom: 6px;
  }

  .surah-frame-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    ${isDark ? 'filter: drop-shadow(0 2px 6px rgba(0,0,0,0.45)) sepia(1) hue-rotate(85deg) saturate(2.8) brightness(0.95);' : 'filter: invert(1) brightness(0.25) sepia(1) hue-rotate(110deg) saturate(3);'}
  }

  .surah-title-text {
    position: relative;
    z-index: 2;
    color: ${isDark ? '#ffffff' : '#065f46'};
    font-family: 'Cairo', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-shadow: ${isDark ? '0 1px 4px rgba(0,0,0,0.8)' : 'none'};
    padding: 0 35px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .basmalah-row {
    font-size: clamp(19px, 5vw, 23px);
    color: ${isDark ? '#ffffff' : '#1e293b'};
    margin: 2px auto 6px auto;
    text-align: center;
    font-family: 'p1' !important;
    line-height: 1.5;
  }

  .mushaf-lines {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* Elegantly proportioned line gap for Opening Pages (Pages 1 & 2) matching authentic Mushaf layout */
  .mushaf-lines.opening-lines {
    gap: clamp(7px, 1.4vh, 11px);
  }

  /* Compact line gap for Standard 15-line Pages (Pages 3 to 604) */
  .mushaf-lines.standard-lines {
    gap: clamp(6px, 1.3vh, 10px);
  }

  .mushaf-line {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    white-space: nowrap;
    align-items: center;
    justify-content: center;
  }

  .mushaf-line.opening-line {
    gap: 4px;
    line-height: 1.85;
  }

  .mushaf-line.standard-line {
    gap: 4px;
    line-height: 1.85;
  }

  /* Verses on Opening Pages (1 & 2): Authentic proportion matching standard pages */
  .opening-word-glyph {
    font-size: clamp(21px, 5.2vw, 24px);
    color: ${isDark ? '#ffffff' : '#1e293b'};
    display: inline-block;
  }

  /* Verses on Standard 15-line Pages (3 to 604) */
  .standard-word-glyph {
    font-size: clamp(21px, 5.2vw, 24px);
    color: ${isDark ? '#ffffff' : '#1e293b'};
    display: inline-block;
  }

  .page-footer {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .page-badge {
    padding: 4px 20px;
    border-radius: 20px;
    background: ${isDark ? 'rgba(42, 60, 50, 0.7)' : 'rgba(15, 142, 93, 0.1)'};
    border: 1px solid ${isDark ? 'rgba(84, 120, 98, 0.6)' : 'rgba(15, 142, 93, 0.25)'};
    font-family: 'Cairo', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: ${isDark ? '#f1f5f9' : '#0f8e5d'};
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(16, 185, 129, 0.2);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: auto;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Interactive Floating Controls Overlay (Toggleable on screen tap) */
  .floating-controls-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    transition: opacity 0.25s cubic-bezier(0.2, 0, 0, 1), transform 0.25s cubic-bezier(0.2, 0, 0, 1), visibility 0.25s;
    opacity: 1;
    visibility: visible;
    transform: scale(1);
  }

  .floating-controls-overlay.hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none !important;
    transform: scale(0.96);
  }

  .floating-controls-overlay.hidden .floating-ctrl-btn {
    pointer-events: none !important;
  }

  .floating-ctrl-btn {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: ${isDark ? 'rgba(38, 48, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)'};
    border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)'};
    color: ${isDark ? '#ffffff' : '#1e293b'};
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.15s ease, background 0.15s ease;
    outline: none;
    padding: 0;
  }

  .floating-ctrl-btn:active {
    transform: scale(0.92);
    background: ${isDark ? 'rgba(48, 62, 54, 0.95)' : 'rgba(240, 240, 240, 0.98)'};
  }

  .btn-top-left {
    position: fixed;
    top: ${Math.max(insets.top, 16) + 12}px;
    left: 20px;
    width: 44px;
    height: 44px;
  }

  .btn-bottom-left {
    position: fixed;
    bottom: ${Math.max(insets.bottom, 16) + 16}px;
    left: 20px;
    width: 48px;
    height: 48px;
  }

  .group-bottom-right {
    position: fixed;
    bottom: ${Math.max(insets.bottom, 16) + 16}px;
    right: 20px;
    display: flex;
    flex-direction: row;
    gap: 12px;
    align-items: center;
  }

  .group-bottom-right .floating-ctrl-btn {
    width: 48px;
    height: 48px;
  }
</style>
</head>
<body>
  <div id="mushaf-viewport">
    <div id="slot-0" class="mushaf-page" style="transform: translate3d(100vw, 0, 0);"></div>
    <div id="slot-1" class="mushaf-page" style="transform: translate3d(0, 0, 0);"></div>
    <div id="slot-2" class="mushaf-page" style="transform: translate3d(-100vw, 0, 0);"></div>
  </div>

  <!-- Floating Controls Overlay (Hidden by default, shows on tap and hides on tap) -->
  <div id="controls-overlay" class="floating-controls-overlay hidden">
    <!-- Top-Left Close Button -->
    <button class="floating-ctrl-btn btn-top-left" onclick="onCloseClick(event)" aria-label="Close">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <!-- Bottom-Left Search Button -->
    <button class="floating-ctrl-btn btn-bottom-left" onclick="onSearchClick(event)" aria-label="Search">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </button>

    <!-- Bottom-Right Group: Play + AA -->
    <div class="group-bottom-right">
      <button class="floating-ctrl-btn" onclick="onPlayClick(event)" aria-label="Play Audio">
        <svg id="play-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 2px;">
          <polygon points="6 4 20 12 6 20 6 4"></polygon>
        </svg>
      </button>

      <button class="floating-ctrl-btn" onclick="onSettingsClick(event)" aria-label="Font Settings">
        <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">AA</span>
      </button>
    </div>
  </div>

  <script>
    const TOTAL_PAGES = 604;
    let currentPage = ${initialPage};
    const loadedFonts = new Set();
    const pageDataCache = {};
    const PAGE_METAS = ${pageMetaJson};
    const SURAH_NAMES = ${surahNamesJson};
    const SURAH_FRAME_SRC = "${SURAH_FRAME_BASE64}";

    // Arabic Numerals Helper
    const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    function toArabic(num) {
      return String(num).replace(/[0-9]/g, d => arabicDigits[+d]);
    }

    // Pre-bundled King Fahd Complex V2 Glyphs for Page 1 & Page 2 (Exact official 15-line layout)
    pageDataCache[1] = {
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

    pageDataCache[2] = {
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

    // Pre-bundled King Fahd Complex V2 Glyphs for Page 525 (Corrected authentic 15-line layout)
    pageDataCache[525] = {
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

    // Dynamically load King Fahd Complex WOFF2 font for any page
    function loadPageFont(p) {
      if (p < 1 || p > TOTAL_PAGES || loadedFonts.has(p)) return Promise.resolve();
      loadedFonts.add(p);
      const font = new FontFace('p' + p, 'url(https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p' + p + '.woff2)', { display: 'block' });
      return font.load().then(f => {
        document.fonts.add(f);
      }).catch(err => console.warn('Font load p' + p, err));
    }

    loadPageFont(1);

    // Fetch Page Data from Quran Foundation API V4 with Local Storage Cache
    async function getPageData(p) {
      if (p === 1 || p === 2 || p === 525) {
        return pageDataCache[p];
      }
      if (pageDataCache[p]) return pageDataCache[p];
      const cacheKey = 'qpc_v6_p' + p;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          pageDataCache[p] = parsed;
          return parsed;
        } catch {}
      }

      try {
        const res = await fetch('https://api.quran.com/api/v4/verses/by_page/' + p + '?words=true&word_fields=code_v2,text_uthmani,line_number,page_number&mushaf=1');
        const json = await res.json();
        const verses = json.verses || [];
        
        // Identify which surahs start on this page and at which line
        const surahStarts = {};
        verses.forEach(v => {
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
        });

        const lineWords = {};
        verses.forEach(v => {
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

        // If line 1 is missing and no Surah starts at lines 1, 2, or 3, fetch boundary verses from previous page
        const hasTopSurah = surahStarts[1] || surahStarts[2] || surahStarts[3];
        if (p > 1 && !lineWords[1] && !hasTopSurah) {
          try {
            const prevRes = await fetch('https://api.quran.com/api/v4/verses/by_page/' + (p - 1) + '?words=true&word_fields=code_v2,text_uthmani,line_number,page_number&mushaf=1');
            const prevJson = await prevRes.json();
            (prevJson.verses || []).forEach(v => {
              (v.words || []).forEach(w => {
                if (w.page_number === p) {
                  const l = w.line_number;
                  if (!lineWords[l]) lineWords[l] = [];
                  if (w.code_v2 && !lineWords[l].some(item => item.id === w.id)) {
                    lineWords[l].push({ id: w.id, code: w.code_v2 });
                  }
                }
              });
            });
          } catch {}
        }

        const lines = {};
        Object.keys(lineWords).forEach(l => {
          lineWords[l].sort((a, b) => a.id - b.id);
          lines[l] = lineWords[l].map(x => x.code);
        });

        const data = {
          page: p,
          isOpening: p === 1 || p === 2,
          lines: lines,
          surahStarts: surahStarts
        };

        pageDataCache[p] = data;
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        return data;
      } catch (e) {
        return null;
      }
    }

    function renderPageHTML(p, data) {
      if (!data) {
        return '<div class="spinner"></div>';
      }

      loadPageFont(p);
      const meta = PAGE_METAS[p] || { s: '', j: 1, h: 1 };
      const isOpening = p === 1 || p === 2;
      const glyphClass = isOpening ? 'opening-word-glyph' : 'standard-word-glyph';
      let bannerWrapClass = 'surah-banner-wrap';
      if (p === 1) bannerWrapClass = 'surah-banner-wrap opening-banner page-1-banner';
      else if (p === 2) bannerWrapClass = 'surah-banner-wrap opening-banner page-2-banner';
      else if (isOpening) bannerWrapClass = 'surah-banner-wrap opening-banner';

      const linesContainerClass = isOpening ? 'mushaf-lines opening-lines' : 'mushaf-lines standard-lines';
      const lineClass = isOpening ? 'mushaf-line opening-line' : 'mushaf-line standard-line';

      let contentHTML = '';
      contentHTML += '<div class="' + linesContainerClass + '" style="font-family: \\'p' + p + '\\';">';

      const lineKeys = Object.keys(data.lines).sort((a,b) => +a - +b);
      lineKeys.forEach(lNum => {
        const lineNum = Number(lNum);

        // If a Surah starts at this line, render its ornamental frame and Basmalah immediately before it!
        if (data.surahStarts && data.surahStarts[lineNum]) {
          const sInfo = data.surahStarts[lineNum];
          contentHTML += '<div class="' + bannerWrapClass + '"><img class="surah-frame-img" src="' + SURAH_FRAME_SRC + '" alt="frame" /><span class="surah-title-text">سورة ' + sInfo.name + '</span></div>';
          if (sInfo.hasBasmalah) {
            contentHTML += '<div class="basmalah-row"><span class="word-glyph" style="font-family: \\'p1\\' !important;">ﱁ ﱂ ﱃ ﱄ</span></div>';
          }
        }

        const words = data.lines[lNum] || [];
        contentHTML += '<div class="' + lineClass + '">';
        words.forEach(w => {
          contentHTML += '<span class="' + glyphClass + '">' + w + '</span>';
        });
        contentHTML += '</div>';
      });
      contentHTML += '</div>';

      return \`
        <div class="page-header">
          <span>سورة \${meta.s || ''}</span>
          <span>الجزء \${toArabic(meta.j || 1)} &nbsp; حزب \${toArabic(meta.h || 1)}</span>
        </div>
        <div class="content-container \${isOpening ? 'opening-container' : 'standard-container'}">
          \${contentHTML}
        </div>
        <div class="page-footer">
          <div class="page-badge">\${toArabic(p)}</div>
        </div>
      \`;
    }

    function notifyPageChange(p) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pageChange', page: p }));
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(JSON.stringify({ type: 'pageChange', page: p }), '*');
      }
    }

    let controlsVisible = false;

    function toggleControls() {
      controlsVisible = !controlsVisible;
      const overlay = document.getElementById('controls-overlay');
      if (overlay) {
        if (controlsVisible) {
          overlay.classList.remove('hidden');
        } else {
          overlay.classList.add('hidden');
        }
      }
    }

    function onCloseClick(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      notifyAction('close');
    }

    function onSearchClick(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      notifyAction('search');
    }

    function onPlayClick(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      notifyAction('play');
    }

    function onSettingsClick(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      notifyAction('settings');
    }

    function notifyAction(action) {
      const msg = JSON.stringify({ type: 'controlAction', action: action });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, '*');
      } else {
        window.postMessage(msg, '*');
      }
    }

    window.setAudioPlaying = function(isPlaying) {
      const icon = document.getElementById('play-icon');
      if (icon) {
        if (isPlaying) {
          icon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
          icon.style.marginLeft = '0px';
        } else {
          icon.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"></polygon>';
          icon.style.marginLeft = '2px';
        }
      }
    };

    // 3-Slot Virtual Sliding Engine (Perpetual Carousel with 0ms Flash)
    const slots = [
      document.getElementById('slot-0'),
      document.getElementById('slot-1'),
      document.getElementById('slot-2')
    ];

    let prevSlot = 0; // Page - 1 (left: -100vw)
    let currSlot = 1; // Page (center: 0)
    let nextSlot = 2; // Page + 1 (right: +100vw)

    async function populateSlot(slotIndex, pageNum) {
      const el = slots[slotIndex];
      el.dataset.page = String(pageNum);
      if (pageNum < 1 || pageNum > TOTAL_PAGES) {
        el.innerHTML = '';
        return;
      }
      loadPageFont(pageNum);
      const data = await getPageData(pageNum);
      if (el.dataset.page === String(pageNum)) {
        el.innerHTML = renderPageHTML(pageNum, data);
      }
    }

    function setSlotTransform(slotIndex, tx) {
      slots[slotIndex].style.transform = 'translate3d(' + tx + ', 0, 0)';
    }

    function setSlotTransition(slotIndex, trans) {
      slots[slotIndex].style.transition = trans;
    }

    // Gesture Tracking State
    let isTracking = false;
    let isHorizontal = null;
    let isAnimating = false;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let currentDeltaX = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocityX = 0;

    function onPointerStart(x, y) {
      if (isAnimating) return;
      isTracking = true;
      isHorizontal = null;
      startX = x;
      startY = y;
      lastX = x;
      startTime = Date.now();
      lastTime = startTime;
      velocityX = 0;
      currentDeltaX = 0;

      // Disable transitions on all slots for immediate, lag-free 60fps tracking
      slots.forEach(s => {
        s.style.transition = 'none';
      });
    }

    function onPointerMove(x, y, e) {
      if (!isTracking || isAnimating) return;

      const diffX = x - startX;
      const diffY = y - startY;

      if (isHorizontal === null) {
        if (Math.abs(diffX) > 4 || Math.abs(diffY) > 4) {
          isHorizontal = Math.abs(diffX) >= Math.abs(diffY);
        }
      }

      if (!isHorizontal) return;
      if (e && e.cancelable) e.preventDefault();

      let dx = diffX;

      // Rubber-band resistance at boundaries (Page 1 can't go back, Page 604 can't go next)
      if ((currentPage === 1 && dx < 0) || (currentPage === TOTAL_PAGES && dx > 0)) {
        dx *= 0.25;
      }

      currentDeltaX = dx;

      // Real-time velocity tracking for instant flick response
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 8) {
        velocityX = (x - lastX) / dt;
        lastX = x;
        lastTime = now;
      }

      const W = window.innerWidth;
      setSlotTransform(currSlot, dx + 'px');
      // Left-to-Right swipe moves Next Page in from the Left (-W)
      if (currentPage < TOTAL_PAGES) {
        setSlotTransform(nextSlot, (dx - W) + 'px');
      }
      // Right-to-Left swipe moves Previous Page in from the Right (+W)
      if (currentPage > 1) {
        setSlotTransform(prevSlot, (dx + W) + 'px');
      }
    }

    function onPointerEnd(e) {
      if (!isTracking || isAnimating) return;
      isTracking = false;

      const W = window.innerWidth;
      const totalTime = Date.now() - startTime;
      const absDiffX = Math.abs(currentDeltaX);

      // Tap detection: clicking or tapping anywhere on the screen shows / hides the floating controls
      if (absDiffX < 15 && totalTime < 500) {
        toggleControls();
        return;
      }

      if (!isHorizontal) {
        snapBack();
        return;
      }

      // Responsive threshold: 10% of screen width (~35-40px) or quick flick velocity
      const threshold = W * 0.10;
      // Left-to-Right swipe (dx > 0: thumb moves left to right) -> NEXT PAGE
      const isFlickNext = currentDeltaX > threshold || velocityX > 0.22;
      // Right-to-Left swipe (dx < 0: thumb moves right to left) -> PREVIOUS PAGE
      const isFlickPrev = currentDeltaX < -threshold || velocityX < -0.22;

      if (isFlickNext && currentPage < TOTAL_PAGES) {
        animateToNext();
      } else if (isFlickPrev && currentPage > 1) {
        animateToPrev();
      } else {
        snapBack();
      }
    }

    const DURATION = 240;
    const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

    function animateToNext() {
      if (isAnimating) return;
      isAnimating = true;

      const trans = 'transform ' + DURATION + 'ms ' + EASING;
      setSlotTransition(currSlot, trans);
      setSlotTransition(nextSlot, trans);

      // Current page slides out to the right (+100vw), next page slides in from the left (0)
      setSlotTransform(currSlot, '100vw');
      setSlotTransform(nextSlot, '0');

      setTimeout(() => {
        currentPage++;

        // Rotate slot pointers
        const oldPrev = prevSlot;
        prevSlot = currSlot; // Old curr is now prev at +100vw
        currSlot = nextSlot; // Current page in view — UNTOUCHED!
        nextSlot = oldPrev;  // Recycled offscreen slot

        // Reposition recycled slot off-screen to the left (-100vw) without transition
        setSlotTransition(nextSlot, 'none');
        setSlotTransform(nextSlot, '-100vw');
        slots[nextSlot].innerHTML = '';

        // Populate upcoming page in the background
        if (currentPage < TOTAL_PAGES) {
          populateSlot(nextSlot, currentPage + 1);
        }

        // Preload upcoming fonts
        loadPageFont(currentPage);
        if (currentPage < TOTAL_PAGES) loadPageFont(currentPage + 1);
        if (currentPage + 1 < TOTAL_PAGES) loadPageFont(currentPage + 2);

        isAnimating = false;
        notifyPageChange(currentPage);
      }, DURATION);
    }

    function animateToPrev() {
      if (isAnimating) return;
      isAnimating = true;

      const trans = 'transform ' + DURATION + 'ms ' + EASING;
      setSlotTransition(currSlot, trans);
      setSlotTransition(prevSlot, trans);

      // Current page slides out to the left (-100vw), previous page slides in from the right (0)
      setSlotTransform(currSlot, '-100vw');
      setSlotTransform(prevSlot, '0');

      setTimeout(() => {
        currentPage--;

        // Rotate slot pointers
        const oldNext = nextSlot;
        nextSlot = currSlot; // Old curr is now next at -100vw
        currSlot = prevSlot; // Current page in view — UNTOUCHED!
        prevSlot = oldNext;  // Recycled offscreen slot

        // Reposition recycled slot off-screen to the right (+100vw) without transition
        setSlotTransition(prevSlot, 'none');
        setSlotTransform(prevSlot, '100vw');
        slots[prevSlot].innerHTML = '';

        // Populate upcoming previous page in the background
        if (currentPage > 1) {
          populateSlot(prevSlot, currentPage - 1);
        }

        // Preload upcoming fonts
        loadPageFont(currentPage);
        if (currentPage > 1) loadPageFont(currentPage - 1);

        isAnimating = false;
        notifyPageChange(currentPage);
      }, DURATION);
    }

    function snapBack() {
      const trans = 'transform 200ms ' + EASING;
      setSlotTransition(currSlot, trans);
      if (currentPage < TOTAL_PAGES) setSlotTransition(nextSlot, trans);
      if (currentPage > 1) setSlotTransition(prevSlot, trans);

      setSlotTransform(currSlot, '0');
      if (currentPage < TOTAL_PAGES) setSlotTransform(nextSlot, '-100vw');
      if (currentPage > 1) setSlotTransform(prevSlot, '100vw');
    }

    // Touch Event Listeners on window (Mobile devices)
    window.addEventListener('touchstart', (e) => {
      if (e.target && e.target.closest && e.target.closest('.floating-ctrl-btn')) {
        return;
      }
      if (e.touches.length === 1) {
        onPointerStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (e.target && e.target.closest && e.target.closest('.floating-ctrl-btn')) {
        return;
      }
      onPointerEnd(e);
    }, { passive: true });

    window.addEventListener('touchcancel', (e) => {
      onPointerEnd(e);
    }, { passive: true });

    // Mouse Event Listeners on window (Web / Desktop browser testing)
    let isMouseDown = false;
    window.addEventListener('mousedown', (e) => {
      if (e.target && e.target.closest && e.target.closest('.floating-ctrl-btn')) {
        return;
      }
      isMouseDown = true;
      onPointerStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        onPointerMove(e.clientX, e.clientY, e);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (isMouseDown) {
        isMouseDown = false;
        if (e.target && e.target.closest && e.target.closest('.floating-ctrl-btn')) {
          return;
        }
        onPointerEnd(e);
      }
    });

    // Keyboard Arrow Keys (Right = Next, Left = Prev)
    window.addEventListener('keydown', (e) => {
      if (isAnimating) return;
      if (e.key === 'ArrowRight' && currentPage < TOTAL_PAGES) {
        animateToNext();
      } else if (e.key === 'ArrowLeft' && currentPage > 1) {
        animateToPrev();
      }
    });

    // Initial Layout Setup
    function init() {
      setSlotTransition(prevSlot, 'none');
      setSlotTransition(currSlot, 'none');
      setSlotTransition(nextSlot, 'none');

      setSlotTransform(prevSlot, '100vw');
      setSlotTransform(currSlot, '0');
      setSlotTransform(nextSlot, '-100vw');

      loadPageFont(currentPage);
      populateSlot(currSlot, currentPage);

      if (currentPage < TOTAL_PAGES) {
        loadPageFont(currentPage + 1);
        populateSlot(nextSlot, currentPage + 1);
      }
      if (currentPage > 1) {
        loadPageFont(currentPage - 1);
        populateSlot(prevSlot, currentPage - 1);
      }
    }

    init();
  </script>
</body>
</html>
  `;

  const currentMeta = useMemo(() => getPageMetadata(currentPage), [currentPage]);

  const renderSettingsModal = () => (
    <Modal
      visible={isSettingsModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setIsSettingsModalVisible(false)}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={() => setIsSettingsModalVisible(false)}
      >
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#1e2621' : '#ffffff',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalDragHandle} />
          <View style={styles.modalHeaderRow}>
            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
              سورة {currentMeta.surahName} • صفحة {currentPage}
            </Text>
            <TouchableOpacity
              onPress={() => setIsSettingsModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalInfoRow}>
            <Text style={[styles.modalInfoText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              الجزء {currentMeta.juz} • الحزب {currentMeta.hizb}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.modalActionBtn,
              { backgroundColor: isDark ? '#2d3b32' : '#f1f5f9' },
            ]}
            onPress={() => {
              setIsSettingsModalVisible(false);
              audioPlayer.openPlayerModal();
            }}
          >
            <Ionicons name="headset-outline" size={20} color={isDark ? '#4ade80' : '#059669'} />
            <Text style={[styles.modalActionBtnText, { color: isDark ? '#ffffff' : '#1e293b' }]}>
              مشغل التلاوة الصوتية
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  // On Web / non-mobile (browser / emulator preview), render standard native iframe to avoid "WebView not supported" error
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#222825' : '#fcfbfa' }]}>
        {React.createElement('iframe', {
          srcDoc: htmlContent,
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: isDark ? '#222825' : '#fcfbfa',
          },
          title: 'Mushaf V2',
        })}
        {renderSettingsModal()}
      </View>
    );
  }

  // On Native Mobile (iOS / Android), render high performance React Native WebView
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#222825' : '#fcfbfa' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#222825' : '#fcfbfa'}
        translucent
      />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        scrollEnabled={false}
        overScrollMode="never"
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.webView}
      />
      {renderSettingsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    zIndex: 100,
  },
  searchBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
  },
  bottomRightGroup: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
  },
  aaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalInfoRow: {
    marginBottom: 20,
  },
  modalInfoText: {
    fontSize: 14,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalActionBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
