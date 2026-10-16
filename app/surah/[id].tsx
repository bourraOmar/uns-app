import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  FlatList,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import surahsData from '@/data/surahs.json';
import {
  PRELOADED_PAGES,
  PreloadedPage,
  toEasternArabicNumerals,
  QuranLine,
  StandardVerse,
} from '@/data/quranPages';
import SurahBanner from '@/components/quran/SurahBanner';
import VerseMedallion from '@/components/quran/VerseMedallion';
import PageBadge from '@/components/quran/PageBadge';
import { SurahItem } from '@/context/AudioPlayerContext';

export default function SurahReaderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: windowWidth } = useWindowDimensions();

  const surahId = parseInt(id || '1', 10);
  const currentSurah = (surahsData as SurahItem[]).find((s) => s.id === surahId) || (surahsData[0] as SurahItem);

  // Initial page for this surah
  const initialPage = currentSurah.start_page || 1;
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // Dynamic pages cache
  const [pagesCache, setPagesCache] = useState<Record<number, PreloadedPage>>(PRELOADED_PAGES);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);

  // FlatList ref for paging
  const flatListRef = useRef<FlatList>(null);

  // Fetch page if not in cache
  const loadPageData = useCallback(async (pageNum: number) => {
    if (pagesCache[pageNum]) return;

    try {
      setIsLoadingPage(true);
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_page/${pageNum}?fields=text_uthmani`);
      if (!res.ok) throw new Error('Failed to fetch page');
      const data = await res.json();
      const rawVerses: any[] = data.verses || [];

      if (rawVerses.length === 0) return;

      const firstVerse = rawVerses[0];
      const pageSurahId = parseInt(firstVerse.verse_key.split(':')[0], 10);
      const matchedSurah = (surahsData as SurahItem[]).find((s) => s.id === pageSurahId) || currentSurah;

      const standardVerses: StandardVerse[] = rawVerses.map((v) => ({
        number: v.verse_number,
        text: v.text_uthmani,
      }));

      const newPage: PreloadedPage = {
        pageNumber: pageNum,
        surahId: pageSurahId,
        surahName: matchedSurah.vocalized_name,
        juzNumber: firstVerse.juz_number || 1,
        hizbNumber: firstVerse.hizb_number,
        hasBanner: pageNum === matchedSurah.start_page && pageNum > 2,
        bannerTitle: matchedSurah.vocalized_name,
        hasBasmalah: pageNum === matchedSurah.start_page && pageSurahId !== 1 && pageSurahId !== 9,
        isCustomCentered: false,
        verses: standardVerses,
      };

      setPagesCache((prev) => ({ ...prev, [pageNum]: newPage }));
    } catch {
      // Keep silent fallback
    } finally {
      setIsLoadingPage(false);
    }
  }, [pagesCache, currentSurah]);

  useEffect(() => {
    loadPageData(currentPage);
  }, [currentPage, loadPageData]);

  // Current page data
  const pageData = pagesCache[currentPage] || {
    pageNumber: currentPage,
    surahId: currentSurah.id,
    surahName: currentSurah.vocalized_name,
    juzNumber: 1,
    hasBanner: false,
    bannerTitle: currentSurah.vocalized_name,
    hasBasmalah: false,
    isCustomCentered: false,
    verses: [],
  };

  const handleNextPage = () => {
    if (currentPage < 604) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentPage((prev) => prev - 1);
    }
  };

  /* RENDER 1: Custom Centered Lines (Page 1 Al-Fatiha & Page 2 Al-Baqarah 1-5) */
  const renderCenteredLines = (lines: QuranLine[]) => {
    return (
      <View style={styles.centeredLinesContainer}>
        {lines.map((line, idx) => (
          <View key={`line-${idx}`} style={styles.centeredVerseRow}>
            {line.tokens.map((token, tIdx) => {
              if (token.type === 'text') {
                return (
                  <Text key={`txt-${tIdx}`} style={styles.centeredQuranText}>
                    {token.text}
                  </Text>
                );
              }
              if (token.type === 'verse' && token.number !== undefined) {
                return (
                  <VerseMedallion key={`med-${tIdx}`} number={token.number} />
                );
              }
              return null;
            })}
          </View>
        ))}
      </View>
    );
  };

  /* RENDER 2: Standard Full-Width Page (Page 3+ and other pages) */
  const renderStandardVerses = (verses: StandardVerse[]) => {
    if (isLoadingPage && verses.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>جاري تحميل الصفحة...</Text>
        </View>
      );
    }

    return (
      <View style={styles.standardTextContainer}>
        <Text style={styles.standardQuranParagraph}>
          {verses.map((v) => (
            <React.Fragment key={`v-${v.number}`}>
              {v.text}
              <Text style={styles.inlineVerseMedallion}>
                {' '}﴿{toEasternArabicNumerals(v.number)}﴾{' '}
              </Text>
            </React.Fragment>
          ))}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* TOP HEADER BAR */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color="#cbd5e1" />
          </TouchableOpacity>
          <Text style={styles.topSurahName}>{pageData.surahName}</Text>
        </View>

        <View style={styles.topHeaderRight}>
          <Text style={styles.topJuzInfo}>
            الجزء {toEasternArabicNumerals(pageData.juzNumber)}
            {pageData.hizbNumber ? `   حزب ${toEasternArabicNumerals(pageData.hizbNumber)}` : ''}
          </Text>
        </View>
      </View>

      {/* MAIN MUSHAF PAGE BODY */}
      <View style={styles.pageBodyWrapper}>
        {/* Decorative Surah Banner (When Surah starts on this page) */}
        {pageData.hasBanner && (
          <SurahBanner title={pageData.bannerTitle} />
        )}

        {/* Basmalah */}
        {pageData.hasBasmalah && (
          <View style={styles.basmalahContainer}>
            <View style={styles.basmalahRow}>
              <Text style={styles.basmalahText}>
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </Text>
              {pageData.basmalahWithAyah ? (
                <VerseMedallion number={pageData.basmalahWithAyah} />
              ) : null}
            </View>
          </View>
        )}

        {/* Verses Content Area */}
        <View style={styles.versesContentArea}>
          {pageData.isCustomCentered && pageData.lines
            ? renderCenteredLines(pageData.lines)
            : renderStandardVerses(pageData.verses || [])}
        </View>

        {/* Navigation Touch Controls for Paging (Left = Next, Right = Prev in RTL) */}
        <View style={styles.pageTurnRow}>
          {currentPage > 1 ? (
            <TouchableOpacity
              style={styles.pageNavArrow}
              onPress={handlePrevPage}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward" size={16} color="#64748b" />
            </TouchableOpacity>
          ) : (
            <View style={styles.pageNavPlaceholder} />
          )}

          {/* Bottom Page Badge */}
          <PageBadge number={currentPage} />

          {currentPage < 604 ? (
            <TouchableOpacity
              style={styles.pageNavArrow}
              onPress={handleNextPage}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color="#64748b" />
            </TouchableOpacity>
          ) : (
            <View style={styles.pageNavPlaceholder} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  /* TOP HEADER BAR */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSurahName: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 19,
    color: '#e2e8f0',
    includeFontPadding: false,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topJuzInfo: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
  },

  /* PAGE BODY */
  pageBodyWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },

  /* BASMALAH */
  basmalahContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  basmalahRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basmalahText: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 23,
    color: '#f8fafc',
    textAlign: 'center',
    includeFontPadding: false,
  },

  /* VERSES CONTENT AREA */
  versesContentArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },

  /* CUSTOM CENTERED LINES (Page 1 & Page 2) */
  centeredLinesContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  centeredVerseRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredQuranText: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 21.5,
    color: '#f8fafc',
    textAlign: 'center',
    includeFontPadding: false,
  },

  /* STANDARD CONTINUOUS VERSES (Page 3+) */
  standardTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  standardQuranParagraph: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 21,
    lineHeight: 46,
    color: '#f8fafc',
    textAlign: 'justify',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  inlineVerseMedallion: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 21,
    color: '#10b981',
    includeFontPadding: false,
  },

  /* LOADING */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#94a3b8',
  },

  /* PAGE TURN CONTROLS */
  pageTurnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 4 : 8,
  },
  pageNavArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNavPlaceholder: {
    width: 36,
    height: 36,
  },
});
