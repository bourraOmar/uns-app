import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
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
  notificationService,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '@/services/notificationService';

type PrayerToggleKey = 'Fajr' | 'Sunrise' | 'Jumuah' | 'Asr' | 'Maghrib' | 'Isha';

interface PrayerRowData {
  key: PrayerToggleKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSwitch?: boolean;
}

const PRAYER_ROWS: PrayerRowData[] = [
  { key: 'Fajr', title: 'صلاة الفجر', icon: 'sparkles-outline' },
  { key: 'Sunrise', title: 'الشروق', icon: 'navigate-outline', isSwitch: true },
  { key: 'Jumuah', title: 'صلاة الجمعة', icon: 'sunny' },
  { key: 'Asr', title: 'صلاة العصر', icon: 'sunny-outline' },
  { key: 'Maghrib', title: 'صلاة المغرب', icon: 'partly-sunny-outline' },
  { key: 'Isha', title: 'صلاة العشاء', icon: 'moon-outline' },
];

export default function PrayerNotificationsScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await notificationService.getSettings();
    setSettings(s);
  };

  const handleTogglePrayer = async (key: PrayerToggleKey, explicitVal?: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentVal = settings.prayerToggles[key];
    const nextVal = explicitVal !== undefined ? explicitVal : !currentVal;

    const updatedToggles = {
      ...settings.prayerToggles,
      [key]: nextVal,
    };

    const updated = {
      ...settings,
      prayerToggles: updatedToggles,
    };

    setSettings(updated);
    await notificationService.updateSettings({ prayerToggles: updatedToggles });
  };

  const handleResetDefaults = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'إعادة التعيين',
      'هل ترغب في إعادة ضبط تنبيهات مواقيت الصلاة إلى الوضع الافتراضي؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة التعيين',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const defaultToggles = { ...DEFAULT_NOTIFICATION_SETTINGS.prayerToggles };
            const updated = { ...settings, prayerToggles: defaultToggles };
            setSettings(updated);
            await notificationService.updateSettings({ prayerToggles: defaultToggles });
          },
        },
      ]
    );
  };

  // Color palette matching the reference screenshot and uns-app theme
  const colors = {
    screenBg: isDark ? '#0e151b' : '#f8fafc',
    headerTitle: isDark ? '#ffffff' : '#0f172a',
    backBtnBg: isDark ? '#1a242c' : '#f1f5f9',
    backBtnBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
    resetBtnBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    resetBtnText: isDark ? '#cbd5e1' : '#475569',
    sectionTitle: isDark ? '#6ee7b7' : '#059669', // Mint emerald tint like reference
    cardBg: isDark ? '#151f28' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    divider: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    itemTitle: isDark ? '#ffffff' : '#0f172a',
    itemStatusText: isDark ? '#94a3b8' : '#64748b',
    iconCircleBg: isDark ? 'rgba(52, 211, 153, 0.16)' : 'rgba(16, 185, 129, 0.12)',
    iconTint: isDark ? '#6ee7b7' : '#059669',
    chevron: isDark ? '#94a3b8' : '#64748b',
    switchTrackFalse: isDark ? '#334155' : '#cbd5e1',
    switchTrackTrue: '#10b981',
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
            <View style={styles.topActionsRow}>
              {/* Reset Button on Left */}
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: colors.resetBtnBg }]}
                onPress={handleResetDefaults}
                activeOpacity={0.7}
              >
                <Text style={[styles.resetButtonText, { color: colors.resetBtnText }]}>
                  إعادة التعيين
                </Text>
              </TouchableOpacity>

              {/* Back Button on Right */}
              <TouchableOpacity
                style={[
                  styles.backButton,
                  { backgroundColor: colors.backBtnBg, borderColor: colors.backBtnBorder },
                ]}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/notifications-settings' as any))}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={24} color={colors.headerTitle} />
              </TouchableOpacity>
            </View>

            {/* Screen Title placed below action row, right-aligned */}
            <Text style={[styles.mainScreenTitle, { color: colors.headerTitle }]}>
              تنبيهات الصلاة
            </Text>
          </View>

          {/* ================= SECTION 1: تنبيهات أوقات الصلاة ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
              تنبيهات أوقات الصلاة
            </Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {PRAYER_ROWS.map((p, index) => {
                const isEnabled = settings.prayerToggles[p.key];

                return (
                  <React.Fragment key={p.key}>
                    {index > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}

                    {p.isSwitch ? (
                      /* Sunrise row with Switch */
                      <View style={styles.prayerRow}>
                        <Switch
                          value={isEnabled}
                          onValueChange={(val) => handleTogglePrayer(p.key, val)}
                          trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                          thumbColor="#ffffff"
                        />

                        <View style={styles.rowRightGroup}>
                          <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                            {p.title}
                          </Text>
                          <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
                            <Ionicons name={p.icon} size={19} color={colors.iconTint} />
                          </View>
                        </View>
                      </View>
                    ) : (
                      /* Prayers rows with Chevron and "مفعل / معطل" */
                      <TouchableOpacity
                        style={styles.prayerRow}
                        onPress={() => handleTogglePrayer(p.key)}
                        activeOpacity={0.65}
                      >
                        <View style={styles.rowLeftGroup}>
                          <Ionicons name="chevron-back" size={16} color={colors.chevron} />
                          <Text
                            style={[
                              styles.rowStatusText,
                              { color: isEnabled ? colors.itemStatusText : '#ef4444' },
                            ]}
                          >
                            {isEnabled ? 'مفعل' : 'معطل'}
                          </Text>
                        </View>

                        <View style={styles.rowRightGroup}>
                          <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                            {p.title}
                          </Text>
                          <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
                            <Ionicons name={p.icon} size={19} color={colors.iconTint} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* ================= SECTION 2: اعدادات مواقيت الصلاة ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
              اعدادات مواقيت الصلاة
            </Text>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={styles.prayerRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/prayer-settings' as any);
                }}
                activeOpacity={0.65}
              >
                <Ionicons name="chevron-back" size={17} color={colors.chevron} />

                <Text style={[styles.rowTitleText, { color: colors.itemTitle }]}>
                  تعديل الإعدادات
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  /* Header */
  headerContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
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
  prayerRow: {
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
  rowLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowStatusText: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});