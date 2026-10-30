import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/context/ThemeContext';
import IslamicBackground from '@/components/IslamicBackground';

interface DhikrItem {
  id: string;
  name: string;
  defaultTarget: number;
}

type GeometricShape = 'star' | 'flower' | 'both';

const DEFAULT_DHIKRS: DhikrItem[] = [
  { id: 'subhanallah', name: 'سُبْحَانَ اللَّهِ', defaultTarget: 33 },
  { id: 'alhamdulillah', name: 'الْحَمْدُ لِلَّهِ', defaultTarget: 33 },
  { id: 'allahuakbar', name: 'اللهُ أَكْبَرُ', defaultTarget: 33 },
  { id: 'la_ilaha_illallah', name: 'لَا إِلَهَ إِلَّا اللَّهُ', defaultTarget: 33 },
  { id: 'astaghfirullah', name: 'أَسْتَغْفِرُ اللَّهَ', defaultTarget: 100 },
  { id: 'subhanallahi_wabihamdih', name: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', defaultTarget: 100 },
  { id: 'salawat', name: 'اللَّهُمَّ صَلِّ عَلَى نَبِيِّنَا مُحَمَّدٍ', defaultTarget: 100 },
  { id: 'hawqala', name: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', defaultTarget: 33 },
];

const STORAGE_KEYS = {
  COUNTS: '@tasbih_counts_v1',
  TOTAL: '@tasbih_total_today_v1',
  TARGETS: '@tasbih_targets_v1',
  HAPTICS: '@tasbih_haptics_v1',
  SOUND: '@tasbih_sound_v1',
  SAVE_LAST: '@tasbih_save_last_count_v1',
  SHAPE: '@tasbih_shape_v1',
};

export default function TasbihScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useAppTheme();

  const [activeDhikrIndex, setActiveDhikrIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [totalToday, setTotalToday] = useState(0);

  // Settings states matching screenshot
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [saveLastCount, setSaveLastCount] = useState(true);
  const [geometricShape, setGeometricShape] = useState<GeometricShape>('star');

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showGoalNotification, setShowGoalNotification] = useState(false);

  // Scale animation for tactile feedback
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Click audio player
  const clickPlayer = useAudioPlayer(require('@/assets/sounds/click.wav'));

  const currentDhikr = DEFAULT_DHIKRS[activeDhikrIndex] || DEFAULT_DHIKRS[0];
  const currentCount = counts[currentDhikr.id] || 0;
  const currentTarget = targets[currentDhikr.id] ?? currentDhikr.defaultTarget;

  // Dynamic light/dark theme colors
  const colors = {
    background: isDark ? '#0d1527' : '#f8fafc',
    headerTitle: isDark ? '#ffffff' : '#0f172a',
    actionBtnBg: isDark ? '#162238' : '#ffffff',
    actionBtnBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    actionBtnIcon: isDark ? '#cbd5e1' : '#334155',
    watermarkTint: isDark ? '#25354e' : '#94a3b8',
    watermarkOpacity: isDark ? 0.35 : 0.22,
    frameTint: isDark ? '#2b3a53' : '#64748b',
    counterText: isDark ? '#6ee7b7' : '#059669',
    chipBg: isDark ? '#162238' : '#ffffff',
    chipBorder: isDark ? 'rgba(255, 255, 255, 0.04)' : '#e2e8f0',
    chipText: isDark ? '#94a3b8' : '#475569',
    targetBadgeBg: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.12)',
    targetBadgeBorder: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)',
    targetBadgeText: isDark ? '#34d399' : '#059669',
    tapHint: isDark ? '#64748b' : '#94a3b8',
    bottomStatsBg: isDark ? '#131d2e' : '#ffffff',
    bottomStatsBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    bottomStatValue: isDark ? '#ffffff' : '#0f172a',
    bottomStatLabel: isDark ? '#8592a6' : '#64748b',
    bottomStatDivider: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    modalOverlay: isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(0, 0, 0, 0.5)',
    modalContent: isDark ? '#152033' : '#ffffff',
    modalBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    modalTitle: isDark ? '#ffffff' : '#0f172a',
    modalCloseBtn: isDark ? '#1e2d44' : '#f1f5f9',
    modalCloseIcon: isDark ? '#94a3b8' : '#64748b',
    settingRowBorder: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
    settingLabel: isDark ? '#ffffff' : '#0f172a',
    optionCardBg: isDark ? '#1a273e' : '#f1f5f9',
    optionCardBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    optionCardText: isDark ? '#94a3b8' : '#64748b',
    switchTrackFalse: isDark ? '#1e293b' : '#cbd5e1',
  };

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const [
          savedCounts,
          savedTotal,
          savedTargets,
          savedHaptics,
          savedSound,
          savedSaveLast,
          savedShape,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.COUNTS),
          AsyncStorage.getItem(STORAGE_KEYS.TOTAL),
          AsyncStorage.getItem(STORAGE_KEYS.TARGETS),
          AsyncStorage.getItem(STORAGE_KEYS.HAPTICS),
          AsyncStorage.getItem(STORAGE_KEYS.SOUND),
          AsyncStorage.getItem(STORAGE_KEYS.SAVE_LAST),
          AsyncStorage.getItem(STORAGE_KEYS.SHAPE),
        ]);

        const shouldSave = savedSaveLast === null ? true : savedSaveLast === 'true';
        setSaveLastCount(shouldSave);

        if (shouldSave && savedCounts) setCounts(JSON.parse(savedCounts));
        if (savedTotal) setTotalToday(Number(savedTotal) || 0);
        if (savedTargets) setTargets(JSON.parse(savedTargets));
        if (savedHaptics !== null) setHapticsEnabled(savedHaptics === 'true');
        if (savedSound !== null) setSoundEnabled(savedSound === 'true');
        if (savedShape) setGeometricShape(savedShape as GeometricShape);
      } catch (e) {
        // Fallback to defaults
      }
    })();
  }, []);

  const saveCounts = async (newCounts: Record<string, number>, newTotal: number) => {
    if (!saveLastCount) return;
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.COUNTS, JSON.stringify(newCounts)),
        AsyncStorage.setItem(STORAGE_KEYS.TOTAL, String(newTotal)),
      ]);
    } catch (e) {
      // Ignored
    }
  };

  const saveTarget = async (dhikrId: string, targetVal: number) => {
    const updated = { ...targets, [dhikrId]: targetVal };
    setTargets(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(updated));
    } catch (e) {
      // Ignored
    }
  };

  const toggleSound = async (val: boolean) => {
    setSoundEnabled(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SOUND, String(val));
    } catch (e) {}
  };

  const toggleHaptics = async (val: boolean) => {
    setHapticsEnabled(val);
    if (val) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAPTICS, String(val));
    } catch (e) {}
  };

  const toggleSaveLast = async (val: boolean) => {
    setSaveLastCount(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVE_LAST, String(val));
    } catch (e) {}
  };

  const selectShape = async (shape: GeometricShape) => {
    setGeometricShape(shape);
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHAPE, shape);
    } catch (e) {}
  };

  const playClickSound = async () => {
    if (!soundEnabled || !clickPlayer) return;
    try {
      await clickPlayer.seekTo(0);
      clickPlayer.play();
    } catch (e) {
      // ignored
    }
  };

  const handleTap = () => {
    // Tap scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();

    // Play click sound if enabled
    if (soundEnabled) {
      playClickSound();
    }

    const nextCount = currentCount + 1;
    const nextTotal = totalToday + 1;

    const newCounts = { ...counts, [currentDhikr.id]: nextCount };
    setCounts(newCounts);
    setTotalToday(nextTotal);
    saveCounts(newCounts, nextTotal);

    if (hapticsEnabled) {
      if (currentTarget > 0 && nextCount === currentTarget) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowGoalNotification(true);
        setTimeout(() => setShowGoalNotification(false), 2200);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleReset = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newCounts = { ...counts, [currentDhikr.id]: 0 };
    setCounts(newCounts);
    saveCounts(newCounts, totalToday);
  };

  return (
    <View style={styles.container}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={styles.header}>
        {/* Left Action Buttons */}
        <View style={styles.leftActions}>
          {/* Reset button */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.actionBtnBg,
                borderColor: colors.actionBtnBorder,
              },
            ]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={19} color={colors.actionBtnIcon} />
          </TouchableOpacity>

          {/* Light / Dark Mode Toggle button */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.actionBtnBg,
                borderColor: colors.actionBtnBorder,
              },
              isDark && styles.actionBtnActiveWarm,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleTheme();
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={19}
              color={isDark ? '#f59e0b' : '#6366f1'}
            />
          </TouchableOpacity>

          {/* Settings button */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.actionBtnBg,
                borderColor: colors.actionBtnBorder,
              },
            ]}
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={19} color={colors.actionBtnIcon} />
          </TouchableOpacity>
        </View>

        {/* Right Section: Title and Back Button */}
        <View style={styles.rightSection}>
          <Text style={[styles.headerTitle, { color: colors.headerTitle }]}>السبحة</Text>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: colors.actionBtnBg,
                borderColor: colors.actionBtnBorder,
              },
            ]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/adhkar' as any))}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={22} color={colors.headerTitle} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Dhikr Selection Pills */}
      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {DEFAULT_DHIKRS.map((dhikr, index) => {
            const isActive = activeDhikrIndex === index;
            return (
              <TouchableOpacity
                key={dhikr.id}
                style={[
                  styles.dhikrChip,
                  {
                    backgroundColor: isActive ? '#10b981' : colors.chipBg,
                    borderColor: isActive ? '#10b981' : colors.chipBorder,
                  },
                ]}
                onPress={() => {
                  if (hapticsEnabled) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveDhikrIndex(index);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.dhikrChipText,
                    { color: isActive ? '#ffffff' : colors.chipText },
                    isActive && styles.dhikrChipTextActive,
                  ]}
                >
                  {dhikr.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Center Interactive Area (Tapping anywhere increments the counter) */}
      <Pressable style={styles.centerArea} onPress={handleTap}>
        {/* Dhikr Title */}
        <Text style={[styles.dhikrBigTitle, { color: colors.headerTitle }]}>
          {currentDhikr.name}
        </Text>

        {/* Target Badge */}
        <View
          style={[
            styles.targetBadge,
            {
              backgroundColor: colors.targetBadgeBg,
              borderColor: colors.targetBadgeBorder,
            },
          ]}
        >
          <Text style={[styles.targetBadgeText, { color: colors.targetBadgeText }]}>
            {currentTarget > 0 ? `الهدف: ${currentTarget} مرة` : 'حر (مفتوح)'}
          </Text>
        </View>

        {/* Geometric Islamic Shape Frame with Counter in the Center */}
        <Animated.View
          style={[
            styles.shapeWrapper,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {geometricShape === 'star' && (
            <Image
              source={require('@/assets/images/tasbih_shape_frame.png')}
              style={[styles.geometricFrame, { tintColor: colors.frameTint }]}
              resizeMode="contain"
            />
          )}

          {geometricShape === 'flower' && (
            <Image
              source={require('@/assets/images/islamic_pattern_corner.png')}
              style={[styles.geometricFrame, { tintColor: colors.frameTint }]}
              resizeMode="contain"
            />
          )}

          {geometricShape === 'both' && (
            <>
              <Image
                source={require('@/assets/images/islamic_pattern_corner.png')}
                style={[
                  styles.geometricFrame,
                  { tintColor: colors.frameTint, opacity: 0.5, transform: [{ scale: 0.95 }] },
                ]}
                resizeMode="contain"
              />
              <Image
                source={require('@/assets/images/tasbih_shape_frame.png')}
                style={[styles.geometricFrame, { position: 'absolute', tintColor: colors.frameTint }]}
                resizeMode="contain"
              />
            </>
          )}

          <View style={styles.counterAbsoluteCenter}>
            <Text style={[styles.counterText, { color: colors.counterText }]}>
              {currentCount}
            </Text>
          </View>
        </Animated.View>

        {/* Goal Reached Notification */}
        {showGoalNotification && (
          <View style={styles.goalBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.goalBannerText}>ما شاء الله، اكتمل الهدف المبارك!</Text>
          </View>
        )}

        {/* Tap Helper Hint */}
        <Text style={[styles.tapHintText, { color: colors.tapHint }]}>
          المس أي مكان في الشاشة للتسبيح
        </Text>
      </Pressable>

      {/* Bottom Subtle Stats Bar */}
      <View
        style={[
          styles.bottomStatsCard,
          {
            backgroundColor: colors.bottomStatsBg,
            borderColor: colors.bottomStatsBorder,
          },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.bottomStatValue }]}>
            {totalToday}
          </Text>
          <Text style={[styles.statLabel, { color: colors.bottomStatLabel }]}>
            مجموع اليوم
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.bottomStatDivider }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.bottomStatValue }]}>
            {currentTarget > 0 ? Math.max(0, currentTarget - currentCount) : '∞'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.bottomStatLabel }]}>
            المتبقي للهدف
          </Text>
        </View>
      </View>

      {/* Settings Modal (العداد) */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
          onPress={() => setSettingsVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.modalContent,
                borderColor: colors.modalBorder,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header: Title on the right, Close (X) on the left */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.settingRowBorder }]}>
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.modalCloseBtn }]}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={colors.modalCloseIcon} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.modalTitle }]}>العداد</Text>
            </View>

            {/* Toggle 1: صوت العداد */}
            <View style={[styles.settingRow, { borderBottomColor: colors.settingRowBorder }]}>
              <Switch
                value={soundEnabled}
                onValueChange={toggleSound}
                trackColor={{ false: colors.switchTrackFalse, true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor={colors.switchTrackFalse}
              />
              <Text style={[styles.settingLabel, { color: colors.settingLabel }]}>صوت العداد</Text>
            </View>

            {/* Toggle 2: العداد بالاهتزاز */}
            <View style={[styles.settingRow, { borderBottomColor: colors.settingRowBorder }]}>
              <Switch
                value={hapticsEnabled}
                onValueChange={toggleHaptics}
                trackColor={{ false: colors.switchTrackFalse, true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor={colors.switchTrackFalse}
              />
              <Text style={[styles.settingLabel, { color: colors.settingLabel }]}>العداد بالاهتزاز</Text>
            </View>

            {/* Toggle 3: حفظ آخر رقم وصل إليه العداد */}
            <View style={[styles.settingRow, { borderBottomColor: colors.settingRowBorder }]}>
              <Switch
                value={saveLastCount}
                onValueChange={toggleSaveLast}
                trackColor={{ false: colors.switchTrackFalse, true: '#10b981' }}
                thumbColor="#ffffff"
                ios_backgroundColor={colors.switchTrackFalse}
              />
              <Text style={[styles.settingLabel, { color: colors.settingLabel }]}>حفظ آخر رقم وصل إليه العداد</Text>
            </View>

            {/* Section 1: شكل الزخرفة الهندسية: */}
            <Text style={[styles.sectionHeaderLabel, { color: colors.optionCardText }]}>
              شكل الزخرفة الهندسية:
            </Text>
            <View style={styles.shapesOptionRow}>
              {/* Option 1: نجمة مثمنة */}
              <TouchableOpacity
                style={[
                  styles.shapeOptionCard,
                  {
                    backgroundColor:
                      geometricShape === 'star' ? '#10b981' : colors.optionCardBg,
                    borderColor:
                      geometricShape === 'star' ? '#10b981' : colors.optionCardBorder,
                  },
                ]}
                onPress={() => selectShape('star')}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="sunny-outline"
                  size={24}
                  color={geometricShape === 'star' ? '#ffffff' : colors.optionCardText}
                />
                <Text
                  style={[
                    styles.shapeOptionText,
                    {
                      color: geometricShape === 'star' ? '#ffffff' : colors.optionCardText,
                    },
                    geometricShape === 'star' && styles.shapeOptionTextActive,
                  ]}
                >
                  نجمة مثمنة
                </Text>
              </TouchableOpacity>

              {/* Option 2: وردة إسلامية */}
              <TouchableOpacity
                style={[
                  styles.shapeOptionCard,
                  {
                    backgroundColor:
                      geometricShape === 'flower' ? '#10b981' : colors.optionCardBg,
                    borderColor:
                      geometricShape === 'flower' ? '#10b981' : colors.optionCardBorder,
                  },
                ]}
                onPress={() => selectShape('flower')}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="flower-outline"
                  size={24}
                  color={geometricShape === 'flower' ? '#ffffff' : colors.optionCardText}
                />
                <Text
                  style={[
                    styles.shapeOptionText,
                    {
                      color:
                        geometricShape === 'flower' ? '#ffffff' : colors.optionCardText,
                    },
                    geometricShape === 'flower' && styles.shapeOptionTextActive,
                  ]}
                >
                  وردة إسلامية
                </Text>
              </TouchableOpacity>

              {/* Option 3: النمطان معاً */}
              <TouchableOpacity
                style={[
                  styles.shapeOptionCard,
                  {
                    backgroundColor:
                      geometricShape === 'both' ? '#10b981' : colors.optionCardBg,
                    borderColor:
                      geometricShape === 'both' ? '#10b981' : colors.optionCardBorder,
                  },
                ]}
                onPress={() => selectShape('both')}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="sparkles"
                  size={22}
                  color={geometricShape === 'both' ? '#ffffff' : colors.optionCardText}
                />
                <Text
                  style={[
                    styles.shapeOptionText,
                    {
                      color: geometricShape === 'both' ? '#ffffff' : colors.optionCardText,
                    },
                    geometricShape === 'both' && styles.shapeOptionTextActive,
                  ]}
                >
                  النمطان معاً
                </Text>
              </TouchableOpacity>
            </View>

            {/* Section 2: الهدف المحدد: */}
            <Text style={[styles.sectionHeaderLabel, { color: colors.optionCardText }]}>
              الهدف المحدد:
            </Text>
            <View style={styles.targetOptionsRow}>
              {/* 33 مرة */}
              <TouchableOpacity
                style={[
                  styles.targetOptionChip,
                  {
                    backgroundColor:
                      currentTarget === 33 ? '#10b981' : colors.optionCardBg,
                    borderColor:
                      currentTarget === 33 ? '#10b981' : colors.optionCardBorder,
                  },
                ]}
                onPress={() => {
                  saveTarget(currentDhikr.id, 33);
                  if (hapticsEnabled) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.targetOptionText,
                    { color: currentTarget === 33 ? '#ffffff' : colors.optionCardText },
                    currentTarget === 33 && styles.targetOptionTextActive,
                  ]}
                >
                  33 مرة
                </Text>
              </TouchableOpacity>

              {/* 100 مرة */}
              <TouchableOpacity
                style={[
                  styles.targetOptionChip,
                  {
                    backgroundColor:
                      currentTarget === 100 ? '#10b981' : colors.optionCardBg,
                    borderColor:
                      currentTarget === 100 ? '#10b981' : colors.optionCardBorder,
                  },
                ]}
                onPress={() => {
                  saveTarget(currentDhikr.id, 100);
                  if (hapticsEnabled) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.targetOptionText,
                    { color: currentTarget === 100 ? '#ffffff' : colors.optionCardText },
                    currentTarget === 100 && styles.targetOptionTextActive,
                  ]}
                >
                  100 مرة
                </Text>
              </TouchableOpacity>

              {/* حر (مفتوح) */}
              <TouchableOpacity
                style={[
                  styles.targetOptionChip,
                  {
                    backgroundColor:
                      currentTarget === 0 ? '#10b981' : colors.optionCardBg,
                    borderColor:
                      currentTarget === 0 ? '#10b981' : colors.optionCardBorder,
                  },
                ]}
                onPress={() => {
                  saveTarget(currentDhikr.id, 0);
                  if (hapticsEnabled) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.targetOptionText,
                    { color: currentTarget === 0 ? '#ffffff' : colors.optionCardText },
                    currentTarget === 0 && styles.targetOptionTextActive,
                  ]}
                >
                  حر (مفتوح)
                </Text>
              </TouchableOpacity>
            </View>
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
  cornerWatermark: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 220,
    height: 220,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    zIndex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 24,
    textAlign: 'right',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnActiveWarm: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  chipsContainer: {
    paddingBottom: 12,
    zIndex: 1,
  },
  chipsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingHorizontal: 20,
  },
  dhikrChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  dhikrChipText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
  },
  dhikrChipTextActive: {
    fontFamily: 'Cairo_700Bold',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  dhikrBigTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  targetBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 28,
  },
  targetBadgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
  },
  shapeWrapper: {
    width: 270,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  geometricFrame: {
    width: 270,
    height: 270,
  },
  counterAbsoluteCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 78,
    textAlign: 'center',
    includeFontPadding: false,
  },
  goalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#10b981',
    marginTop: 20,
  },
  goalBannerText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#10b981',
  },
  tapHintText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    marginTop: 24,
    textAlign: 'center',
  },
  bottomStatsCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    zIndex: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
  },
  statLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 26,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 38,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    textAlign: 'right',
  },
  sectionHeaderLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 18,
    marginBottom: 10,
  },
  shapesOptionRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 6,
  },
  shapeOptionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  shapeOptionText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    marginTop: 6,
  },
  shapeOptionTextActive: {
    color: '#ffffff',
  },
  targetOptionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 8,
  },
  targetOptionChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  targetOptionText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
  },
  targetOptionTextActive: {
    color: '#ffffff',
  },
});
