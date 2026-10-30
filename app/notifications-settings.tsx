import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/context/ThemeContext';
import IslamicBackground from '@/components/IslamicBackground';
import {
  notificationService,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  ADHAN_OPTIONS,
  AdhanOption,
} from '@/services/notificationService';

type PrayerKey = 'Fajr' | 'Jumuah' | 'Asr' | 'Maghrib' | 'Isha';

interface AdhanPrayerRow {
  key: PrayerKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ADHAN_PRAYERS_LIST: AdhanPrayerRow[] = [
  { key: 'Fajr', title: 'صلاة الفجر', icon: 'sparkles-outline' },
  { key: 'Jumuah', title: 'صلاة الجمعة', icon: 'business-outline' },
  { key: 'Asr', title: 'صلاة العصر', icon: 'sunny-outline' },
  { key: 'Maghrib', title: 'صلاة المغرب', icon: 'partly-sunny-outline' },
  { key: 'Isha', title: 'صلاة العشاء', icon: 'moon-outline' },
];

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isAdhanModalVisible, setIsAdhanModalVisible] = useState(false);
  const [selectedPrayerForReciter, setSelectedPrayerForReciter] = useState<PrayerKey | null>(null);
  const [playingAdhanId, setPlayingAdhanId] = useState<string | null>(null);

  // Time Picker Modal State
  const [timePickerTarget, setTimePickerTarget] = useState<{
    key: string;
    title: string;
    hour: number;
    minute: number;
  } | null>(null);

  useEffect(() => {
    loadSettings();

    const unsub = notificationService.subscribePreview(() => {
      setPlayingAdhanId(notificationService.getCurrentPreviewId());
    });

    return () => {
      unsub();
      notificationService.stopPreview();
    };
  }, []);

  const loadSettings = async () => {
    const s = await notificationService.getSettings();
    setSettings(s);
  };

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await notificationService.updateSettings({ [key]: value });

    // Sync Tasbih settings with Tasbih screen storage keys
    if (key === 'tasbihSound') {
      AsyncStorage.setItem('@tasbih_sound_v1', JSON.stringify(value)).catch(() => {});
    } else if (key === 'tasbihHaptics') {
      AsyncStorage.setItem('@tasbih_haptics_v1', JSON.stringify(value)).catch(() => {});
    } else if (key === 'tasbihSaveLastCount') {
      AsyncStorage.setItem('@tasbih_save_last_count_v1', JSON.stringify(value)).catch(() => {});
    }
  };

  const handleSelectAdhanForPrayer = async (prayerKey: PrayerKey, adhanId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedPrayerAdhans = {
      ...settings.prayerAdhans,
      [prayerKey]: adhanId,
    };
    const updated = {
      ...settings,
      selectedAdhanId: adhanId,
      prayerAdhans: updatedPrayerAdhans,
    };
    setSettings(updated);
    await notificationService.updateSettings({
      selectedAdhanId: adhanId,
      prayerAdhans: updatedPrayerAdhans,
    });
    setSelectedPrayerForReciter(null);
  };

  const formatTimePill = (hour: number, minute: number): string => {
    const isPM = hour >= 12;
    let h12 = hour % 12;
    if (h12 === 0) h12 = 12;
    const mStr = minute.toString().padStart(2, '0');
    const period = isPM ? 'م' : 'ص';
    return `${h12}:${mStr} ${period}`;
  };

  const openTimePicker = (key: string, title: string, hour: number, minute: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimePickerTarget({ key, title, hour, minute });
  };

  const saveSelectedTime = async (hour: number, minute: number) => {
    if (!timePickerTarget) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const key = timePickerTarget.key;
    let patch: Partial<NotificationSettings> = {};

    if (key === 'morning') {
      patch = { morningHour: hour, morningMinute: minute };
    } else if (key === 'evening') {
      patch = { eveningHour: hour, eveningMinute: minute };
    } else if (key === 'sleep') {
      patch = { sleepHour: hour, sleepMinute: minute };
    } else if (key === 'lastTenDays') {
      patch = { lastTenDaysHour: hour, lastTenDaysMinute: minute };
    } else if (key === 'kahf') {
      patch = { kahfHour: hour, kahfMinute: minute };
    } else if (key === 'duha') {
      patch = { duhaHour: hour, duhaMinute: minute };
    } else if (key === 'witr') {
      patch = { witrHour: hour, witrMinute: minute };
    }

    const updated = { ...settings, ...patch };
    setSettings(updated);
    await notificationService.updateSettings(patch);
    setTimePickerTarget(null);
  };

  const getAdhanName = (id: string): string => {
    const found = ADHAN_OPTIONS.find((a) => a.id === id);
    return found ? found.name : 'أذان ناصر القطامي';
  };

  // Color palette matching the reference screenshots
  const colors = {
    screenBg: isDark ? '#0e151b' : '#f8fafc',
    headerTitle: isDark ? '#ffffff' : '#0f172a',
    backBtnBg: isDark ? '#1a242c' : '#f1f5f9',
    backBtnBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
    sectionTitle: isDark ? '#6ee7b7' : '#059669', // Mint emerald tint
    cardBg: isDark ? '#151f28' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    divider: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    itemTitle: isDark ? '#ffffff' : '#0f172a',
    chevron: isDark ? '#94a3b8' : '#64748b',
    iconCircleBg: isDark ? 'rgba(52, 211, 153, 0.16)' : 'rgba(16, 185, 129, 0.12)',
    iconTint: isDark ? '#6ee7b7' : '#059669',
    timePillBg: isDark ? '#1f2a35' : '#f1f5f9',
    timePillText: isDark ? '#cbd5e1' : '#475569',
    switchTrackFalse: isDark ? '#334155' : '#cbd5e1',
    switchTrackTrue: '#10b981',
    modalBg: isDark ? '#18222b' : '#ffffff',
    saveBtnBg: '#a7f3d0',
    saveBtnText: '#064e3b',
  };

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

            <Text style={[styles.mainScreenTitle, { color: colors.headerTitle }]}>
              إعدادات التنبيهات
            </Text>
          </View>

          {/* ================= SECTION 1: تنبيهات الصلاة ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>تنبيهات الصلاة</Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => handleToggle('prayerTimes', !settings.prayerTimes)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={settings.prayerTimes ? 'checkmark-circle' : 'chevron-back'}
                  size={settings.prayerTimes ? 20 : 17}
                  color={settings.prayerTimes ? '#10b981' : colors.chevron}
                />

                <View style={styles.rowRightGroup}>
                  <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                    تفعيل تنبيهات الصلاة
                  </Text>
                  <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
                    <Ionicons name="business-outline" size={19} color={colors.iconTint} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= SECTION 2: أصوات التنبيهات ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>أصوات التنبيهات</Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setIsAdhanModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={17} color={colors.chevron} />

                <View style={styles.rowRightGroup}>
                  <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>صوت الأذان</Text>
                  <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
                    <Ionicons name="notifications-outline" size={19} color={colors.iconTint} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= SECTION 3: تنبيهات الأذكار ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>تنبيهات الأذكار</Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {/* Row 1: أذكار الصباح */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.morningAdhkar}
                    onValueChange={(val) => handleToggle('morningAdhkar', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    style={[styles.timePill, { backgroundColor: colors.timePillBg }]}
                    onPress={() =>
                      openTimePicker('morning', 'أذكار الصباح', settings.morningHour, settings.morningMinute)
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>
                      {formatTimePill(settings.morningHour, settings.morningMinute)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>أذكار الصباح</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 2: أذكار المساء */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.eveningAdhkar}
                    onValueChange={(val) => handleToggle('eveningAdhkar', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    style={[styles.timePill, { backgroundColor: colors.timePillBg }]}
                    onPress={() =>
                      openTimePicker('evening', 'أذكار المساء', settings.eveningHour, settings.eveningMinute)
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>
                      {formatTimePill(settings.eveningHour, settings.eveningMinute)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>أذكار المساء</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 3: أذكار النوم */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.sleepAdhkar}
                    onValueChange={(val) => handleToggle('sleepAdhkar', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    style={[styles.timePill, { backgroundColor: colors.timePillBg }]}
                    onPress={() =>
                      openTimePicker('sleep', 'أذكار النوم', settings.sleepHour, settings.sleepMinute)
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>
                      {formatTimePill(settings.sleepHour, settings.sleepMinute)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>أذكار النوم</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 4: دعاء العشر الأواخر */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.lastTenDaysDua}
                    onValueChange={(val) => handleToggle('lastTenDaysDua', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    style={[styles.timePill, { backgroundColor: colors.timePillBg }]}
                    onPress={() =>
                      openTimePicker(
                        'lastTenDays',
                        'دعاء العشر الأواخر',
                        settings.lastTenDaysHour,
                        settings.lastTenDaysMinute
                      )
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>
                      {formatTimePill(settings.lastTenDaysHour, settings.lastTenDaysMinute)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                  دعاء العشر الأواخر
                </Text>
              </View>
            </View>
          </View>

          {/* ================= SECTION 4: تنبيهات الطاعات ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>تنبيهات الطاعات</Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {/* Row 1: الصلاة على النبي */}
              <View style={styles.switchRow}>
                <Switch
                  value={settings.prophetPrayer}
                  onValueChange={(val) => handleToggle('prophetPrayer', val)}
                  trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                  thumbColor="#ffffff"
                />
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>الصلاة على النبي</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 2: صيام الإثنين والخميس */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.fastingMondayThursday}
                    onValueChange={(val) => handleToggle('fastingMondayThursday', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <View style={[styles.timePill, { backgroundColor: colors.timePillBg }]}>
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>قبل يوم</Text>
                  </View>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                  صيام الإثنين والخميس
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 3: تذكير سورة الكهف */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.kahfReminder}
                    onValueChange={(val) => handleToggle('kahfReminder', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    style={[styles.timePill, { backgroundColor: colors.timePillBg }]}
                    onPress={() =>
                      openTimePicker('kahf', 'تذكير سورة الكهف', settings.kahfHour, settings.kahfMinute)
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>
                      {formatTimePill(settings.kahfHour, settings.kahfMinute)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                  تذكير سورة الكهف
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 4: صلاة الضحى */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.duhaPrayer}
                    onValueChange={(val) => handleToggle('duhaPrayer', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    style={[styles.timePill, { backgroundColor: colors.timePillBg }]}
                    onPress={() =>
                      openTimePicker('duha', 'صلاة الضحى', settings.duhaHour, settings.duhaMinute)
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>
                      {formatTimePill(settings.duhaHour, settings.duhaMinute)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>صلاة الضحى</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 5: صلاة الوتر */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.witrPrayer}
                    onValueChange={(val) => handleToggle('witrPrayer', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    style={[styles.timePill, { backgroundColor: colors.timePillBg }]}
                    onPress={() =>
                      openTimePicker('witr', 'صلاة الوتر', settings.witrHour, settings.witrMinute)
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>
                      {formatTimePill(settings.witrHour, settings.witrMinute)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>صلاة الوتر</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 6: آخر ساعة من الجمعة */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.fridayLastHour}
                    onValueChange={(val) => handleToggle('fridayLastHour', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <View style={[styles.timePill, { backgroundColor: colors.timePillBg }]}>
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>
                      {settings.fridayLastHourTime}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                  آخر ساعة من الجمعة
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 7: التذكير بالصدقة */}
              <View style={styles.switchRow}>
                <Switch
                  value={settings.charityReminder}
                  onValueChange={(val) => handleToggle('charityReminder', val)}
                  trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                  thumbColor="#ffffff"
                />
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                  التذكير بالصدقة
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 8: الأيام البيض */}
              <View style={styles.switchRow}>
                <View style={styles.switchLeftGroup}>
                  <Switch
                    value={settings.whiteDaysFasting}
                    onValueChange={(val) => handleToggle('whiteDaysFasting', val)}
                    trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                    thumbColor="#ffffff"
                  />
                  <View style={[styles.timePill, { backgroundColor: colors.timePillBg }]}>
                    <Text style={[styles.timePillText, { color: colors.timePillText }]}>قبل يوم</Text>
                  </View>
                </View>
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>الأيام البيض</Text>
              </View>
            </View>
          </View>

          {/* ================= SECTION 5: عداد التسبيح ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>عداد التسبيح</Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {/* Row 1: صوت العداد */}
              <View style={styles.switchRow}>
                <Switch
                  value={settings.tasbihSound}
                  onValueChange={(val) => handleToggle('tasbihSound', val)}
                  trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                  thumbColor="#ffffff"
                />
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>صوت العداد</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 2: العداد بالاهتزاز */}
              <View style={styles.switchRow}>
                <Switch
                  value={settings.tasbihHaptics}
                  onValueChange={(val) => handleToggle('tasbihHaptics', val)}
                  trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                  thumbColor="#ffffff"
                />
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                  العداد بالاهتزاز
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Row 3: حفظ آخر رقم وصل إليه العداد */}
              <View style={styles.switchRow}>
                <Switch
                  value={settings.tasbihSaveLastCount}
                  onValueChange={(val) => handleToggle('tasbihSaveLastCount', val)}
                  trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                  thumbColor="#ffffff"
                />
                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                  حفظ آخر رقم وصل إليه العداد
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ================= MODAL: صوت تنبيه الأذان (Bottom Sheet - Image 3) ================= */}
        <Modal
          visible={isAdhanModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAdhanModalVisible(false)}
        >
          <Pressable
            style={styles.bottomSheetOverlay}
            onPress={() => setIsAdhanModalVisible(false)}
          >
            <Pressable
              style={[
                styles.bottomSheetCard,
                { backgroundColor: colors.modalBg, borderColor: colors.cardBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Top Grabber Handle */}
              <View style={styles.grabberHandle} />

              {/* Modal Header */}
              <View style={styles.bottomSheetHeader}>
                <TouchableOpacity
                  onPress={() => setIsAdhanModalVisible(false)}
                  style={[styles.sheetCloseBtn, { backgroundColor: colors.timePillBg }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={colors.chevron} />
                </TouchableOpacity>

                <Text style={[styles.bottomSheetTitle, { color: colors.itemTitle }]}>
                  صوت تنبيه الأذان
                </Text>
              </View>

              {/* 5 Prayers List */}
              <View style={styles.adhanPrayersList}>
                {ADHAN_PRAYERS_LIST.map((p, index) => {
                  const currentAdhanId = settings.prayerAdhans?.[p.key] || settings.selectedAdhanId;
                  const adhanName = getAdhanName(currentAdhanId);

                  return (
                    <React.Fragment key={p.key}>
                      {index > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                      <TouchableOpacity
                        style={styles.adhanPrayerRow}
                        onPress={() => setSelectedPrayerForReciter(p.key)}
                        activeOpacity={0.65}
                      >
                        <View style={styles.adhanRowLeft}>
                          <Ionicons name="chevron-back" size={16} color={colors.chevron} />
                          <Text style={[styles.adhanValueText, { color: colors.chevron }]} numberOfLines={1}>
                            {adhanName}
                          </Text>
                        </View>

                        <View style={styles.rowRightGroup}>
                          <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                            {p.title}
                          </Text>
                          <View
                            style={[styles.prayerMiniIconCircle, { backgroundColor: colors.iconCircleBg }]}
                          >
                            <Ionicons name={p.icon} size={18} color={colors.iconTint} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </View>

              {/* Bottom Green Action Button */}
              <TouchableOpacity
                style={[styles.saveSelectionBtn, { backgroundColor: colors.saveBtnBg }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setIsAdhanModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.saveSelectionBtnText, { color: colors.saveBtnText }]}>
                  حفظ الإختيار
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ================= MODAL: اختيار صوت المؤذن للصلاة ================= */}
        <Modal
          visible={selectedPrayerForReciter !== null}
          transparent
          animationType="fade"
          onRequestClose={() => {
            notificationService.stopPreview();
            setSelectedPrayerForReciter(null);
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              notificationService.stopPreview();
              setSelectedPrayerForReciter(null);
            }}
          >
            <Pressable
              style={[
                styles.reciterPickerCard,
                { backgroundColor: colors.modalBg, borderColor: colors.cardBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.reciterHeader}>
                <TouchableOpacity
                  onPress={() => {
                    notificationService.stopPreview();
                    setSelectedPrayerForReciter(null);
                  }}
                  style={styles.sheetCloseBtn}
                >
                  <Ionicons name="close" size={20} color={colors.chevron} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.itemTitle }]}>
                  اختر صوت الأذان
                </Text>
              </View>

              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {ADHAN_OPTIONS.map((opt) => {
                  const currentSelected = selectedPrayerForReciter
                    ? settings.prayerAdhans?.[selectedPrayerForReciter] === opt.id
                    : false;
                  const isPlaying = playingAdhanId === opt.id;

                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.reciterOptionRow,
                        currentSelected && {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(16, 185, 129, 0.08)',
                        },
                      ]}
                      onPress={() => {
                        if (selectedPrayerForReciter) {
                          handleSelectAdhanForPrayer(selectedPrayerForReciter, opt.id);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <TouchableOpacity
                        style={styles.playAudioBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          notificationService.previewAdhan(opt.id);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={isPlaying ? 'pause-circle' : 'play-circle'}
                          size={28}
                          color={isPlaying ? '#10b981' : colors.chevron}
                        />
                      </TouchableOpacity>

                      <View style={{ alignItems: 'flex-end', flex: 1 }}>
                        <Text
                          style={[
                            styles.reciterNameText,
                            { color: currentSelected ? '#10b981' : colors.itemTitle },
                          ]}
                        >
                          {opt.name}
                        </Text>
                        <Text style={[styles.reciterSubtext, { color: colors.chevron }]}>
                          {opt.subtitle}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ================= MODAL: تعديل وقت التنبيه ================= */}
        <Modal
          visible={timePickerTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setTimePickerTarget(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setTimePickerTarget(null)}>
            <Pressable
              style={[
                styles.timePickerCard,
                { backgroundColor: colors.modalBg, borderColor: colors.cardBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.timePickerTitle, { color: colors.itemTitle }]}>
                تعديل وقت: {timePickerTarget?.title}
              </Text>

              {timePickerTarget && (
                <TimePickerComponent
                  initialHour={timePickerTarget.hour}
                  initialMinute={timePickerTarget.minute}
                  onSave={(h, m) => saveSelectedTime(h, m)}
                  onCancel={() => setTimePickerTarget(null)}
                  colors={colors}
                />
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function TimePickerComponent({
  initialHour,
  initialMinute,
  onSave,
  onCancel,
  colors,
}: {
  initialHour: number;
  initialMinute: number;
  onSave: (h: number, m: number) => void;
  onCancel: () => void;
  colors: any;
}) {
  const [hour12, setHour12] = useState<number>(() => {
    let h = initialHour % 12;
    return h === 0 ? 12 : h;
  });
  const [minute, setMinute] = useState<number>(initialMinute);
  const [isPM, setIsPM] = useState<boolean>(initialHour >= 12);

  const handleConfirm = () => {
    let h24 = hour12 % 12;
    if (isPM) h24 += 12;
    onSave(h24, minute);
  };

  return (
    <View style={styles.timePickerInner}>
      <View style={styles.timePickerRow}>
        {/* Period (AM/PM) */}
        <View style={styles.periodCol}>
          <TouchableOpacity
            style={[
              styles.periodBtn,
              !isPM && { backgroundColor: '#10b981' },
            ]}
            onPress={() => setIsPM(false)}
          >
            <Text style={[styles.periodBtnText, !isPM && { color: '#ffffff' }]}>ص</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodBtn,
              isPM && { backgroundColor: '#10b981' },
            ]}
            onPress={() => setIsPM(true)}
          >
            <Text style={[styles.periodBtnText, isPM && { color: '#ffffff' }]}>م</Text>
          </TouchableOpacity>
        </View>

        {/* Minutes Stepper */}
        <View style={styles.stepperCol}>
          <TouchableOpacity
            style={styles.timeStepBtn}
            onPress={() => setMinute((m) => (m + 5) % 60)}
          >
            <Ionicons name="chevron-up" size={20} color={colors.itemTitle} />
          </TouchableOpacity>
          <Text style={[styles.timeDisplayVal, { color: colors.itemTitle }]}>
            {minute.toString().padStart(2, '0')}
          </Text>
          <TouchableOpacity
            style={styles.timeStepBtn}
            onPress={() => setMinute((m) => (m - 5 + 60) % 60)}
          >
            <Ionicons name="chevron-down" size={20} color={colors.itemTitle} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.timeColon, { color: colors.itemTitle }]}>:</Text>

        {/* Hours Stepper */}
        <View style={styles.stepperCol}>
          <TouchableOpacity
            style={styles.timeStepBtn}
            onPress={() => setHour12((h) => (h === 12 ? 1 : h + 1))}
          >
            <Ionicons name="chevron-up" size={20} color={colors.itemTitle} />
          </TouchableOpacity>
          <Text style={[styles.timeDisplayVal, { color: colors.itemTitle }]}>
            {hour12.toString()}
          </Text>
          <TouchableOpacity
            style={styles.timeStepBtn}
            onPress={() => setHour12((h) => (h === 1 ? 12 : h - 1))}
          >
            <Ionicons name="chevron-down" size={20} color={colors.itemTitle} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.timePickerActions}>
        <TouchableOpacity style={styles.cancelTimeBtn} onPress={onCancel}>
          <Text style={styles.cancelTimeText}>إلغاء</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmTimeBtn} onPress={handleConfirm}>
          <Text style={styles.confirmTimeText}>تأكيد</Text>
        </TouchableOpacity>
      </View>
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitleText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    textAlign: 'right',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePillText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  /* Bottom Sheet Modal (Image 3) */
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  grabberHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    textAlign: 'right',
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adhanPrayersList: {
    marginBottom: 20,
  },
  adhanPrayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  adhanRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  adhanValueText: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 14,
  },
  prayerMiniIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveSelectionBtn: {
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveSelectionBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
  },
  /* Generic Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reciterPickerCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
  },
  reciterHeader: {
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
  reciterOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 3,
  },
  playAudioBtn: {
    marginRight: 10,
  },
  reciterNameText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    textAlign: 'right',
  },
  reciterSubtext: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  /* Time Picker Inner */
  timePickerCard: {
    width: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  timePickerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  timePickerInner: {
    width: '100%',
    alignItems: 'center',
  },
  timePickerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  stepperCol: {
    alignItems: 'center',
  },
  timeStepBtn: {
    padding: 6,
  },
  timeDisplayVal: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    minWidth: 44,
    textAlign: 'center',
  },
  timeColon: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    marginBottom: 4,
  },
  periodCol: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 12,
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  periodBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#94a3b8',
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelTimeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelTimeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#94a3b8',
  },
  confirmTimeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTimeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#ffffff',
  },
});