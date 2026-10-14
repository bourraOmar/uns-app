import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import surahsData from '../../data/surahs.json';

// --- CUSTOM SVG ICONS MATCHING SCREENSHOT EXACTLY ---

// 1. Square Open Book Icon (Used for Mushaf both in circle button and menu pill)
function MushafSquareBookIcon({ size = 22, color = '#f8fafc' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5H10.5C11.5 6.5 12 7.2 12 8V18.5C11.5 17.8 10.5 17.2 9.5 17.2H4V6.5Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <Path
        d="M20 6.5H13.5C12.5 6.5 12 7.2 12 8V18.5C12.5 17.8 13.5 17.2 14.5 17.2H20V6.5Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 2. Open Book with Radiating Rays Icon (Used for المُشغّل / Player)
function PlayerBookRaysIcon({ size = 22, color = '#cbd5e1' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2.5V5.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M6 4.5L8.5 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M18 4.5L15.5 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path
        d="M4.5 10.5H10.5C11.5 10.5 12 11.2 12 12V19.5C11.5 18.8 10.5 18.3 9.5 18.3H4.5V10.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path
        d="M19.5 10.5H13.5C12.5 10.5 12 11.2 12 12V19.5C12.5 18.8 13.5 18.3 14.5 18.3H19.5V10.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 3. Mosque / Gate Facade Icon (Used for الخدمات / Services)
function ServicesMosqueIcon({ size = 22, color = '#cbd5e1' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21V12C4 10 6 7 12 7C18 7 20 10 20 12V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 21V15C8.5 13.5 10 12.5 12 12.5C14 12.5 15.5 13.5 15.5 15V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M12 3V7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M2.5 21H21.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

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

// Map each Juz (1..30) to its approximate starting Surah ID
const JUZ_START_SURAH: Record<number, number> = {
  1: 1,
  2: 2,
  3: 2,
  4: 3,
  5: 4,
  6: 4,
  7: 5,
  8: 6,
  9: 7,
  10: 8,
  11: 9,
  12: 11,
  13: 12,
  14: 15,
  15: 17,
  16: 18,
  17: 21,
  18: 23,
  19: 25,
  20: 27,
  21: 29,
  22: 33,
  23: 36,
  24: 39,
  25: 41,
  26: 46,
  27: 51,
  28: 58,
  29: 67,
  30: 78,
};

const JUZ_LIST = Array.from({ length: 30 }, (_, i) => i + 1);

export default function QuranScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<SurahItem>>(null);

  const [activeTab, setActiveTab] = useState<'mushaf' | 'readings'>('mushaf');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeJuz, setActiveJuz] = useState<number | null>(null);

  // Recent Readings state
  const [recentReadings, setRecentReadings] = useState<RecentReadingItem[]>(INITIAL_RECENT_READINGS);

  useEffect(() => {
    loadRecentReadings();
  }, []);

  const loadRecentReadings = async () => {
    try {
      const saved = await AsyncStorage.getItem('@uns_recent_readings');
      if (saved) {
        setRecentReadings(JSON.parse(saved));
      }
    } catch {}
  };

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
    } catch {}
  };

  // Floating Menu Bar state & animation
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showFloatingMenu) {
      Animated.spring(menuAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 65,
      }).start();
    } else {
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showFloatingMenu]);

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

  // Scroll to Surah for selected Juz
  const handleSelectJuz = (juz: number) => {
    setActiveJuz(juz);
    const targetSurahId = JUZ_START_SURAH[juz] || 1;
    const index = filteredSurahs.findIndex((s) => s.id >= targetSurahId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.1,
      });
    }
  };

  const renderSurahCard = ({ item }: { item: SurahItem }) => {
    const isMakki = item.revelation_place === 'makkah';

    return (
      <TouchableOpacity
        style={styles.surahCard}
        activeOpacity={0.75}
        onPress={() => handleOpenSurah(item)}
      >
        {/* Left Section: Verses Pill + Revelation Place + Page Number */}
        <View style={styles.cardLeftSection}>
          {/* Pill Badge */}
          <View style={styles.versesBadgePill}>
            <Ionicons name="chevron-back" size={13} color="#94a3b8" />
            <Text style={styles.versesBadgeText}>
              {item.verses_count} {item.verses_count <= 10 ? 'آيات' : 'آية'}
            </Text>
          </View>

          {/* Place & Page Metadata */}
          <View style={styles.metaRow}>
            <Text style={styles.revelationText}>{isMakki ? 'مكية' : 'مدنية'}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.pageNumberText}>{item.start_page} الصفحة</Text>
          </View>
        </View>

        {/* Right Section: Vocalized Name + Islamic Geometric Star with Number */}
        <View style={styles.cardRightSection}>
          <Text style={styles.surahVocalizedName} numberOfLines={1}>
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        {/* Left Action Buttons */}
        <View style={styles.headerActionsLeft}>
          {/* Profile Button (Emerald Circle) */}
          <TouchableOpacity style={styles.profileCircleButton} activeOpacity={0.8}>
            <Ionicons name="person" size={16} color="#ffffff" />
          </TouchableOpacity>

          {/* Bookmarks Button */}
          <TouchableOpacity style={styles.headerCircleButton} activeOpacity={0.8}>
            <Ionicons name="bookmark-outline" size={17} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Search Toggle Button */}
          <TouchableOpacity
            style={[styles.headerCircleButton, showSearch && styles.headerCircleButtonActive]}
            activeOpacity={0.8}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons
              name={showSearch ? 'close' : 'search'}
              size={17}
              color={showSearch ? '#34d399' : '#cbd5e1'}
            />
          </TouchableOpacity>
        </View>

        {/* Right Title + Back Button */}
        <View style={styles.headerTitleRight}>
          <Text style={styles.headerTitle}>المصحف</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={20} color="#f8fafc" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR (Toggled or inline) */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن اسم السورة أو رقمها..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* SEGMENTED PILL TABS ("المصحف" / "قراءاتي") */}
      <View style={styles.segmentedTabsContainer}>
        <View style={styles.segmentedTabsTrack}>
          {/* المصحف */}
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'mushaf' && styles.segmentTabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('mushaf');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                activeTab === 'mushaf' && styles.segmentTabTextActive,
              ]}
            >
              المصحف
            </Text>
          </TouchableOpacity>

          {/* قراءاتي */}
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'readings' && styles.segmentTabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('readings');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                activeTab === 'readings' && styles.segmentTabTextActive,
              ]}
            >
              قراءاتي
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB 1: قراءاتي (READINGS & HISTORY TAB) matching screenshot */}
      {activeTab === 'readings' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.readingsScrollContent}
        >
          {/* Section 1: ختماتي */}
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity style={styles.seeAllButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={14} color="#94a3b8" />
              <Text style={styles.seeAllText}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={styles.sectionHeaderTitle}>ختماتي</Text>
          </View>

          {/* Start New Khatmah Card */}
          <TouchableOpacity style={styles.newKhatmahCard} activeOpacity={0.8}>
            {/* Left: Plus icon */}
            <View style={styles.plusIconWrapper}>
              <Ionicons name="add" size={24} color="#cbd5e1" />
            </View>

            {/* Center: Title */}
            <Text style={styles.newKhatmahTitle}>ابدأ بـ ختمة جديدة</Text>

            {/* Right: Circular Calligraphy Emblem */}
            <View style={styles.khatmahCalligraphyWrapper}>
              <Image
                source={require('../../assets/images/quran-calligraphy.png')}
                style={styles.khatmahCalligraphyImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          {/* Section 2: آخر قراءاتي */}
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity style={styles.seeAllButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={14} color="#94a3b8" />
              <Text style={styles.seeAllText}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={styles.sectionHeaderTitle}>آخر قراءاتي</Text>
          </View>

          {/* Recent Readings List Card Container */}
          <View style={styles.readingsListCard}>
            {recentReadings.map((item, index) => {
              const isLast = index === recentReadings.length - 1;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.readingItemRow, !isLast && styles.readingItemBorder]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  {/* Left: Page Number with Chevron */}
                  <View style={styles.readingPageWrapper}>
                    <Ionicons name="chevron-back" size={14} color="#64748b" />
                    <Text style={styles.readingPageNumber}>{item.page}</Text>
                  </View>

                  {/* Center: Surah Title & Time Ago */}
                  <View style={styles.readingInfoWrapper}>
                    <Text style={styles.readingSurahName}>{item.surahName}</Text>
                    <Text style={styles.readingTimeAgo}>{item.timeAgo}</Text>
                  </View>

                  {/* Right: Circular History Clock Icon */}
                  <View style={styles.readingHistoryCircle}>
                    <MaterialCommunityIcons name="history" size={18} color="#34d399" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* TAB 2: المصحف (SURAHS LIST TAB) */
        <>
          {/* FILTER ROW: "العرض: السور ⬍" */}
          <View style={styles.filterRow}>
            <View style={styles.resultsBadge}>
              <Text style={styles.resultsBadgeText}>{filteredSurahs.length} سورة</Text>
            </View>

            <TouchableOpacity style={styles.filterDropdownButton} activeOpacity={0.8}>
              <Ionicons name="swap-vertical" size={14} color="#94a3b8" />
              <Text style={styles.filterDropdownText}>العرض: السور</Text>
            </TouchableOpacity>
          </View>

          {/* MAIN CONTENT AREA: JUZ RAIL ON LEFT + SURAHS LIST ON RIGHT */}
          <View style={styles.contentRow}>
            {/* VERTICAL JUZ INDEX RAIL (Left side: 1..30) */}
            <View style={styles.juzRailContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.juzRailContent}
              >
                {JUZ_LIST.map((juz) => {
                  const isSelected = activeJuz === juz;
                  return (
                    <TouchableOpacity
                      key={juz}
                      onPress={() => handleSelectJuz(juz)}
                      style={[styles.juzNumberItem, isSelected && styles.juzNumberItemActive]}
                      hitSlop={{ top: 4, bottom: 4, left: 6, right: 6 }}
                    >
                      <Text
                        style={[
                          styles.juzNumberText,
                          isSelected && styles.juzNumberTextActive,
                        ]}
                      >
                        {juz}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* SURAHS LIST */}
            <FlatList
              ref={flatListRef}
              data={filteredSurahs}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSurahCard}
              contentContainerStyle={styles.surahListContent}
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={(info) => {
                flatListRef.current?.scrollToOffset({
                  offset: info.averageItemLength * info.index,
                  animated: true,
                });
              }}
            />
          </View>
        </>
      )}

      {/* FLOATING ACTIONS / MENU AT BOTTOM */}
      {showFloatingMenu ? (
        <>
          {/* Backdrop to dismiss menu when tapping outside */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowFloatingMenu(false)}
          />

          {/* Expanded Floating Menu Bar matching screenshot */}
          <Animated.View
            style={[
              styles.floatingMenuBar,
              {
                opacity: menuAnim,
                transform: [
                  {
                    scale: menuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.88, 1],
                    }),
                  },
                  {
                    translateY: menuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* 1. الخدمات (Services / Duas / Qibla - Far Left) */}
            <TouchableOpacity
              style={styles.floatingMenuItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFloatingMenu(false);
                router.push('/duas' as any);
              }}
              activeOpacity={0.7}
            >
              <ServicesMosqueIcon size={21} color="#cbd5e1" />
              <Text style={styles.floatingMenuItemText}>الخدمات</Text>
            </TouchableOpacity>

            {/* 2. الأذكار (Adhkar / Quotes) */}
            <TouchableOpacity
              style={styles.floatingMenuItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFloatingMenu(false);
                router.push('/adhkar' as any);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="format-quote-close" size={22} color="#cbd5e1" />
              <Text style={styles.floatingMenuItemText}>الأذكار</Text>
            </TouchableOpacity>

            {/* 3. المصحف (Active Tab with highlighted oval capsule) */}
            <TouchableOpacity
              style={styles.floatingMenuItemActivePill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFloatingMenu(false);
              }}
              activeOpacity={0.8}
            >
              <MushafSquareBookIcon size={21} color="#ffffff" />
              <Text style={styles.floatingMenuItemActiveText}>المصحف</Text>
            </TouchableOpacity>

            {/* 4. المُشغّل (Player / Reciters) */}
            <TouchableOpacity
              style={styles.floatingMenuItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFloatingMenu(false);
                router.push('/reciters' as any);
              }}
              activeOpacity={0.7}
            >
              <PlayerBookRaysIcon size={21} color="#cbd5e1" />
              <Text style={styles.floatingMenuItemText}>المُشغّل</Text>
            </TouchableOpacity>

            {/* 5. الرئيسية (Home - Far Right) */}
            <TouchableOpacity
              style={styles.floatingMenuItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFloatingMenu(false);
                router.replace('/');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="home-outline" size={20} color="#cbd5e1" />
              <Text style={styles.floatingMenuItemText}>الرئيسية</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : (
        /* Collapsed Floating Circular Buttons (Search on Left, Book on Right) matching screenshot */
        <View style={styles.floatingActionsContainer} pointerEvents="box-none">
          {/* Floating Search Button (Bottom Left) */}
          <TouchableOpacity
            style={styles.floatingCircleButton}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSearch(!showSearch);
            }}
          >
            <Ionicons name="search" size={22} color="#f8fafc" />
          </TouchableOpacity>

          {/* Floating Book Button (Bottom Right) -> Toggles Floating Menu Bar */}
          <TouchableOpacity
            style={styles.floatingCircleButton}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFloatingMenu(true);
            }}
          >
            <MushafSquareBookIcon size={22} color="#f8fafc" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 26,
    color: '#f8fafc',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f8e5d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f8e5d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCircleButtonActive: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
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

  /* New Khatmah Card */
  newKhatmahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  khatmahCalligraphyWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#263d32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  khatmahCalligraphyImage: {
    width: 36,
    height: 36,
    tintColor: '#a7f3d0',
  },
  newKhatmahTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#f8fafc',
    flex: 1,
    textAlign: 'right',
    paddingRight: 14,
  },
  plusIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  readingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.45)',
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
    gap: 6,
  },
  readingPageNumber: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#cbd5e1',
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

  /* MAIN CONTENT ROW (RAIL + LIST) */
  contentRow: {
    flex: 1,
    flexDirection: 'row',
  },

  /* VERTICAL JUZ RAIL (Far Left) */
  juzRailContainer: {
    width: 28,
    paddingVertical: 4,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(51, 65, 85, 0.35)',
  },
  juzRailContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  juzNumberItem: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  juzNumberItemActive: {
    backgroundColor: '#0f8e5d',
  },
  juzNumberText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 10,
    color: '#64748b',
  },
  juzNumberTextActive: {
    color: '#ffffff',
    fontFamily: 'Cairo_700Bold',
  },

  /* SURAH LIST */
  surahListContent: {
    paddingLeft: 12,
    paddingRight: 16,
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
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },

  /* FLOATING MENU BAR (Expanded State) */
  floatingMenuBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(26, 38, 30, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
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
    color: '#cbd5e1',
  },
  floatingMenuItemActivePill: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 142, 93, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: 22,
    paddingVertical: 5,
    paddingHorizontal: 16,
    minWidth: 70,
    gap: 2,
  },
  floatingMenuItemActiveText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#ffffff',
  },
});
