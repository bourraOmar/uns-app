import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ImageSourcePropType,
  Share,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IslamicBackground from '@/components/IslamicBackground';
import { useScrollCollapse } from '@/context/ScrollCollapseContext';
import { useAppTheme } from '@/context/ThemeContext';
import surahsData from '../../data/surahs.json';
import {
  getPrayerTimesForDate,
  getUserLocation,
  calculateUpcomingPrayer,
  formatTo12HourArabic,
  formatSecondsToCountdown,
  formatRemainingArabicText,
  CityLocation,
} from '@/services/prayerTimesService';
import { getDailyInspirations } from '@/data/dailyInspirations';
import { getSmartIslamicGreeting, getHijriNumericDate } from '@/services/smartIslamicGreetingService';
import LocationModal from '@/components/LocationModal';
import { ALL_DAILY_APPS, DEFAULT_DAILY_APP_IDS, DailyAppItem } from '@/data/dailyAppsData';
import { getHomeSections, HomeSectionItem } from '@/services/homeSectionsService';
// Custom icons using pure React Native components (no external SVG dependency)
function TasbihBeadsIcon({ size = 22, color = '#ffffff' }: { size?: number; color?: string }) {
  const radius = (size - 6) / 2;
  const center = size / 2;
  const count = 10;
  const beads = [];
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
    const left = center + radius * Math.cos(angle) - 1.5;
    const top = center + radius * Math.sin(angle) - 1.5;
    beads.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          left,
          top,
          width: 3.5,
          height: 3.5,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: color,
          backgroundColor: 'transparent',
        }}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {beads}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: 1.5,
          height: 4.5,
          backgroundColor: color,
          borderRadius: 0.75,
        }}
      />
    </View>
  );
}

function QuranStandIcon({ size = 20, color = '#483852' }: { size?: number; color?: string }) {
  return (
    <MaterialCommunityIcons name="book-open-page-variant-outline" size={size} color={color} />
  );
}

function MorningSunIcon({ size = 20, color = '#483852' }: { size?: number; color?: string }) {
  return (
    <Ionicons name="sunny-outline" size={size} color={color} />
  );
}

interface LastReadSurah {
  surahId: number;
  surahName: string;
  page: number;
  versesCount: number;
  revelationPlace?: string;
}

const DEFAULT_LAST_READ: LastReadSurah = {
  surahId: 1,
  surahName: 'سورة الفاتحة',
  page: 1,
  versesCount: 7,
  revelationPlace: 'makkah',
};

const PRAYER_ICONS = {
  fajrShines: require('@/assets/icons/fajr_shines.png'),
  sunOutline: require('@/assets/icons/sun_outline.png'),
  sunSolid: require('@/assets/icons/sun_solid.png'),
  sunriseRays: require('@/assets/icons/sunrise_rays.png'),
  sunriseSimple: require('@/assets/icons/sunrise_simple.png'),
  moonStars: require('@/assets/icons/moon_stars.png'),
};

interface PrayerItem {
  id: string;
  name: string;
  time: string;
  icon: ImageSourcePropType;
}

interface RibbonBadgeProps {
  type: 'ayah' | 'hadith' | 'dua';
}

