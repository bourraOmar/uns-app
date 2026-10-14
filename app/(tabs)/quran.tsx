import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
        onPress={() => {
          // Navigate to Surah / Page reader
        }}
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
          {/* قراءاتي */}
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'readings' && styles.segmentTabActive]}
            onPress={() => setActiveTab('readings')}
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

          {/* المصحف */}
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'mushaf' && styles.segmentTabActive]}
            onPress={() => setActiveTab('mushaf')}
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
        </View>
      </View>

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
                  <Text style={[styles.juzNumberText, isSelected && styles.juzNumberTextActive]}>
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

      {/* FLOATING ACTION BUTTONS AT BOTTOM */}
      <View style={styles.floatingActionsContainer} pointerEvents="box-none">
        {/* Floating Search Action (Bottom Left) */}
        <TouchableOpacity
          style={styles.floatingSearchButton}
          activeOpacity={0.85}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons name="search" size={20} color="#34d399" />
        </TouchableOpacity>

        {/* Floating Mushaf Reader Action (Bottom Right) */}
        <TouchableOpacity style={styles.floatingMushafButton} activeOpacity={0.85}>
          <Text style={styles.floatingMushafText}>المصحف</Text>
          <Ionicons name="book" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
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

  /* FILTER ROW */
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
    paddingBottom: 90,
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

  /* FLOATING ACTIONS AT BOTTOM */
  floatingActionsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingSearchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#34d399',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  floatingMushafButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f8e5d',
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 48,
    shadowColor: '#0f8e5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingMushafText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
});
