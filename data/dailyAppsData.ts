export interface DailyAppItem {
  id: string;
  title: string;
  subTitle?: string;
  category: 'main' | 'other';
  iconType: 'ionicons' | 'material' | 'fontAwesome' | 'custom';
  iconName?: string;
  customIcon?: any;
  bgColor: string;
  iconColor: string;
  route: string | { pathname: string; params?: Record<string, string> };
}

const ICONS = {
  adan: require('@/assets/icons/app_adan.png'),
  afterPrayer: require('@/assets/icons/app_after_prayer.png'),
  prayerAdhkar: require('@/assets/icons/app_prayer_adhkar.png'),
  ruqyah: require('@/assets/icons/app_ruqyah.png'),
  hajjDua: require('@/assets/icons/app_hajj_dua.png'),
  ramadan: require('@/assets/icons/app_ramadan.png'),
  tasbih: require('@/assets/icons/app_tasbih.png'),
  qibla: require('@/assets/icons/app_qibla.png'),
  tv: require('@/assets/icons/app_tv.png'),
};

export const ALL_DAILY_APPS: DailyAppItem[] = [
  // ================= 1. أهم التطبيقات (Main Apps) =================
  {
    id: 'salat_times',
    title: 'المواقيت',
    category: 'main',
    iconType: 'custom',
    customIcon: ICONS.adan,
    bgColor: '#3f523c',
    iconColor: '#a7f3d0',
    route: '/(tabs)',
  },
  {
    id: 'qibla',
    title: 'اتجاه القبلة',
    category: 'main',
    iconType: 'custom',
    customIcon: ICONS.qibla,
    bgColor: '#4a3854',
    iconColor: '#e9d5ff',
    route: '/(tabs)/qibla',
  },
  {
    id: 'tasbih',
    title: 'المسبحة',
    category: 'main',
    iconType: 'custom',
    customIcon: ICONS.tasbih,
    bgColor: '#4a4832',
    iconColor: '#fef08a',
    route: '/tasbih',
  },
  {
    id: 'islamic_events',
    title: 'المناسبات الإسلامية',
    category: 'main',
    iconType: 'ionicons',
    iconName: 'calendar-outline',
    bgColor: '#324a48',
    iconColor: '#a5f3fc',
    route: '/duas',
  },
  {
    id: 'morning_adhkar',
    title: 'أذكار الصباح',
    category: 'main',
    iconType: 'ionicons',
    iconName: 'sunny-outline',
    bgColor: '#523838',
    iconColor: '#fed7aa',
    route: '/dhikr/morning',
  },
  {
    id: 'evening_adhkar',
    title: 'أذكار المساء',
    category: 'main',
    iconType: 'ionicons',
    iconName: 'moon-outline',
    bgColor: '#373c4f',
    iconColor: '#bfdbfe',
    route: '/dhikr/evening',
  },
  {
    id: 'prayer_adhkar',
    title: 'أذكار الصلاة',
    category: 'main',
    iconType: 'custom',
    customIcon: ICONS.prayerAdhkar,
    bgColor: '#4d4a32',
    iconColor: '#fde68a',
    route: '/dhikr/prayer',
  },
  {
    id: 'after_prayer_adhkar',
    title: 'أذكار بعد الصلاة',
    category: 'main',
    iconType: 'custom',
    customIcon: ICONS.afterPrayer,
    bgColor: '#364f3c',
    iconColor: '#bbf7d0',
    route: '/dhikr/after_prayer',
  },
  {
    id: 'radio_quran',
    title: 'اذاعة القرآن الكريم',
    category: 'main',
    iconType: 'ionicons',
    iconName: 'radio-outline',
    bgColor: '#304b4c',
    iconColor: '#99f6e4',
    route: '/(tabs)/reciters',
  },
  {
    id: 'live_quran',
    title: 'البث المباشر للقرآن الكريم',
    subTitle: 'للقرآن الكريم',
    category: 'main',
    iconType: 'custom',
    customIcon: ICONS.tv,
    bgColor: '#52353a',
    iconColor: '#fbcfe8',
    route: '/(tabs)/reciters',
  },

  // ================= 2. تطبيقات أخرى (Other Apps) =================
  {
    id: 'sleep_adhkar',
    title: 'أذكار النوم',
    category: 'other',
    iconType: 'material',
    iconName: 'weather-night',
    bgColor: '#363d4e',
    iconColor: '#bae6fd',
    route: '/dhikr/sleep',
  },
  {
    id: 'wake_up_adhkar',
    title: 'أذكار الاستيقاظ',
    category: 'other',
    iconType: 'ionicons',
    iconName: 'sunny',
    bgColor: '#324749',
    iconColor: '#a5f3fc',
    route: '/dhikr/wake_up',
  },
  {
    id: 'quranic_duas',
    title: 'أدعية من القرآن',
    category: 'other',
    iconType: 'fontAwesome',
    iconName: 'book-open',
    bgColor: '#2c4754',
    iconColor: '#bae6fd',
    route: '/duas',
  },
  {
    id: 'prophets_duas',
    title: 'أدعية النبي',
    category: 'other',
    iconType: 'material',
    iconName: 'hands-pray',
    bgColor: '#523644',
    iconColor: '#fbcfe8',
    route: '/duas',
  },
  {
    id: 'ruqyah',
    title: 'الرقية الشرعية',
    category: 'other',
    iconType: 'custom',
    customIcon: ICONS.ruqyah,
    bgColor: '#4a3852',
    iconColor: '#e9d5ff',
    route: '/dhikr/ruqyah',
  },
  {
    id: 'hajj_duas',
    title: 'أدعية الحج والعمرة',
    category: 'other',
    iconType: 'custom',
    customIcon: ICONS.hajjDua,
    bgColor: '#324a3a',
    iconColor: '#bbf7d0',
    route: '/dhikr/hajj',
  },
  {
    id: 'ramadan_sunan',
    title: 'سنن رمضان والعيدين',
    category: 'other',
    iconType: 'custom',
    customIcon: ICONS.ramadan,
    bgColor: '#4d4933',
    iconColor: '#fef08a',
    route: '/dhikr/ramadan',
  },
  {
    id: 'hajj_deeds',
    title: 'أعمال الحج',
    category: 'other',
    iconType: 'custom',
    customIcon: ICONS.hajjDua,
    bgColor: '#3d4734',
    iconColor: '#bbf7d0',
    route: '/dhikr/hajj',
  },
];

// Default 4 daily apps matching current home screen
export const DEFAULT_DAILY_APP_IDS: string[] = [
  'tasbih',
  'qibla',
  'after_prayer_adhkar',
  'live_quran',
];