function InspirationRibbonBadge({ type }: RibbonBadgeProps) {
  const config = {
    ayah: {
      title: 'آية اليوم',
      bgColor: '#41553c',
      foldColor: '#2b3927',
      textColor: '#dcfce7',
      icon: <FontAwesome5 name="quran" size={13} color="#dcfce7" />,
    },
    hadith: {
      title: 'حديث اليوم',
      bgColor: '#524c30',
      foldColor: '#383320',
      textColor: '#fef9c3',
      icon: <FontAwesome5 name="mosque" size={12} color="#fef08a" />,
    },
    dua: {
      title: 'دعاء اليوم',
      bgColor: '#3b4350',
      foldColor: '#272c35',
      textColor: '#e0f2fe',
      icon: <FontAwesome5 name="pray" size={13} color="#bae6fd" />,
    },
  }[type];

  return (
    <View style={styles.ribbonWrapper}>
      {/* 1. Top Ribbon Banner */}
      <View style={[styles.ribbonTopBanner, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.ribbonTitleText, { color: config.textColor }]}>
          {config.title}
        </Text>
      </View>

      {/* 2. Hanging Tab + Angled Fold Flap */}
      <View style={styles.ribbonHangingContainer}>
        {/* Hanging Tab with Icon */}
        <View style={[styles.ribbonTabSquare, { backgroundColor: config.bgColor }]}>
          {config.icon}
        </View>

        {/* 45-degree Angled Fold Flap */}
        <View
          style={[
            styles.ribbonFoldTriangle,
            {
              borderTopColor: config.foldColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const ARABIC_WEEKDAYS = [
  'الأَحَدُ',
  'الإِثْنَيْنُ',
  'الثُّلَاثَاءُ',
  'الأَرْبِعَاءُ',
  'الخَمِيسُ',
  'الجُمُعَةُ',
  'السَّبْتُ',
];

const GREGORIAN_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

function getLiveCalendarDates(now: Date = new Date()) {
  const weekdayName = ARABIC_WEEKDAYS[now.getDay()];
  const gregDay = now.getDate();
  const gregMonth = GREGORIAN_MONTHS[now.getMonth()];
  const gregYear = now.getFullYear();

  let hijriDay = '1';
  let hijriMonth = 'جمادى الأولى';
  let hijriYear = '1448';

  try {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    parts.forEach((p) => {
      if (p.type === 'day') hijriDay = p.value;
      if (p.type === 'month') hijriMonth = p.value;
      if (p.type === 'year') hijriYear = p.value;
    });
  } catch {}

  return {
    weekdayName,
    gregDay,
    gregMonth,
    gregYear,
    hijriDay,
    hijriMonth,
    hijriYear,
  };
}

function getTodayDateKey(date: Date = new Date()) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

// Determines if a prayer's time has already entered today
function hasPrayerTimeArrived(
  prayerId: string,
  rawTimes: Record<string, string>,
  now: Date = new Date()
): boolean {
  // Sunrise and Midnight are astronomical markers, not obligatory prayers
  if (prayerId === 'Sunrise' || prayerId === 'Midnight') return false;

  const timeStr = rawTimes[prayerId];
  if (!timeStr) return false;

  const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10));
  const pDate = new Date(now);
  pDate.setHours(h, m, 0, 0);

  return now.getTime() >= pDate.getTime();
}

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { onScroll, openSearch } = useScrollCollapse();

  const colors = {
    title: isDark ? '#f8fafc' : '#0f172a',
    subtitle: isDark ? '#94a3b8' : '#475569',
    muted: isDark ? '#64748b' : '#64748b',
    cardBg: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.92)',
    cardBorder: isDark ? '#334155' : 'rgba(226, 232, 240, 0.95)',
    cardShadow: isDark ? '#000' : '#94a3b8',
    headerBtnBg: isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.9)',
    headerBtnBorder: isDark ? '#334155' : '#cbd5e1',
    headerBtnIcon: isDark ? '#8ba7c0' : '#1e293b',
    calendarNumber: isDark ? '#f8fafc' : '#0f172a',
    calendarDay: isDark ? '#34d399' : '#059669',
    calendarDivider: isDark ? '#334155' : '#e2e8f0',
    greetingText: isDark ? '#e2e8f0' : '#1e293b',
    actionPillBg: isDark ? '#15251d' : '#0f766e',
    actionPillBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 118, 110, 0.25)',
    mosqueCircleBg: isDark ? '#15251d' : '#ecfdf5',
    mosqueCircleBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#a7f3d0',
    prayerName: isDark ? '#8ba7c0' : '#475569',
    prayerTime: isDark ? '#f8fafc' : '#0f172a',
    prayerIconTint: isDark ? '#94a3b8' : '#64748b',
    appTitle: isDark ? '#f8fafc' : '#0f172a',
    appSubtitle: isDark ? '#8ba7c0' : '#64748b',
    appCircleBorder: isDark ? '#334155' : 'rgba(0, 0, 0, 0.08)',
    lastReadBg: isDark ? '#122026' : 'rgba(255, 255, 255, 0.95)',
    lastReadBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.95)',
    lastReadTitle: isDark ? '#ffffff' : '#0f172a',
    lastReadArrowBg: isDark ? '#1e333d' : '#f1f5f9',
    lastReadArrowIcon: isDark ? '#f8fafc' : '#1e293b',
  };

  // 1. Live Calendar State
  const [calendar, setCalendar] = useState(() => getLiveCalendarDates(new Date()));

  // 2. Location State
  const [userLocation, setUserLocation] = useState<CityLocation>({
    city: 'آسفي، المغرب',
    country: 'المغرب',
    latitude: 32.2994,
    longitude: -9.2372,
  });
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleApplyLocation = async (newLoc: CityLocation) => {
    setUserLocation(newLoc);
    const times = await getPrayerTimesForDate(new Date(), newLoc);
    setPrayerRawTimes(times);
  };

  // 3. Prayer Times & Live Countdown State
  const [prayerRawTimes, setPrayerRawTimes] = useState<Record<string, string>>({
    Fajr: '05:17',
    Sunrise: '06:38',
    Dhuhr: '12:24',
    Asr: '15:39',
    Maghrib: '18:08',
    Isha: '19:25',
    Midnight: '23:43',
  });
  const [activePrayerId, setActivePrayerId] = useState<string>('Asr');
  const [countdown, setCountdown] = useState('01:52:05');
  const [remainingBadgeText, setRemainingBadgeText] = useState('ساعة و52 د');
  const [upcomingPrayerName, setUpcomingPrayerName] = useState('العصر');

  // 4. Prayed Prayers Tracker State (الصلوات المؤداة بالحد الأخضر مع إعادة الضبط التلقائي)
  const [prayedPrayers, setPrayedPrayers] = useState<Record<string, boolean>>({});
  const [currentCycleDate, setCurrentCycleDate] = useState<string>(() => getTodayDateKey());

  const loadPrayedPrayers = async () => {
    try {
      const todayKey = getTodayDateKey();
      const savedStr = await AsyncStorage.getItem('@uns_prayed_prayers');
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved && saved.date === todayKey) {
          setPrayedPrayers(saved.prayers || {});
          setCurrentCycleDate(todayKey);
          return;
        }
      }
      setPrayedPrayers({});
      setCurrentCycleDate(todayKey);
      await AsyncStorage.setItem(
        '@uns_prayed_prayers',
        JSON.stringify({ date: todayKey, prayers: {} })
      );
    } catch {}
  };

  const togglePrayedPrayer = async (id: string) => {
    // 1. Sunrise and Midnight are completely unselectable
    if (id === 'Sunrise' || id === 'Midnight') {
      return;
    }

    // 2. Only prayers whose time has already arrived today can be marked as prayed
    const hasArrived = hasPrayerTimeArrived(id, prayerRawTimes, new Date());
    if (!hasArrived) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const todayKey = getTodayDateKey();
    const updated = {
      ...prayedPrayers,
      [id]: !prayedPrayers[id],
    };
    setPrayedPrayers(updated);
    try {
      await AsyncStorage.setItem(
        '@uns_prayed_prayers',
        JSON.stringify({ date: todayKey, prayers: updated })
      );
    } catch {}
  };

  // 5. Smart Time & Islamic Event Greeting
  const [greeting, setGreeting] = useState(() => getSmartIslamicGreeting(new Date(), 'Asr'));

  // 6. Daily Inspirations
  const [dailyInspirations, setDailyInspirations] = useState(() => getDailyInspirations(new Date()));

  // 7. Last Read Surah State
  const [lastRead, setLastRead] = useState<LastReadSurah>(DEFAULT_LAST_READ);

  // 8. Custom Daily Apps State
  const [dailyAppIds, setDailyAppIds] = useState<string[]>(DEFAULT_DAILY_APP_IDS);

  const loadDailyApps = async () => {
    try {
      const saved = await AsyncStorage.getItem('@uns_custom_daily_apps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((id) => ALL_DAILY_APPS.some((app) => app.id === id));
          setDailyAppIds(valid.length > 0 ? valid : DEFAULT_DAILY_APP_IDS);
          return;
        }
      }
      setDailyAppIds(DEFAULT_DAILY_APP_IDS);
    } catch {}
  };

  const loadLastRead = async () => {
    try {
      const saved = await AsyncStorage.getItem('@uns_last_read');
      if (saved) {
        setLastRead(JSON.parse(saved));
        return;
      }
      const savedRecent = await AsyncStorage.getItem('@uns_recent_readings');
      if (savedRecent) {
        const list = JSON.parse(savedRecent);
        if (list && list.length > 0) {
          const top = list[0];
          const surah = (surahsData as any[]).find((s) => s.id === top.surahId);
          setLastRead({
            surahId: top.surahId,
            surahName: top.surahName || (surah ? `سورة ${surah.name_arabic}` : 'سورة الفاتحة'),
            page: top.page || (surah ? surah.start_page : 1),
            versesCount: surah ? surah.verses_count : 7,
            revelationPlace: surah ? surah.revelation_place : 'makkah',
          });
        }
      }
    } catch {}
  };

  // Custom Home Sections State
  const [homeSections, setHomeSections] = useState<HomeSectionItem[]>([]);

  const isSectionVisible = (id: string) => {
    if (!homeSections || homeSections.length === 0) return true;
    const item = homeSections.find((s) => s.id === id);
    return item ? item.enabled : true;
  };

  useFocusEffect(
    useCallback(() => {
      loadLastRead();
      loadPrayedPrayers();
      loadDailyApps();
      getHomeSections().then(setHomeSections);
      getUserLocation().then((loc) => {
        getPrayerTimesForDate(new Date(), loc).then((times) => {
          setPrayerRawTimes(times);
        });
      });
    }, [])
  );

  // Initialize location & prayer times
  useEffect(() => {
    let isMounted = true;

    getUserLocation().then((loc) => {
      if (!isMounted) return;
      setUserLocation(loc);
      getPrayerTimesForDate(new Date(), loc).then((times) => {
        if (!isMounted) return;
        setPrayerRawTimes(times);
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Live 1-second countdown and prayer tracking ticker
  useEffect(() => {
    const updateTicker = () => {
      const now = new Date();
      setCalendar(getLiveCalendarDates(now));
      setDailyInspirations(getDailyInspirations(now));

      const { upcomingId, secondsRemaining, nextPrayerName } = calculateUpcomingPrayer(
        prayerRawTimes,
        now
      );

      setUpcomingPrayerName(nextPrayerName);
      // Highlight the next upcoming prayer automatically
      setActivePrayerId(upcomingId);
      setGreeting(getSmartIslamicGreeting(now, upcomingId, getHijriNumericDate(now)));

      // The top hero badge ALWAYS shows the remaining time to the upcoming prayer!
      setRemainingBadgeText(formatRemainingArabicText(secondsRemaining));
      setCountdown(formatSecondsToCountdown(secondsRemaining));

      // Reset prayers when a new day/cycle begins
      const todayKey = getTodayDateKey(now);
      if (todayKey !== currentCycleDate) {
        setCurrentCycleDate(todayKey);
        setPrayedPrayers({});
        AsyncStorage.setItem(
          '@uns_prayed_prayers',
          JSON.stringify({ date: todayKey, prayers: {} })
        ).catch(() => {});
      }
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [prayerRawTimes, currentCycleDate]);

  const handleShare = async (message: string) => {
    try {
      await Share.share({
        message: `${message}\n\nتطبيق أُنس`,
      });
    } catch {
      // ignore
    }
  };

  // Row 1: Fajr -> Sunrise -> Dhuhr -> Asr
  const row1Prayers: PrayerItem[] = [
    {
      id: 'Fajr',
      name: 'الفجر',
      time: formatTo12HourArabic(prayerRawTimes.Fajr) || '5:17 ص',
      icon: PRAYER_ICONS.fajrShines,
    },
    {
      id: 'Sunrise',
      name: 'الشروق',
      time: formatTo12HourArabic(prayerRawTimes.Sunrise) || '6:38 ص',
      icon: PRAYER_ICONS.sunriseRays,
    },
    {
      id: 'Dhuhr',
      name: 'الظهر',
      time: formatTo12HourArabic(prayerRawTimes.Dhuhr) || '12:24 م',
      icon: PRAYER_ICONS.sunSolid,
    },
    {
      id: 'Asr',
      name: 'العصر',
      time: formatTo12HourArabic(prayerRawTimes.Asr) || '3:39 م',
      icon: PRAYER_ICONS.sunOutline,
    },
  ];

  // Row 2: Maghrib -> Isha -> Midnight
  const row2Prayers: PrayerItem[] = [
    {
      id: 'Maghrib',
      name: 'المغرب',
      time: formatTo12HourArabic(prayerRawTimes.Maghrib) || '6:08 م',
      icon: PRAYER_ICONS.sunriseRays,
    },
    {
      id: 'Isha',
      name: 'العشاء',
      time: formatTo12HourArabic(prayerRawTimes.Isha) || '7:25 م',
      icon: PRAYER_ICONS.moonStars,
    },
    {
      id: 'Midnight',
      name: 'منتصف الليل',
      time: formatTo12HourArabic(prayerRawTimes.Midnight) || '11:43 م',
      icon: PRAYER_ICONS.fajrShines,
    },
  ];

  const renderPrayerCard = (p: PrayerItem) => {
    const isUpcoming = p.id === activePrayerId;
    const isAstronomical = p.id === 'Sunrise' || p.id === 'Midnight';
    const hasArrived = hasPrayerTimeArrived(p.id, prayerRawTimes, new Date());
    const isPrayed = !isAstronomical && !!prayedPrayers[p.id];
    const canSelect = !isAstronomical && hasArrived;

    if (isUpcoming) {
      const noticeText = isAstronomical ? 'المتبقي' : 'تبقى للأذان';

      // Wide Highlight Card (Mint Green) for the upcoming prayer
      return (
        <View
          key={p.id}
          style={styles.prayerCardHighlight}
        >
          {/* Left Column: Countdown */}
          <View style={styles.highlightCountdownCol}>
            <Text style={styles.countdownNotice} numberOfLines={1}>
              {noticeText}
            </Text>
            <Text style={styles.countdownDigits} numberOfLines={1}>
              {countdown}
            </Text>
          </View>

          {/* Right Column: Icon on Top, Name + Time below */}
          <View style={styles.highlightInfoCol}>
            <Image
              source={p.icon}
              style={[styles.prayerIconImgHighlight, { tintColor: '#15803d' }]}
              resizeMode="contain"
            />
            <Text style={styles.highlightNameText} numberOfLines={1}>
              {p.name}
            </Text>
            <Text style={styles.highlightTimeText} numberOfLines={1}>
              {p.time}
            </Text>
          </View>
        </View>
      );
    }

    // Normal Card
    return (
      <TouchableOpacity
        key={p.id}
        style={[
          styles.prayerCardNormal,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            shadowColor: colors.cardShadow,
          },
          isPrayed && styles.prayerCardNormalPrayed,
        ]}
        activeOpacity={canSelect ? 0.75 : 1}
        onPress={() => togglePrayedPrayer(p.id)}
      >
        {/* Top Checkmark if prayed */}
        {isPrayed && (
          <View style={styles.prayedCheckBadgeNormal}>
            <Ionicons name="checkmark-circle" size={14} color="#34d399" />
          </View>
        )}

        <Image
          source={p.icon}
          style={[
            styles.prayerIconImg,
            { tintColor: isPrayed ? '#34d399' : colors.prayerIconTint },
          ]}
          resizeMode="contain"
        />
        <Text
          style={[styles.prayerCardName, { color: colors.prayerName }, isPrayed && styles.prayerCardNamePrayed]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {p.name}
        </Text>
        <Text style={[styles.prayerCardTime, { color: colors.prayerTime }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {p.time}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDailyAppIcon = (app: DailyAppItem) => {
    const size = 26;
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
      return <MaterialCommunityIcons name={app.iconName as any} size={size} color={app.iconColor} />;
    }
    if (app.iconType === 'fontAwesome') {
      return <FontAwesome5 name={app.iconName as any} size={size - 2} color={app.iconColor} />;
    }
    return <Ionicons name={app.iconName as any} size={size} color={app.iconColor} />;
  };

  const activeDailyApps = (
    dailyAppIds.length > 0 ? dailyAppIds : DEFAULT_DAILY_APP_IDS
  )
    .map((id) => ALL_DAILY_APPS.find((app) => app.id === id))
    .filter(Boolean) as DailyAppItem[];

  return (
    <View style={styles.container}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* ================= 1. Top Header ================= */}
        <View style={styles.topHeader}>
          {/* Left Action Icons */}
          <View style={styles.headerActionIcons}>
            <TouchableOpacity
              style={[
                styles.profileIconButton,
                !isDark && {
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  borderColor: 'rgba(16, 185, 129, 0.25)',
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/duas' as any);
              }}
            >
              <Ionicons name="person" size={18} color="#0f8e5d" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.headerIconButton,
                { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/(tabs)/quran', params: { tab: 'readings' } } as any);
              }}
            >
              <Ionicons name="bookmark" size={18} color={colors.headerBtnIcon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.headerIconButton,
                { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                openSearch();
              }}
            >
              <Ionicons name="search" size={18} color={colors.headerBtnIcon} />
            </TouchableOpacity>
          </View>

          {/* Right Main Title */}
          <Text style={[styles.screenMainTitle, { color: colors.title }]}>الرئيسية</Text>
        </View>

        {/* ================= 2. Hero Section ================= */}
        <View style={styles.heroSectionRow}>
          {/* Left: Calendar Card */}
          <View
            style={[
              styles.calendarCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                shadowColor: colors.cardShadow,
              },
            ]}
          >
            <Text style={[styles.calendarDayTitle, { color: colors.calendarDay }]}>{calendar.weekdayName}</Text>
            <View style={[styles.calendarDivider, { backgroundColor: colors.calendarDivider }]} />
            <View style={styles.calendarColumnsRow}>
              <View style={styles.calendarCol}>
                <Text
                  style={[styles.calendarColLabel, { color: colors.subtitle }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {calendar.hijriMonth}
                </Text>
                <Text style={[styles.calendarColNumber, { color: colors.calendarNumber }]}>{calendar.hijriDay}</Text>
                <Text style={[styles.calendarColYear, { color: colors.muted }]}>{calendar.hijriYear}</Text>
              </View>
              <View style={styles.calendarCol}>
                <Text
                  style={[styles.calendarColLabel, { color: colors.subtitle }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {calendar.gregMonth}
                </Text>
                <Text style={[styles.calendarColNumber, { color: colors.calendarNumber }]}>{calendar.gregDay}</Text>
                <Text style={[styles.calendarColYear, { color: colors.muted }]}>{calendar.gregYear}</Text>
              </View>
            </View>
          </View>

          {/* Right: Greetings and Action */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingTitleRow}>
              <Text
                style={[styles.greetingTitle, { color: colors.greetingText }]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {greeting.title}
              </Text>
              <Text style={styles.rosaryIcon}>{greeting.icon}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.actionPillButton,
                {
                  backgroundColor: colors.actionPillBg,
                  borderColor: colors.actionPillBorder,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(greeting.route as any);
              }}
            >
              <Text style={styles.actionPillText}>{greeting.buttonText}</Text>
            </TouchableOpacity>

            <View style={styles.prayerCountdownRow}>
              <View style={styles.limeBadge}>
                <Text style={styles.limeBadgeText}>{remainingBadgeText}</Text>
              </View>

              <View style={styles.prayerLabelWithIcon}>
                <Text style={[styles.prayerLabelText, { color: colors.subtitle }]} numberOfLines={1}>: صلاة {upcomingPrayerName} بعد</Text>
                <View style={[styles.mosqueIconCircle, { backgroundColor: colors.mosqueCircleBg, borderColor: colors.mosqueCircleBorder }]}>
                  <MaterialCommunityIcons name="mosque" size={13} color={isDark ? '#a3e635' : '#059669'} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ================= 3. Prayer Times Section ================= */}
        {isSectionVisible('prayer_times') && (
        <>
        {/* Header: Location on Left, "أوقات الصلاة" on Right */}
        <View style={styles.prayerSectionHeader}>
          <TouchableOpacity
            style={styles.locationTagRow}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowLocationModal(true);
            }}
          >
            <Ionicons name="location-outline" size={16} color="#0f8e5d" />
            <Text style={[styles.locationCityText, { color: colors.subtitle }]}>{userLocation.city}</Text>
          </TouchableOpacity>
          <Text style={[styles.prayerSectionTitle, { color: colors.title }]}>أوقات الصلاة</Text>
        </View>

        {/* Prayer Times Grid */}
        <View style={styles.prayerGrid}>
          {/* Row 1: Fajr (Right) -> Sunrise -> Dhuhr -> Asr (Left) */}
          <View style={styles.prayerRow}>
            {row1Prayers.map((p) => renderPrayerCard(p))}
          </View>

          {/* Row 2: Maghrib (Right) -> Isha -> Midnight (Left) */}
          <View style={styles.prayerRow}>
            {row2Prayers.map((p) => renderPrayerCard(p))}
          </View>
        </View>
        </>
        )}

        {/* ================= 4. Daily Apps Section ================= */}
        {isSectionVisible('daily_apps') && (
        <>
        <View style={styles.sectionTitleRow}>
          <TouchableOpacity
            style={styles.customizeButton}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/custom-daily-apps' as any);
            }}
          >
            <Ionicons name="pencil-outline" size={14} color={colors.subtitle} />
            <Text style={[styles.customizeText, { color: colors.subtitle }]}>تخصيص</Text>
          </TouchableOpacity>
          <Text style={[styles.sectionHeaderTitle, { color: colors.title }]}>تطبيقاتك اليومية</Text>
        </View>

        {activeDailyApps.length <= 4 ? (
          <View style={styles.quickAppsRow}>
            {activeDailyApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.quickAppItem}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(app.route as any);
                }}
              >
                <View style={[styles.quickAppCircle, { backgroundColor: app.bgColor, borderColor: colors.appCircleBorder }]}>
                  {renderDailyAppIcon(app)}
                </View>
                <Text style={[styles.quickAppTitle, { color: colors.appTitle }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{app.title}</Text>
                {app.subTitle ? (
                  <Text style={[styles.quickAppSubTitle, { color: colors.appSubtitle }]} numberOfLines={1}>{app.subTitle}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickAppsScroll}
          >
            {activeDailyApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.quickAppItemScroll}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(app.route as any);
                }}
              >
                <View style={[styles.quickAppCircle, { backgroundColor: app.bgColor, borderColor: colors.appCircleBorder }]}>
                  {renderDailyAppIcon(app)}
                </View>
                <Text style={[styles.quickAppTitle, { color: colors.appTitle }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{app.title}</Text>
                {app.subTitle ? (
                  <Text style={[styles.quickAppSubTitle, { color: colors.appSubtitle }]} numberOfLines={1}>{app.subTitle}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        </>
        )}

        {/* ================= 5. Last Read / Resume Quran Section ================= */}
        {isSectionVisible('continue_khatmah') && (
        <View style={styles.lastReadSectionWrapper}>
          <TouchableOpacity
            style={[
              styles.lastReadCard,
              {
                backgroundColor: colors.lastReadBg,
                borderColor: colors.lastReadBorder,
                shadowColor: colors.cardShadow,
              },
            ]}
            activeOpacity={0.88}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/surah/[id]',
                params: { id: lastRead.surahId.toString() },
              });
            }}
          >
            {/* Left Column: Arrow Chevron & Page Pill */}
            <View style={styles.lastReadLeftCol}>
              <View style={[styles.lastReadArrowCircle, { backgroundColor: colors.lastReadArrowBg, borderColor: colors.cardBorder }]}>
                <Ionicons name="chevron-back" size={16} color={colors.lastReadArrowIcon} />
              </View>
              <View style={styles.lastReadPagePill}>
                <Text style={styles.lastReadPageText}>ص {lastRead.page}</Text>
              </View>
            </View>

            {/* Center Column: Section Title, Surah Title, Meta */}
            <View style={styles.lastReadCenterCol}>
              <View style={styles.lastReadBadgeRow}>
                <View style={styles.lastReadLiveIndicator} />
                <Text style={styles.lastReadBadgeText}>آخر قراءة • متابعة المصحف</Text>
              </View>

              <Text style={[styles.lastReadSurahTitle, { color: colors.lastReadTitle }]} numberOfLines={1}>
                {lastRead.surahName}
              </Text>

              <View style={styles.lastReadMetaRow}>
                <Text style={[styles.lastReadMetaText, { color: colors.subtitle }]}>
                  {lastRead.revelationPlace === 'makkah' ? 'مكية' : 'مدنية'}
                </Text>
                <Text style={[styles.lastReadMetaDot, { color: colors.muted }]}>•</Text>
                <Text style={[styles.lastReadMetaText, { color: colors.subtitle }]}>{lastRead.versesCount} آية</Text>
                <Text style={[styles.lastReadMetaDot, { color: colors.muted }]}>•</Text>
                <Text style={styles.lastReadMetaHighlight}>اضغط للمتابعة</Text>
              </View>
            </View>

            {/* Right Column: Quran Calligraphy Circle Emblem */}
            <View style={styles.lastReadEmblemWrapper}>
              <Image
                source={require('@/assets/images/quran_circle_emblem.png')}
                style={styles.lastReadEmblemImg}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        </View>
        )}

        {/* ================= 6. Recent Activities Section (أنشطتك الأخيرة) ================= */}
        {isSectionVisible('recent_activities') && (
        <View style={styles.recentActivitiesSection}>
          <Text style={[styles.recentActivitiesHeaderTitle, { color: colors.title }]}>أنشطتك الأخيرة</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentActivitiesScroll}
          >
            {/* Pill 1: السبحة */}
            <TouchableOpacity
              style={[styles.activityPill, { backgroundColor: '#9eb2ea' }]}
              activeOpacity={0.82}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/tasbih' as any);
              }}
            >
              <TasbihBeadsIcon size={20} color="#ffffff" />
              <Text style={[styles.activityPillText, { color: '#1e293b' }]}>السبحة</Text>
            </TouchableOpacity>

            {/* Pill 2: أدعية من القرآن */}
            <TouchableOpacity
              style={[styles.activityPill, { backgroundColor: '#eedff2' }]}
              activeOpacity={0.82}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/duas' as any);
              }}
            >
              <QuranStandIcon size={20} color="#483852" />
              <Text style={[styles.activityPillText, { color: '#2c1e34' }]}>أدعية من القرآن</Text>
            </TouchableOpacity>

            {/* Pill 3: أذكار الصباح */}
            <TouchableOpacity
              style={[styles.activityPill, { backgroundColor: '#f3e8f5' }]}
              activeOpacity={0.82}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/dhikr/morning' as any);
              }}
            >
              <MorningSunIcon size={20} color="#483852" />
              <Text style={[styles.activityPillText, { color: '#2c1e34' }]}>أذكار الصباح</Text>
            </TouchableOpacity>

            {/* Pill 4: سورة الكهف */}
            <TouchableOpacity
              style={[styles.activityPill, { backgroundColor: '#dceddd' }]}
              activeOpacity={0.82}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/surah/[id]', params: { id: '18' } } as any);
              }}
            >
              <Ionicons name="book-outline" size={18} color="#274431" />
              <Text style={[styles.activityPillText, { color: '#162e1f' }]}>سورة الكهف</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        )}

        {/* ================= 7. Daily Inspirations (آية اليوم، حديث اليوم، دعاء اليوم) ================= */}
        <View style={styles.dailyInspirationsSection}>
          {/* Card 1: آية اليوم */}
          {isSectionVisible('ayah_of_day') && (
          <TouchableOpacity
            style={[
              styles.compactInspirationCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                shadowColor: colors.cardShadow,
              },
            ]}
            activeOpacity={0.88}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/surah/[id]',
                params: { id: dailyInspirations.ayah.surahId.toString() },
              } as any);
            }}
          >
            <View style={styles.cardMainRow}>
              {/* Left: Share Icon */}
              <TouchableOpacity
                style={styles.cleanShareBtn}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleShare(
                    `﴿ ${dailyInspirations.ayah.text} ﴾ [${dailyInspirations.ayah.reference}]`
                  );
                }}
              >
                <Ionicons name="share-outline" size={17} color={isDark ? '#86efac' : '#059669'} />
              </TouchableOpacity>

              {/* Center: Verse Text */}
              <View style={styles.cardCenterCol}>
                <Text style={[styles.ayahTextInline, { color: colors.title }]}>
                  {dailyInspirations.ayah.text}{' '}
                  <Text style={styles.ayahBadgeInline}>
                    ﴿{dailyInspirations.ayah.arabicVerseNumber}﴾
                  </Text>
                </Text>
              </View>

              {/* Right: Ribbon Badge */}
              <InspirationRibbonBadge type="ayah" />
            </View>

            {/* Bottom Row: Reference */}
            <View style={styles.cardBottomRow}>
              <Text style={[styles.referenceTextSimple, { color: colors.subtitle }]}>{dailyInspirations.ayah.reference}</Text>
            </View>
          </TouchableOpacity>
          )}

          {/* Card 2: حديث اليوم */}
          {isSectionVisible('hadith_of_day') && (
          <View
            style={[
              styles.compactInspirationCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                shadowColor: colors.cardShadow,
              },
            ]}
          >
            <View style={styles.cardMainRow}>
              {/* Left: Share Icon */}
              <TouchableOpacity
                style={styles.cleanShareBtn}
                activeOpacity={0.7}
                onPress={() =>
                  handleShare(
                    `${dailyInspirations.hadith.text}\n(${dailyInspirations.hadith.source})`
                  )
                }
              >
                <Ionicons name="share-outline" size={17} color={isDark ? '#86efac' : '#059669'} />
              </TouchableOpacity>

              {/* Center: Hadith Text */}
              <View style={styles.cardCenterCol}>
                <Text style={[styles.hadithTextInline, { color: colors.title }]}>
                  {dailyInspirations.hadith.text}
                </Text>
              </View>

              {/* Right: Ribbon Badge */}
              <InspirationRibbonBadge type="hadith" />
            </View>

            {/* Bottom Row: Source */}
            {dailyInspirations.hadith.source ? (
              <View style={styles.cardBottomRow}>
                <Text style={[styles.referenceTextSimple, { color: colors.subtitle }]}>{dailyInspirations.hadith.source}</Text>
              </View>
            ) : null}
          </View>
          )}

          {/* Card 3: دعاء اليوم */}
          {isSectionVisible('dua_of_day') && (
          <View
            style={[
              styles.compactInspirationCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                shadowColor: colors.cardShadow,
              },
            ]}
          >
            <View style={styles.cardMainRow}>
              {/* Left: Share Icon */}
              <TouchableOpacity
                style={styles.cleanShareBtn}
                activeOpacity={0.7}
                onPress={() =>
                  handleShare(
                    `${dailyInspirations.dua.text}\n(${dailyInspirations.dua.source})`
                  )
                }
              >
                <Ionicons name="share-outline" size={17} color={isDark ? '#86efac' : '#059669'} />
              </TouchableOpacity>

              {/* Center: Dua Text */}
              <View style={styles.cardCenterCol}>
                <Text style={[styles.duaTextInline, { color: colors.title }]}>
                  {dailyInspirations.dua.text}
                </Text>
              </View>

              {/* Right: Ribbon Badge */}
              <InspirationRibbonBadge type="dua" />
            </View>

            {/* Bottom Row: Source */}
            {dailyInspirations.dua.source ? (
              <View style={styles.cardBottomRow}>
                <Text style={[styles.referenceTextSimple, { color: colors.subtitle }]}>{dailyInspirations.dua.source}</Text>
              </View>
            ) : null}
          </View>
          )}
        </View>
      </ScrollView>
      </SafeAreaView>

      {/* Location Settings Modal */}
      <LocationModal
        visible={showLocationModal}
        currentLocation={userLocation}
        onClose={() => setShowLocationModal(false)}
        onApplyLocation={handleApplyLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 160 : 140,
  },

  /* 1. Header */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  screenMainTitle: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 32,
    color: '#f8fafc',
  },
  headerActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 142, 93, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(15, 142, 93, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 2. Hero Section */
  heroSectionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
    marginBottom: 28,
  },

  /* Calendar Card on the Left */
  calendarCard: {
    width: 144,
    backgroundColor: '#1e293b',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  calendarDayTitle: {
    fontFamily: 'Rakkas_400Regular',
    fontSize: 32,
    lineHeight: 42,
    color: '#a7f3d0',
    textAlign: 'center',
    paddingTop: 2,
  },
  calendarDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  calendarColumnsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
  },
  calendarCol: {
    alignItems: 'center',
    flex: 1,
  },
  calendarColLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: '#8ba7c0',
    marginBottom: 2,
    textAlign: 'center',
  },
  calendarColNumber: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 21,
    color: '#f8fafc',
  },
  calendarColYear: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 10.5,
    color: '#64748b',
  },

  /* Greeting Section on the Right */
  greetingSection: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 8,
  },
  greetingTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    lineHeight: 21,
    color: '#e2e8f0',
    textAlign: 'right',
    flexShrink: 1,
  },
  rosaryIcon: {
    fontSize: 17,
  },
  actionPillButton: {
    backgroundColor: '#15251d',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  actionPillText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  prayerCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  limeBadge: {
    backgroundColor: '#65a30d',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limeBadgeText: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 11,
    color: '#ffffff',
  },
  prayerLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  prayerLabelText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#94a3b8',
  },
  mosqueIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#15251d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 3. Prayer Times Section */
  prayerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  prayerSectionTitle: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 24,
    color: '#f8fafc',
  },
  locationTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationCityText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#94a3b8',
  },
  prayerGrid: {
    gap: 12,
    marginBottom: 24,
  },
  prayerRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    alignItems: 'stretch',
  },
  prayerCardNormal: {
    flex: 1,
    minHeight: 88,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  prayerCardName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    lineHeight: 15,
    color: '#8ba7c0',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  prayerCardTime: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 10.5,
    color: '#f8fafc',
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  prayerIconImg: {
    width: 22,
    height: 22,
  },

  /* Wide Highlighted Card (Mint green) */
  prayerCardHighlight: {
    flex: 1.8,
    minHeight: 88,
    backgroundColor: '#cbf4dc',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15, 142, 93, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  highlightCountdownCol: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexShrink: 1,
  },
  countdownNotice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 9.5,
    color: '#065f46',
    marginBottom: 2,
    textAlign: 'left',
  },
  countdownDigits: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 13.5,
    color: '#065f46',
    letterSpacing: 0,
    textAlign: 'left',
  },
  highlightInfoCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 4,
  },
  prayerIconImgHighlight: {
    width: 19,
    height: 19,
  },
  highlightNameText: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 11.5,
    color: '#065f46',
    marginTop: 2,
  },
  highlightTimeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
    color: '#065f46',
    marginTop: 1,
  },
  prayerCardNormalPrayed: {
    borderWidth: 2,
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  prayerCardNamePrayed: {
    color: '#34d399',
  },
  prayedCheckBadgeNormal: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 2,
  },
  prayerCardHighlightPrayed: {
    borderWidth: 2.5,
    borderColor: '#059669',
  },
  prayedCheckBadgeHighlight: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },

  /* 4. Daily Apps Section */
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 20,
    color: '#f8fafc',
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customizeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#8ba7c0',
  },
  quickAppsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAppsScroll: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 16,
    paddingBottom: 4,
    marginBottom: 20,
  },
  quickAppItem: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 84,
    minHeight: 104,
  },
  quickAppItemScroll: {
    alignItems: 'center',
    width: 78,
    minHeight: 104,
  },
  quickAppCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickAppIconImg: {
    width: 28,
    height: 28,
  },
  qiblaIconBig: {
    width: 35,
    height: 35,
  },
  quickAppTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#f8fafc',
    textAlign: 'center',
  },
  quickAppSubTitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 10,
    color: '#8ba7c0',
    textAlign: 'center',
    marginTop: -2,
  },

  /* 5. Last Read / Resume Quran Section */
  lastReadSectionWrapper: {
    marginTop: 10,
    marginBottom: 8,
  },
  lastReadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#122026',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  lastReadLeftCol: {
    alignItems: 'center',
    gap: 6,
  },
  lastReadArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e333d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  lastReadPagePill: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  lastReadPageText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 10.5,
    color: '#34d399',
  },
  lastReadCenterCol: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 14,
    marginLeft: 10,
  },
  lastReadBadgeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  lastReadLiveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  lastReadBadgeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11.5,
    color: '#34d399',
  },
  lastReadSurahTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16.5,
    color: '#ffffff',
    textAlign: 'right',
  },
  lastReadMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  lastReadMetaText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11.5,
    color: '#94a3b8',
  },
  lastReadMetaDot: {
    color: '#64748b',
    fontSize: 10,
  },
  lastReadMetaHighlight: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#6ee7b7',
  },
  lastReadEmblemWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#304a3f',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastReadEmblemImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  /* 6. Recent Activities Section */
  recentActivitiesSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  recentActivitiesHeaderTitle: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 18,
    color: '#f8fafc',
    textAlign: 'right',
    marginBottom: 14,
  },
  recentActivitiesScroll: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingBottom: 6,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  activityPillText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14.5,
    letterSpacing: -0.2,
  },

  /* 7. Daily Inspirations Section */
  dailyInspirationsSection: {
    marginTop: 18,
    marginBottom: 32,
    gap: 10,
  },
  compactInspirationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cleanShareBtn: {
    paddingTop: 1,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenterCol: {
    flex: 1,
    paddingTop: 1,
  },
  ayahTextInline: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 14.5,
    lineHeight: 25,
    color: '#f8fafc',
    textAlign: 'right',
  },
  ayahBadgeInline: {
    color: '#86efac',
    fontFamily: 'Amiri_700Bold',
    fontSize: 14.5,
  },
  hadithTextInline: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12.5,
    lineHeight: 20,
    color: '#f8fafc',
    textAlign: 'right',
  },
  duaTextInline: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12.5,
    lineHeight: 20,
    color: '#f8fafc',
    textAlign: 'right',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
    paddingLeft: 2,
  },
  referenceTextSimple: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'left',
  },
  /* Handcrafted 3D Folded Bookmark Ribbon */
  ribbonWrapper: {
    alignItems: 'flex-end',
    width: 66,
  },
  ribbonTopBanner: {
    width: 66,
    height: 19,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonTitleText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 14,
  },
  ribbonHangingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: 66,
    paddingLeft: 14,
  },
  ribbonTabSquare: {
    width: 24,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  ribbonFoldTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 18,
    borderRightWidth: 24,
    borderRightColor: 'transparent',
  },
});
