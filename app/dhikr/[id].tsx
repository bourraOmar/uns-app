import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  Pressable,
  Share,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/context/ThemeContext';
import IslamicBackground from '@/components/IslamicBackground';
import azkarData from '@/data/azkar.json';
import { EXTRA_DHIKR_DATA } from '@/data/extraDhikrs';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Stack Deck Card dimensions
const CARD_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.85), 380);
const CARD_HEIGHT = Math.min(Math.round(SCREEN_HEIGHT * 0.67), 530);

interface DhikrItem {
  id: string;
  content: string;
  count: number;
  description: string;
  reference: string;
}

const CATEGORY_MAP: Record<string, { title: string; categoryKey: string }> = {
  morning: { title: 'أذكار الصباح', categoryKey: 'أذكار الصباح' },
  evening: { title: 'أذكار المساء', categoryKey: 'أذكار المساء' },
  prayer: { title: 'أذكار الصلاة', categoryKey: 'أذكار الصلاة' },
  after_prayer: { title: 'أذكار بعد الصلاة', categoryKey: 'أذكار بعد السلام من الصلاة المفروضة' },
  sleep: { title: 'أذكار النوم', categoryKey: 'أذكار النوم' },
  wake_up: { title: 'أذكار الاستيقاظ', categoryKey: 'أذكار الاستيقاظ' },
  quranic_duas: { title: 'أدعية من القرآن', categoryKey: 'أدعية قرآنية' },
  prophets_duas: { title: 'أدعية النبي', categoryKey: 'أدعية الأنبياء' },
  ruqyah: { title: 'الرقية الشرعية', categoryKey: 'الرقية الشرعية' },
  ramadan: { title: 'سنن رمضان والصيام', categoryKey: 'سنن رمضان والصيام' },
  hajj: { title: 'أعمال الحج والعمرة', categoryKey: 'أعمال الحج والعمرة' },
  fadael: { title: 'قسم الفضائل', categoryKey: 'قسم الفضائل' },
  fadael_dhikr: { title: 'فضل الذكر', categoryKey: 'فضل الذكر' },
  fadael_salawat: { title: 'فضل الصلاة على النبي', categoryKey: 'فضل الصلاة على النبي' },
  fadael_kaaba: { title: 'فضائل تعظيم البيت الحرام', categoryKey: 'فضائل تعظيم البيت الحرام' },
  fadael_madinah: { title: 'فضائل المدينة المنورة', categoryKey: 'فضائل المدينة المنورة' },
  fadael_tasbih: { title: 'فضل التسبيح والتحميد والتهليل والتكبير', categoryKey: 'فضل التسبيح والتحميد والتهليل والتكبير' },
  travel: { title: 'دعاء السفر', categoryKey: 'دعاء السفر' },
  farewell: { title: 'دعاء المسافر للمقيم', categoryKey: 'دعاء المسافر للمقيم' },
  sayyid_istighfar: { title: 'دعاء سيد الاستغفار', categoryKey: 'دعاء سيد الاستغفار' },
  new_clothes: { title: 'دعاء لُبس الثوب الجديد', categoryKey: 'دعاء لُبس الثوب الجديد' },
  wearing_new_clothes: { title: 'الدعاء لمن لبس ثوباً جديداً', categoryKey: 'الدعاء لمن لبس ثوباً جديداً' },
  vehicle_riding: { title: 'دعاء الركوب (السيارة وما نحوها)', categoryKey: 'دعاء الركوب' },
  difficult_affair: { title: 'دعاء من استصعب عليه أمر', categoryKey: 'دعاء من استصعب عليه أمر' },
  anguish_distress: { title: 'دعاء الكرب', categoryKey: 'دعاء الكرب' },
  grief_sorrow: { title: 'دعاء الهم والحزن', categoryKey: 'دعاء الهم والحزن' },
  visiting_sick: { title: 'الدعاء للمريض في عيادته', categoryKey: 'الدعاء للمريض في عيادته' },
};

export default function DhikrCardsStackDeckScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useAppTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isTransitioning = useRef(false);

  // Resolve category configuration
  const categoryConfig = (id && CATEGORY_MAP[id]) || (id && EXTRA_DHIKR_DATA[id]) || {
    title: id ? decodeURIComponent(id) : 'الأذكار',
    categoryKey: id ? decodeURIComponent(id) : 'أذكار الصباح',
  };

  // Extract all raw dhikr items for this category
  const rawList =
    (EXTRA_DHIKR_DATA as any)[id || '']?.items ||
    (azkarData as any)[(categoryConfig as any).categoryKey] ||
    (azkarData as any)[(categoryConfig as any).title] ||
    [];

  const items: DhikrItem[] = useMemo(() => {
    if ((EXTRA_DHIKR_DATA as any)[id || '']?.items) {
      return (EXTRA_DHIKR_DATA as any)[id || ''].items.map((it: any, idx: number) => ({
        id: `${id || 'dhikr'}_${idx}`,
        content: it.content,
        count: it.count || 1,
        description: it.description || '',
        reference: it.reference || '',
      }));
    }
    return (Array.isArray(rawList) ? rawList.flat(Infinity) : []).map(
      (item: any, idx: number) => ({
        id: `${id || 'dhikr'}_${idx}`,
        content: item.content || '',
        count: parseInt(item.count || '1', 10) || 1,
        description: item.description || '',
        reference: item.reference || '',
      })
    );
  }, [rawList, id]);

  const storageKeyCounts = `@dhikr_counts_${id || 'default'}_v1`;
  const storageKeyFavs = `@dhikr_favorites_v1`;
  const storageKeySelected = `@dhikr_selected_${id || 'default'}_v1`;

  // Load favorites and user's selected dhikrs (counts start fresh each session)
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.removeItem(storageKeyCounts).catch(() => {});
        const [savedFavs, savedSelected] = await Promise.all([
          AsyncStorage.getItem(storageKeyFavs),
          AsyncStorage.getItem(storageKeySelected),
        ]);
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
        if (savedSelected) setSelectedIds(JSON.parse(savedSelected));
      } catch (e) {
        // Fallback to empty
      }
    })();

    return () => {
      AsyncStorage.removeItem(storageKeyCounts).catch(() => {});
    };
  }, [storageKeyCounts, storageKeyFavs, storageKeySelected]);

  // Active items: only dhikrs checked/selected by the user
  const activeItems: DhikrItem[] = useMemo(() => {
    if (Object.keys(selectedIds).length === 0) return items;
    const filtered = items.filter((it) => selectedIds[it.id] !== false);
    return filtered.length > 0 ? filtered : items;
  }, [items, selectedIds]);

  // Clamp current index if active items count changes
  useEffect(() => {
    if (currentIndex >= activeItems.length) {
      setCurrentIndex(Math.max(0, activeItems.length - 1));
      pan.setValue({ x: 0, y: 0 });
    }
  }, [activeItems.length, currentIndex, pan]);

  const saveCount = (dhikrId: string, val: number) => {
    setCounts((prev) => ({ ...prev, [dhikrId]: val }));
  };

  const resetCounts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCounts({});
    setCurrentIndex(0);
    pan.setValue({ x: 0, y: 0 });
    AsyncStorage.removeItem(storageKeyCounts).catch(() => {});
  };

  const saveSelectedIds = async (updated: Record<string, boolean>) => {
    setSelectedIds(updated);
    try {
      await AsyncStorage.setItem(storageKeySelected, JSON.stringify(updated));
    } catch {}
  };

  const toggleDhikrSelection = (dhikrId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentVal = selectedIds[dhikrId] !== false;
    const updated = { ...selectedIds, [dhikrId]: !currentVal };
    saveSelectedIds(updated);
  };

  const selectAllDhikrs = (allSelected: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated: Record<string, boolean> = {};
    items.forEach((it) => {
      updated[it.id] = allSelected;
    });
    saveSelectedIds(updated);
  };

  const toggleFavorite = async (dhikrId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...favorites, [dhikrId]: !favorites[dhikrId] };
    setFavorites(updated);
    try {
      await AsyncStorage.setItem(storageKeyFavs, JSON.stringify(updated));
    } catch {}
  };

  const handleCopy = async (item: DhikrItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${item.content}\n\n[${categoryConfig.title} - تكرار ${item.count} مرات]`,
      });
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleShare = async (item: DhikrItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${item.content}\n\n[${categoryConfig.title}]`,
      });
    } catch {}
  };

  const goToNext = (directionMultiplier = 1) => {
    if (isTransitioning.current) return;
    if (currentIndex < activeItems.length - 1) {
      isTransitioning.current = true;
      Animated.timing(pan, {
        toValue: { x: directionMultiplier * SCREEN_WIDTH * 1.2, y: 0 },
        duration: 240,
        useNativeDriver: true,
      }).start(() => {
        pan.setValue({ x: 0, y: 0 });
        setCurrentIndex((prev) => Math.min(activeItems.length - 1, prev + 1));
        isTransitioning.current = false;
      });
    } else {
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  };

  const goToPrev = () => {
    if (isTransitioning.current) return;
    if (currentIndex > 0) {
      isTransitioning.current = true;
      Animated.timing(pan, {
        toValue: { x: SCREEN_WIDTH * 1.2, y: 0 },
        duration: 240,
        useNativeDriver: true,
      }).start(() => {
        pan.setValue({ x: 0, y: 0 });
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        isTransitioning.current = false;
      });
    } else {
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleIncrement = (item: DhikrItem) => {
    const current = counts[item.id] || 0;
    const target = item.count;
    if (current < target) {
      const next = current + 1;
      saveCount(item.id, next);
      if (next >= target) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          if (currentIndex < activeItems.length - 1) {
            goToNext(-1);
          }
        }, 300);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      if (currentIndex < activeItems.length - 1) {
        goToNext(-1);
      }
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          return Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
        },
        onPanResponderMove: (_, gesture) => {
          pan.setValue({ x: gesture.dx, y: gesture.dy * 0.15 });
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -80) {
            goToNext(-1);
          } else if (gesture.dx > 80) {
            goToPrev();
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 6,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [currentIndex, activeItems.length]
  );

  const colors = {
    screenTitle: isDark ? '#ffffff' : '#0f172a',
    cardBg: isDark ? 'rgba(26, 38, 57, 0.94)' : '#ffffff',
    cardBorderDefault: isDark ? 'rgba(51, 65, 85, 0.65)' : 'rgba(226, 232, 240, 0.9)',
    cardBorderDone: '#10b981',
    cardTopBtnBg: isDark ? 'rgba(30, 41, 59, 0.75)' : '#f1f5f9',
    cardTopBtnIcon: isDark ? '#cbd5e1' : '#475569',
    dhikrText: isDark ? '#ffffff' : '#0f172a',
    dhikrDesc: isDark ? '#94a3b8' : '#64748b',
    descBoxBg: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
    counterPillBg: isDark ? 'rgba(15, 23, 42, 0.7)' : '#f1f5f9',
    counterPillBorder: isDark ? '#334155' : '#cbd5e1',
    counterPillText: isDark ? '#f8fafc' : '#1e293b',
    headerBtnBg: isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    headerBtnBorder: isDark ? '#334155' : '#cbd5e1',
    headerBtnIcon: isDark ? '#ffffff' : '#0f172a',
    modalBg: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    modalCard: isDark ? '#1e293b' : '#ffffff',
    modalBorder: isDark ? '#334155' : '#e2e8f0',
    modalText: isDark ? '#ffffff' : '#0f172a',
    modalSub: isDark ? '#94a3b8' : '#64748b',
    checkActive: '#10b981',
    checkInactive: isDark ? '#475569' : '#cbd5e1',
  };

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const activeOpacity = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.75, 0, SCREEN_WIDTH * 0.75],
    outputRange: [0.7, 1, 0.7],
    extrapolate: 'clamp',
  });

  const renderBackCard = (item: DhikrItem, type: 'next1' | 'next2' | 'prev1') => {
    let transformStyle = {};
    let zIndex = 1;
    let borderColor = colors.cardBorderDefault;
    let borderWidth = 1;

    if (type === 'next1') {
      zIndex = 8;
      transformStyle = {
        transform: [
          { translateY: 10 },
          { translateX: 14 },
          { scale: 0.95 },
        ],
      };
    } else if (type === 'next2') {
      zIndex = 6;
      transformStyle = {
        transform: [
          { translateY: 20 },
          { translateX: 26 },
          { scale: 0.90 },
        ],
      };
    } else if (type === 'prev1') {
      zIndex = 7;
      transformStyle = {
        transform: [
          { translateY: 10 },
          { translateX: -20 },
          { scale: 0.95 },
        ],
      };
    }

    return (
      <Animated.View
        key={`${item.id}_${type}`}
        style={[
          styles.cardContainerBase,
          {
            position: 'absolute',
            backgroundColor: colors.cardBg,
            borderColor,
            borderWidth,
            zIndex,
          },
          transformStyle,
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={0.8}
          onPress={() => {
            if (type.startsWith('prev')) {
              goToPrev();
            } else {
              goToNext(-1);
            }
          }}
        />
      </Animated.View>
    );
  };

  const renderActiveCard = (item: DhikrItem) => {
    const currentRep = counts[item.id] || 0;
    const isDone = currentRep >= item.count;
    const isFav = !!favorites[item.id];
    const progressRatio = item.count > 0 ? Math.min(1, currentRep / item.count) : 0;

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardContainerBase,
          {
            position: 'relative',
            backgroundColor: colors.cardBg,
            borderColor: isDone ? colors.cardBorderDone : colors.cardBorderDefault,
            borderWidth: 1.5,
            zIndex: 10,
            transform: [
              { translateX: pan.x },
              { rotate },
            ],
            opacity: activeOpacity,
          },
        ]}
      >
        {/* Top Actions Row */}
        <View style={styles.cardTopRow}>
          <TouchableOpacity
            style={[styles.cardIconBtn, { backgroundColor: colors.cardTopBtnBg }]}
            onPress={() => handleShare(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={colors.cardTopBtnIcon}
            />
          </TouchableOpacity>

          <View style={styles.cardIndexPill}>
            <Text style={styles.cardIndexPillText}>
              {currentIndex + 1}/{activeItems.length}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.cardIconBtn, { backgroundColor: colors.cardTopBtnBg }]}
            onPress={() => toggleFavorite(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFav ? 'star' : 'star-outline'}
              size={18}
              color={isFav ? '#f59e0b' : colors.cardTopBtnIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Center Dhikr Text Content */}
        <ScrollView
          style={styles.cardBodyScrollView}
          contentContainerStyle={styles.cardBodyScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <Text style={[styles.dhikrMainText, { color: colors.dhikrText }]}>
            {item.content}
          </Text>

          {item.description ? (
            <View style={[styles.descBox, { backgroundColor: colors.descBoxBg }]}>
              <Text style={[styles.dhikrDescText, { color: colors.dhikrDesc }]}>
                {item.description}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom Actions Row */}
        <View style={styles.cardBottomRow}>
          <TouchableOpacity
            style={[
              styles.nextCircleBtn,
              isDone && styles.nextCircleBtnDone,
            ]}
            onPress={() => handleIncrement(item)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isDone ? 'checkmark' : 'chevron-back'}
              size={22}
              color="#ffffff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardBottomActionBtn, { backgroundColor: colors.cardTopBtnBg }]}
            onPress={() => handleCopy(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={copiedId === item.id ? 'checkmark' : 'copy-outline'}
              size={18}
              color={copiedId === item.id ? '#10b981' : colors.cardTopBtnIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.progressPillContainer,
              {
                backgroundColor: colors.counterPillBg,
                borderColor: isDone ? '#10b981' : colors.counterPillBorder,
              },
            ]}
            onPress={() => handleIncrement(item)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.progressPillFill,
                {
                  width: `${progressRatio * 100}%`,
                  right: 0,
                  backgroundColor: isDone ? '#10b981' : 'rgba(16, 185, 129, 0.35)',
                },
              ]}
            />
            <Text
              style={[
                styles.progressPillText,
                { color: isDone ? '#ffffff' : colors.counterPillText },
              ]}
            >
              {currentRep} من {item.count} مرات
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.leftHeaderActions}>
            <TouchableOpacity
              style={[styles.circleNavBtn, { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder }]}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="list" size={20} color={colors.headerBtnIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.circleNavBtn, { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder }]}
              onPress={resetCounts}
              activeOpacity={0.7}
            >
              <Ionicons name="reload-outline" size={19} color={colors.headerBtnIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitleText, { color: colors.screenTitle }]}>
              {categoryConfig.title}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.circleNavBtn, { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/adhkar' as any))}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.headerBtnIcon} />
          </TouchableOpacity>
        </View>

        {/* Stack Deck Area */}
        <View style={styles.deckContainer}>
          {activeItems.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorderDefault }]}>
              <Ionicons name="alert-circle-outline" size={44} color="#f59e0b" />
              <Text style={[styles.emptyTitle, { color: colors.dhikrText }]}>
                لم تختر أي ذكر بعد
              </Text>
              <Text style={[styles.emptySub, { color: colors.dhikrDesc }]}>
                اضغط على أيقونة القائمة لتحديد الأذكار التي ترغب في قراءتها.
              </Text>
              <TouchableOpacity
                style={styles.openSelectionBtn}
                onPress={() => setMenuVisible(true)}
              >
                <Text style={styles.openSelectionBtnText}>تحديد الأذكار</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {currentIndex + 2 < activeItems.length &&
                renderBackCard(activeItems[currentIndex + 2], 'next2')}
              {currentIndex + 1 < activeItems.length &&
                renderBackCard(activeItems[currentIndex + 1], 'next1')}
              {currentIndex > 0 &&
                renderBackCard(activeItems[currentIndex - 1], 'prev1')}
              {renderActiveCard(activeItems[currentIndex])}
            </>
          )}
        </View>

        {/* Bottom Navigation Toolbar */}
        <View style={styles.bottomNavToolbar}>
          <TouchableOpacity
            style={[
              styles.navCircleBtn,
              currentIndex === 0 && styles.navCircleBtnDisabled,
            ]}
            disabled={currentIndex === 0}
            onPress={goToPrev}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.bottomCounterIndicator}>
            <Text style={[styles.bottomCounterText, { color: colors.screenTitle }]}>
              {activeItems.length > 0 ? `${currentIndex + 1} / ${activeItems.length}` : '0 / 0'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.navCircleBtn,
              currentIndex >= activeItems.length - 1 && styles.navCircleBtnDisabled,
            ]}
            disabled={currentIndex >= activeItems.length - 1}
            onPress={() => goToNext(-1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Drawer Modal: Select Specific Dhikrs */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
            <Pressable
              style={[
                styles.modalDrawer,
                { backgroundColor: colors.modalCard, borderColor: colors.modalBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.drawerHeader}>
                <TouchableOpacity
                  style={[styles.circleNavBtn, { backgroundColor: colors.cardTopBtnBg, borderColor: colors.modalBorder }]}
                  onPress={() => setMenuVisible(false)}
                >
                  <Ionicons name="close" size={18} color={colors.modalText} />
                </TouchableOpacity>

                <View style={styles.drawerTitleBox}>
                  <Text style={[styles.drawerTitle, { color: colors.modalText }]}>
                    تحديد أذكار الورد
                  </Text>
                  <Text style={[styles.drawerSub, { color: colors.modalSub }]}>
                    حدد الأذكار التي تود ظهورها في البطاقات
                  </Text>
                </View>
              </View>

              <View style={styles.drawerToolbar}>
                <TouchableOpacity
                  style={[styles.drawerPillBtn, { borderColor: colors.modalBorder }]}
                  onPress={() => selectAllDhikrs(true)}
                >
                  <Ionicons name="checkmark-done" size={15} color="#10b981" />
                  <Text style={[styles.drawerPillBtnText, { color: colors.modalText }]}>تحديد الكل</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.drawerPillBtn, { borderColor: colors.modalBorder }]}
                  onPress={() => selectAllDhikrs(false)}
                >
                  <Ionicons name="close" size={15} color="#ef4444" />
                  <Text style={[styles.drawerPillBtnText, { color: colors.modalText }]}>إلغاء التحديد</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.drawerPillBtn, { borderColor: colors.modalBorder }]}
                  onPress={resetCounts}
                >
                  <Ionicons name="refresh" size={15} color="#3b82f6" />
                  <Text style={[styles.drawerPillBtnText, { color: colors.modalText }]}>تصفير العداد</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.drawerList}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {items.map((item, idx) => {
                  const isChecked = selectedIds[item.id] !== false;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.drawerItemRow,
                        { borderColor: colors.modalBorder },
                        isChecked && styles.drawerItemRowChecked,
                      ]}
                      onPress={() => toggleDhikrSelection(item.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isChecked ? colors.checkActive : colors.checkInactive}
                      />
                      <View style={styles.drawerItemContent}>
                        <Text
                          style={[styles.drawerItemText, { color: colors.modalText }]}
                          numberOfLines={2}
                        >
                          {item.content}
                        </Text>
                        <Text style={[styles.drawerItemCount, { color: colors.modalSub }]}>
                          التكرار: {item.count} مرات
                        </Text>
                      </View>
                      <Text style={[styles.drawerItemIndex, { color: colors.modalSub }]}>
                        #{idx + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  leftHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitleText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    textAlign: 'center',
  },

  deckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  cardContainerBase: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 28,
    padding: 22,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIndexPill: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
  },
  cardIndexPillText: {
    fontFamily: 'Cairo_700Bold',
    color: '#ffffff',
    fontSize: 13,
  },
  cardBodyScrollView: {
    flex: 1,
    width: '100%',
    marginVertical: 10,
  },
  cardBodyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dhikrMainText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 21,
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: 0.2,
    width: '100%',
  },
  descBox: {
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    width: '100%',
  },
  dhikrDescText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    gap: 10,
  },
  nextCircleBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextCircleBtnDone: {
    backgroundColor: '#059669',
  },
  cardBottomActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPillContainer: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPillFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  progressPillText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    zIndex: 2,
  },

  bottomNavToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 20,
    paddingTop: 8,
  },
  navCircleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  navCircleBtnDisabled: {
    backgroundColor: '#475569',
    opacity: 0.45,
  },
  bottomCounterIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomCounterText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
  },

  emptyCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT * 0.7,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    marginTop: 14,
  },
  emptySub: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  openSelectionBtn: {
    marginTop: 18,
    backgroundColor: '#10b981',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 16,
  },
  openSelectionBtnText: {
    fontFamily: 'Cairo_700Bold',
    color: '#ffffff',
    fontSize: 14,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalDrawer: {
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  drawerTitleBox: {
    alignItems: 'flex-end',
    flex: 1,
    paddingRight: 12,
  },
  drawerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
  },
  drawerSub: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  drawerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  drawerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  drawerPillBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11.5,
  },
  drawerList: {
    marginTop: 10,
  },
  drawerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  drawerItemRowChecked: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  drawerItemContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  drawerItemText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    textAlign: 'right',
  },
  drawerItemCount: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  drawerItemIndex: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
});
