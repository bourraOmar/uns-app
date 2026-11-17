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
import mushafPagesData from '@/data/mushaf_v2_pages.json';
import { SURAH_FRAME_BASE64 } from '@/constants/surahFrameBase64';

interface MushafV2ReaderProps {
  initialPage: number;
  isDark: boolean;
  onBack: () => void;
}

export type MushafThemeId = 'white' | 'night' | 'calm' | 'comfort';

export interface MushafThemeConfig {
  id: MushafThemeId;
  name: string;
  bg: string;
  textColor: string;
  headerColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  ayahNumberColor: string;
  surahBannerBg: string;
  surahTitleColor: string;
  surahFrameFilter: string;
  ctrlBtnBg: string;
  ctrlBtnColor: string;
  ctrlBtnBorder: string;
  isDark: boolean;
  previewBg: string;
  previewLetterColor: string;
  previewTextColor: string;
}

export const MUSHAF_THEMES: Record<MushafThemeId, MushafThemeConfig> = {
  white: {
    id: 'white',
    name: 'أبيض',
    bg: '#ffffff',
    textColor: '#111827',
    headerColor: '#64748b',
    badgeBg: 'rgba(92, 153, 131, 0.12)',
    badgeBorder: 'rgba(92, 153, 131, 0.35)',
    badgeText: '#2b5f4c',
    ayahNumberColor: '#5c9983',
    surahBannerBg: 'rgba(16, 185, 129, 0.08)',
    surahTitleColor: '#065f46',
    surahFrameFilter: 'invert(1) brightness(0.25) sepia(1) hue-rotate(110deg) saturate(3);',
    ctrlBtnBg: 'rgba(255, 255, 255, 0.95)',
    ctrlBtnColor: '#1e293b',
    ctrlBtnBorder: 'rgba(0, 0, 0, 0.12)',
    isDark: false,
    previewBg: '#ffffff',
    previewLetterColor: '#1e293b',
    previewTextColor: '#1e293b',
  },
  night: {
    id: 'night',
    name: 'ليلي',
    bg: '#222825',
    textColor: '#ffffff',
    headerColor: '#94a3b8',
    badgeBg: 'rgba(120, 146, 112, 0.22)',
    badgeBorder: 'rgba(120, 146, 112, 0.55)',
    badgeText: '#ffffff',
    ayahNumberColor: '#789270',
    surahBannerBg: 'rgba(38, 64, 48, 0.45)',
    surahTitleColor: '#ffffff',
    surahFrameFilter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45)) sepia(1) hue-rotate(85deg) saturate(2.8) brightness(0.95);',
    ctrlBtnBg: 'rgba(38, 48, 42, 0.92)',
    ctrlBtnColor: '#ffffff',
    ctrlBtnBorder: 'rgba(255, 255, 255, 0.18)',
    isDark: true,
    previewBg: '#252e27',
    previewLetterColor: '#ffffff',
    previewTextColor: '#ffffff',
  },
  calm: {
    id: 'calm',
    name: 'هادئ',
    bg: '#dff1ec',
    textColor: '#10241e',
    headerColor: '#44665b',
    badgeBg: 'rgba(82, 153, 130, 0.16)',
    badgeBorder: 'rgba(82, 153, 130, 0.40)',
    badgeText: '#103d30',
    ayahNumberColor: '#529982',
    surahBannerBg: 'rgba(13, 148, 136, 0.10)',
    surahTitleColor: '#0f766e',
    surahFrameFilter: 'invert(1) brightness(0.25) sepia(1) hue-rotate(130deg) saturate(3);',
    ctrlBtnBg: 'rgba(235, 247, 243, 0.95)',
    ctrlBtnColor: '#10241e',
    ctrlBtnBorder: 'rgba(16, 36, 30, 0.12)',
    isDark: false,
    previewBg: '#d8ede5',
    previewLetterColor: '#10241e',
    previewTextColor: '#10241e',
  },
  comfort: {
    id: 'comfort',
    name: 'مريح',
    bg: '#edf5ed',
    textColor: '#152618',
    headerColor: '#47664c',
    badgeBg: 'rgba(92, 148, 114, 0.16)',
    badgeBorder: 'rgba(92, 148, 114, 0.40)',
    badgeText: '#15381e',
    ayahNumberColor: '#5c9472',
    surahBannerBg: 'rgba(16, 185, 129, 0.09)',
    surahTitleColor: '#047857',
    surahFrameFilter: 'invert(1) brightness(0.25) sepia(1) hue-rotate(90deg) saturate(3);',
    ctrlBtnBg: 'rgba(240, 248, 241, 0.95)',
    ctrlBtnColor: '#152618',
    ctrlBtnBorder: 'rgba(21, 38, 24, 0.12)',
    isDark: false,
    previewBg: '#e2f0e3',
    previewLetterColor: '#152618',
    previewTextColor: '#152618',
  },
};

