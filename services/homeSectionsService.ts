import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HomeSectionItem {
  id:
    | 'prayer_times'
    | 'daily_apps'
    | 'continue_khatmah'
    | 'recent_activities'
    | 'ayah_of_day'
    | 'hadith_of_day'
    | 'dua_of_day'
    | 'banners';
  title: string;
  enabled: boolean;
}

export const DEFAULT_HOME_SECTIONS: HomeSectionItem[] = [
  { id: 'prayer_times', title: 'أوقات الصلاة', enabled: true },
  { id: 'daily_apps', title: 'اختصارات', enabled: true },
  { id: 'continue_khatmah', title: 'متابعة قراءة الختمة', enabled: true },
  { id: 'recent_activities', title: 'أنشطتك الأخيرة', enabled: true },
  { id: 'ayah_of_day', title: 'آية اليوم', enabled: true },
  { id: 'hadith_of_day', title: 'حديث اليوم', enabled: true },
  { id: 'dua_of_day', title: 'دعاء اليوم', enabled: true },
  { id: 'banners', title: 'اللافتات', enabled: false }, // Matches reference screenshot
];

const STORAGE_HOME_SECTIONS_KEY = '@uns_home_sections_v2';

export async function getHomeSections(): Promise<HomeSectionItem[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_HOME_SECTIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate and merge with defaults to ensure all sections exist
        const knownIds = new Set(DEFAULT_HOME_SECTIONS.map((s) => s.id));
        const validList: HomeSectionItem[] = [];

        parsed.forEach((item: any) => {
          if (item && knownIds.has(item.id)) {
            const def = DEFAULT_HOME_SECTIONS.find((d) => d.id === item.id);
            validList.push({
              id: item.id,
              title: def ? def.title : item.title,
              enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
            });
            knownIds.delete(item.id);
          }
        });

        // Add any missing default sections to the end
        DEFAULT_HOME_SECTIONS.forEach((def) => {
          if (knownIds.has(def.id)) {
            validList.push(def);
          }
        });

        return validList;
      }
    }
  } catch {}
  return DEFAULT_HOME_SECTIONS;
}

export async function saveHomeSections(sections: HomeSectionItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_HOME_SECTIONS_KEY, JSON.stringify(sections));
  } catch {}
}

export async function resetHomeSections(): Promise<HomeSectionItem[]> {
  try {
    await AsyncStorage.setItem(
      STORAGE_HOME_SECTIONS_KEY,
      JSON.stringify(DEFAULT_HOME_SECTIONS)
    );
  } catch {}
  return DEFAULT_HOME_SECTIONS;
}
