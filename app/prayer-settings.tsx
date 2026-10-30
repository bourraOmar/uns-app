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

interface PrayerItem {
  id: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PRAYERS: PrayerItem[] = [
  { id: 'Fajr', name: 'الفجر', icon: 'sparkles-outline' },
  { id: 'Dhuhr', name: 'الظهر', icon: 'sunny-outline' },
  { id: 'Asr', name: 'العصر', icon: 'sunny' },
  { id: 'Maghrib', name: 'المغرب', icon: 'partly-sunny-outline' },
  { id: 'Isha', name: 'العشاء', icon: 'moon-outline' },
];

export default function PrayerSettingsScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();

  const [config, setConfig] = useState<PrayerCalculationConfig>(DEFAULT_PRAYER_CONFIG);
  const [baseTimes, setBaseTimes] = useState<Record<string, string>>({
    Fajr: '05:30',
    Dhuhr: '12:22',
    Asr: '15:25',
    Maghrib: '17:49',
    Isha: '19:07',
  });
  const [activeModal, setActiveModal] = useState<'method' | 'asr' | 'ramadan' | null>(null);

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

  // Color palette matching the reference design and uns-app theme
  const colors = {
    screenBg: isDark ? '#0e151b' : '#f8fafc',
    headerTitle: isDark ? '#ffffff' : '#0f172a',
    backBtnBg: isDark ? '#1a242c' : '#f1f5f9',
    backBtnBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
    sectionLabel: isDark ? '#6ee7b7' : '#059669', // Mint emerald tint like reference
    cardBg: isDark ? '#151f28' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    divider: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    itemTitle: isDark ? '#ffffff' : '#0f172a',
    itemValue: isDark ? '#94a3b8' : '#64748b',
    iconCircleBg: isDark ? 'rgba(52, 211, 153, 0.16)' : 'rgba(16, 185, 129, 0.12)',
    iconTint: isDark ? '#6ee7b7' : '#059669',
    stepperBg: isDark ? '#1f2a35' : '#f1f5f9',
    stepperBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    stepperDivider: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
    stepperIcon: isDark ? '#ffffff' : '#0f172a',
    modalBg: isDark ? '#151f28' : '#ffffff',
    activeCheck: '#10b981',
  };

  const currentAsrLabel =
    ASR_MADHABS.find((m) => m.id === config.asrMadhab)?.name || 'حنبلي، شافعي، مالكي';

  const currentRamadanLabel =
    RAMADAN_ISHA_OPTIONS.find((r) => r.offset === config.ramadanIshaOffset)?.name || 'بدون إضافة';

  return (
    <View style={[styles.root, { backgroundColor: colors.screenBg }]}>
      <IslamicBackground />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ================= TOP HEADER (Matching Reference) ================= */}
          <View style={styles.headerContainer}>
            {/* Back Button on Top Right */}
            <View style={styles.backButtonRow}>
              <TouchableOpacity
                style={[
                  styles.backButton,
                  { backgroundColor: colors.backBtnBg, borderColor: colors.backBtnBorder },
                ]}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/' as any))}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={24} color={colors.headerTitle} />
              </TouchableOpacity>
            </View>

            {/* Main Screen Title placed below back button, right-aligned */}
            <Text style={[styles.mainScreenTitle, { color: colors.headerTitle }]}>
              اعدادات مواقيت الصلاة
            </Text>
          </View>

          {/* ================= SECTION 1: الحساب ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.sectionLabel }]}>الحساب</Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {/* Row 1: طريقة الحساب */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setActiveModal('method')}
                activeOpacity={0.65}
              >
                <View style={styles.rowLeftGroup}>
                  <Ionicons name="chevron-back" size={17} color={colors.itemValue} />
                  <Text style={[styles.rowValueText, { color: colors.itemValue }]} numberOfLines={1}>
                    {config.methodName}
                  </Text>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>طريقة الحساب</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 2: حساب وقت العصر */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setActiveModal('asr')}
                activeOpacity={0.65}
              >
                <View style={styles.rowLeftGroup}>
                  <Ionicons name="chevron-back" size={17} color={colors.itemValue} />
                  <Text style={[styles.rowValueText, { color: colors.itemValue }]} numberOfLines={1}>
                    {currentAsrLabel}
                  </Text>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>حساب وقت العصر</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 3: تعديل العشاء في رمضان */}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setActiveModal('ramadan')}
                activeOpacity={0.65}
              >
                <View style={styles.rowLeftGroup}>
                  <Ionicons name="chevron-back" size={17} color={colors.itemValue} />
                  <Text style={[styles.rowValueText, { color: colors.itemValue }]} numberOfLines={1}>
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
            <Text style={[styles.sectionTitle, { color: colors.sectionLabel }]}>
              تعديل أوقات الصلاة يدوياً
            </Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {PRAYERS.map((prayer, index) => {
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
                          styles.stepperPill,
                          {
                            backgroundColor: colors.stepperBg,
                            borderColor: colors.stepperBorder,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.stepperAction}
                          onPress={() => updateOffsets(prayer.id, 1)}
                          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="add" size={19} color={colors.stepperIcon} />
                        </TouchableOpacity>

                        <View
                          style={[styles.stepperSeparator, { backgroundColor: colors.stepperDivider }]}
                        />

                        <TouchableOpacity
                          style={styles.stepperAction}
                          onPress={() => updateOffsets(prayer.id, -1)}
                          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="remove" size={19} color={colors.stepperIcon} />
                        </TouchableOpacity>
                      </View>

                      {/* Right: Prayer name & time ON SAME LINE + Icon Circle (Matching Screenshot) */}
                      <View style={styles.prayerRightGroup}>
                        <View style={styles.prayerSingleLineText}>
                          <Text style={[styles.prayerNameText, { color: colors.itemTitle }]}>
                            {prayer.name}{' '}
                            <Text style={[styles.prayerTimeText, { color: colors.itemValue }]}>
                              {formattedTime}
                            </Text>
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.prayerIconCircle,
                            {
                              backgroundColor: colors.iconCircleBg,
                            },
                          ]}
                        >
                          <Ionicons name={prayer.icon} size={20} color={colors.iconTint} />
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

        {/* ================= MODALS ================= */}
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
                  <Ionicons name="close" size={22} color={colors.itemValue} />
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
                  <Ionicons name="close" size={22} color={colors.itemValue} />
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
                        <Text style={[styles.modalOptionSubtext, { color: colors.itemValue }]}>
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
                  <Ionicons name="close" size={22} color={colors.itemValue} />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 40,
  },
  /* Header matching reference */
  headerContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  backButtonRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainScreenTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 26,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  /* Section headers */
  sectionContainer: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  /* Cards */
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowTitleText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    textAlign: 'right',
  },
  rowLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  /* Prayer rows */
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  prayerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  prayerSingleLineText: {
    alignItems: 'flex-end',
  },
  prayerNameText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    textAlign: 'right',
  },
  prayerTimeText: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 14,
  },
  prayerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Stepper capsule [ + | - ] */
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    height: 38,
    width: 90,
  },
  stepperAction: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperSeparator: {
    width: 1,
    height: 18,
  },
  /* Reset Card */
  resetCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
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
  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
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
    paddingHorizontal: 14,
    borderRadius: 12,
    marginVertical: 3,
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