import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScrollCollapse } from '@/context/ScrollCollapseContext';
import { useAppTheme } from '@/context/ThemeContext';
import IslamicBackground from '@/components/IslamicBackground';
import surahsData from '../../data/surahs.json';

interface SurahItem {
  id: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: string;
  verses_count: number;
  start_page: number;
  vocalized_name: string;
}

interface RecentReadingItem {
  id: string;
  surahId: number;
  surahName: string;
  page: number;
  timeAgo: string;
}

// Initial realistic reading history matching screenshot exactly
const INITIAL_RECENT_READINGS: RecentReadingItem[] = [
  {
    id: '8',
    surahId: 8,
    surahName: 'سورة الأنفال',
    page: 177,
    timeAgo: 'قبل 5 أيام',
  },
  {
    id: '7',
    surahId: 7,
    surahName: 'سورة الأعراف',
    page: 175,
    timeAgo: 'قبل 5 أيام',
  },
  {
    id: '2',
    surahId: 2,
    surahName: 'سورة البقرة',
    page: 2,
    timeAgo: 'الأسبوع الماضي',
  },
  {
    id: '1',
    surahId: 1,
    surahName: 'سورة الفاتحة',
    page: 1,
    timeAgo: 'الأسبوع الماضي',
  },
  {
    id: '3',
    surahId: 3,
    surahName: 'سورة آل عمران',
    page: 50,
    timeAgo: 'قبل أسبوعين',
  },
];

interface SwipeableReadingRowProps {
  item: RecentReadingItem;
  isLast: boolean;
  onPress: () => void;
  onDelete: (id: string) => void;
}

