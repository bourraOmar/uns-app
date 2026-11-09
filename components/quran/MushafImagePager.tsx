import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMushafPageUrl,
  getPageMetadata,
  preloadNearbyPages,
} from '@/services/mushafPageService';

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
}: MushafImagePagerProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState<number>(() => Math.max(1, Math.min(604, initialPage)));
  const [loadedPages, setLoadedPages] = useState<Record<number, boolean>>({});

  const flatListRef = useRef<FlatList<number>>(null);

  // Handle hardware Android back button
  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

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

  const renderPageItem = useCallback(
    ({ item: pageNum }: { item: number }) => {
      const imageUrl = getMushafPageUrl(pageNum);
      const isLoaded = loadedPages[pageNum];

      return (
        <View
          style={[
            styles.pageSlide,
            {
              width: screenWidth,
              height: screenHeight,
              paddingTop: insets.top > 0 ? insets.top + 4 : 8,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
            },
          ]}
        >
          {/* Subtle loading spinner for first time load */}
          {!isLoaded && (
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={isDark ? '#34d399' : '#0f8e5d'} />
              </View>
            </View>
          )}

          <Image
            source={{ uri: imageUrl, cache: 'force-cache' }}
            style={[
              styles.pageImage,
              isDark && { tintColor: '#ffffff' },
            ]}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() => {
              setLoadedPages((prev) => ({ ...prev, [pageNum]: true }));
            }}
          />
        </View>
      );
    },
    [screenWidth, screenHeight, insets, loadedPages, isDark]
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
    <View style={[styles.container, { backgroundColor: isDark ? '#222825' : '#fcfbfa' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#222825' : '#fcfbfa'}
        translucent
      />

      {/* 604-Page Horizontal Swiper (Swipe only, no buttons) */}
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
    paddingHorizontal: 6,
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
