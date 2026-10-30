import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import IslamicBackground from '@/components/IslamicBackground';
import {
  PrayerCalculationConfig,
  DEFAULT_PRAYER_CONFIG,
  CALCULATION_METHODS,
  ASR_MADHABS,
  RAMADAN_ISHA_OPTIONS,
  getPrayerCalculationConfig,
  savePrayerCalculationConfig,
  resetPrayerCalculationConfig,
  getBasePrayerTimesForDate,
  applyMinuteOffsetToTime,
  formatTo12HourArabic,
  getUserLocation,
} from '@/services/prayerTimesService';

interface PrayerRowInfo {
  id: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const PRAYERS_LIST: PrayerRowInfo[] = [
  { id: 'Fajr', name: 'الفجر', icon: 'partly-sunny-outline', iconColor: '#38bdf8' },
  { id: 'Dhuhr', name: 'الظهر', icon: 'sunny-outline', iconColor: '#f59e0b' },
  { id: 'Asr', name: 'العصر', icon: 'sunny', iconColor: '#10b981' },
  { id: 'Maghrib', name: 'المغرب', icon: 'cloudy-night-outline', iconColor: '#f97316' },
  { id: 'Isha', name: 'العشاء', icon: 'moon-outline', iconColor: '#a78bfa' },
];

export default function PrayerSettingsScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();

  const [config, setConfig] = useState<PrayerCalculationConfig>(DEFAULT_PRAYER_CONFIG);
  const [baseTimes, setBaseTimes] = useState<Record<string, string>>({
    Fajr: '05:30',
    Dhuhr: '12:30',
    Asr: '15:45',
    Maghrib: '18:15',
    Isha: '19:45',
  });
  const [activeModal, setActiveModal] = useState<'method' | 'asr' | 'ramadan' | null>(null);

  // Load config & baseline prayer times on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedConfig = await getPrayerCalculationConfig();
    setConfig(savedConfig);

