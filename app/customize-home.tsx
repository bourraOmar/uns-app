import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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
  HomeSectionItem,
  getHomeSections,
  saveHomeSections,
  resetHomeSections,
} from '@/services/homeSectionsService';

const MIN_SECTIONS = 3;

export default function CustomizeHomeScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();

  const [sections, setSections] = useState<HomeSectionItem[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    const list = await getHomeSections();
    setSections(list);
  };

  const handleToggleSection = async (index: number) => {
    const item = sections[index];
    if (!item) return;

    const enabledCount = sections.filter((s) => s.enabled).length;

    // Disallow disabling if it would drop below minimum
    if (item.enabled && enabledCount <= MIN_SECTIONS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setWarningMessage('يجب الإبقاء على 3 أقسام على الأقل في الصفحة الرئيسية');
      setTimeout(() => setWarningMessage(null), 3000);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWarningMessage(null);

    const updated = [...sections];
    updated[index] = { ...item, enabled: !item.enabled };
    setSections(updated);
    await saveHomeSections(updated);
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    setSections(updated);
    await saveHomeSections(updated);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= sections.length - 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    setSections(updated);
    await saveHomeSections(updated);
  };

  const handleResetToDefaults = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'إعادة التعيين',
      'هل ترغب في استعادة الترتيب والأقسام الافتراضية للواجهة الرئيسية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة التعيين',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const resetList = await resetHomeSections();
            setSections(resetList);
            setWarningMessage(null);
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
    mainTitle: isDark ? '#6ee7b7' : '#059669', // Mint emerald tint like reference
    subtitleHeader: isDark ? '#ffffff' : '#0f172a',
    subtitleDesc: isDark ? '#94a3b8' : '#64748b',
    limitText: isDark ? '#64748b' : '#94a3b8',
    cardBg: isDark ? '#151f28' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    divider: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    itemTitleActive: isDark ? '#ffffff' : '#0f172a',
    itemTitleInactive: isDark ? '#94a3b8' : '#94a3b8',
    checkCircleBg: isDark ? 'rgba(52, 211, 153, 0.22)' : 'rgba(16, 185, 129, 0.15)',
    checkCircleBorder: '#10b981',
    checkIcon: '#10b981',
    uncheckCircleBorder: isDark ? '#64748b' : '#cbd5e1',
    reorderIcon: isDark ? '#64748b' : '#94a3b8',
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
          {/* ================= TOP ACTIONS (Matching Reference) ================= */}
          <View style={styles.topActionsRow}>
            {/* Reset Button on Left with swap icon */}
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.resetBtnBg }]}
              onPress={handleResetToDefaults}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-vertical-outline" size={16} color={colors.resetBtnText} />
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
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/' as any))}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.headerTitle} />
            </TouchableOpacity>
          </View>

          {/* ================= HEADER TITLES ================= */}
          <View style={styles.headerTitlesContainer}>
            <Text style={[styles.mainScreenTitle, { color: colors.mainTitle }]}>
              تخصيص الرئيسية
            </Text>

            <Text style={[styles.subtitleHeader, { color: colors.subtitleHeader }]}>
              تخصيص عرض واجهة أُنس الرئيسية
            </Text>

            <Text style={[styles.subtitleDesc, { color: colors.subtitleDesc }]}>
              اختر مفضلاتك لتظهر في الصفحة الرئيسية للتطبيق ..
            </Text>

            <Text style={[styles.limitText, { color: colors.limitText }]}>
              حد أدنى 3 أقسام
            </Text>

            {warningMessage && (
              <View style={styles.warningBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={styles.warningBannerText}>{warningMessage}</Text>
              </View>
            )}
          </View>

          {/* ================= SECTIONS LIST CARD ================= */}
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            {sections.map((section, index) => {
              const isEnabled = section.enabled;

              return (
                <React.Fragment key={section.id}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}

                  <View style={styles.sectionRow}>
                    {/* Left: Reorder Controls (Handles + Micro Move Buttons) */}
                    <View style={styles.reorderGroup}>
                      <TouchableOpacity
                        style={styles.reorderMicroBtn}
                        onPress={() => handleMoveUp(index)}
                        disabled={index === 0}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={14}
                          color={index === 0 ? 'transparent' : colors.reorderIcon}
                        />
                      </TouchableOpacity>

                      <Ionicons
                        name="reorder-three-outline"
                        size={22}
                        color={colors.reorderIcon}
                      />

                      <TouchableOpacity
                        style={styles.reorderMicroBtn}
                        onPress={() => handleMoveDown(index)}
                        disabled={index === sections.length - 1}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={14}
                          color={index === sections.length - 1 ? 'transparent' : colors.reorderIcon}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Right: Title & Checkmark Circle (Tapping toggles) */}
                    <TouchableOpacity
                      style={styles.rowClickArea}
                      onPress={() => handleToggleSection(index)}
                      activeOpacity={0.65}
                    >
                      <Text
                        style={[
                          styles.sectionTitleText,
                          {
                            color: isEnabled ? colors.itemTitleActive : colors.itemTitleInactive,
                          },
                        ]}
                      >
                        {section.title}
                      </Text>

                      <View
                        style={[
                          styles.checkCircle,
                          isEnabled
                            ? {
                                backgroundColor: colors.checkCircleBg,
                                borderColor: colors.checkCircleBorder,
                              }
                            : {
                                borderColor: colors.uncheckCircleBorder,
                              },
                        ]}
                      >
                        {isEnabled && (
                          <Ionicons name="checkmark" size={15} color={colors.checkIcon} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </React.Fragment>
              );
            })}
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
  /* Top Actions */
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  /* Header Titles */
  headerTitlesContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  mainScreenTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    textAlign: 'right',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  subtitleHeader: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 4,
  },
  subtitleDesc: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 4,
  },
  limitText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    textAlign: 'right',
  },
  warningBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  warningBannerText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#ef4444',
  },
  /* Sections Card */
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowClickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sectionTitleText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    textAlign: 'right',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reorderMicroBtn: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});