function SwipeableReadingRow({ item, isLast, onPress, onDelete }: SwipeableReadingRowProps) {
  const { isDark } = useAppTheme();
  const [pan] = useState(() => new Animated.Value(0));
  const [rowHeight] = useState(() => new Animated.Value(68));
  const [rowOpacity] = useState(() => new Animated.Value(1));
  const [isOpen, setIsOpen] = useState(false);

  const resetPosition = useCallback(() => {
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 4,
    }).start(() => setIsOpen(false));
  }, [pan]);

  const openDelete = useCallback(() => {
    Animated.spring(pan, {
      toValue: -80,
      useNativeDriver: false,
      bounciness: 4,
    }).start(() => setIsOpen(true));
  }, [pan]);

  const triggerDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(pan, {
        toValue: -400,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(rowOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      Animated.timing(rowHeight, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start(() => {
        onDelete(item.id);
      });
    });
  }, [item.id, onDelete, pan, rowHeight, rowOpacity]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 10 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
          );
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            pan.setValue(Math.max(-120, gestureState.dx + (isOpen ? -80 : 0)));
          } else if (isOpen && gestureState.dx > 0) {
            pan.setValue(Math.min(0, -80 + gestureState.dx));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -110 || gestureState.vx < -0.8) {
            triggerDelete();
          } else if (gestureState.dx < -40 || (isOpen && gestureState.dx < 20)) {
            openDelete();
          } else {
            resetPosition();
          }
        },
      }),
    [isOpen, openDelete, pan, resetPosition, triggerDelete]
  );

  const handleDeletePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(pan, {
        toValue: -400,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(rowOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      Animated.timing(rowHeight, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start(() => {
        onDelete(item.id);
      });
    });
  };

  const deleteOpacity = pan.interpolate({
    inputRange: [-80, -10, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.swipeableContainer, { height: rowHeight, opacity: rowOpacity, backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
      {/* Background Red Delete Button (only revealed when actively swiping left) */}
      <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.8}
          onPress={handleDeletePress}
        >
          <Ionicons name="trash-outline" size={20} color="#ffffff" />
          <Text style={styles.deleteButtonText}>حذف</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Foreground Row */}
      <Animated.View
        style={[
          styles.readingItemRow,
          !isLast && styles.readingItemBorder,
          {
            transform: [{ translateX: pan }],
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderBottomColor: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)',
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.readingItemInner}
          activeOpacity={0.7}
          onPress={() => {
            if (isOpen) {
              resetPosition();
            } else {
              onPress();
            }
          }}
        >
          {/* Left: Page Number with Chevron Pill */}
          <View
            style={[
              styles.readingPageWrapper,
              {
                backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                borderColor: isDark ? 'rgba(51, 65, 85, 0.6)' : '#e2e8f0',
              },
            ]}
          >
            <Ionicons name="chevron-back" size={13} color={isDark ? '#cbd5e1' : '#475569'} />
            <Text style={[styles.readingPageNumber, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              {item.page}
            </Text>
          </View>

          {/* Center: Surah Title & Time Ago */}
          <View style={styles.readingInfoWrapper}>
            <Text style={[styles.readingSurahName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{item.surahName}</Text>
            <Text style={[styles.readingTimeAgo, { color: isDark ? '#94a3b8' : '#64748b' }]}>{item.timeAgo}</Text>
          </View>

          {/* Right: Circular History Clock Icon */}
          <View style={[styles.readingHistoryCircle, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(16, 185, 129, 0.12)' }]}>
            <MaterialCommunityIcons name="history" size={18} color={isDark ? '#34d399' : '#059669'} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function QuranScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const flatListRef = useRef<FlatList<SurahItem>>(null);
  const {
    onScroll,
    searchQuery,
    setSearchPlaceholder,
    openSearch,
    closeSearch,
    isSearchActive,
  } = useScrollCollapse();

  const colors = {
    title: isDark ? '#f8fafc' : '#0f172a',
    subtitle: isDark ? '#94a3b8' : '#64748b',
    headerBtnBg: isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.9)',
    headerBtnBorder: isDark ? '#334155' : '#cbd5e1',
    headerBtnIcon: isDark ? '#f8fafc' : '#1e293b',
    trackBg: isDark ? '#1e293b' : 'rgba(226, 232, 240, 0.85)',
    trackBorder: isDark ? '#334155' : '#cbd5e1',
    tabActiveBg: isDark ? '#0f172a' : '#ffffff',
    tabActiveText: isDark ? '#f8fafc' : '#0f172a',
    tabInactiveText: isDark ? '#64748b' : '#64748b',
    cardBg: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.92)',
    cardBorder: isDark ? '#334155' : 'rgba(226, 232, 240, 0.95)',
    cardShadow: isDark ? '#000' : '#94a3b8',
    surahName: isDark ? '#f8fafc' : '#0f172a',
    pillBg: isDark ? '#0f172a' : '#f1f5f9',
    pillBorder: isDark ? 'rgba(51, 65, 85, 0.6)' : '#e2e8f0',
    pillText: isDark ? '#cbd5e1' : '#475569',
    resultsBadgeBg: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.9)',
    resultsBadgeText: isDark ? '#94a3b8' : '#475569',
    filterBtnBg: isDark ? '#1e293b' : '#ffffff',
    filterBtnBorder: isDark ? '#334155' : '#cbd5e1',
    filterBtnText: isDark ? '#cbd5e1' : '#1e293b',
  };

  const searchParams = useLocalSearchParams<{ tab?: string }>();
  const [selectedTab, setSelectedTab] = useState<'mushaf' | 'readings' | null>(null);
  const activeTab = selectedTab ?? (searchParams.tab === 'mushaf' ? 'mushaf' : 'readings');
  const setActiveTab = (tab: 'mushaf' | 'readings') => setSelectedTab(tab);

  useEffect(() => {
    setSearchPlaceholder('ابحث عن اسم السورة أو رقمها...');
  }, [setSearchPlaceholder]);

  // Recent Readings state
  const [recentReadings, setRecentReadings] = useState<RecentReadingItem[]>(INITIAL_RECENT_READINGS);

  const loadRecentReadings = async () => {
    try {
      const saved = await AsyncStorage.getItem('@uns_recent_readings');
      if (saved) {
        setRecentReadings(JSON.parse(saved));
      }
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      loadRecentReadings();
    }, [])
  );

  const handleOpenSurah = async (surah: SurahItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add to history
    const newItem: RecentReadingItem = {
      id: surah.id.toString(),
      surahId: surah.id,
      surahName: `سورة ${surah.name_arabic}`,
      page: surah.start_page,
      timeAgo: 'اليوم',
    };
    const filtered = recentReadings.filter((r) => r.surahId !== surah.id);
    const updated = [newItem, ...filtered].slice(0, 10);
    setRecentReadings(updated);
    try {
      await AsyncStorage.setItem('@uns_recent_readings', JSON.stringify(updated));
      await AsyncStorage.setItem(
        '@uns_last_read',
        JSON.stringify({
          surahId: surah.id,
          surahName: `سورة ${surah.name_arabic}`,
          page: surah.start_page,
          versesCount: surah.verses_count,
          revelationPlace: surah.revelation_place,
          timeAgo: 'اليوم',
        })
      );
    } catch {}
    router.push({ pathname: '/surah/[id]', params: { id: surah.id.toString() } });
  };

  const handleDeleteReading = async (id: string) => {
    const updated = recentReadings.filter((item) => item.id !== id);
    setRecentReadings(updated);
    try {
      await AsyncStorage.setItem('@uns_recent_readings', JSON.stringify(updated));
      if (updated.length > 0) {
        const top = updated[0];
        const surah = (surahsData as any[]).find((s) => s.id === top.surahId);
        await AsyncStorage.setItem(
          '@uns_last_read',
          JSON.stringify({
            surahId: top.surahId,
            surahName: top.surahName,
            page: top.page,
            versesCount: surah ? surah.verses_count : 7,
            revelationPlace: surah ? surah.revelation_place : 'makkah',
            timeAgo: top.timeAgo,
          })
        );
      } else {
        await AsyncStorage.removeItem('@uns_last_read');
      }
    } catch {}
  };

  // Filtered Surahs based on search query
  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahsData as SurahItem[];
    const q = searchQuery.trim().toLowerCase();
    return (surahsData as SurahItem[]).filter((s) => {
      return (
        s.name_arabic.includes(q) ||
        s.vocalized_name.includes(q) ||
        s.name_simple.toLowerCase().includes(q) ||
        s.id.toString() === q
      );
    });
  }, [searchQuery]);

  const renderSurahCard = ({ item }: { item: SurahItem }) => {
    const isMakki = item.revelation_place === 'makkah';

    return (
      <TouchableOpacity
        style={[
          styles.surahCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            shadowColor: colors.cardShadow,
          },
        ]}
        activeOpacity={0.75}
        onPress={() => handleOpenSurah(item)}
      >
        {/* Left Section: Verses Pill + Revelation Place + Page Number */}
        <View style={styles.cardLeftSection}>
          {/* Pill Badge */}
          <View
            style={[
              styles.versesBadgePill,
              {
                backgroundColor: colors.pillBg,
                borderColor: colors.pillBorder,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={13} color={colors.pillText} />
            <Text style={[styles.versesBadgeText, { color: colors.pillText }]}>
              {item.verses_count} {item.verses_count <= 10 ? 'آيات' : 'آية'}
            </Text>
          </View>

          {/* Place & Page Metadata */}
          <View style={styles.metaRow}>
            <Text style={[styles.revelationText, { color: colors.subtitle }]}>{isMakki ? 'مكية' : 'مدنية'}</Text>
            <Text style={[styles.dotSeparator, { color: colors.subtitle }]}>•</Text>
            <Text style={[styles.pageNumberText, { color: colors.subtitle }]}>{item.start_page} الصفحة</Text>
          </View>
        </View>

        {/* Right Section: Vocalized Name + Islamic Geometric Star with Number */}
        <View style={styles.cardRightSection}>
          <Text style={[styles.surahVocalizedName, { color: colors.surahName }]} numberOfLines={1}>
            {item.vocalized_name}
          </Text>

          {/* Islamic Star Shape with Number in Center */}
          <View style={styles.starContainer}>
            <Image
              source={require('../../assets/images/islamic_star.png')}
              style={styles.starIconImage}
              resizeMode="contain"
            />
            <Text style={styles.starNumberText}>{item.id}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* TOP HEADER MATCHING DHIKR PAGE */}
      <View style={styles.header}>
        {/* Left Action Buttons: Profile, Bookmarks/Readings, Search */}
        <View style={styles.headerActionsLeft}>
          {/* Profile / Services shortcut */}
          <TouchableOpacity
            style={[
              styles.headerCircleButton,
              {
                backgroundColor: colors.headerBtnBg,
                borderColor: colors.headerBtnBorder,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/duas' as any);
            }}
          >
            <Ionicons name="person-outline" size={18} color={colors.headerBtnIcon} />
          </TouchableOpacity>

          {/* Bookmarks / Readings Button */}
          <TouchableOpacity
            style={[
              styles.headerCircleButton,
              {
                backgroundColor: colors.headerBtnBg,
                borderColor: colors.headerBtnBorder,
              },
              activeTab === 'readings' && styles.headerCircleButtonActive,
            ]}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(activeTab === 'readings' ? 'mushaf' : 'readings');
            }}
          >
            <Ionicons
              name={activeTab === 'readings' ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={activeTab === 'readings' ? '#10b981' : colors.headerBtnIcon}
            />
          </TouchableOpacity>

          {/* Search Toggle Button */}
          <TouchableOpacity
            style={[
              styles.headerCircleButton,
              {
                backgroundColor: colors.headerBtnBg,
                borderColor: colors.headerBtnBorder,
              },
              isSearchActive && styles.headerCircleButtonActive,
            ]}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (isSearchActive) {
                closeSearch();
              } else {
                openSearch();
              }
            }}
          >
            <Ionicons
              name={isSearchActive ? 'close' : 'search-outline'}
              size={18}
              color={isSearchActive ? '#10b981' : colors.headerBtnIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Right: Title "المصحف" */}
        <Text style={[styles.headerTitle, { color: colors.title }]}>المصحف</Text>
      </View>

      {/* SEGMENTED PILL TABS ("المصحف" / "قراءاتي") */}
      <View style={styles.segmentedTabsContainer}>
        <View style={[styles.segmentedTabsTrack, { backgroundColor: colors.trackBg, borderColor: colors.trackBorder }]}>
          {/* المصحف */}
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === 'mushaf' && [styles.segmentTabActive, { backgroundColor: colors.tabActiveBg }],
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('mushaf');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                activeTab === 'mushaf'
                  ? [styles.segmentTabTextActive, { color: colors.tabActiveText }]
                  : { color: colors.tabInactiveText },
              ]}
            >
              المصحف
            </Text>
          </TouchableOpacity>

          {/* قراءاتي */}
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === 'readings' && [styles.segmentTabActive, { backgroundColor: colors.tabActiveBg }],
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('readings');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                activeTab === 'readings'
                  ? [styles.segmentTabTextActive, { color: colors.tabActiveText }]
                  : { color: colors.tabInactiveText },
              ]}
            >
              قراءاتي
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB 1: قراءاتي (READINGS & HISTORY TAB) */}
      {activeTab === 'readings' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.readingsScrollContent}
        >
          {/* Section: آخر قراءاتي */}
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity style={styles.seeAllButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={14} color={colors.subtitle} />
              <Text style={[styles.seeAllText, { color: colors.subtitle }]}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionHeaderTitle, { color: colors.title }]}>آخر قراءاتي</Text>
          </View>

          {/* Recent Readings List Card Container */}
          <View style={[styles.readingsListCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            {recentReadings.length > 0 ? (
              recentReadings.map((item, index) => {
                const isLast = index === recentReadings.length - 1;
                return (
                  <SwipeableReadingRow
                    key={item.id}
                    item={item}
                    isLast={isLast}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/surah/[id]',
                        params: { id: item.surahId.toString() },
                      });
                    }}
                    onDelete={handleDeleteReading}
                  />
                );
              })
            ) : (
              <View style={styles.emptyHistoryBox}>
                <MaterialCommunityIcons name="history" size={34} color={colors.subtitle} />
                <Text style={[styles.emptyHistoryText, { color: colors.title }]}>لا توجد قراءات في السجل</Text>
                <Text style={[styles.emptyHistorySubText, { color: colors.subtitle }]}>
                  السور التي تقرؤها ستظهر هنا تلقائياً
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        /* TAB 2: المصحف (SURAHS LIST TAB) */
        <>
          {/* FILTER ROW: "العرض: السور ⬍" */}
          <View style={styles.filterRow}>
            <View style={[styles.resultsBadge, { backgroundColor: colors.resultsBadgeBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.resultsBadgeText, { color: colors.resultsBadgeText }]}>{filteredSurahs.length} سورة</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.filterDropdownButton,
                { backgroundColor: colors.filterBtnBg, borderColor: colors.filterBtnBorder },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-vertical" size={14} color={colors.filterBtnText} />
              <Text style={[styles.filterDropdownText, { color: colors.filterBtnText }]}>العرض: السور</Text>
            </TouchableOpacity>
          </View>

          {/* MAIN CONTENT AREA: SURAHS LIST */}
          <View style={styles.contentRow}>
            {/* SURAHS LIST OR EMPTY STATE */}
            {filteredSurahs.length > 0 ? (
              <FlatList
                ref={flatListRef}
                data={filteredSurahs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSurahCard}
                contentContainerStyle={styles.surahListContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScroll={onScroll}
                scrollEventThrottle={16}
                onScrollToIndexFailed={(info) => {
                  flatListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                }}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyCircleIcon}>
                  <Ionicons name="close" size={26} color="#f8fafc" />
                </View>
                <Text style={styles.emptyTitle}>لا توجد نتائج لما تبحث عنه!</Text>
                <Text style={styles.emptySubtitle}>
                  لم نعثر على سورة باسم أو رقم &quot;{searchQuery}&quot;
                </Text>
              </View>
            )}
          </View>
        </>
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

  /* HEADER MATCHING DHIKR PAGE */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 32,
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  headerActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCircleButtonActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },

  /* SEARCH BAR */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    textAlign: 'right',
  },
  clearSearchBtn: {
    padding: 4,
  },

  /* SEGMENTED TABS */
  segmentedTabsContainer: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
  },
  segmentedTabsTrack: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  segmentTabActive: {
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#64748b',
  },
  segmentTabTextActive: {
    color: '#f8fafc',
    fontFamily: 'Cairo_700Bold',
  },

  /* READINGS TAB (قراءاتي) */
  readingsScrollContent: {
    paddingBottom: 110,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#f8fafc',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
  },

  /* Recent Readings Card Container */
  readingsListCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    outlineWidth: 0,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    borderWidth: 0,
    outlineWidth: 0,
  },
  deleteButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  readingItemRow: {
    backgroundColor: '#1e293b',
    width: '100%',
    zIndex: 2,
  },
  readingItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    outlineWidth: 0,
  },
  readingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  emptyHistoryBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyHistoryText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  emptyHistorySubText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#64748b',
  },
  readingHistoryCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingInfoWrapper: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 14,
  },
  readingSurahName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#f8fafc',
  },
  readingTimeAgo: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  readingPageWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    minWidth: 42,
    gap: 4,
  },
  readingPageNumber: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#cbd5e1',
    includeFontPadding: false,
    lineHeight: 16,
  },

  /* FILTER ROW (المصحف Tab) */
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  resultsBadge: {
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsBadgeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#94a3b8',
  },
  filterDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterDropdownText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#cbd5e1',
  },

  /* MAIN CONTENT AREA */
  contentRow: {
    flex: 1,
  },

  /* SURAH LIST */
  surahListContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },

  /* SURAH CARD */
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  /* CARD LEFT SECTION (Verses Pill + Place + Page) */
  cardLeftSection: {
    alignItems: 'flex-start',
    gap: 6,
  },
  versesBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    gap: 4,
  },
  versesBadgeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#cbd5e1',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 2,
  },
  revelationText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#94a3b8',
  },
  dotSeparator: {
    fontSize: 10,
    color: '#64748b',
  },
  pageNumberText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#94a3b8',
  },

  /* CARD RIGHT SECTION (Vocalized Name + Star Badge) */
  cardRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  surahVocalizedName: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 20,
    color: '#f8fafc',
    textAlign: 'right',
  },
  starContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  starIconImage: {
    width: 44,
    height: 44,
    tintColor: '#34d399',
  },
  starNumberText: {
    position: 'absolute',
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#f8fafc',
    textAlign: 'center',
  },

  /* FLOATING CIRCULAR BUTTONS (Collapsed State) */
  floatingActionsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingCircleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(30, 41, 59, 0.94)',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },

  /* FLOATING MENU BAR (Expanded State with iOS Glass Effect) */
  floatingMenuAnimContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },
  floatingMenuBar: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 41, 59, 0.55)' : 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderTopColor: 'rgba(255, 255, 255, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  floatingMenuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 54,
    gap: 3,
  },
  floatingMenuItemText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#8ba7c0',
  },
  floatingMenuItemActivePill: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 142, 93, 0.22)',
    borderWidth: 1.5,
    borderColor: '#0f8e5d',
    borderRadius: 22,
    paddingVertical: 5,
    paddingHorizontal: 16,
    minWidth: 70,
    gap: 2,
  },
  floatingMenuItemActiveText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#34d399',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 140,
  },
  emptyCircleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 19,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 13,
    color: '#85998a',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
});
