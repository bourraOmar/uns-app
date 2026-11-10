import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPageMetadata } from '@/services/mushafPageService';

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
    touch-action: pan-y;
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
    transition: transform 0.28s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.28s ease;
    will-change: transform, opacity;
  }

  .page-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Cairo', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: ${isDark ? '#94a3b8' : '#64748b'};
    padding: 0 10px;
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

  .surah-banner {
    width: 92%;
    background: ${
      isDark
        ? 'linear-gradient(135deg, rgba(46, 77, 59, 0.95), rgba(35, 60, 45, 0.98))'
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.2))'
    };
    border: 1.5px solid ${isDark ? 'rgba(125, 170, 140, 0.45)' : 'rgba(16, 185, 129, 0.35)'};
    border-radius: 14px;
    padding: 8px 16px;
    text-align: center;
    margin-bottom: 20px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  }

  .surah-title {
    font-family: 'Cairo', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: ${isDark ? '#ffffff' : '#065f46'};
    letter-spacing: 0.5px;
  }

  .basmalah-row {
    font-size: clamp(22px, 6vw, 30px);
    color: ${isDark ? '#ffffff' : '#1e293b'};
    margin-bottom: 16px;
    text-align: center;
    font-family: 'p1';
    line-height: 1.8;
  }

  .mushaf-lines {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .mushaf-line {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    white-space: nowrap;
    align-items: center;
    justify-content: center;
    gap: 4px;
    line-height: 1.8;
  }

  /* Verses on Opening Pages (1 & 2): Large, bold font matching reference screenshot */
  .opening-word-glyph {
    font-size: clamp(25px, 6.8vw, 33px);
    color: ${isDark ? '#ffffff' : '#1e293b'};
    display: inline-block;
  }

  /* Verses on Standard 15-line Pages (3 to 604) */
  .standard-word-glyph {
    font-size: clamp(19px, 5.1vw, 25px);
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
    padding: 3px 18px;
    border-radius: 16px;
    background: ${isDark ? 'rgba(45, 68, 55, 0.45)' : 'rgba(15, 142, 93, 0.1)'};
    border: 1px solid ${isDark ? 'rgba(74, 104, 84, 0.5)' : 'rgba(15, 142, 93, 0.25)'};
    font-family: 'Cairo', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: ${isDark ? '#f8fafc' : '#0f8e5d'};
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
    <div id="page-slot-prev" class="mushaf-page" style="transform: translateX(100vw);"></div>
    <div id="page-slot-curr" class="mushaf-page" style="transform: translateX(0);"></div>
    <div id="page-slot-next" class="mushaf-page" style="transform: translateX(-100vw);"></div>
  </div>

  <script>
    const TOTAL_PAGES = 604;
    let currentPage = ${initialPage};
    const loadedFonts = new Set();
    const pageDataCache = {};

    // Arabic Numerals Helper
    const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    function toArabic(num) {
      return String(num).replace(/[0-9]/g, d => arabicDigits[+d]);
    }

    // Pre-bundled King Fahd Complex V2 Glyphs for Page 1 & Page 2 (Instant 0ms render!)
    pageDataCache[1] = {
      surahName: "الفاتحة",
      juz: 1,
      hizb: 1,
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
      surahName: "البقرة",
      juz: 1,
      hizb: 1,
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
      if (loadedFonts.has(p)) return Promise.resolve();
      loadedFonts.add(p);
      const font = new FontFace('p' + p, 'url(https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p' + p + '.woff2)', { display: 'block' });
      return font.load().then(f => {
        document.fonts.add(f);
      }).catch(err => console.warn('Font load error p' + p, err));
    }

    // Always load p1 for Basmalah calligraphy
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
        let surahName = 'القرآن';
        let juz = 1;
        let hizb = 1;
        let isOpening = p === 1 || p === 2;

        verses.forEach(v => {
          if (v.words && v.words.length > 0) {
            juz = v.words[0].juz_number || juz;
            hizb = v.words[0].hizb_number || hizb;
            v.words.forEach(w => {
              const l = w.line_number;
              if (!lines[l]) lines[l] = [];
              if (w.code_v2) lines[l].push(w.code_v2);
            });
          }
        });

        const data = {
          page: p,
          surahName: surahName,
          juz: juz,
          hizb: hizb,
          isOpening: isOpening,
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
      const isOpening = p === 1 || p === 2;
      const glyphClass = isOpening ? 'opening-word-glyph' : 'standard-word-glyph';

      let contentHTML = '';

      // Banner for Opening Pages or Chapter Starts
      if (p === 1) {
        contentHTML += '<div class="surah-banner"><div class="surah-title">سورة الفاتحة</div></div>';
      } else if (p === 2) {
        contentHTML += '<div class="surah-banner"><div class="surah-title">سورة البقرة</div></div>';
        contentHTML += '<div class="basmalah-row"><span class="word-glyph">ﱁ ﱂ ﱃ ﱄ</span></div>';
      }

      // Render 15 Lines
      contentHTML += '<div class="mushaf-lines" style="font-family: \\'p' + p + '\\';">';
      const lineKeys = Object.keys(data.lines).sort((a,b) => +a - +b);
      lineKeys.forEach(lNum => {
        const words = data.lines[lNum] || [];
        contentHTML += '<div class="mushaf-line">';
        words.forEach(w => {
          contentHTML += '<span class="' + glyphClass + '">' + w + '</span>';
        });
        contentHTML += '</div>';
      });
      contentHTML += '</div>';

      return \`
        <div class="page-header">
          <span>سورة \${data.surahName || ''}</span>
          <span>الجزء \${toArabic(data.juz || 1)} &nbsp; حزب \${toArabic(data.hizb || 1)}</span>
        </div>
        <div class="content-container">
          \${contentHTML}
        </div>
        <div class="page-footer">
          <div class="page-badge">\${toArabic(p)}</div>
        </div>
      \`;
    }

    async function updatePageSlots() {
      const prevEl = document.getElementById('page-slot-prev');
      const currEl = document.getElementById('page-slot-curr');
      const nextEl = document.getElementById('page-slot-next');

      // Preload fonts for current and adjacent pages
      loadPageFont(currentPage);
      if (currentPage > 1) loadPageFont(currentPage - 1);
      if (currentPage < TOTAL_PAGES) loadPageFont(currentPage + 1);

      // Render Current Page
      const currData = await getPageData(currentPage);
      currEl.innerHTML = renderPageHTML(currentPage, currData);

      // Notify host environment of Page Change
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pageChange', page: currentPage }));
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(JSON.stringify({ type: 'pageChange', page: currentPage }), '*');
      }

      // Pre-render Previous Page (on right for RTL)
      if (currentPage > 1) {
        const prevData = await getPageData(currentPage - 1);
        prevEl.innerHTML = renderPageHTML(currentPage - 1, prevData);
      } else {
        prevEl.innerHTML = '';
      }

      // Pre-render Next Page (on left for RTL)
      if (currentPage < TOTAL_PAGES) {
        const nextData = await getPageData(currentPage + 1);
        nextEl.innerHTML = renderPageHTML(currentPage + 1, nextData);
      } else {
        nextEl.innerHTML = '';
      }
    }

    // Touch Swiping Engine (RTL: Swiping Right-To-Left 👉 ⬅️ advances to Next Page)
    let startX = 0;
    let currentDeltaX = 0;
    let isSwiping = false;

    const viewport = document.getElementById('mushaf-viewport');

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      currentDeltaX = 0;
      isSwiping = true;

      document.querySelectorAll('.mushaf-page').forEach(el => {
        el.style.transition = 'none';
      });
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      currentDeltaX = e.touches[0].clientX - startX;

      const currEl = document.getElementById('page-slot-curr');
      const prevEl = document.getElementById('page-slot-prev');
      const nextEl = document.getElementById('page-slot-next');

      currEl.style.transform = 'translateX(' + currentDeltaX + 'px)';
      if (prevEl) prevEl.style.transform = 'translateX(' + (currentDeltaX + window.innerWidth) + 'px)';
      if (nextEl) nextEl.style.transform = 'translateX(' + (currentDeltaX - window.innerWidth) + 'px)';
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      if (!isSwiping) return;
      isSwiping = false;

      const threshold = window.innerWidth * 0.18; // 18% drag triggers page change

      const currEl = document.getElementById('page-slot-curr');
      const prevEl = document.getElementById('page-slot-prev');
      const nextEl = document.getElementById('page-slot-next');

      [prevEl, currEl, nextEl].forEach(el => {
        if (el) el.style.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
      });

      // Swipe Right-to-Left (currentDeltaX < -threshold) -> NEXT PAGE
      if (currentDeltaX < -threshold && currentPage < TOTAL_PAGES) {
        currEl.style.transform = 'translateX(-100vw)';
        nextEl.style.transform = 'translateX(0)';
        setTimeout(() => {
          currentPage++;
          currEl.style.transition = 'none';
          nextEl.style.transition = 'none';
          currEl.style.transform = 'translateX(0)';
          nextEl.style.transform = 'translateX(-100vw)';
          updatePageSlots();
        }, 280);
      }
      // Swipe Left-to-Right (currentDeltaX > threshold) -> PREVIOUS PAGE
      else if (currentDeltaX > threshold && currentPage > 1) {
        currEl.style.transform = 'translateX(100vw)';
        prevEl.style.transform = 'translateX(0)';
        setTimeout(() => {
          currentPage--;
          currEl.style.transition = 'none';
          prevEl.style.transition = 'none';
          currEl.style.transform = 'translateX(0)';
          prevEl.style.transform = 'translateX(100vw)';
          updatePageSlots();
        }, 280);
      }
      // Snap back to current page
      else {
        currEl.style.transform = 'translateX(0)';
        if (prevEl) prevEl.style.transform = 'translateX(100vw)';
        if (nextEl) nextEl.style.transform = 'translateX(-100vw)';
      }
    });

    // Also support mouse dragging on web browser preview
    let isMouseDown = false;
    viewport.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      startX = e.clientX;
      currentDeltaX = 0;
      document.querySelectorAll('.mushaf-page').forEach(el => el.style.transition = 'none');
    });
    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      currentDeltaX = e.clientX - startX;
      const currEl = document.getElementById('page-slot-curr');
      const prevEl = document.getElementById('page-slot-prev');
      const nextEl = document.getElementById('page-slot-next');
      currEl.style.transform = 'translateX(' + currentDeltaX + 'px)';
      if (prevEl) prevEl.style.transform = 'translateX(' + (currentDeltaX + window.innerWidth) + 'px)';
      if (nextEl) nextEl.style.transform = 'translateX(' + (currentDeltaX - window.innerWidth) + 'px)';
    });
    window.addEventListener('mouseup', () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      const threshold = window.innerWidth * 0.18;
      const currEl = document.getElementById('page-slot-curr');
      const prevEl = document.getElementById('page-slot-prev');
      const nextEl = document.getElementById('page-slot-next');
      [prevEl, currEl, nextEl].forEach(el => {
        if (el) el.style.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
      });
      if (currentDeltaX < -threshold && currentPage < TOTAL_PAGES) {
        currEl.style.transform = 'translateX(-100vw)';
        nextEl.style.transform = 'translateX(0)';
        setTimeout(() => {
          currentPage++;
          currEl.style.transition = 'none';
          nextEl.style.transition = 'none';
          currEl.style.transform = 'translateX(0)';
          nextEl.style.transform = 'translateX(-100vw)';
          updatePageSlots();
        }, 280);
      } else if (currentDeltaX > threshold && currentPage > 1) {
        currEl.style.transform = 'translateX(100vw)';
        prevEl.style.transform = 'translateX(0)';
        setTimeout(() => {
          currentPage--;
          currEl.style.transition = 'none';
          prevEl.style.transition = 'none';
          currEl.style.transform = 'translateX(0)';
          prevEl.style.transform = 'translateX(100vw)';
          updatePageSlots();
        }, 280);
      } else {
        currEl.style.transform = 'translateX(0)';
        if (prevEl) prevEl.style.transform = 'translateX(100vw)';
        if (nextEl) nextEl.style.transform = 'translateX(-100vw)';
      }
    });

    // Support Arrow keys navigation on PC/Web
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        if (currentPage < TOTAL_PAGES) {
          currentPage++;
          updatePageSlots();
        }
      } else if (e.key === 'ArrowRight') {
        if (currentPage > 1) {
          currentPage--;
          updatePageSlots();
        }
      }
    });

    // Initialize first render immediately
    updatePageSlots();
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
