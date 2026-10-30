import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Share,
  Modal,
  Pressable,
  Switch,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useScrollCollapse } from '@/context/ScrollCollapseContext';
import { useAppTheme } from '@/context/ThemeContext';
import IslamicBackground from '@/components/IslamicBackground';
import {
  notificationService,
  NotificationSettings,
  ADHAN_OPTIONS,
  AdhanOption,
} from '@/services/notificationService';

interface ServiceItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  badge?: string;
}

export default function ServicesScreen() {
  const router = useRouter();
  const { onScroll } = useScrollCollapse();
  const { isDark, toggleTheme } = useAppTheme();

  // Modals for settings and information
  const [activeModal, setActiveModal] = useState<
    'notifications' | 'about' | 'privacy' | 'social' | 'feedback' | null
  >(null);

  // Notifications persistent states
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    morningAdhkar: true,
    morningHour: 7,
    morningMinute: 0,
    eveningAdhkar: true,
    eveningHour: 17,
    eveningMinute: 30,
    prayerTimes: true,
    selectedAdhanId: 'makkah',
    dailyQuran: true,
    dailyQuranHour: 21,
    dailyQuranMinute: 0,
    fridayKahf: true,
  });
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isAdhanPickerVisible, setIsAdhanPickerVisible] = useState(false);
  const [playingAdhanId, setPlayingAdhanId] = useState<string | null>(null);

  useEffect(() => {
    notificationService.getSettings().then(setNotificationSettings);

    const unsubscribe = notificationService.subscribePreview(() => {
      setPlayingAdhanId(notificationService.getCurrentPreviewId());
    });

    return () => {
      unsubscribe();
      notificationService.stopPreview();
    };
  }, []);

  const handleToggleNotification = async (key: keyof NotificationSettings, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      const granted = await notificationService.requestPermissions();
      if (!granted) return;
    }
    const updated = await notificationService.updateSettings({ [key]: value });
    setNotificationSettings(updated);
  };

  const handleSelectAdhan = async (adhanId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await notificationService.updateSettings({ selectedAdhanId: adhanId });
    setNotificationSettings(updated);
  };

  const handlePreviewAdhan = (adhanId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    notificationService.previewAdhan(adhanId);
  };

  const handleSendTestNotification = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSendingTest(true);
    try {
      const success = await notificationService.sendTestNotification();
      if (success) {
        Alert.alert(
          'تم إرسال التنبيه التجريبي 🕌',
          'تم إطلاق صوت الأذان المختار وإرسال التنبيه. تأكد من شريط الإشعارات بهاتفك.'
        );
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  const colors = {
    title: isDark ? '#ffffff' : '#0f172a',
    subtitle: isDark ? '#94a3b8' : '#64748b',
    headerBtnBg: isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(241, 245, 249, 0.85)',
    headerBtnBorder: isDark ? '#334155' : '#cbd5e1',
    headerBtnIcon: isDark ? '#f8fafc' : '#1e293b',
    cardBg: isDark ? 'rgba(26, 38, 57, 0.82)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: isDark ? 'rgba(51, 65, 85, 0.55)' : 'rgba(226, 232, 240, 0.85)',
    iconColor: isDark ? '#34d399' : '#059669',
    chevron: isDark ? '#64748b' : '#94a3b8',
    bottomBtnBg: isDark ? 'rgba(26, 38, 57, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    bottomBtnBorder: isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 0.9)',
    sheetBg: isDark ? '#1e293b' : '#ffffff',
    sheetBorder: isDark ? '#334155' : '#e2e8f0',
  };

  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message:
          'تطبيق أُنس - رفيقك اليومي للقرآن الكريم، الأذكار النبوية، مواقيت الصلاة والمسبحة الذكية.\nحمّل التطبيق الآن وشاركه كصدقة جارية 🌿',
      });
    } catch {
      // Ignore
    }
  };

  const handleRateApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'تقييم تطبيق أُنس',
      'جزاكم الله خيراً لدعمكم! يسعدنا ترك تقييمك الطيب لمساعدتنا في نشر الخير.',
      [{ text: 'شكراً لكم', style: 'default' }]
    );
  };

  const SERVICES_LIST: ServiceItem[] = [
    {
      id: 'customize_home',
      title: 'تخصيص الصفحة الرئيسية',
      icon: 'layers-outline',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/' as any);
      },
    },
    {
      id: 'prayer_settings',
      title: 'إعدادات مواقيت الصلاة',
      icon: 'time-outline',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/prayer-settings' as any);
      },
    },
    {
      id: 'notifications_settings',
      title: 'إعدادات التنبيهات',
      icon: 'notifications-outline',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveModal('notifications');
      },
    },
    {
      id: 'download_manager',
      title: 'مدير التحميل',
      icon: 'folder-outline',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/reciters' as any);
      },
    },
    {
      id: 'appearance_language',
      title: isDark ? 'المظهر (الوضع الليلي نشط)' : 'المظهر (الوضع النهاري نشط)',
      icon: isDark ? 'moon-outline' : 'sunny-outline',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        toggleTheme();
      },
      badge: isDark ? 'ليلي' : 'نهاري',
    },
    {
      id: 'about_app',
      title: 'عن التطبيق',
      icon: 'information-circle-outline',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveModal('about');
      },
    },
    {
      id: 'privacy_policy',
      title: 'سياسة الخصوصية',
      icon: 'shield-checkmark-outline',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveModal('privacy');
      },
    },
    {
      id: 'social_media',
      title: 'تابع أُنس على الشبكات الاجتماعية',
      icon: 'share-social-outline',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveModal('social');
      },
    },
    {
      id: 'feedback_report',
      title: 'الإبلاغ عن خلل / اقتراح تحسين',
      icon: 'alert-circle-outline',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveModal('feedback');
      },
    },
  ];

  return (
    <View style={styles.container}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* TOP HEADER MATCHING SCREENSHOT 2 */}
        <View style={styles.topHeader}>
          {/* Circular Navigation / Back Button on Left */}
          <TouchableOpacity
            style={[
              styles.circleNavBtn,
              { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder },
            ]}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/' as any);
              }
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.headerBtnIcon} />
          </TouchableOpacity>

          {/* Title on the Right: "الحساب" / "الخدمات" */}
          <Text style={[styles.screenTitle, { color: colors.title }]}>الخدمات</Text>
        </View>

        {/* MAIN SCROLLABLE LIST */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* LIST OF SERVICES PILLS */}
          <View style={styles.servicesList}>
            {SERVICES_LIST.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.servicePill,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.78}
                onPress={item.action}
              >
                {/* Left: Chevron */}
                <Ionicons name="chevron-back" size={18} color={colors.chevron} />

                {/* Right: Icon + Label (in RTL layout) */}
                <View style={styles.servicePillInfo}>
                  {item.badge && (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{item.badge}</Text>
                    </View>
                  )}
                  <Text style={[styles.serviceTitle, { color: colors.title }]}>
                    {item.title}
                  </Text>
                  <Ionicons name={item.icon} size={22} color={colors.iconColor} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* BOTTOM ACTIONS: RATE APP & SHARE APP (MATCHING SCREENSHOT 2) */}
          <View style={styles.bottomButtonsRow}>
            {/* Left Button: قيّم التطبيق */}
            <TouchableOpacity
              style={[
                styles.bottomActionCard,
                { backgroundColor: colors.bottomBtnBg, borderColor: colors.bottomBtnBorder },
              ]}
              activeOpacity={0.8}
              onPress={handleRateApp}
            >
              <Ionicons name="open-outline" size={16} color={colors.iconColor} />
              <Text style={[styles.bottomActionText, { color: colors.title }]}>
                قيّم التطبيق
              </Text>
              <Ionicons name="star" size={18} color={colors.iconColor} />
            </TouchableOpacity>

            {/* Right Button: شارك التطبيق */}
            <TouchableOpacity
              style={[
                styles.bottomActionCard,
                { backgroundColor: colors.bottomBtnBg, borderColor: colors.bottomBtnBorder },
              ]}
              activeOpacity={0.8}
              onPress={handleShareApp}
            >
              <Ionicons name="arrow-up-outline" size={16} color={colors.iconColor} />
              <Text style={[styles.bottomActionText, { color: colors.title }]}>
                شارك التطبيق
              </Text>
              <Ionicons name="share-social-outline" size={19} color={colors.iconColor} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* MODAL: NOTIFICATIONS SETTINGS */}
        <Modal
          visible={activeModal === 'notifications'}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)}>
            <Pressable
              style={[
                styles.modalSheet,
                { backgroundColor: colors.sheetBg, borderColor: colors.sheetBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.dragHandle} />
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { borderColor: colors.sheetBorder }]}
                  onPress={() => setActiveModal(null)}
                >
                  <Ionicons name="close" size={18} color={colors.title} />
                </TouchableOpacity>
                <Text style={[styles.modalSheetTitle, { color: colors.title }]}>
                  إعدادات التنبيهات
                </Text>
              </View>

              <View style={styles.toggleRow}>
                <Switch
                  value={notificationSettings.morningAdhkar}
                  onValueChange={(val) => handleToggleNotification('morningAdhkar', val)}
                  trackColor={{ false: '#64748b', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
                <View style={styles.toggleLabelCol}>
                  <Text style={[styles.toggleLabel, { color: colors.title }]}>
                    أذكار الصباح 🌿
                  </Text>
                  <Text style={[styles.toggleSubLabel, { color: colors.subtitle }]}>
                    تذكير يومي عند الساعة 07:00 صباحاً
                  </Text>
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Switch
                  value={notificationSettings.eveningAdhkar}
                  onValueChange={(val) => handleToggleNotification('eveningAdhkar', val)}
                  trackColor={{ false: '#64748b', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
                <View style={styles.toggleLabelCol}>
                  <Text style={[styles.toggleLabel, { color: colors.title }]}>
                    أذكار المساء 🌙
                  </Text>
                  <Text style={[styles.toggleSubLabel, { color: colors.subtitle }]}>
                    تذكير يومي عند الساعة 05:30 مساءً
                  </Text>
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Switch
                  value={notificationSettings.prayerTimes}
                  onValueChange={(val) => handleToggleNotification('prayerTimes', val)}
                  trackColor={{ false: '#64748b', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
                <View style={styles.toggleLabelCol}>
                  <Text style={[styles.toggleLabel, { color: colors.title }]}>
                    مواقيت الصلاة والأذان 🕌
                  </Text>
                  <Text style={[styles.toggleSubLabel, { color: colors.subtitle }]}>
                    تنبيهات دخول أوقات الصلوات الخمس حسب موقعك
                  </Text>
                </View>
              </View>

              {/* Chosen Adhan Selector Button */}
              {notificationSettings.prayerTimes && (
                <TouchableOpacity
                  style={[
                    styles.adhanSelectorRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(30, 41, 59, 0.65)'
                        : 'rgba(241, 245, 249, 0.85)',
                      borderColor: colors.sheetBorder,
                    },
                  ]}
                  onPress={() => setIsAdhanPickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.chevron} />
                  <View style={styles.adhanSelectorTextCol}>
                    <Text style={[styles.adhanSelectorTitle, { color: colors.title }]}>
                      صوت الأذان المختار 🔊
                    </Text>
                    <Text style={styles.adhanSelectorSubtitle}>
                      {ADHAN_OPTIONS.find((a) => a.id === notificationSettings.selectedAdhanId)
                        ?.name || 'أذان الحرم المكي الشريف'}
                    </Text>
                  </View>
                  <View style={styles.adhanIconBadge}>
                    <Ionicons name="volume-high" size={18} color="#10b981" />
                  </View>
                </TouchableOpacity>
              )}

              <View style={styles.toggleRow}>
                <Switch
                  value={notificationSettings.dailyQuran}
                  onValueChange={(val) => handleToggleNotification('dailyQuran', val)}
                  trackColor={{ false: '#64748b', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
                <View style={styles.toggleLabelCol}>
                  <Text style={[styles.toggleLabel, { color: colors.title }]}>
                    ورد القرآن الكريم 📖
                  </Text>
                  <Text style={[styles.toggleSubLabel, { color: colors.subtitle }]}>
                    تذكير يومي بالقراءة عند الساعة 09:00 مساءً
                  </Text>
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Switch
                  value={notificationSettings.fridayKahf}
                  onValueChange={(val) => handleToggleNotification('fridayKahf', val)}
                  trackColor={{ false: '#64748b', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
                <View style={styles.toggleLabelCol}>
                  <Text style={[styles.toggleLabel, { color: colors.title }]}>
                    سورة الكهف يوم الجمعة 🕊️
                  </Text>
                  <Text style={[styles.toggleSubLabel, { color: colors.subtitle }]}>
                    تذكير أسبوعي صباح كل جمعة عند 10:00 ص
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.testNotificationBtn}
                onPress={handleSendTestNotification}
                disabled={isSendingTest}
              >
                {isSendingTest ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="notifications" size={18} color="#ffffff" />
                    <Text style={styles.testNotificationText}>
                      تجربة إشعار الأذان المختار فوراً 🕌
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* MODAL: ADHAN SOUND PICKER */}
        <Modal
          visible={isAdhanPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            notificationService.stopPreview();
            setIsAdhanPickerVisible(false);
          }}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              notificationService.stopPreview();
              setIsAdhanPickerVisible(false);
            }}
          >
            <Pressable
              style={[
                styles.modalSheet,
                { backgroundColor: colors.sheetBg, borderColor: colors.sheetBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.dragHandle} />
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { borderColor: colors.sheetBorder }]}
                  onPress={() => {
                    notificationService.stopPreview();
                    setIsAdhanPickerVisible(false);
                  }}
                >
                  <Ionicons name="close" size={18} color={colors.title} />
                </TouchableOpacity>
                <Text style={[styles.modalSheetTitle, { color: colors.title }]}>
                  صوت مؤذن الصلاة والأذان
                </Text>
              </View>

              <Text
                style={[
                  styles.dialogBodyText,
                  { color: colors.subtitle, marginBottom: 12, textAlign: 'right' },
                ]}
              >
                اختر صوت الأذان المفضل لديك، ويمكنك الضغط على زر التشغيل للاستماع لصوت المؤذن قبل الاختيار:
              </Text>

              <View style={styles.adhanList}>
                {ADHAN_OPTIONS.map((adhan) => {
                  const isSelected = notificationSettings.selectedAdhanId === adhan.id;
                  const isPlaying = playingAdhanId === adhan.id;

                  return (
                    <TouchableOpacity
                      key={adhan.id}
                      style={[
                        styles.adhanOptionCard,
                        {
                          backgroundColor: isDark
                            ? isSelected
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(30, 41, 59, 0.6)'
                            : isSelected
                            ? 'rgba(16, 185, 129, 0.1)'
                            : '#f8fafc',
                          borderColor: isSelected ? '#10b981' : colors.sheetBorder,
                        },
                      ]}
                      onPress={() => handleSelectAdhan(adhan.id)}
                      activeOpacity={0.8}
                    >
                      {/* Play / Stop Audio Button */}
                      <TouchableOpacity
                        style={[
                          styles.playPreviewBtn,
                          {
                            backgroundColor: isPlaying
                              ? '#10b981'
                              : isDark
                              ? '#1e293b'
                              : '#ffffff',
                            borderColor: isPlaying ? '#10b981' : colors.sheetBorder,
                          },
                        ]}
                        onPress={() => handlePreviewAdhan(adhan.id)}
                      >
                        <Ionicons
                          name={isPlaying ? 'pause' : 'play'}
                          size={16}
                          color={isPlaying ? '#ffffff' : '#10b981'}
                        />
                      </TouchableOpacity>

                      {/* Text info */}
                      <View style={styles.adhanOptionTextCol}>
                        <Text
                          style={[
                            styles.adhanOptionName,
                            { color: isSelected ? '#10b981' : colors.title },
                          ]}
                        >
                          {adhan.name}
                        </Text>
                        <Text style={[styles.adhanOptionSubtitle, { color: colors.subtitle }]}>
                          {adhan.subtitle}
                        </Text>
                      </View>

                      {/* Selection Radio Indicator */}
                      <View
                        style={[
                          styles.adhanRadioOuter,
                          { borderColor: isSelected ? '#10b981' : colors.subtitle },
                        ]}
                      >
                        {isSelected && <View style={styles.adhanRadioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  notificationService.stopPreview();
                  setIsAdhanPickerVisible(false);
                }}
              >
                <Text style={styles.doneBtnText}>تأكيد الاختيار</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* MODAL: ABOUT APP */}
        <Modal
          visible={activeModal === 'about'}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)}>
            <Pressable
              style={[
                styles.modalSheet,
                { backgroundColor: colors.sheetBg, borderColor: colors.sheetBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.dragHandle} />
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { borderColor: colors.sheetBorder }]}
                  onPress={() => setActiveModal(null)}
                >
                  <Ionicons name="close" size={18} color={colors.title} />
                </TouchableOpacity>
                <Text style={[styles.modalSheetTitle, { color: colors.title }]}>
                  عن تطبيق أُنس
                </Text>
              </View>

              <Text style={[styles.dialogBodyText, { color: colors.subtitle }]}>
                تطبيق «أُنس» هو رفيقك الرقمي اليومي المبارك للقرآن الكريم كاملاً برواية حفص،
                مع باقة وافية من الأذكار النبوية الموثوقة، وتلاوات كبار قراء العالم الإسلامي،
                والسبحة التفاعلية الذكية وبوصلة القبلة الدقيقة.
                {'\n\n'}
                هذا العمل وقفٌ إسلامي خالص لوجه الله تعالى وصدقة جارية لكل من ساهم في نشره
                وقراءته.
              </Text>
              <Text style={[styles.versionText, { color: colors.iconColor }]}>
                الإصدار 1.0.0 • صُنع بحب وإخلاص
              </Text>
            </Pressable>
          </Pressable>
        </Modal>

        {/* MODAL: PRIVACY POLICY */}
        <Modal
          visible={activeModal === 'privacy'}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)}>
            <Pressable
              style={[
                styles.modalSheet,
                { backgroundColor: colors.sheetBg, borderColor: colors.sheetBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.dragHandle} />
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { borderColor: colors.sheetBorder }]}
                  onPress={() => setActiveModal(null)}
                >
                  <Ionicons name="close" size={18} color={colors.title} />
                </TouchableOpacity>
                <Text style={[styles.modalSheetTitle, { color: colors.title }]}>
                  سياسة الخصوصية
                </Text>
              </View>

              <Text style={[styles.dialogBodyText, { color: colors.subtitle }]}>
                نحن في تطبيق أُنس نحترم خصوصيتك احتراماً تاماً:
                {'\n\n'}
                • لا نقوم بجمع أي بيانات شخصية أو تخزينها على خوادم خارجية.
                {'\n'}
                • كافة محفوظاتك من ختمات وعدادات الأذكار والتفضيلات تُحفظ محلياً على جهازك
                فقط.
                {'\n'}
                • صلاحيات الموقع الجغرافي تُستخدم حصرياً لحساب اتجاه القبلة ومواقيت الصلاة
                محلياً دون إرسالها إلى أي جهة.
              </Text>
            </Pressable>
          </Pressable>
        </Modal>

        {/* MODAL: SOCIAL MEDIA */}
        <Modal
          visible={activeModal === 'social'}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)}>
            <Pressable
              style={[
                styles.modalSheet,
                { backgroundColor: colors.sheetBg, borderColor: colors.sheetBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.dragHandle} />
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { borderColor: colors.sheetBorder }]}
                  onPress={() => setActiveModal(null)}
                >
                  <Ionicons name="close" size={18} color={colors.title} />
                </TouchableOpacity>
                <Text style={[styles.modalSheetTitle, { color: colors.title }]}>
                  تابع أُنس
                </Text>
              </View>

              <Text style={[styles.dialogBodyText, { color: colors.subtitle, textAlign: 'center' }]}>
                انضم إلى مجتمع أُنس القرآني للحصول على الجديد من الفوائد والتحديثات المباركة:
              </Text>

              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity
                  style={[styles.socialRowBtn, { borderColor: colors.cardBorder }]}
                  onPress={() => {
                    Linking.openURL('https://x.com');
                  }}
                >
                  <Ionicons name="logo-twitter" size={20} color="#38bdf8" />
                  <Text style={[styles.socialBtnText, { color: colors.title }]}>
                    منصة إكس (تويتر سابقاً)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialRowBtn, { borderColor: colors.cardBorder }]}
                  onPress={() => {
                    Linking.openURL('https://t.me');
                  }}
                >
                  <Ionicons name="paper-plane" size={20} color="#38bdf8" />
                  <Text style={[styles.socialBtnText, { color: colors.title }]}>
                    قناة تيليجرام
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* MODAL: FEEDBACK */}
        <Modal
          visible={activeModal === 'feedback'}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)}>
            <Pressable
              style={[
                styles.modalSheet,
                { backgroundColor: colors.sheetBg, borderColor: colors.sheetBorder },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.dragHandle} />
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { borderColor: colors.sheetBorder }]}
                  onPress={() => setActiveModal(null)}
                >
                  <Ionicons name="close" size={18} color={colors.title} />
                </TouchableOpacity>
                <Text style={[styles.modalSheetTitle, { color: colors.title }]}>
                  اقتراح أو إبلاغ عن خلل
                </Text>
              </View>

              <Text style={[styles.dialogBodyText, { color: colors.subtitle }]}>
                رأيكم واقتراحاتكم محل عنايتنا وتقديرنا الكبير. إذا واجهتكم أي مشكلة تقنية أو
                لديكم فكرة لتطوير تطبيق أُنس، نسعد بتواصلكم المباشر.
              </Text>

              <TouchableOpacity
                style={styles.feedbackActionBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveModal(null);
                  Linking.openURL('mailto:support@unsapp.com?subject=اقتراح%20لتطبيق%20أُنس');
                }}
              >
                <Ionicons name="mail-outline" size={18} color="#ffffff" />
                <Text style={styles.feedbackActionText}>مراسلة فريق التطوير عبر البريد</Text>
              </TouchableOpacity>
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

  /* TOP HEADER */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  screenTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 32,
    letterSpacing: -0.3,
  },
  circleNavBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  /* SCROLL CONTENT */
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for floating bottom tab bar
  },

  /* SERVICES PILL LIST */
  servicesList: {
    gap: 8,
    marginBottom: 20,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  servicePillInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  serviceTitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    textAlign: 'right',
  },
  badgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  badgePillText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#34d399',
  },

  /* BOTTOM BUTTONS ROW */
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  bottomActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  bottomActionText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    textAlign: 'center',
  },

  /* MODALS & SHEETS */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748b',
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 19,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.15)',
  },
  toggleLabelCol: {
    flex: 1,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  toggleLabel: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    textAlign: 'right',
  },
  toggleSubLabel: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  testNotificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 16,
    marginTop: 18,
  },
  testNotificationText: {
    fontFamily: 'Cairo_700Bold',
    color: '#ffffff',
    fontSize: 14,
  },

  /* ADHAN SELECTOR ROW IN NOTIFICATIONS MODAL */
  adhanSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 6,
  },
  adhanSelectorTextCol: {
    flex: 1,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  adhanSelectorTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    textAlign: 'right',
  },
  adhanSelectorSubtitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#10b981',
    textAlign: 'right',
    marginTop: 2,
  },
  adhanIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ADHAN PICKER MODAL STYLES */
  adhanList: {
    gap: 8,
    marginBottom: 16,
  },
  adhanOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  playPreviewBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adhanOptionTextCol: {
    flex: 1,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  adhanOptionName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    textAlign: 'right',
  },
  adhanOptionSubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 1,
  },
  adhanRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adhanRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  doneBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    fontFamily: 'Cairo_700Bold',
    color: '#ffffff',
    fontSize: 14,
  },
  dialogBodyText: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: 16,
  },
  versionText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  socialButtonsContainer: {
    gap: 10,
    marginTop: 10,
  },
  socialRowBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  socialBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
  },
  feedbackActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  feedbackActionText: {
    fontFamily: 'Cairo_700Bold',
    color: '#ffffff',
    fontSize: 14,
  },
});
