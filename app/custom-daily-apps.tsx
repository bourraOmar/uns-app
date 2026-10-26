import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IslamicBackground from '@/components/IslamicBackground';
import { useAppTheme } from '@/context/ThemeContext';
import {
  ALL_DAILY_APPS,
  DEFAULT_DAILY_APP_IDS,
  DailyAppItem,
} from '@/data/dailyAppsData';

const MAX_DAILY_APPS = 8;

export default function CustomDailyAppsScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_DAILY_APP_IDS);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  const colors = {
    bg: isDark ? '#0c1712' : '#f8fafc',
    title: isDark ? '#a7f3d0' : '#065f46',
    description: isDark ? '#94a3b8' : '#475569',
    backBtnBg: isDark ? '#1b2c24' : 'rgba(255, 255, 255, 0.95)',
    backBtnBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.95)',
    backBtnIcon: isDark ? '#ffffff' : '#0f172a',
    sectionTitle: isDark ? '#f8fafc' : '#0f172a',
    resetBtnText: isDark ? '#8ba7c0' : '#059669',
    cardSelectedBg: isDark ? '#122019' : 'rgba(255, 255, 255, 0.96)',
    cardSelectedBorder: isDark ? '#243a2e' : 'rgba(16, 185, 129, 0.5)',
    cardUnselectedBg: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.65)',
    cardUnselectedBorder: isDark ? 'transparent' : 'rgba(226, 232, 240, 0.75)',
    appTitle: isDark ? '#f8fafc' : '#0f172a',
    bottomBarBg: isDark ? 'rgba(10, 19, 14, 0.92)' : 'rgba(255, 255, 255, 0.95)',
    bottomBarBorder: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(226, 232, 240, 0.95)',
    countBadgeBg: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)',
    countBadgeBorder: isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.35)',
    countBadgeText: isDark ? '#86efac' : '#047857',
  };

  useEffect(() => {
    AsyncStorage.getItem('@uns_custom_daily_apps').then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter((id) => ALL_DAILY_APPS.some((app) => app.id === id));
            setSelectedIds(valid.length > 0 ? valid.slice(0, MAX_DAILY_APPS) : DEFAULT_DAILY_APP_IDS);
            return;
          }
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    if (showLimitWarning) {
      const timer = setTimeout(() => setShowLimitWarning(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showLimitWarning]);

  const handleToggleApp = (id: string) => {
    if (selectedIds.includes(id)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIds(selectedIds.filter((item) => item !== id));
      setShowLimitWarning(false);
    } else {
      if (selectedIds.length >= MAX_DAILY_APPS) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setShowLimitWarning(true);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIds([...selectedIds, id]);
      setShowLimitWarning(false);
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIds(DEFAULT_DAILY_APP_IDS);
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const toSave = selectedIds.length > 0 ? selectedIds : DEFAULT_DAILY_APP_IDS;
    await AsyncStorage.setItem('@uns_custom_daily_apps', JSON.stringify(toSave));
    router.back();
  };

  const mainApps = ALL_DAILY_APPS.filter((a) => a.category === 'main');
  const otherApps = ALL_DAILY_APPS.filter((a) => a.category === 'other');

  const renderIcon = (app: DailyAppItem) => {
    const size = 22;
    if (app.iconType === 'custom' && app.customIcon) {
      return (
        <Image
          source={app.customIcon}
          style={{ width: size, height: size, tintColor: app.iconColor }}
          resizeMode="contain"
        />
      );
    }
    if (app.iconType === 'material') {
      return (
        <MaterialCommunityIcons
          name={app.iconName as any}
          size={size}
          color={app.iconColor}
        />
      );
    }
    if (app.iconType === 'fontAwesome') {
      return (
        <FontAwesome5
          name={app.iconName as any}
          size={size - 2}
          color={app.iconColor}
        />
      );
    }
    return (
      <Ionicons
        name={app.iconName as any}
        size={size}
        color={app.iconColor}
      />
    );
  };

  const renderAppCard = (app: DailyAppItem) => {
    const orderIndex = selectedIds.indexOf(app.id);
    const isSelected = orderIndex !== -1;

    return (
      <TouchableOpacity
        key={app.id}
        style={[
          styles.appCard,
          {
            backgroundColor: isSelected ? colors.cardSelectedBg : colors.cardUnselectedBg,
            borderColor: isSelected ? colors.cardSelectedBorder : colors.cardUnselectedBorder,
          },
        ]}
        activeOpacity={0.75}
        onPress={() => handleToggleApp(app.id)}
      >
        {/* Order badge (1, 2, 3...) on top-right */}
        {isSelected && (
          <View style={styles.orderBadge}>
            <Text style={styles.orderBadgeText}>{orderIndex + 1}</Text>
          </View>
        )}

        {/* Circular colorful icon */}
        <View style={[styles.iconCircle, { backgroundColor: app.bgColor }]}>
          {renderIcon(app)}
        </View>

        {/* App Title */}
        <Text style={[styles.appTitle, { color: colors.appTitle }]} numberOfLines={2}>
          {app.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top Header Row with Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.backBtnBg, borderColor: colors.backBtnBorder },
            ]}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.backBtnIcon} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Title & Description */}
          <Text style={[styles.screenMainTitle, { color: colors.title }]}>تطبيقاتك اليومية</Text>
          <Text style={[styles.screenDescription, { color: colors.description }]}>
            خصص التطبيقات التي تستخدمها بشكل يومي ومتكرر حتى تظهر في الرئيسية وتبقى أمام عينيك
          </Text>

          {/* Limit Count & Warning Badge */}
          <View style={styles.countBadgeRow}>
            {showLimitWarning ? (
              <View style={styles.limitWarningBadge}>
                <Ionicons name="alert-circle" size={15} color="#fbbf24" />
                <Text style={styles.limitWarningText}>
                  الحد الأقصى هو {MAX_DAILY_APPS} تطبيقات فقط
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: colors.countBadgeBg,
                    borderColor: colors.countBadgeBorder,
                  },
                  selectedIds.length === MAX_DAILY_APPS && styles.countBadgeFull,
                ]}
              >
                <Text style={[styles.countBadgeText, { color: colors.countBadgeText }]}>
                  تم اختيار {selectedIds.length} من {MAX_DAILY_APPS} تطبيقات
                </Text>
              </View>
            )}
          </View>

          {/* Section 1: أهم التطبيقات */}
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.7}
              onPress={handleReset}
            >
              <Text style={[styles.resetButtonText, { color: colors.resetBtnText }]}>إعادة التعيين</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>أهم التطبيقات</Text>
          </View>

          <View style={styles.appsGrid}>
            {mainApps.map((app) => renderAppCard(app))}
          </View>

          {/* Section 2: تطبيقات أخرى */}
          <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
            <View style={{ width: 60 }} />
            <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>تطبيقات أخرى</Text>
          </View>

          <View style={styles.appsGrid}>
            {otherApps.map((app) => renderAppCard(app))}
          </View>

          {/* Spacer so content doesn't hide behind save button */}
          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Fixed Bottom Save Button */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.bottomBarBg,
              borderTopColor: colors.bottomBarBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.saveBtnTouch}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtnGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.saveBtnText}>حفظ الترتيب</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1712',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1b2c24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  screenMainTitle: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 28,
    color: '#a7f3d0',
    textAlign: 'right',
    marginBottom: 8,
  },
  screenDescription: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 16,
  },
  countBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  countBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countBadgeFull: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderColor: '#10b981',
  },
  countBadgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#86efac',
  },
  limitWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  limitWarningText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#fef08a',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 18,
    color: '#f8fafc',
  },
  resetButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#8ba7c0',
  },

  /* Apps Grid - 4 Columns */
  appsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  appCard: {
    width: '22.8%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 110,
  },
  appCardSelected: {
    backgroundColor: '#122019',
    borderColor: '#243a2e',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  orderBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  orderBadgeText: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 11,
    color: '#ffffff',
    lineHeight: 14,
    textAlign: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11.5,
    color: '#f8fafc',
    textAlign: 'center',
    lineHeight: 16,
  },

  /* Fixed Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(10, 19, 14, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  saveBtnTouch: {
    borderRadius: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  saveBtnText: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});
