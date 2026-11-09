import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMushafPageUrl,
  getPageMetadata,
  preloadNearbyPages,
} from '@/services/mushafPageService';
import { toEasternArabicNumerals } from '@/data/quranPages';

const TOTAL_PAGES = 604;
const ALL_PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

interface MushafImagePagerProps {
  initialPage: number;
  isDark: boolean;
  onBack: () => void;
  onToggleTextMode?: () => void;
}

export default function MushafImagePager({
  initialPage,
  isDark,
  onBack,
  onToggleTextMode,
}: MushafImagePagerProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [currentPage, setCurrentPage] = useState<number>(() => Math.max(1, Math.min(604, initialPage)));
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [loadedPages, setLoadedPages] = useState<Record<number, boolean>>({});

  const flatListRef = useRef<FlatList<number>>(null);
  const overlaysOpacity = useRef(new Animated.Value(1)).current;

  // Toggle Header and Footer overlay visibility with animation
  const toggleOverlays = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowOverlays((prev) => {
      const nextVal = !prev;
      Animated.timing(overlaysOpacity, {
        toValue: nextVal ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return nextVal;
    });
  }, [overlaysOpacity]);

  // Current page metadata
  const currentMeta = useMemo(() => getPageMetadata(currentPage), [currentPage]);

  // Save last read position
  const saveReadingProgress = useCallback(async (p: number) => {
    try {
      const meta = getPageMetadata(p);
      const item = {
        surahId: meta.surahId,
        surahName: `سورة ${meta.surahName}`,
        page: p,
        versesCount: 0,
        revelationPlace: 'makkah',
        timeAgo: 'الآن',
      };
      await AsyncStorage.setItem('@uns_last_read', JSON.stringify(item));
    } catch {}
  }, []);

  // Preload nearby pages when current page changes
  useEffect(() => {
    preloadNearbyPages(currentPage);
    saveReadingProgress(currentPage);
  }, [currentPage, saveReadingProgress]);

  // Handle page scrolling
  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / screenWidth);
      const newPage = index + 1;
      if (newPage >= 1 && newPage <= TOTAL_PAGES && newPage !== currentPage) {
        setCurrentPage(newPage);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [screenWidth, currentPage]
  );

  const jumpToPage = useCallback(
    (pageTarget: number) => {
      const clamped = Math.max(1, Math.min(TOTAL_PAGES, pageTarget));
      setCurrentPage(clamped);
      flatListRef.current?.scrollToIndex({
        index: clamped - 1,
        animated: true,
      });
    },
    []
  );

  const renderPageItem = useCallback(
    ({ item: pageNum }: { item: number }) => {
      const imageUrl = getMushafPageUrl(pageNum);
      const isLoaded = loadedPages[pageNum];

      return (
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleOverlays}
          style={[styles.pageSlide, { width: screenWidth, height: screenHeight }]}
        >
          {/* Subtle loading spinner for first time load */}
          {!isLoaded && (
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0f8e5d" />
              </View>
            </View>
          )}

          <Image
            source={{ uri: imageUrl, cache: 'force-cache' }}
            style={styles.pageImage}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() => {
              setLoadedPages((prev) => ({ ...prev, [pageNum]: true }));
            }}
          />
        </TouchableOpacity>
      );
    },
    [screenWidth, screenHeight, loadedPages, toggleOverlays]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth]
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b0f17' : '#f8f9fa' }]}>
      <StatusBar hidden={!showOverlays} barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 604-Page Horizontal Swiper (Paging Enabled) */}
      <FlatList
        ref={flatListRef}
        data={ALL_PAGES}
        keyExtractor={(item) => item.toString()}
        renderItem={renderPageItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={Math.max(0, initialPage - 1)}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 100);
        }}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={onMomentumScrollEnd}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews
      />

      {/* Top Header Overlay */}
      {showOverlays && (
        <Animated.View style={[styles.topHeaderWrapper, { opacity: overlaysOpacity }]}>
          <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View
              style={[
                styles.topHeader,
                {
                  backgroundColor: isDark ? 'rgba(18, 24, 38, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <TouchableOpacity
                onPress={onBack}
                style={[
                  styles.iconBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-forward" size={20} color={isDark ? '#fff' : '#1e354d'} />
              </TouchableOpacity>

              <View style={styles.headerTitleBox}>
                <Text style={[styles.headerSurahText, { color: isDark ? '#fff' : '#1e354d' }]}>
                  سورة {currentMeta.surahName}
                </Text>
                <Text style={[styles.headerSubText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  الجزء {toEasternArabicNumerals(currentMeta.juz)} • الحزب {toEasternArabicNumerals(currentMeta.hizb)}
                </Text>
              </View>

              {onToggleTextMode && (
                <TouchableOpacity
                  onPress={onToggleTextMode}
                  style={[
                    styles.modeToggleBtn,
                    { backgroundColor: isDark ? 'rgba(15, 142, 93, 0.2)' : 'rgba(15, 142, 93, 0.1)' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="text-outline" size={17} color="#0f8e5d" />
                  <Text style={styles.modeToggleText}>نص</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Bottom Footer Overlay */}
      {showOverlays && (
        <Animated.View style={[styles.bottomFooterWrapper, { opacity: overlaysOpacity }]}>
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            <View
              style={[
                styles.bottomFooter,
                {
                  backgroundColor: isDark ? 'rgba(18, 24, 38, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              {/* Previous Page Button (moves to page - 1) */}
              <TouchableOpacity
                onPress={() => jumpToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                style={[styles.pageNavBtn, currentPage <= 1 && styles.pageNavBtnDisabled]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={currentPage <= 1 ? '#64748b' : '#0f8e5d'}
                />
                <Text
                  style={[
                    styles.pageNavBtnText,
                    { color: currentPage <= 1 ? '#64748b' : '#0f8e5d' },
                  ]}
                >
                  السابقة
                </Text>
              </TouchableOpacity>

              {/* Page Number Badge */}
              <View style={styles.pageCenterBadge}>
                <Text style={[styles.pageNumberText, { color: isDark ? '#fff' : '#1e354d' }]}>
                  صفحة {toEasternArabicNumerals(currentPage)}
                </Text>
                <Text style={styles.mushafNameText}>مصحف مجمع الملك فهد</Text>
              </View>

              {/* Next Page Button (moves to page + 1) */}
              <TouchableOpacity
                onPress={() => jumpToPage(currentPage + 1)}
                disabled={currentPage >= TOTAL_PAGES}
                style={[styles.pageNavBtn, currentPage >= TOTAL_PAGES && styles.pageNavBtnDisabled]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pageNavBtnText,
                    { color: currentPage >= TOTAL_PAGES ? '#64748b' : '#0f8e5d' },
                  ]}
                >
                  التالية
                </Text>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={currentPage >= TOTAL_PAGES ? '#64748b' : '#0f8e5d'}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageSlide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageImage: {
    width: '100%',
    height: '92%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  bottomFooterWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  safeArea: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerSurahText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo_700Bold',
  },
  headerSubText: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Cairo_500Medium',
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modeToggleText: {
    color: '#0f8e5d',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Cairo_700Bold',
  },
  bottomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pageNavBtnDisabled: {
    opacity: 0.4,
  },
  pageNavBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Cairo_700Bold',
  },
  pageCenterBadge: {
    alignItems: 'center',
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo_700Bold',
  },
  mushafNameText: {
    fontSize: 10,
    color: '#0f8e5d',
    marginTop: 1,
    fontFamily: 'Cairo_500Medium',
  },
});