export const MUSHAF_THEME_LIST: MushafThemeConfig[] = [
  MUSHAF_THEMES.white,
  MUSHAF_THEMES.night,
  MUSHAF_THEMES.calm,
  MUSHAF_THEMES.comfort,
];

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
  const [scrollMode, setScrollMode] = useState<'horizontal' | 'auto'>('horizontal');

  const [selectedThemeId, setSelectedThemeId] = useState<MushafThemeId>(() => {
    return isDark ? 'night' : 'comfort';
  });

  const currentTheme = useMemo(() => {
    return MUSHAF_THEMES[selectedThemeId] || (isDark ? MUSHAF_THEMES.night : MUSHAF_THEMES.comfort);
  }, [selectedThemeId, isDark]);

  useEffect(() => {
    AsyncStorage.getItem('@uns_mushaf_theme').then((saved) => {
      if (saved && (saved === 'white' || saved === 'night' || saved === 'calm' || saved === 'comfort')) {
        setSelectedThemeId(saved as MushafThemeId);
        const t = MUSHAF_THEMES[saved as MushafThemeId];
        if (t && webViewRef.current) {
          const js = `if (window.applyTheme) { window.applyTheme(${JSON.stringify(t)}); } true;`;
          webViewRef.current.injectJavaScript(js);
        }
      }
    }).catch(() => {});
  }, []);

  const handleSelectTheme = (themeId: MushafThemeId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedThemeId(themeId);
    const t = MUSHAF_THEMES[themeId];
    if (t && webViewRef.current) {
      const js = `if (window.applyTheme) { window.applyTheme(${JSON.stringify(t)}); } true;`;
      webViewRef.current.injectJavaScript(js);
    }
  };

  const handleApplyTheme = async () => {
    try {
      await AsyncStorage.setItem('@uns_mushaf_theme', selectedThemeId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setIsSettingsModalVisible(false);
  };

  // Auto-scroll handler
  useEffect(() => {
    let timer: any = null;
    if (scrollMode === 'auto') {
      timer = setInterval(() => {
        const js = `if (typeof animateToNext === 'function' && currentPage < TOTAL_PAGES) { animateToNext(); } true;`;
        webViewRef.current?.injectJavaScript(js);
      }, 25000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [scrollMode]);

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

  const mushafPagesJson = useMemo(() => {
    return JSON.stringify(mushafPagesData);
  }, []);

  const preloadLinks = useMemo(() => {
    const links = [
      `<link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p${initialPage}.woff2">`,
    ];
    if (initialPage < 604) {
      links.push(`<link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p${initialPage + 1}.woff2">`);
    }
    if (initialPage > 1) {
      links.push(`<link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p${initialPage - 1}.woff2">`);
    }
    return links.join('\n');
  }, [initialPage]);

  const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>King Fahd Complex V2</title>
${preloadLinks}
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;700&display=swap');

  :root {
    --bg-color: ${currentTheme.bg};
    --text-color: ${currentTheme.textColor};
    --header-color: ${currentTheme.headerColor};
    --badge-bg: ${currentTheme.badgeBg};
    --badge-border: ${currentTheme.badgeBorder};
    --badge-text: ${currentTheme.badgeText};
    --ayah-number-color: ${currentTheme.ayahNumberColor};
    --surah-banner-bg: ${currentTheme.surahBannerBg};
    --surah-title-color: ${currentTheme.surahTitleColor};
    --surah-frame-filter: ${currentTheme.surahFrameFilter};
    --ctrl-btn-bg: ${currentTheme.ctrlBtnBg};
    --ctrl-btn-color: ${currentTheme.ctrlBtnColor};
    --ctrl-btn-border: ${currentTheme.ctrlBtnBorder};
  }

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
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color 0.2s ease, color 0.2s ease;
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
    font-family: 'Cairo', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Arabic", "Geeza Pro", Tahoma, sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--header-color);
    padding: 0 16px;
    box-sizing: border-box;
    transition: color 0.2s ease;
  }

  .content-container {
    width: 100%;
    max-width: 580px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: auto 0;
    padding: 0 4px;
    box-sizing: border-box;
    overflow: hidden;
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
    background: var(--surah-banner-bg);
    border-radius: 8px;
    transition: background 0.2s ease;
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
    filter: var(--surah-frame-filter);
    transition: filter 0.2s ease;
  }

  .surah-title-text {
    position: relative;
    z-index: 2;
    color: var(--surah-title-color);
    font-family: 'Cairo', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 0 35px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    transition: color 0.2s ease;
  }

  .basmalah-row {
    font-size: clamp(19px, 5vw, 23px);
    color: var(--text-color);
    margin: 2px auto 6px auto;
    text-align: center;
    font-family: 'p1' !important;
    line-height: 1.5;
    transition: color 0.2s ease;
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
    gap: clamp(3px, 0.8vh, 6px);
  }

  .mushaf-line {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    white-space: nowrap;
    align-items: center;
    justify-content: center;
    will-change: transform;
  }

  .mushaf-line.opening-line {
    gap: clamp(1px, 0.45vw, 2.8px);
    line-height: 1.75;
  }

  .mushaf-line.standard-line {
    gap: clamp(1px, 0.45vw, 2.8px);
    line-height: 1.75;
  }

  /* Verses on Opening Pages (1 & 2): Authentic proportion matching standard pages */
  .opening-word-glyph {
    font-size: clamp(20px, min(5.6vw, 3.2vh), 26px);
    color: var(--text-color);
    display: inline-block;
    transition: color 0.2s ease;
  }

  /* Verses on Standard 15-line Pages (3 to 604) */
  .standard-word-glyph {
    font-size: clamp(20px, min(5.6vw, 3.2vh), 26px);
    color: var(--text-color);
    display: inline-block;
    transition: color 0.2s ease;
  }

  /* Verse Number Rosette Marker (Accent colored according to theme) */
  .ayah-glyph {
    color: var(--ayah-number-color) !important;
    display: inline-block;
    transition: color 0.2s ease;
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
    background: var(--badge-bg);
    border: 1px solid var(--badge-border);
    font-family: 'Cairo', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--badge-text);
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
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
    background: var(--ctrl-btn-bg);
    border: 1px solid var(--ctrl-btn-border);
    color: var(--ctrl-btn-color);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.15s ease, background 0.2s ease, color 0.2s ease;
    outline: none;
    padding: 0;
  }

  .floating-ctrl-btn:active {
    transform: scale(0.92);
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

  /* Page Loading and Offline States */
  .page-loading-wrap, .page-offline-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: auto;
    padding: 30px 20px;
    text-align: center;
    font-family: 'Cairo', sans-serif;
  }

  .page-loading-text {
    margin-top: 14px;
    font-size: 14px;
    font-weight: 600;
    color: ${isDark ? '#cbd5e1' : '#64748b'};
  }

  .page-offline-wrap {
    max-width: 320px;
    border-radius: 16px;
    background: ${isDark ? 'rgba(38, 48, 42, 0.6)' : 'rgba(0, 0, 0, 0.03)'};
    border: 1px dashed ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
  }

  .offline-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${isDark ? '#34d399' : '#059669'};
    margin-bottom: 8px;
  }

  .offline-title {
    font-size: 15px;
    font-weight: 700;
    color: ${isDark ? '#ffffff' : '#1e293b'};
    margin-bottom: 6px;
  }

  .offline-desc {
    font-size: 12.5px;
    line-height: 1.6;
    color: ${isDark ? '#cbd5e1' : '#64748b'};
    margin-bottom: 14px;
  }

  .offline-retry-btn {
    padding: 8px 24px;
    border-radius: 20px;
    border: none;
    background: #10b981;
    color: #ffffff;
    font-family: 'Cairo', sans-serif;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
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
    const PAGE_METAS = ${pageMetaJson};
    const SURAH_NAMES = ${surahNamesJson};
    const pageDataCache = ${mushafPagesJson};
    const SURAH_FRAME_SRC = '${SURAH_FRAME_BASE64}';

    function toArabic(num) {
      if (num === undefined || num === null) return '';
      const digits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
      return String(num).replace(/\d/g, function(d) { return digits[+d]; });
    }

    window.applyTheme = function(theme) {
      if (!theme) return;
      document.body.style.backgroundColor = theme.bg;
      var root = document.documentElement;
      root.style.setProperty('--bg-color', theme.bg);
      root.style.setProperty('--text-color', theme.textColor);
      root.style.setProperty('--header-color', theme.headerColor);
      root.style.setProperty('--badge-bg', theme.badgeBg);
      root.style.setProperty('--badge-border', theme.badgeBorder);
      root.style.setProperty('--badge-text', theme.badgeText);
      root.style.setProperty('--ayah-number-color', theme.ayahNumberColor);
      root.style.setProperty('--surah-banner-bg', theme.surahBannerBg);
      root.style.setProperty('--surah-title-color', theme.surahTitleColor);
      root.style.setProperty('--surah-frame-filter', theme.surahFrameFilter);
      root.style.setProperty('--ctrl-btn-bg', theme.ctrlBtnBg);
      root.style.setProperty('--ctrl-btn-color', theme.ctrlBtnColor);
      root.style.setProperty('--ctrl-btn-border', theme.ctrlBtnBorder);
    };

    const loadedFonts = new Set();
    const loadingFonts = new Map();

    function loadPageFont(p) {
      if (p < 1 || p > TOTAL_PAGES) return Promise.resolve(false);
      if (loadedFonts.has(p)) return Promise.resolve(true);
      if (loadingFonts.has(p)) return loadingFonts.get(p);

      const url = 'https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p' + p + '.woff2';

      // Inject native @font-face style rule for maximum reliability across WebViews
      const styleId = 'font-p' + p;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = '@font-face { font-family: "p' + p + '"; src: url("' + url + '") format("woff2"); font-display: block; }';
        document.head.appendChild(style);
      }

      if (typeof FontFace !== 'undefined') {
        const font = new FontFace('p' + p, 'url(' + url + ')', { display: 'block' });
        const promise = font.load().then(function(f) {
          document.fonts.add(f);
          loadedFonts.add(p);
          requestAnimationFrame(function() {
            slots.forEach(function(s) { fitSlotLines(s); });
          });
          return true;
        }).catch(function(err) {
          console.warn('FontFace load p' + p, err);
          loadedFonts.add(p);
          return true;
        }).finally(function() {
          loadingFonts.delete(p);
        });

        loadingFonts.set(p, promise);
        return promise;
      } else {
        loadedFonts.add(p);
        return Promise.resolve(true);
      }
    }

    loadPageFont(currentPage);
    if (currentPage < TOTAL_PAGES) loadPageFont(currentPage + 1);
    if (currentPage > 1) loadPageFont(currentPage - 1);

    // Retrieve Page Data directly from Pre-bundled Offline Dataset (0ms, 100% Offline)
    async function getPageData(p) {
      if (pageDataCache && pageDataCache[p]) {
        return pageDataCache[p];
      }
      return null;
    }

    function renderPageHTML(p, data) {
      if (!data) {
        return '<div class="spinner"></div>';
      }

      loadPageFont(p);
      const meta = (PAGE_METAS && PAGE_METAS[p]) || { s: '', j: 1, h: 1 };
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

      const lineKeys = Object.keys(data.lines).sort(function(a, b) { return +a - +b; });
      lineKeys.forEach(function(lNum) {
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
        words.forEach(function(w) {
          const isAyah = data.ayahGlyphs && data.ayahGlyphs.indexOf(w) !== -1;
          const cls = isAyah ? (glyphClass + ' ayah-glyph') : glyphClass;
          contentHTML += '<span class="' + cls + '">' + w + '</span>';
        });
        contentHTML += '</div>';
      });
      contentHTML += '</div>';

      return '<div class="page-header">' +
        '<span>سورة ' + (meta.s || '') + '</span>' +
        '<span dir="rtl">الجزء ' + toArabic(meta.j || 1) + ' &nbsp;•&nbsp; حزب ' + toArabic(meta.h || 1) + '</span>' +
        '</div>' +
        '<div class="content-container ' + (isOpening ? 'opening-container' : 'standard-container') + '">' +
        contentHTML +
        '</div>' +
        '<div class="page-footer">' +
        '<div class="page-badge">' + toArabic(p) + '</div>' +
        '</div>';
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

    function fitSlotLines(slotEl) {
      if (!slotEl) return;
      const container = slotEl.querySelector('.content-container');
      if (!container) return;
      const containerWidth = container.clientWidth || window.innerWidth;
      const maxWidth = Math.max(260, containerWidth - 8);

      const lines = slotEl.querySelectorAll('.mushaf-line');
      lines.forEach(line => {
        line.style.transform = '';
        const sw = line.scrollWidth;
        if (sw > maxWidth && maxWidth > 0) {
          const scale = Math.max(0.70, +(maxWidth / sw).toFixed(4));
          line.style.transform = 'scale(' + scale + ')';
          line.style.transformOrigin = 'center center';
        }
      });
    }

    async function populateSlot(slotIndex, pageNum) {
      const el = slots[slotIndex];
      el.dataset.page = String(pageNum);
      if (pageNum < 1 || pageNum > TOTAL_PAGES) {
        el.innerHTML = '';
        return;
      }

      // Preload current, next, and previous fonts immediately in background
      loadPageFont(pageNum);
      if (pageNum < TOTAL_PAGES) loadPageFont(pageNum + 1);
      if (pageNum > 1) loadPageFont(pageNum - 1);

      const data = await getPageData(pageNum);
      if (el.dataset.page !== String(pageNum) || !data) return;

      el.innerHTML = renderPageHTML(pageNum, data);

      if (loadedFonts.has(pageNum)) {
        requestAnimationFrame(() => {
          fitSlotLines(el);
        });
      } else {
        const lines = el.querySelector('.mushaf-lines');
        if (lines) lines.style.visibility = 'hidden';

        loadPageFont(pageNum).then(success => {
          if (el.dataset.page !== String(pageNum)) return;
          if (lines) lines.style.visibility = 'visible';
          requestAnimationFrame(() => {
            fitSlotLines(el);
          });
        });

        // Safety fallback: ensure text is NEVER stuck hidden
        setTimeout(() => {
          if (el.dataset.page === String(pageNum) && lines && lines.style.visibility === 'hidden') {
            lines.style.visibility = 'visible';
            requestAnimationFrame(() => {
              fitSlotLines(el);
            });
          }
        }, 400);
      }
    }

    window.retryPage = function(pageNum, slotIndex) {
      populateSlot(slotIndex, pageNum);
    };

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

        fitSlotLines(slots[currSlot]);
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

        fitSlotLines(slots[currSlot]);
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

      populateSlot(currSlot, currentPage);

      if (currentPage < TOTAL_PAGES) {
        populateSlot(nextSlot, currentPage + 1);
      }
      if (currentPage > 1) {
        populateSlot(prevSlot, currentPage - 1);
      }

      window.addEventListener('resize', () => {
        slots.forEach(s => fitSlotLines(s));
      });
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
      animationType="slide"
      onRequestClose={() => setIsSettingsModalVisible(false)}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={() => setIsSettingsModalVisible(false)}
      >
        <View
          style={[
            styles.modalCard,
            { paddingBottom: Math.max(insets.bottom, 16) + 14 },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalDragHandle} />

          {/* Header Row */}
          <View style={styles.modalHeaderRow}>
            <TouchableOpacity
              onPress={() => setIsSettingsModalVisible(false)}
              style={styles.modalRoundCloseBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <Text style={styles.modalSheetTitle}>
              إعدادات القراءة
            </Text>

            <View style={{ width: 36 }} />
          </View>

          {/* Section 1: خلفية القراءة */}
          <Text style={styles.modalSectionLabel}>
            خلفية القراءة
          </Text>

          <View style={styles.themeCardsRow}>
            {MUSHAF_THEME_LIST.map((t) => {
              const isSelected = selectedThemeId === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themeCard,
                    { backgroundColor: t.previewBg },
                    isSelected && styles.themeCardSelected,
                  ]}
                  onPress={() => handleSelectTheme(t.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.themeCardLetter, { color: t.previewLetterColor }]}>
                    ع
                  </Text>
                  <Text style={[styles.themeCardName, { color: t.previewTextColor }]}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section 2: خيارات التمرير */}
          <Text style={styles.modalSectionLabel}>
            خيارات التمرير
          </Text>

          <View style={styles.scrollOptionsRow}>
            <TouchableOpacity
              style={[
                styles.scrollOptionPill,
                scrollMode === 'auto' ? styles.scrollOptionPillActive : styles.scrollOptionPillInactive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScrollMode('auto');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-down-outline"
                size={18}
                color={scrollMode === 'auto' ? '#ffffff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.scrollOptionText,
                  { color: scrollMode === 'auto' ? '#ffffff' : '#94a3b8' },
                ]}
              >
                تمرير تلقائي
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.scrollOptionPill,
                scrollMode === 'horizontal' ? styles.scrollOptionPillActive : styles.scrollOptionPillInactive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScrollMode('horizontal');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="book-outline"
                size={18}
                color={scrollMode === 'horizontal' ? '#ffffff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.scrollOptionText,
                  { color: scrollMode === 'horizontal' ? '#ffffff' : '#94a3b8' },
                ]}
              >
                تمرير أفقي
              </Text>
            </TouchableOpacity>
          </View>

          {/* Audio Player Shortcut */}
          <TouchableOpacity
            style={styles.modalAudioBtn}
            onPress={() => {
              setIsSettingsModalVisible(false);
              audioPlayer.openPlayerModal();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="headset-outline" size={18} color="#34d399" />
            <Text style={styles.modalAudioBtnText}>
              مشغل التلاوة الصوتية
            </Text>
          </TouchableOpacity>

          {/* Apply Button */}
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApplyTheme}
            activeOpacity={0.85}
          >
            <Text style={styles.applyBtnText}>
              تطبيق
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  // On Web / non-mobile (browser / emulator preview), render standard native iframe to avoid "WebView not supported" error
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
        {React.createElement('iframe', {
          srcDoc: htmlContent,
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: currentTheme.bg,
          },
          title: 'Mushaf V2',
        })}
        {renderSettingsModal()}
      </View>
    );
  }

  // On Native Mobile (iOS / Android), render high performance React Native WebView
  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <StatusBar
        barStyle={currentTheme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={currentTheme.bg}
        translucent
      />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://verses.quran.foundation' }}
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1b231e',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalDragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalRoundCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#273229',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Cairo',
  },
  modalSectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    marginTop: 16,
    marginBottom: 12,
    fontFamily: 'Cairo',
  },
  themeCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  themeCard: {
    flex: 1,
    height: 98,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  themeCardSelected: {
    borderWidth: 2,
    borderColor: '#34d399',
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  themeCardLetter: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  themeCardName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  scrollOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scrollOptionPill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scrollOptionPillActive: {
    backgroundColor: '#27332a',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  scrollOptionPillInactive: {
    backgroundColor: '#202821',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  scrollOptionText: {
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  modalAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#243026',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 16,
  },
  modalAudioBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Cairo',
  },
  applyBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0d6b4a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#0d6b4a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Cairo',
  },
});
