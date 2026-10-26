import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useScrollCollapse } from '@/context/ScrollCollapseContext';
import { useAppTheme } from '@/context/ThemeContext';
import IslamicBackground from '@/components/IslamicBackground';
import {
  RECITERS_DATA,
  Reciter,
  fetchRecitersFromMp3Quran,
  matchesReciter,
} from '@/data/reciters';

type FilterType = 'all' | 'hafs' | 'multiple';

export default function RecitersScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const searchInputRef = useRef<TextInput>(null);

  const colors = {
    title: isDark ? '#f8fafc' : '#0f172a',
    subtitle: isDark ? '#94a3b8' : '#64748b',
    cardBg: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.92)',
    cardBorder: isDark ? '#334155' : 'rgba(226, 232, 240, 0.95)',
    cardShadow: isDark ? '#000' : '#94a3b8',
    headerBtnBg: isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.9)',
    headerBtnBorder: isDark ? '#334155' : '#cbd5e1',
    headerBtnIcon: isDark ? '#f8fafc' : '#1e293b',
    micBadgeBg: isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(16, 185, 129, 0.12)',
    micBadgeBorder: isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.25)',
    micColor: isDark ? '#34d399' : '#059669',
    menuBg: isDark ? '#1e293b' : '#ffffff',
    menuBorder: isDark ? '#334155' : '#e2e8f0',
  };

  // Reciters State: start with initial local data, then populate from MP3Quran API
  const [reciters, setReciters] = useState<Reciter[]>(RECITERS_DATA);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Floating menu bar animation
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  // Fetch full reciters directory from MP3Quran.net on mount
  useEffect(() => {
    loadReciters();
  }, []);

  const loadReciters = async () => {
    setIsLoadingApi(true);
    try {
      const data = await fetchRecitersFromMp3Quran();
      if (data && data.length > 0) {
        setReciters(data);
      }
    } catch (e) {
      console.warn('Error loading reciters:', e);
    } finally {
      setIsLoadingApi(false);
    }
  };

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

  const { onScroll, searchQuery, setSearchPlaceholder, openSearch, closeSearch, isSearchActive } = useScrollCollapse();

  useEffect(() => {
    setSearchPlaceholder('ابحث باسم القارئ (عربي / English)...');
  }, [setSearchPlaceholder]);

  // Filter reciters based on bilingual search and selected narration filter
  const filteredReciters = useMemo(() => {
    return reciters.filter((r) => {
      // Filter type check
      if (filter === 'hafs' && !r.rewaya.includes('حفص')) return false;
      if (filter === 'multiple' && !r.rewaya.includes('روايا')) return false;

      // Bilingual search query check (supports Arabic & English)
      return matchesReciter(r, searchQuery);
    });
  }, [reciters, searchQuery, filter]);

  const filterLabel = useMemo(() => {
    switch (filter) {
      case 'hafs':
        return 'حفص عن عاصم';
      case 'multiple':
        return 'روايات متعددة';
      default:
        return 'الكل';
    }
  }, [filter]);

  // Card Render matching the app's website dark slate + emerald color theme:
  // Far Left: Chevron '<'
  // Middle: Reciter Name + Riwayah Info (with document icon on the right of the text)
  // Far Right: Circular Microphone Badge in emerald tint
  const renderReciterCard = ({ item }: { item: Reciter }) => (
    <TouchableOpacity
      style={[
        styles.reciterCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          shadowColor: colors.cardShadow,
        },
      ]}
      activeOpacity={0.75}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: '/reciter/[id]',
          params: {
            id: item.id,
            name: item.name,
            rewaya: item.rewaya,
            server: item.server || '',
          },
        } as any);
      }}
    >
      {/* 1. Left side: Chevron arrow '<' pointing left */}
      <Ionicons name="chevron-back" size={18} color={colors.subtitle} style={styles.chevronIcon} />

      {/* 2. Middle: Reciter details aligned to the right */}
      <View style={styles.reciterInfoContainer}>
        <Text style={[styles.reciterName, { color: colors.title }]}>{item.name}</Text>
        <View style={styles.rewayaRow}>
          {item.badge && (
            <>
              <Text style={styles.badgeText}>{item.badge}</Text>
              <Text style={[styles.badgeSeparator, { color: colors.subtitle }]}>•</Text>
            </>
          )}
          <Text style={[styles.rewayaText, { color: colors.subtitle }]}>{item.rewaya}</Text>
          <Ionicons name="document-text-outline" size={13} color={colors.subtitle} />
        </View>
      </View>

      {/* 3. Right side: Circular microphone badge in app brand emerald */}
      <View
        style={[
          styles.micCircleBadge,
          {
            backgroundColor: colors.micBadgeBg,
            borderColor: colors.micBadgeBorder,
          },
        ]}
      >
        <Ionicons name="mic" size={22} color={colors.micColor} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* TOP HEADER MATCHING DHIKR PAGE */}
      <View style={styles.topHeader}>
        {/* Left Action Buttons: Profile, Filter/Bookmarks, Search */}
        <View style={styles.leftActions}>
          {/* Profile / Services shortcut */}
          <TouchableOpacity
            style={[
              styles.circleActionBtn,
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

          {/* Filter Dropdown Toggle Button */}
          <TouchableOpacity
            style={[
              styles.circleActionBtn,
              {
                backgroundColor: colors.headerBtnBg,
                borderColor: colors.headerBtnBorder,
              },
              showFilterMenu && styles.circleActionBtnActive,
            ]}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFilterMenu(!showFilterMenu);
            }}
          >
            <Ionicons
              name="swap-vertical"
              size={18}
              color={showFilterMenu ? '#10b981' : colors.headerBtnIcon}
            />
          </TouchableOpacity>

          {/* Search Toggle Button */}
          <TouchableOpacity
            style={[
              styles.circleActionBtn,
              {
                backgroundColor: colors.headerBtnBg,
                borderColor: colors.headerBtnBorder,
              },
              isSearchActive && styles.circleActionBtnActive,
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

        {/* Right: Screen Title "القُرّاء" with optional loading spinner */}
        <View style={styles.titleRow}>
          {isLoadingApi && (
            <ActivityIndicator size="small" color="#34d399" style={styles.loadingSpinner} />
          )}
          <Text style={[styles.screenTitle, { color: colors.title }]}>القُرّاء</Text>
        </View>
      </View>

      {/* FILTER DROPDOWN OPTIONS (Collapsible) */}
      {showFilterMenu && (
        <View style={[styles.filterDropdownMenu, { backgroundColor: colors.menuBg, borderColor: colors.menuBorder }]}>
          <TouchableOpacity
            style={[styles.filterMenuItem, filter === 'all' && styles.filterMenuItemActive]}
            onPress={() => {
              setFilter('all');
              setShowFilterMenu(false);
            }}
          >
            <Text
              style={[
                styles.filterMenuItemText,
                { color: filter === 'all' ? '#10b981' : colors.subtitle },
                filter === 'all' && styles.filterMenuItemTextActive,
              ]}
            >
              الكل ({reciters.length})
            </Text>
            {filter === 'all' && <Ionicons name="checkmark" size={16} color="#34d399" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterMenuItem, filter === 'hafs' && styles.filterMenuItemActive]}
            onPress={() => {
              setFilter('hafs');
              setShowFilterMenu(false);
            }}
          >
            <Text
              style={[
                styles.filterMenuItemText,
                { color: filter === 'hafs' ? '#10b981' : colors.subtitle },
                filter === 'hafs' && styles.filterMenuItemTextActive,
              ]}
            >
              حفص عن عاصم
            </Text>
            {filter === 'hafs' && <Ionicons name="checkmark" size={16} color="#34d399" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterMenuItem, filter === 'multiple' && styles.filterMenuItemActive]}
            onPress={() => {
              setFilter('multiple');
              setShowFilterMenu(false);
            }}
          >
            <Text
              style={[
                styles.filterMenuItemText,
                { color: filter === 'multiple' ? '#10b981' : colors.subtitle },
                filter === 'multiple' && styles.filterMenuItemTextActive,
              ]}
            >
              روايات متعددة
            </Text>
            {filter === 'multiple' && <Ionicons name="checkmark" size={16} color="#34d399" />}
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN CONTENT AREA */}
      <KeyboardAvoidingView
        style={styles.contentWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {filteredReciters.length > 0 ? (
          /* RECITERS SINGLE-COLUMN LIST */
          <FlatList
            data={filteredReciters}
            keyExtractor={(item) => item.id}
            renderItem={renderReciterCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={onScroll}
            scrollEventThrottle={16}
          />
        ) : (
          /* EMPTY STATE MATCHING SCREENSHOT EXACTLY */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircleIcon}>
              <Ionicons name="close" size={26} color="#f8fafc" />
            </View>
            <Text style={styles.emptyTitle}>لا توجد نتائج لما تبحث عنه!</Text>
            <Text style={styles.emptySubtitle}>
              لم نعثر على نتيجة باسم &quot;{searchQuery}&quot; ، جرب البحث باسم آخر أو بالاسم الكامل
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    flex: 1,
  },

  /* TOP HEADER MATCHING DHIKR PAGE */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleActionBtn: {
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
  circleActionBtnActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingSpinner: {
    marginRight: 4,
  },
  screenTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 32,
    color: '#f8fafc',
    letterSpacing: -0.3,
    textAlign: 'right',
  },

  /* FILTER DROPDOWN MENU */
  filterDropdownMenu: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  filterMenuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  filterMenuItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  filterMenuItemText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'right',
  },
  filterMenuItemTextActive: {
    color: '#34d399',
  },

  /* LIST & CARDS */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  reciterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b', // Slate 800 card matching website
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155', // Slate 700 border
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  chevronIcon: {
    marginRight: 6,
  },
  reciterInfoContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 14,
  },
  reciterName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#f8fafc',
    textAlign: 'right',
  },
  rewayaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 6,
  },
  rewayaText: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
  badgeSeparator: {
    fontSize: 11,
    color: '#64748b',
  },
  badgeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#34d399',
  },
  micCircleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* EMPTY STATE */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },

  /* BOTTOM BAR ROW */
  bottomBarRow: {
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
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },

  /* EXPANDED BOTTOM SEARCH CAPSULE */
  bottomSearchCapsule: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSearchInput: {
    flex: 1,
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#f8fafc',
    textAlign: 'right',
    paddingHorizontal: 8,
  },
  searchMagnifierIcon: {
    marginLeft: 4,
  },
  searchCloseCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
  activePillTouchable: {
    borderRadius: 22,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingMenuItemActivePill: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(15, 142, 93, 0.28)' : 'rgba(15, 142, 93, 0.35)',
    borderWidth: 1.2,
    borderColor: 'rgba(52, 211, 153, 0.5)',
    borderTopColor: 'rgba(110, 231, 183, 0.8)',
    borderRadius: 22,
    overflow: 'hidden',
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
});
