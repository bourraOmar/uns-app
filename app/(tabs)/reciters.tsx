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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { RECITERS_DATA, Reciter } from '@/data/reciters';

// --- CUSTOM SVG ICONS MATCHING SCREENSHOT EXACTLY ---

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
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Floating menu bar animation
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

  // Filter reciters based on search and selected narration filter
  const filteredReciters = useMemo(() => {
    return RECITERS_DATA.filter((r) => {
      // Filter type check
      if (filter === 'hafs' && !r.rewaya.includes('حفص')) return false;
      if (filter === 'multiple' && !r.rewaya.includes('روايا')) return false;

      // Search query check
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return r.name.toLowerCase().includes(q) || r.rewaya.toLowerCase().includes(q);
    });
  }, [search, filter]);

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

  const renderReciterCard = ({ item }: { item: Reciter }) => (
    <TouchableOpacity
      style={styles.reciterCard}
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      {/* Left side: Chevron arrow pointing left */}
      <Ionicons name="chevron-back" size={18} color="#64748b" style={styles.chevronIcon} />

      {/* Center: Reciter details aligned right */}
      <View style={styles.reciterInfoContainer}>
        <Text style={styles.reciterName}>{item.name}</Text>
        <View style={styles.rewayaRow}>
          <Ionicons name="document-text-outline" size={13} color="#85998a" />
          <Text style={styles.rewayaText}>{item.rewaya}</Text>
          {item.badge && (
            <>
              <Text style={styles.badgeSeparator}>•</Text>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </>
          )}
        </View>
      </View>

      {/* Right side: Circular microphone badge replacing photo profile */}
      <View style={styles.micCircleBadge}>
        <Ionicons name="mic" size={24} color="#34d399" />
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
          <Ionicons name="chevron-forward" size={20} color="#ffffff" />
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
              الكل
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

      {/* SCREEN TITLE: "القُرّاء" (Large Bold Right-Aligned Title) */}
      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>القُرّاء</Text>
      </View>

      {/* SEARCH BAR (Toggled via Bottom Left Search Button) */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن اسم القارئ أو الرواية..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* RECITERS SINGLE-COLUMN LIST */}
      <FlatList
        data={filteredReciters}
        keyExtractor={(item) => item.id}
        renderItem={renderReciterCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* BOTTOM FLOATING BAR: COLLAPSED OR EXPANDED */}
      {showFloatingMenu ? (
        <>
          {/* Backdrop to dismiss expanded floating menu */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowFloatingMenu(false)}
          />

          {/* Expanded 5-Item Floating Menu Bar with iOS Glass Effect */}
          <Animated.View
            style={[
              styles.floatingMenuAnimContainer,
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
            <BlurView
              intensity={Platform.OS === 'ios' ? 75 : 90}
              tint="dark"
              style={styles.floatingMenuBar}
            >
              {/* 1. الخدمات (Services / Duas - Far Left) */}
              <TouchableOpacity
                style={styles.floatingMenuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFloatingMenu(false);
                  router.push('/duas' as any);
                }}
                activeOpacity={0.7}
              >
                <ServicesMosqueIcon size={21} color="#8ba7c0" />
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
                <MaterialCommunityIcons name="format-quote-close" size={22} color="#8ba7c0" />
                <Text style={styles.floatingMenuItemText}>الأذكار</Text>
              </TouchableOpacity>

              {/* 3. المصحف (Quran Book) */}
              <TouchableOpacity
                style={styles.floatingMenuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFloatingMenu(false);
                  router.push('/quran' as any);
                }}
                activeOpacity={0.7}
              >
                <MushafSquareBookIcon size={21} color="#8ba7c0" />
                <Text style={styles.floatingMenuItemText}>المصحف</Text>
              </TouchableOpacity>

              {/* 4. المُشغّل (ACTIVE Player Tab with glowing emerald capsule) */}
              <TouchableOpacity
                style={styles.activePillTouchable}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFloatingMenu(false);
                }}
                activeOpacity={0.8}
              >
                <BlurView
                  intensity={Platform.OS === 'ios' ? 40 : 60}
                  tint="dark"
                  style={styles.floatingMenuItemActivePill}
                >
                  <PlayerBookRaysIcon size={21} color="#34d399" />
                  <Text style={styles.floatingMenuItemActiveText}>المُشغّل</Text>
                </BlurView>
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
                <Ionicons name="home-outline" size={20} color="#8ba7c0" />
                <Text style={styles.floatingMenuItemText}>الرئيسية</Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </>
      ) : (
        /* Collapsed State: 2 Circular Floating Buttons matching screenshot */
        <View style={styles.floatingActionsContainer} pointerEvents="box-none">
          {/* Left: Circular Search Button */}
          <TouchableOpacity
            style={styles.floatingCircleButton}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSearch(!showSearch);
            }}
          >
            <Ionicons name="search" size={22} color="#ffffff" />
          </TouchableOpacity>

          {/* Right: Circular Player Button (Expands Floating Menu) */}
          <TouchableOpacity
            style={styles.floatingCircleButton}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFloatingMenu(true);
            }}
          >
            <PlayerBookRaysIcon size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1712',
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
    backgroundColor: '#1a231d',
    borderWidth: 1,
    borderColor: '#27362b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a231d',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#27362b',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 8,
  },
  filterPillText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },

  /* FILTER DROPDOWN MENU */
  filterDropdownMenu: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: '#162119',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27362b',
    overflow: 'hidden',
  },
  filterMenuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterMenuItemActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
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
  screenTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 30,
    color: '#c6eed5',
    textAlign: 'right',
  },

  /* SEARCH BAR */
  searchBarContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#162119',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#27362b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Cairo_500Medium',
    color: '#ffffff',
  },

  /* LIST & CARDS */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 12,
  },
  reciterCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#151e18',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  micCircleBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reciterInfoContainer: {
    flex: 1,
    marginRight: 14,
    alignItems: 'flex-end',
  },
  reciterName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
    color: '#ffffff',
    textAlign: 'right',
  },
  rewayaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
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
    marginHorizontal: 2,
  },
  badgeText: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 12,
    color: '#a7f3d0',
  },
  chevronIcon: {
    marginLeft: 6,
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
    backgroundColor: '#18231b',
    borderWidth: 1,
    borderColor: '#2b3b2f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
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
    backgroundColor: Platform.OS === 'ios' ? 'rgba(21, 30, 24, 0.55)' : 'rgba(21, 30, 24, 0.88)',
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
