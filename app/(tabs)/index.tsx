import React, { useState } from 'react';
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
  Dimensions,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 44;

const SEAL_DURATIONS = [
  { days: 30, label: '30 يوماً', sub: 'جزء يومياً (20 ص)' },
  { days: 60, label: '60 يوماً', sub: 'نصف جزء (10 ص)' },
  { days: 15, label: '15 يوماً', sub: 'جزأين (40 ص)' },
];

const PRAYER_ICONS = {
  fajrShines: require('@/assets/icons/fajr_shines.png'),
  sunOutline: require('@/assets/icons/sun_outline.png'),
  sunSolid: require('@/assets/icons/sun_solid.png'),
  sunriseRays: require('@/assets/icons/sunrise_rays.png'),
  sunriseSimple: require('@/assets/icons/sunrise_simple.png'),
  moonStars: require('@/assets/icons/moon_stars.png'),
};

const DAILY_APP_ICONS = {
  tasbih: require('@/assets/icons/app_tasbih.png'),
  qibla: require('@/assets/icons/app_qibla.png'),
  salat: require('@/assets/icons/app_salat.png'),
  tv: require('@/assets/icons/app_tv.png'),
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

export default function HomeScreen() {
  const router = useRouter();

  const [locationCity] = useState('آسفي، المغرب');
  const [activePrayerId, setActivePrayerId] = useState('Asr'); // Active prayer (e.g. Asr)
  const [countdown] = useState('01:52:05');

  // Quran Seal (Khatmah) State
  const [currentKhatmah, setCurrentKhatmah] = useState({
    surahName: 'الأنفال',
    page: 177,
    progress: 29, // 177 / 604
  });
  const [activeSealIndex, setActiveSealIndex] = useState(0);
  const [showNewSealModal, setShowNewSealModal] = useState(false);
  const [newSealName, setNewSealName] = useState('ختمة القرآن الكريم');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const handleStartNewSeal = () => {
    setCurrentKhatmah({
      surahName: 'الفاتحة',
      page: 1,
      progress: 1,
    });
    setShowNewSealModal(false);
  };

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
    { id: 'Fajr', name: 'الفجر', time: '5:17 ص', icon: PRAYER_ICONS.fajrShines },
    { id: 'Sunrise', name: 'الشروق', time: '6:38 ص', icon: PRAYER_ICONS.sunriseRays },
    { id: 'Dhuhr', name: 'الظهر', time: '12:24 م', icon: PRAYER_ICONS.sunSolid },
    { id: 'Asr', name: 'العصر', time: '3:39 م', icon: PRAYER_ICONS.sunOutline },
  ];

  // Row 2: Maghrib -> Isha -> Midnight
  const row2Prayers: PrayerItem[] = [
    { id: 'Maghrib', name: 'المغرب', time: '6:08 م', icon: PRAYER_ICONS.sunriseRays },
    { id: 'Isha', name: 'العشاء', time: '7:25 م', icon: PRAYER_ICONS.moonStars },
    { id: 'Midnight', name: 'منتصف الليل', time: '11:43 م', icon: PRAYER_ICONS.fajrShines },
  ];

  const renderPrayerCard = (p: PrayerItem) => {
    const isActive = p.id === activePrayerId;

    if (isActive) {
      // Wide Highlight Card (Mint Green)
      return (
        <TouchableOpacity
          key={p.id}
          style={styles.prayerCardHighlight}
          activeOpacity={0.85}
          onPress={() => setActivePrayerId(p.id)}
        >
          {/* Left Column: Countdown */}
          <View style={styles.highlightCountdownCol}>
            <Text style={styles.countdownNotice}>تبقى على الأذان</Text>
            <Text style={styles.countdownDigits}>{countdown}</Text>
          </View>

          {/* Right Column: Icon on Top, Name + Time below */}
          <View style={styles.highlightInfoCol}>
            <Image
              source={p.icon}
              style={[styles.prayerIconImg, { tintColor: '#15803d' }]}
              resizeMode="contain"
            />
            <Text style={styles.highlightNameText}>{p.name}</Text>
            <Text style={styles.highlightTimeText}>{p.time}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Normal Dark Card
    return (
      <TouchableOpacity
        key={p.id}
        style={styles.prayerCardNormal}
        activeOpacity={0.8}
        onPress={() => setActivePrayerId(p.id)}
      >
        <Image
          source={p.icon}
          style={[styles.prayerIconImg, { tintColor: '#94a3b8' }]}
          resizeMode="contain"
        />
        <Text style={styles.prayerCardName}>{p.name}</Text>
        <Text style={styles.prayerCardTime}>{p.time}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= 1. Top Header ================= */}
        <View style={styles.topHeader}>
          {/* Left Action Icons */}
          <View style={styles.headerActionIcons}>
            <TouchableOpacity style={styles.profileIconButton} activeOpacity={0.7}>
              <Ionicons name="person" size={18} color="#4ade80" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
              <Ionicons name="bookmark" size={18} color="#8ba7c0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
              <Ionicons name="search" size={18} color="#8ba7c0" />
            </TouchableOpacity>
          </View>

          {/* Right Main Title */}
          <Text style={styles.screenMainTitle}>الرئيسية</Text>
        </View>

        {/* ================= 2. Hero Section ================= */}
        <View style={styles.heroSectionRow}>
          {/* Left: Calendar Card */}
          <View style={styles.calendarCard}>
            <Text style={styles.calendarDayTitle}>الإِثْنَيْنُ</Text>
            <View style={styles.calendarDivider} />
            <View style={styles.calendarColumnsRow}>
              <View style={styles.calendarCol}>
                <Text style={styles.calendarColLabel}>جمادى الأولى</Text>
                <Text style={styles.calendarColNumber}>1</Text>
                <Text style={styles.calendarColYear}>1448</Text>
              </View>
              <View style={styles.calendarCol}>
                <Text style={styles.calendarColLabel}>أكتوبر</Text>
                <Text style={styles.calendarColNumber}>12</Text>
                <Text style={styles.calendarColYear}>2026</Text>
              </View>
            </View>
          </View>

          {/* Right: Greetings and Action */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingTitleRow}>
              <Text style={styles.rosaryIcon}>📿</Text>
              <Text style={styles.greetingTitle}>وقت مبارك</Text>
            </View>

            <TouchableOpacity
              style={styles.actionPillButton}
              activeOpacity={0.8}
              onPress={() => router.push('/adhkar' as any)}
            >
              <Text style={styles.actionPillText}>لتسبح الله</Text>
            </TouchableOpacity>

            <View style={styles.prayerCountdownRow}>
              <View style={styles.limeBadge}>
                <Text style={styles.limeBadgeText}>ساعة و52 د</Text>
              </View>

              <View style={styles.prayerLabelWithIcon}>
                <Text style={styles.prayerLabelText}>: صلاة العصر بعد</Text>
                <View style={styles.mosqueIconCircle}>
                  <MaterialCommunityIcons name="mosque" size={15} color="#84cc16" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ================= 3. Prayer Times Section ================= */}
        {/* Header: Location on Left, "أوقات الصلاة" on Right */}
        <View style={styles.prayerSectionHeader}>
          <View style={styles.locationTagRow}>
            <Ionicons name="location-outline" size={16} color="#0f8e5d" />
            <Text style={styles.locationCityText}>{locationCity}</Text>
          </View>
          <Text style={styles.prayerSectionTitle}>أوقات الصلاة</Text>
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

        {/* ================= 4. Daily Apps Section ================= */}
        <View style={styles.sectionTitleRow}>
          <TouchableOpacity style={styles.customizeButton} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={14} color="#8ba7c0" />
            <Text style={styles.customizeText}>تخصيص</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderTitle}>تطبيقاتك اليومية</Text>
        </View>

        <View style={styles.quickAppsRow}>
          {/* App 1 (Right): Tasbih */}
          <TouchableOpacity
            style={styles.quickAppItem}
            activeOpacity={0.8}
            onPress={() => router.push('/adhkar' as any)}
          >
            <View style={[styles.quickAppCircle, { backgroundColor: 'rgba(15, 142, 93, 0.15)' }]}>
              <Image
                source={DAILY_APP_ICONS.tasbih}
                style={[styles.quickAppIconImg, { tintColor: '#34d399' }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.quickAppTitle}>المسبحة</Text>
          </TouchableOpacity>

          {/* App 2: Qibla */}
          <TouchableOpacity
            style={styles.quickAppItem}
            activeOpacity={0.8}
            onPress={() => router.push('/qibla' as any)}
          >
            <View style={[styles.quickAppCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Image
                source={DAILY_APP_ICONS.qibla}
                style={[styles.quickAppIconImg, styles.qiblaIconBig, { tintColor: '#c084fc' }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.quickAppTitle}>اتجاه القبلة</Text>
          </TouchableOpacity>

          {/* App 3: Post Prayer Adhkar */}
          <TouchableOpacity
            style={styles.quickAppItem}
            activeOpacity={0.8}
            onPress={() => router.push('/adhkar' as any)}
          >
            <View style={[styles.quickAppCircle, { backgroundColor: 'rgba(15, 142, 93, 0.15)' }]}>
              <Image
                source={DAILY_APP_ICONS.salat}
                style={[styles.quickAppIconImg, { tintColor: '#34d399' }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.quickAppTitle}>أذكار بعد الصلاة</Text>
          </TouchableOpacity>

          {/* App 4 (Left): Live Stream */}
          <TouchableOpacity
            style={styles.quickAppItem}
            activeOpacity={0.8}
            onPress={() => router.push('/reciters' as any)}
          >
            <View style={[styles.quickAppCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Image
                source={DAILY_APP_ICONS.tv}
                style={[styles.quickAppIconImg, { tintColor: '#f87171' }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.quickAppTitle}>البث المباشر</Text>
            <Text style={styles.quickAppSubTitle}>للقرآن الكريم</Text>
          </TouchableOpacity>
        </View>

        {/* ================= 5. Quran Seal / Khatmah Carousel Section ================= */}
        <View style={styles.sealCarouselWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sealScrollContent}
            snapToInterval={CARD_WIDTH + 12}
            decelerationRate="fast"
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const idx = Math.round(x / (CARD_WIDTH + 12));
              setActiveSealIndex(idx);
            }}
            scrollEventThrottle={16}
          >
            {/* Card 1: Resume Quran Reading (Khatmah Progress) */}
            <TouchableOpacity
              style={[styles.sealCard, { width: CARD_WIDTH }]}
              activeOpacity={0.88}
              onPress={() => router.push('/quran' as any)}
            >
              <Ionicons name="chevron-back" size={20} color="#8ba7c0" style={styles.sealChevron} />

              <View style={styles.sealTextCol}>
                <Text style={styles.sealMainTitle}>متابعة المصحف من حيث توقفت</Text>
                <Text style={styles.sealSubTitle}>
                  {currentKhatmah.surahName} - الصفحة {currentKhatmah.page}
                </Text>
                <View style={styles.sealProgressTrack}>
                  <View style={[styles.sealProgressFill, { width: `${currentKhatmah.progress}%` }]} />
                </View>
              </View>

              <View style={styles.sealBadgeCircle}>
                <Image
                  source={require('@/assets/images/quran-calligraphy.png')}
                  style={styles.sealBadgeImg}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>

            {/* Card 2: Start a New Quran Seal (Khatmah) */}
            <TouchableOpacity
              style={[styles.sealCard, { width: CARD_WIDTH }]}
              activeOpacity={0.88}
              onPress={() => setShowNewSealModal(true)}
            >
              <View style={styles.sealPlusBox}>
                <Ionicons name="add" size={24} color="#8ba7c0" />
              </View>

              <View style={styles.sealTextColCenter}>
                <Text style={styles.sealMainTitleCenter}>ابدأ بـ ختمة جديدة</Text>
              </View>

              <View style={styles.sealBadgeCircle}>
                <Image
                  source={require('@/assets/images/quran-calligraphy.png')}
                  style={styles.sealBadgeImg}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.sealPaginationDots}>
            <View style={[styles.sealDot, activeSealIndex === 0 && styles.sealDotActive]} />
            <View style={[styles.sealDot, activeSealIndex === 1 && styles.sealDotActive]} />
          </View>
        </View>

        {/* ================= 6. Recent Activities Section (أنشطتك الأخيرة) ================= */}
        <View style={styles.recentActivitiesSection}>
          <Text style={styles.recentActivitiesHeaderTitle}>أنشطتك الأخيرة</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentActivitiesScroll}
          >
            {/* Pill 1: السبحة */}
            <TouchableOpacity
              style={[styles.activityPill, { backgroundColor: '#9eb2ea' }]}
              activeOpacity={0.82}
              onPress={() => router.push('/adhkar' as any)}
            >
              <TasbihBeadsIcon size={20} color="#ffffff" />
              <Text style={[styles.activityPillText, { color: '#1e293b' }]}>السبحة</Text>
            </TouchableOpacity>

            {/* Pill 2: أدعية من القرآن */}
            <TouchableOpacity
              style={[styles.activityPill, { backgroundColor: '#eedff2' }]}
              activeOpacity={0.82}
              onPress={() => router.push('/duas' as any)}
            >
              <QuranStandIcon size={20} color="#483852" />
              <Text style={[styles.activityPillText, { color: '#2c1e34' }]}>أدعية من القرآن</Text>
            </TouchableOpacity>

            {/* Pill 3: أذكار الصباح */}
            <TouchableOpacity
              style={[styles.activityPill, { backgroundColor: '#f3e8f5' }]}
              activeOpacity={0.82}
              onPress={() => router.push('/adhkar' as any)}
            >
              <MorningSunIcon size={20} color="#483852" />
              <Text style={[styles.activityPillText, { color: '#2c1e34' }]}>أذكار الصباح</Text>
            </TouchableOpacity>

            {/* Pill 4: سورة الكهف */}
            <TouchableOpacity
              style={[styles.activityPill, { backgroundColor: '#dceddd' }]}
              activeOpacity={0.82}
              onPress={() => router.push('/quran' as any)}
            >
              <Ionicons name="book-outline" size={18} color="#274431" />
              <Text style={[styles.activityPillText, { color: '#162e1f' }]}>سورة الكهف</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ================= 7. Daily Inspirations (آية اليوم، حديث اليوم، دعاء اليوم) ================= */}
        <View style={styles.dailyInspirationsSection}>
          {/* Card 1: آية اليوم */}
          <View style={styles.compactInspirationCard}>
            <View style={styles.cardMainRow}>
              {/* Left: Share Icon */}
              <TouchableOpacity
                style={styles.cleanShareBtn}
                activeOpacity={0.7}
                onPress={() =>
                  handleShare(
                    '﴿ قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ ﴾ [الزمر: 53]'
                  )
                }
              >
                <Ionicons name="share-outline" size={17} color="#86efac" />
              </TouchableOpacity>

              {/* Center: Verse Text */}
              <View style={styles.cardCenterCol}>
                <Text style={styles.ayahTextInline}>
                  قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ{' '}
                  <Text style={styles.ayahBadgeInline}>﴿٥٣﴾</Text>
                </Text>
              </View>

              {/* Right: Ribbon Badge */}
              <InspirationRibbonBadge type="ayah" />
            </View>

            {/* Bottom Row: Reference */}
            <View style={styles.cardBottomRow}>
              <Text style={styles.referenceTextSimple}>الزمر: 53</Text>
            </View>
          </View>

          {/* Card 2: حديث اليوم */}
          <View style={styles.compactInspirationCard}>
            <View style={styles.cardMainRow}>
              {/* Left: Share Icon */}
              <TouchableOpacity
                style={styles.cleanShareBtn}
                activeOpacity={0.7}
                onPress={() =>
                  handleShare(
                    'قَالَ النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: «يَسِّرُوا وَلَا تُعَسِّرُوا، وَسَكِّنُوا وَلَا تُنَفِّرُوا».'
                  )
                }
              >
                <Ionicons name="share-outline" size={17} color="#86efac" />
              </TouchableOpacity>

              {/* Center: Hadith Text */}
              <View style={styles.cardCenterCol}>
                <Text style={styles.hadithTextInline}>
                  قَالَ النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: «يَسِّرُوا وَلَا تُعَسِّرُوا، وَسَكِّنُوا وَلَا تُنَفِّرُوا».
                </Text>
              </View>

              {/* Right: Ribbon Badge */}
              <InspirationRibbonBadge type="hadith" />
            </View>
          </View>

          {/* Card 3: دعاء اليوم */}
          <View style={styles.compactInspirationCard}>
            <View style={styles.cardMainRow}>
              {/* Left: Share Icon */}
              <TouchableOpacity
                style={styles.cleanShareBtn}
                activeOpacity={0.7}
                onPress={() =>
                  handleShare(
                    'رب أسألك توبة تجب ما قبلها من الذنوب وتصلح ما بعدها من الأعمال.'
                  )
                }
              >
                <Ionicons name="share-outline" size={17} color="#86efac" />
              </TouchableOpacity>

              {/* Center: Dua Text */}
              <View style={styles.cardCenterCol}>
                <Text style={styles.duaTextInline}>
                  رب أسألك توبة تجب ما قبلها من الذنوب وتصلح ما بعدها من الأعمال.
                </Text>
              </View>

              {/* Right: Ribbon Badge */}
              <InspirationRibbonBadge type="dua" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================= Modal: New Quran Seal (ختمة جديدة) ================= */}
      <Modal
        visible={showNewSealModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewSealModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowNewSealModal(false)}
              >
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>بدء ختمة جديدة</Text>
                <Image
                  source={require('@/assets/images/quran-calligraphy.png')}
                  style={styles.modalTitleIcon}
                  resizeMode="cover"
                />
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Field 1: Khatmah Name */}
              <Text style={styles.modalFieldLabel}>اسم الختمة</Text>
              <TextInput
                style={styles.modalInput}
                value={newSealName}
                onChangeText={setNewSealName}
                placeholder="مثال: ختمة رجب المبارك"
                placeholderTextColor="#64748b"
                textAlign="right"
              />

              {/* Field 2: Target Duration */}
              <Text style={styles.modalFieldLabel}>مدة الختمة المحددة</Text>
              <View style={styles.durationChipsRow}>
                {SEAL_DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d.days}
                    style={[
                      styles.durationChip,
                      selectedDuration === d.days && styles.durationChipActive,
                    ]}
                    onPress={() => setSelectedDuration(d.days)}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        selectedDuration === d.days && styles.durationChipTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                    <Text
                      style={[
                        styles.durationChipSub,
                        selectedDuration === d.days && styles.durationChipSubActive,
                      ]}
                    >
                      {d.sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Field 3: Starting Point Info */}
              <View style={styles.startingPointBox}>
                <View style={styles.startingPointTextCol}>
                  <Text style={styles.startingPointTitle}>نقطة البداية</Text>
                  <Text style={styles.startingPointSub}>من أول سورة الفاتحة (الصفحة 1)</Text>
                </View>
                <View style={styles.startingPointIconCircle}>
                  <Ionicons name="book-outline" size={18} color="#34d399" />
                </View>
              </View>

              {/* Field 4: Daily Reminder Toggle */}
              <View style={styles.reminderRow}>
                <TouchableOpacity
                  style={[styles.checkboxCircle, reminderEnabled && styles.checkboxCircleActive]}
                  onPress={() => setReminderEnabled(!reminderEnabled)}
                >
                  {reminderEnabled && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                </TouchableOpacity>
                <View style={styles.reminderTextCol}>
                  <Text style={styles.reminderTitle}>تفعيل التذكير اليومي للورد</Text>
                  <Text style={styles.reminderSub}>تنبيهك يومياً لمتابعة ورد الختمة</Text>
                </View>
                <Ionicons name="notifications-outline" size={20} color="#34d399" />
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                activeOpacity={0.85}
                onPress={handleStartNewSeal}
              >
                <Text style={styles.modalPrimaryBtnText}>ابدأ الختمة الآن</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowNewSealModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Website dark slate navy (slate-900)
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 105,
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
    width: 160,
    backgroundColor: '#1e293b',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  calendarDayTitle: {
    fontFamily: 'Rakkas_400Regular',
    fontSize: 36,
    lineHeight: 46,
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
    paddingHorizontal: 2,
  },
  calendarCol: {
    alignItems: 'center',
    flex: 1,
  },
  calendarColLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#8ba7c0',
    marginBottom: 2,
  },
  calendarColNumber: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 22,
    color: '#f8fafc',
  },
  calendarColYear: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
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
    gap: 8,
    marginBottom: 10,
  },
  greetingTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 23,
    color: '#f8fafc',
    textAlign: 'right',
  },
  rosaryIcon: {
    fontSize: 20,
  },
  actionPillButton: {
    backgroundColor: '#1e293b',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 13,
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
    fontSize: 15.5,
    color: '#ffffff',
  },
  prayerCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limeBadge: {
    backgroundColor: '#65a30d',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limeBadgeText: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 12,
    color: '#ffffff',
  },
  prayerLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayerLabelText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#94a3b8',
  },
  mosqueIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
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
    gap: 10,
  },
  prayerCardNormal: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  prayerCardName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#8ba7c0',
    marginTop: 6,
  },
  prayerCardTime: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#f8fafc',
    marginTop: 2,
  },
  prayerIconImg: {
    width: 24,
    height: 24,
  },

  /* Wide Highlighted Card (Mint green) */
  prayerCardHighlight: {
    flex: 2,
    backgroundColor: '#cbf4dc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 142, 93, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  highlightCountdownCol: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  countdownNotice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#065f46',
    marginBottom: 4,
  },
  countdownDigits: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 19,
    color: '#065f46',
    letterSpacing: 0.5,
  },
  highlightInfoCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  highlightNameText: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 14,
    color: '#065f46',
    marginTop: 2,
  },
  highlightTimeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#065f46',
    marginTop: 1,
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
  quickAppItem: {
    alignItems: 'center',
    flex: 1,
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

  /* 5. Quran Seal / Khatmah Carousel Section */
  sealCarouselWrapper: {
    marginTop: 8,
    marginBottom: 8,
  },
  sealScrollContent: {
    paddingHorizontal: 0,
    gap: 12,
  },
  sealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sealBadgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(74, 107, 140, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealBadgeImg: {
    width: 48,
    height: 48,
  },
  sealTextCol: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 14,
    marginLeft: 10,
  },
  sealMainTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14.5,
    color: '#f8fafc',
    textAlign: 'right',
  },
  sealSubTitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 2,
    marginBottom: 6,
  },
  sealProgressTrack: {
    width: '100%',
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    flexDirection: 'row-reverse',
  },
  sealProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#0f8e5d',
  },
  sealChevron: {
    marginLeft: 2,
  },
  sealPlusBox: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealTextColCenter: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 16,
  },
  sealMainTitleCenter: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15.5,
    color: '#f8fafc',
    textAlign: 'right',
  },
  sealPaginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  sealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#334155',
  },
  sealDotActive: {
    width: 18,
    backgroundColor: '#0f8e5d',
  },

  /* Modal: New Quran Seal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 18,
    color: '#f8fafc',
  },
  modalTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFieldLabel: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#f8fafc',
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
  },
  durationChipsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  durationChipActive: {
    borderColor: '#0f8e5d',
    backgroundColor: 'rgba(15, 142, 93, 0.2)',
  },
  durationChipText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#8ba7c0',
  },
  durationChipTextActive: {
    color: '#4ade80',
  },
  durationChipSub: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  durationChipSubActive: {
    color: '#86efac',
  },
  startingPointBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginTop: 14,
  },
  startingPointTextCol: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  startingPointTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#f8fafc',
  },
  startingPointSub: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#8ba7c0',
    marginTop: 2,
  },
  startingPointIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 142, 93, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(15, 142, 93, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginTop: 12,
    marginBottom: 20,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleActive: {
    backgroundColor: '#0f8e5d',
    borderColor: '#0f8e5d',
  },
  reminderTextCol: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
    marginLeft: 8,
  },
  reminderTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#f8fafc',
  },
  reminderSub: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#8ba7c0',
    marginTop: 2,
  },
  modalPrimaryBtn: {
    backgroundColor: '#4a6b8c',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#4a6b8c',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  modalPrimaryBtnText: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 15,
    color: '#ffffff',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#8ba7c0',
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
