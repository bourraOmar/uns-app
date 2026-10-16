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
import Svg, { Path } from 'react-native-svg';
import { useScrollCollapse } from '@/context/ScrollCollapseContext';
import {
  RECITERS_DATA,
  Reciter,
  fetchRecitersFromMp3Quran,
  matchesReciter,
} from '@/data/reciters';

// --- CUSTOM SVG ICONS ---

// 1. Square Open Book Icon (Used for المصحف)
function MushafSquareBookIcon({ size = 22, color = '#cbd5e1' }: { size?: number; color?: string }) {
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

type FilterType = 'all' | 'hafs' | 'multiple';

export default function RecitersScreen() {
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);

  // Reciters State: start with initial local data, then populate from MP3Quran API
  const [reciters, setReciters] = useState<Reciter[]>(RECITERS_DATA);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const [search, setSearch] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
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

  const { onScroll, registerSearchHandler } = useScrollCollapse();

  useEffect(() => {
    return registerSearchHandler(() => {
      handleOpenSearch();
    });
  }, [registerSearchHandler]);

  const handleOpenSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchActive(true);
    setShowFloatingMenu(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleCloseSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearch('');
    setIsSearchActive(false);
    Keyboard.dismiss();
  };

  // Detect if current query is in English for dynamic text alignment
  const isEnglishQuery = useMemo(() => {
    return /^[a-zA-Z0-9\s-_'.,]+$/.test(search.trim());
  }, [search]);

  // Filter reciters based on bilingual search and selected narration filter
  const filteredReciters = useMemo(() => {
    return reciters.filter((r) => {
      // Filter type check
      if (filter === 'hafs' && !r.rewaya.includes('حفص')) return false;
      if (filter === 'multiple' && !r.rewaya.includes('روايا')) return false;

      // Bilingual search query check (supports Arabic & English)
      return matchesReciter(r, search);
    });
  }, [reciters, search, filter]);

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
      style={styles.reciterCard}
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
      <Ionicons name="chevron-back" size={18} color="#64748b" style={styles.chevronIcon} />

      {/* 2. Middle: Reciter details aligned to the right */}
      <View style={styles.reciterInfoContainer}>
        <Text style={styles.reciterName}>{item.name}</Text>
        <View style={styles.rewayaRow}>
          {item.badge && (
            <>
              <Text style={styles.badgeText}>{item.badge}</Text>
              <Text style={styles.badgeSeparator}>•</Text>
            </>
          )}
          <Text style={styles.rewayaText}>{item.rewaya}</Text>
          <Ionicons name="document-text-outline" size={13} color="#94a3b8" />
        </View>
      </View>

      {/* 3. Right side: Circular microphone badge in app brand emerald */}
      <View style={styles.micCircleBadge}>
        <Ionicons name="mic" size={22} color="#34d399" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* TOP NAVIGATION BAR */}
      <View style={styles.topBar}>
        {/* Filter Dropdown Pill Button on the Left */}
        <TouchableOpacity
          style={styles.filterPillButton}
          activeOpacity={0.75}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFilterMenu(!showFilterMenu);
          }}
        >
          <Ionicons name="swap-vertical" size={15} color="#94a3b8" />
          <Text style={styles.filterPillText}>{filterLabel}</Text>
        </TouchableOpacity>

        {/* Circular Back Button on the Right */}
        <TouchableOpacity
          style={styles.backCircleButton}
          activeOpacity={0.75}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-forward" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {/* FILTER DROPDOWN OPTIONS (Collapsible) */}
      {showFilterMenu && (
        <View style={styles.filterDropdownMenu}>
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
                filter === 'multiple' && styles.filterMenuItemTextActive,
              ]}
            >
              روايات متعددة
            </Text>
            {filter === 'multiple' && <Ionicons name="checkmark" size={16} color="#34d399" />}
          </TouchableOpacity>
        </View>
      )}

      {/* SCREEN TITLE: "القُرّاء" with optional count */}
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          {isLoadingApi && (
            <ActivityIndicator size="small" color="#34d399" style={styles.loadingSpinner} />
          )}
          <Text style={styles.screenTitle}>القُرّاء</Text>
        </View>
      </View>

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
              لم نعثر على نتيجة باسم &quot;{search}&quot; ، جرب البحث باسم آخر أو بالاسم الكامل
            </Text>
          </View>
        )}

        {/* BOTTOM ACTIVE SEARCH BAR (WHEN USER TAPS SEARCH) */}
        {isSearchActive && (
          <View style={styles.bottomBarRow} pointerEvents="box-none">
            <View style={styles.bottomSearchCapsule}>
              {/* Clear / Close X Button on the Left */}
              <TouchableOpacity
                style={styles.searchCloseCircle}
                onPress={() => {
                  if (search.length > 0) {
                    setSearch('');
                  } else {
                    handleCloseSearch();
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={14} color="#f8fafc" />
              </TouchableOpacity>

              {/* Search Text Input in the Center (supports Arabic & English) */}
              <TextInput
                ref={searchInputRef}
                style={styles.bottomSearchInput}
                placeholder="ابحث باسم القارئ (عربي / English)..."
                placeholderTextColor="#64748b"
                value={search}
                onChangeText={setSearch}
                textAlign={isEnglishQuery ? 'left' : 'right'}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />

              {/* Search Magnifying Glass Icon on the Right */}
              <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchMagnifierIcon} />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Website dark slate navy (slate-900)
  },
  contentWrapper: {
    flex: 1,
  },

  /* TOP NAVIGATION BAR */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 8,
  },
  filterPillText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#f8fafc',
  },

  /* FILTER DROPDOWN MENU */
  filterDropdownMenu: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 8,
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

  /* TITLE */
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: 'flex-end',
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
    fontSize: 28,
    color: '#f8fafc',
    textAlign: 'right',
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