    try {
      const loc = await getUserLocation();
      const base = await getBasePrayerTimesForDate(new Date(), loc, savedConfig);
      setBaseTimes(base);
    } catch {}
  };

  const updateOffsets = async (prayerId: keyof PrayerCalculationConfig['offsets'], delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentOffset = config.offsets[prayerId] || 0;
    const newOffset = currentOffset + delta;

    const newOffsets = {
      ...config.offsets,
      [prayerId]: newOffset,
    };

    const newConfig = {
      ...config,
      offsets: newOffsets,
    };

    setConfig(newConfig);
    await savePrayerCalculationConfig(newConfig);
  };

  const handleSelectMethod = async (method: (typeof CALCULATION_METHODS)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = {
      ...config,
      methodId: method.id,
      methodName: method.name,
    };
    setConfig(updated);
    setActiveModal(null);
    await savePrayerCalculationConfig(updated);

    // Refresh base times with the new method
    try {
      const loc = await getUserLocation();
      const base = await getBasePrayerTimesForDate(new Date(), loc, updated);
      setBaseTimes(base);
    } catch {}
  };

  const handleSelectAsr = async (madhabId: 'standard' | 'hanafi') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = {
      ...config,
      asrMadhab: madhabId,
    };
    setConfig(updated);
    setActiveModal(null);
    await savePrayerCalculationConfig(updated);

    // Refresh base times with new Asr school
    try {
      const loc = await getUserLocation();
      const base = await getBasePrayerTimesForDate(new Date(), loc, updated);
      setBaseTimes(base);
    } catch {}
  };

  const handleSelectRamadan = async (offsetVal: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = {
      ...config,
      ramadanIshaOffset: offsetVal,
    };
    setConfig(updated);
    setActiveModal(null);
    await savePrayerCalculationConfig(updated);
  };

  const handleResetToDefaults = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'استعادة الإعدادات الإفتراضية',
      'هل ترغب في إعادة ضبط جميع حسابات وتعديلات مواقيت الصلاة إلى الإعدادات الافتراضية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استعادة',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const reset = await resetPrayerCalculationConfig();
            setConfig(reset);
            try {
              const loc = await getUserLocation();
              const base = await getBasePrayerTimesForDate(new Date(), loc, reset);
              setBaseTimes(base);
            } catch {}
          },
        },
      ]
    );
  };

  // Colors aligned with dark/light theme
  const colors = {
    screenBg: isDark ? '#0c1524' : '#f8fafc',
    headerTitle: isDark ? '#f8fafc' : '#0f172a',
    backBtnBg: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
    backBtnBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    sectionLabel: isDark ? '#94a3b8' : '#64748b',
    cardBg: isDark ? '#142034' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    divider: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    itemTitle: isDark ? '#f8fafc' : '#0f172a',
    itemSubtitle: isDark ? '#94a3b8' : '#64748b',
    chevron: isDark ? '#64748b' : '#94a3b8',
    stepperBg: isDark ? '#1c2b44' : '#f1f5f9',
    stepperBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
    stepperText: isDark ? '#f8fafc' : '#0f172a',
    stepperDivider: isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
    modalBg: isDark ? '#142034' : '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    activeCheck: '#10b981',
  };

  // Current Asr label
  const currentAsrLabel =
    ASR_MADHABS.find((m) => m.id === config.asrMadhab)?.name || 'حنبلي، شافعي، مالكي';

  // Current Ramadan label
  const currentRamadanLabel =
    RAMADAN_ISHA_OPTIONS.find((r) => r.offset === config.ramadanIshaOffset)?.name || 'بدون إضافة';

  return (
    <View style={[styles.root, { backgroundColor: colors.screenBg }]}>
      <IslamicBackground />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.headerBar}>
          <View style={styles.headerRightContainer}>
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: colors.backBtnBg, borderColor: colors.backBtnBorder },
              ]}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/' as any))}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.headerTitle} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.headerTitle }]}>
              اعدادات مواقيت الصلاة
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ================= SECTION 1: الحساب ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>الحساب</Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {/* Row 1: طريقة الحساب */}
              <TouchableOpacity
                style={styles.rowItem}
                onPress={() => setActiveModal('method')}
                activeOpacity={0.65}
              >
                <View style={styles.rowValueContainer}>
                  <Ionicons name="chevron-back" size={16} color={colors.chevron} />
                  <Text style={[styles.rowValueText, { color: colors.itemSubtitle }]} numberOfLines={1}>
                    {config.methodName}
                  </Text>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>طريقة الحساب</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 2: حساب وقت العصر */}
              <TouchableOpacity
                style={styles.rowItem}
                onPress={() => setActiveModal('asr')}
                activeOpacity={0.65}
              >
                <View style={styles.rowValueContainer}>
                  <Ionicons name="chevron-back" size={16} color={colors.chevron} />
                  <Text style={[styles.rowValueText, { color: colors.itemSubtitle }]} numberOfLines={1}>
                    {currentAsrLabel}
                  </Text>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>حساب وقت العصر</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 3: تعديل العشاء في رمضان */}
              <TouchableOpacity
                style={styles.rowItem}
                onPress={() => setActiveModal('ramadan')}
                activeOpacity={0.65}
              >
                <View style={styles.rowValueContainer}>
                  <Ionicons name="chevron-back" size={16} color={colors.chevron} />
                  <Text style={[styles.rowValueText, { color: colors.itemSubtitle }]} numberOfLines={1}>
                    {currentRamadanLabel}
                  </Text>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                  تعديل العشاء في رمضان
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= SECTION 2: تعديل أوقات الصلاة يدوياً ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>
              تعديل أوقات الصلاة يدوياً
            </Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {PRAYERS_LIST.map((prayer, index) => {
                const base = baseTimes[prayer.id] || '12:00';
                const offset = config.offsets[prayer.id] || 0;
                const ramadanExtra = prayer.id === 'Isha' ? config.ramadanIshaOffset || 0 : 0;
                const adjustedTime24 = applyMinuteOffsetToTime(base, offset + ramadanExtra);
                const formattedTime = formatTo12HourArabic(adjustedTime24);

                return (
                  <React.Fragment key={prayer.id}>
                    {index > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                    <View style={styles.prayerRow}>
                      {/* Left: Capsule Stepper [ + | - ] */}
                      <View
                        style={[
                          styles.stepperContainer,
                          {
                            backgroundColor: colors.stepperBg,
                            borderColor: colors.stepperBorder,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateOffsets(prayer.id, 1)}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="add" size={18} color={colors.stepperText} />
                        </TouchableOpacity>

                        <View
                          style={[styles.stepperDivider, { backgroundColor: colors.stepperDivider }]}
                        />

                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateOffsets(prayer.id, -1)}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="remove" size={18} color={colors.stepperText} />
                        </TouchableOpacity>
                      </View>

                      {/* Right: Icon + Prayer Name & Live Time */}
                      <View style={styles.prayerInfoContainer}>
                        <View style={styles.prayerTextGroup}>
                          <View style={styles.prayerNameRow}>
                            {offset !== 0 && (
                              <View
                                style={[
                                  styles.offsetPill,
                                  { backgroundColor: offset > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.offsetPillText,
                                    { color: offset > 0 ? '#10b981' : '#ef4444' },
                                  ]}
                                >
                                  {offset > 0 ? `+${offset}` : `${offset}`}
                                </Text>
                              </View>
                            )}
                            <Text style={[styles.prayerNameText, { color: colors.itemTitle }]}>
                              {prayer.name}
                            </Text>
                          </View>
                          <Text style={[styles.prayerTimeText, { color: colors.itemSubtitle }]}>
                            {formattedTime}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.prayerIconCircle,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(16, 185, 129, 0.08)',
                              borderColor: isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(16, 185, 129, 0.15)',
                            },
                          ]}
                        >
                          <Ionicons name={prayer.icon} size={20} color={prayer.iconColor} />
                        </View>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* ================= SECTION 3: استعادة الإعدادات الإفتراضية ================= */}
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.resetCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <TouchableOpacity
                onPress={handleResetToDefaults}
                style={styles.resetBtnTouch}
                activeOpacity={0.7}
              >
                <Text style={styles.resetBtnText}>استعادة</Text>
              </TouchableOpacity>

              <Text style={[styles.resetLabelText, { color: colors.itemTitle }]}>
                استعادة الإعدادات الإفتراضية
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* ================= MODAL: طريقة الحساب ================= */}
        <Modal
          visible={activeModal === 'method'}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setActiveModal(null)}>
            <Pressable
              style={[
                styles.modalCard,
                { backgroundColor: colors.modalBg, borderColor: colors.cardBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color={colors.itemSubtitle} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.itemTitle }]}>
                  اختر طريقة الحساب
                </Text>
              </View>

              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {CALCULATION_METHODS.map((m) => {
                  const isSelected = config.methodId === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.modalOptionRow,
                        isSelected && {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(16, 185, 129, 0.08)',
                        },
                      ]}
                      onPress={() => handleSelectMethod(m)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.activeCheck} />
                      ) : (
                        <View style={{ width: 20 }} />
                      )}
                      <Text
                        style={[
                          styles.modalOptionText,
                          { color: isSelected ? colors.activeCheck : colors.itemTitle },
                        ]}
                      >
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ================= MODAL: حساب وقت العصر ================= */}
        <Modal
          visible={activeModal === 'asr'}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setActiveModal(null)}>
            <Pressable
              style={[
                styles.modalCard,
                { backgroundColor: colors.modalBg, borderColor: colors.cardBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color={colors.itemSubtitle} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.itemTitle }]}>
                  حساب وقت العصر
                </Text>
              </View>

              <View style={styles.modalList}>
                {ASR_MADHABS.map((madhab) => {
                  const isSelected = config.asrMadhab === madhab.id;
                  return (
                    <TouchableOpacity
                      key={madhab.id}
                      style={[
                        styles.modalOptionRow,
                        isSelected && {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(16, 185, 129, 0.08)',
                        },
                      ]}
                      onPress={() => handleSelectAsr(madhab.id)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.activeCheck} />
                      ) : (
                        <View style={{ width: 20 }} />
                      )}
                      <View style={{ alignItems: 'flex-end', flex: 1 }}>
                        <Text
                          style={[
                            styles.modalOptionText,
                            { color: isSelected ? colors.activeCheck : colors.itemTitle },
                          ]}
                        >
                          {madhab.name}
                        </Text>
                        <Text style={[styles.modalOptionSubtext, { color: colors.itemSubtitle }]}>
                          {madhab.subtitle}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ================= MODAL: تعديل العشاء في رمضان ================= */}
        <Modal
          visible={activeModal === 'ramadan'}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setActiveModal(null)}>
            <Pressable
              style={[
                styles.modalCard,
                { backgroundColor: colors.modalBg, borderColor: colors.cardBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color={colors.itemSubtitle} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.itemTitle }]}>
                  تعديل العشاء في رمضان
                </Text>
              </View>

              <View style={styles.modalList}>
                {RAMADAN_ISHA_OPTIONS.map((opt) => {
                  const isSelected = config.ramadanIshaOffset === opt.offset;
                  return (
                    <TouchableOpacity
                      key={opt.offset}
                      style={[
                        styles.modalOptionRow,
                        isSelected && {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(16, 185, 129, 0.08)',
                        },
                      ]}
                      onPress={() => handleSelectRamadan(opt.offset)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.activeCheck} />
                      ) : (
                        <View style={{ width: 20 }} />
                      )}
                      <Text
                        style={[
                          styles.modalOptionText,
                          { color: isSelected ? colors.activeCheck : colors.itemTitle },
                        ]}
                      >
                        {opt.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
  },
  headerRightContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    textAlign: 'right',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginTop: 18,
  },
  sectionLabel: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowTitleText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    textAlign: 'right',
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  rowValueText: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 14,
    textAlign: 'left',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  prayerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prayerTextGroup: {
    alignItems: 'flex-end',
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayerNameText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
  },
  prayerTimeText: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 13,
    marginTop: -2,
  },
  offsetPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  offsetPillText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  prayerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    height: 34,
    paddingHorizontal: 2,
  },
  stepperBtn: {
    width: 34,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperDivider: {
    width: 1,
    height: 16,
  },
  resetCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetLabelText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    textAlign: 'right',
  },
  resetBtnTouch: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    textAlign: 'right',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    maxHeight: 380,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  modalOptionText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    textAlign: 'right',
  },
  modalOptionSubtext: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
});