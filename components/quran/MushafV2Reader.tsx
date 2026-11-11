import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, StatusBar, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPageMetadata } from '@/services/mushafPageService';
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
  const webViewRef = useRef<WebView>(null);

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
          }
        } catch {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, []);

  // Handle messages from WebView on Mobile (iOS / Android)
  const handleMessage = useCallback(
    async (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'pageChange') {
          const pageNum = Number(data.page);
          if (pageNum >= 1 && pageNum <= 604) {
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
        }
      } catch {}
    },
    []
  );

  const pageMetaJson = useMemo(() => {
    const startPages: Record<number, string[]> = {};
    (surahsData as any[]).forEach((s) => {
      const p = s.start_page;
      if (!startPages[p]) startPages[p] = [];
      startPages[p].push(s.name_arabic);
    });

    const map: Record<number, { s: string; j: number; h: number; starts?: string[] }> = {};
    for (let p = 1; p <= 604; p++) {
      const m = getPageMetadata(p);
      map[p] = {
        s: m.surahName,
        j: m.juz,
        h: m.hizb,
        starts: startPages[p] || undefined,
      };
    }
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

  .surah-banner-wrap {
    position: relative;
    width: 85%;
    max-width: 350px;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2px auto 14px auto;
    background: ${isDark ? 'rgba(38, 64, 48, 0.45)' : 'rgba(16, 185, 129, 0.08)'};
    border-radius: 8px;
  }

  .surah-banner-wrap.opening-banner {
    width: 88%;
    max-width: 360px;
    height: 60px;
    margin: 4px auto 18px auto;
  }

  .surah-frame-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    ${isDark ? 'filter: drop-shadow(0 2px 6px rgba(0,0,0,0.45));' : 'filter: invert(1) brightness(0.25) sepia(1) hue-rotate(110deg) saturate(3);'}
  }

  .surah-title-text {
    position: relative;
    z-index: 2;
    color: ${isDark ? '#ffffff' : '#065f46'};
    font-family: 'Cairo', sans-serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-shadow: ${isDark ? '0 1px 4px rgba(0,0,0,0.8)' : 'none'};
    padding: 0 35px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .basmalah-row {
    font-size: clamp(22px, 5.6vw, 25px);
    color: ${isDark ? '#ffffff' : '#1e293b'};
    margin-bottom: 14px;
    text-align: center;
    font-family: 'p1';
    line-height: 1.95;
  }

  .mushaf-lines {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* Refined, slightly shorter line gap for Opening Pages (Pages 1 & 2) */
  .mushaf-lines.opening-lines {
    gap: clamp(9px, 1.6vh, 14px);
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
    gap: 6px;
    line-height: 2.0;
  }

  .mushaf-line.standard-line {
    gap: 4px;
    line-height: 1.85;
  }

  /* Verses on Opening Pages (1 & 2): Large and beautifully proportioned */
  .opening-word-glyph {
    font-size: clamp(23px, 6vw, 26px);
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
</style>
</head>
<body>
  <div id="mushaf-viewport">
    <div id="slot-0" class="mushaf-page" style="transform: translate3d(100vw, 0, 0);"></div>
    <div id="slot-1" class="mushaf-page" style="transform: translate3d(0, 0, 0);"></div>
    <div id="slot-2" class="mushaf-page" style="transform: translate3d(-100vw, 0, 0);"></div>
  </div>

  <script>
    const TOTAL_PAGES = 604;
    let currentPage = ${initialPage};
    const loadedFonts = new Set();
    const pageDataCache = {};
    const PAGE_METAS = ${pageMetaJson};
    const SURAH_FRAME_SRC = "${SURAH_FRAME_BASE64}";

    // Arabic Numerals Helper
    const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    function toArabic(num) {
      return String(num).replace(/[0-9]/g, d => arabicDigits[+d]);
    }

    // Pre-bundled King Fahd Complex V2 Glyphs for Page 1 & Page 2 (Instant 0ms render!)
    pageDataCache[1] = {
      isOpening: true,
      lines: {
        2: ["ﱁ","ﱂ","ﱃ","ﱄ"],
        3: ["ﱅ","ﱆ","ﱇ","ﱈ"],
        4: ["ﱉ","ﱊ","ﱋ","ﱌ","ﱍ"],
        5: ["ﱎ","ﱏ","ﱐ","ﱑ"],
        6: ["ﱒ","ﱓ","ﱔ","ﱕ"],
        7: ["ﱖ","ﱗ","ﱘ","ﱙ"],
        8: ["ﱚ","ﱛ","ﱜ","ﱝ"]
      }
    };

    pageDataCache[2] = {
      isOpening: true,
      hasBasmalah: true,
      lines: {
        3: ["ﱁ","ﱂ","ﱃ","ﱄ","ﱅ","ﱆﱇ","ﱈﱉ","ﱊ"],
        4: ["ﱋ","ﱌ","ﱍ","ﱎ","ﱏ","ﱐ","ﱑ"],
        5: ["ﱒ","ﱓ","ﱔ","ﱕ","ﱖ","ﱗ","ﱘ"],
        6: ["ﱙ","ﱚ","ﱛ","ﱜ","ﱝ","ﱞ"],
        7: ["ﱟ","ﱠ","ﱡ","ﱢ","ﱣ","ﱤ"],
        8: ["ﱥ","ﱦ","ﱧ","ﱨ"]
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
      if (pageDataCache[p]) return pageDataCache[p];
      const cached = localStorage.getItem('qpc_v2_p' + p);
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
        const lines = {};

        verses.forEach(v => {
          if (v.words && v.words.length > 0) {
            v.words.forEach(w => {
              const l = w.line_number;
              if (!lines[l]) lines[l] = [];
              if (w.code_v2) lines[l].push(w.code_v2);
            });
          }
        });

        const data = {
          page: p,
          isOpening: p === 1 || p === 2,
          lines: lines
        };

        pageDataCache[p] = data;
        try { localStorage.setItem('qpc_v2_p' + p, JSON.stringify(data)); } catch {}
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
      const bannerWrapClass = isOpening ? 'surah-banner-wrap opening-banner' : 'surah-banner-wrap';
      const linesContainerClass = isOpening ? 'mushaf-lines opening-lines' : 'mushaf-lines standard-lines';
      const lineClass = isOpening ? 'mushaf-line opening-line' : 'mushaf-line standard-line';

      let contentHTML = '';

      // Render Surah Ornamental Frame if this page starts any Surah
      const chapterStarts = meta.starts || [];
      if (chapterStarts.length > 0) {
        chapterStarts.forEach(sName => {
          contentHTML += '<div class="' + bannerWrapClass + '"><img class="surah-frame-img" src="' + SURAH_FRAME_SRC + '" alt="frame" /><span class="surah-title-text">سورة ' + sName + '</span></div>';
          if (sName !== 'الفاتحة' && sName !== 'التوبة') {
            contentHTML += '<div class="basmalah-row"><span class="word-glyph">ﱁ ﱂ ﱃ ﱄ</span></div>';
          }
        });
      }

      contentHTML += '<div class="' + linesContainerClass + '" style="font-family: \\'p' + p + '\\';">';
      const lineKeys = Object.keys(data.lines).sort((a,b) => +a - +b);
      lineKeys.forEach(lNum => {
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
        <div class="content-container">
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

      // Tap-to-turn support (tapping side edges of screen turns page)
      if (absDiffX < 10 && totalTime < 350) {
        // Tap on right 25% of screen -> Next Page
        if (startX > W * 0.75 && currentPage < TOTAL_PAGES) {
          animateToNext();
          return;
        }
        // Tap on left 25% of screen -> Previous Page
        if (startX < W * 0.25 && currentPage > 1) {
          animateToPrev();
          return;
        }
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
      onPointerEnd(e);
    }, { passive: true });

    window.addEventListener('touchcancel', (e) => {
      onPointerEnd(e);
    }, { passive: true });

    // Mouse Event Listeners on window (Web / Desktop browser testing)
    let isMouseDown = false;
    window.addEventListener('mousedown', (e) => {
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
});
