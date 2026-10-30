import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { getPrayerTimesForDate, getUserLocation } from './prayerTimesService';

// Configure foreground notification presentation handler at module load
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface AdhanOption {
  id: string;
  name: string;
  subtitle: string;
  soundFileName: string;
  localSource: any;
  remoteUrl: string;
}

export const ADHAN_OPTIONS: AdhanOption[] = [
  {
    id: 'makkah',
    name: 'أذان الحرم المكي الشريف',
    subtitle: 'الشيخ علي بن أحمد ملا',
    soundFileName: 'adhan_makkah.mp3',
    localSource: require('@/assets/sounds/adhan_makkah.mp3'),
    remoteUrl:
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/master/Ali_Ibn_Ahmad_Mala_1_-_Al_Haram_Al_Maki_(%D8%B9%D9%84%D9%8A_%D8%A8%D9%86_%D8%A3%D8%AD%D9%85%D8%AF_%D9%85%D9%84%D8%A7_-_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D9%83%D9%8A).mp3',
  },
  {
    id: 'madinah',
    name: 'أذان المسجد النبوي الشريف',
    subtitle: 'المدينة المنورة',
    soundFileName: 'adhan_madinah.mp3',
    localSource: require('@/assets/sounds/adhan_madinah.mp3'),
    remoteUrl:
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/master/Adhan_Al_Haram_Al_Madani_-_Al_Madinah_1_(%D8%A3%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D8%AF%D9%86%D9%8A_-_%D8%A7%D9%84%D9%85%D8%AF%D9%8A%D9%86%D8%A9_%D8%A7%D9%84%D9%85%D9%86%D9%88%D8%B1%D8%A9).mp3',
  },
  {
    id: 'alaqsa',
    name: 'أذان المسجد الأقصى المبارك',
    subtitle: 'القدس الشريف',
    soundFileName: 'adhan_alaqsa.mp3',
    localSource: require('@/assets/sounds/adhan_alaqsa.mp3'),
    remoteUrl:
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/master/Adhan_Al_Aqsa_-_Jerusalem_(%D8%A3%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D9%85%D8%B3%D8%AC%D8%AF_%D8%A7%D9%84%D8%A3%D9%82%D8%B5%D9%89_-_%D8%A7%D9%84%D9%82%D8%AF%D8%B3).mp3',
  },
  {
    id: 'alafasy',
    name: 'أذان الشيخ مشاري راشد العفاسي',
    subtitle: 'الكويت',
    soundFileName: 'adhan_alafasy.mp3',
    localSource: require('@/assets/sounds/adhan_alafasy.mp3'),
    remoteUrl:
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/master/Mishary_Al_Afasy_-_HQ_(%D9%85%D8%B4%D8%A7%D8%B1%D9%8A_%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A).mp3',
  },
  {
    id: 'qatami',
    name: 'أذان ناصر القطامي',
    subtitle: 'الرياض، المملكة العربية السعودية',
    soundFileName: 'adhan_alafasy.mp3',
    localSource: require('@/assets/sounds/adhan_alafasy.mp3'),
    remoteUrl:
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/master/Mishary_Al_Afasy_-_HQ_(%D9%85%D8%B4%D8%A7%D8%B1%D9%8A_%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A).mp3',
  },
  {
    id: 'takbeer',
    name: 'تكبيرات فقط (تنبيه مختصر)',
    subtitle: 'الله أكبر الله أكبر',
    soundFileName: 'adhan_makkah.mp3',
    localSource: require('@/assets/sounds/adhan_makkah.mp3'),
    remoteUrl:
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/master/Ali_Ibn_Ahmad_Mala_1_-_Al_Haram_Al_Maki_(%D8%B9%D9%84%D9%8A_%D8%A8%D9%86_%D8%A3%D8%AD%D9%85%D8%AF_%D9%85%D9%84%D8%A7_-_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D9%83%D9%8A).mp3',
  },
];

export interface NotificationSettings {
  // Prayer alerts
  prayerTimes: boolean;
  selectedAdhanId: string;
  prayerAdhans: {
    Fajr: string;
    Jumuah: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  };

  // Adhkar alerts
  morningAdhkar: boolean;
  morningHour: number;
  morningMinute: number;
  eveningAdhkar: boolean;
  eveningHour: number;
  eveningMinute: number;
  sleepAdhkar: boolean;
  sleepHour: number;
  sleepMinute: number;
  lastTenDaysDua: boolean;
  lastTenDaysHour: number;
  lastTenDaysMinute: number;

  // Acts of worship alerts
  prophetPrayer: boolean;
  fastingMondayThursday: boolean;
  fastingOffsetDays: number; // 1 = قبل يوم
  kahfReminder: boolean;
  kahfHour: number;
  kahfMinute: number;
  duhaPrayer: boolean;
  duhaHour: number;
  duhaMinute: number;
  witrPrayer: boolean;
  witrHour: number;
  witrMinute: number;
  fridayLastHour: boolean;
  fridayLastHourTime: string;
  charityReminder: boolean;
  whiteDaysFasting: boolean;
  whiteDaysOffsetDays: number; // 1 = قبل يوم

  // Tasbih counter settings
  tasbihSound: boolean;
  tasbihHaptics: boolean;
  tasbihSaveLastCount: boolean;

  // Legacy compatibility
  dailyQuran?: boolean;
  dailyQuranHour?: number;
  dailyQuranMinute?: number;
  fridayKahf?: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  // Prayer alerts
  prayerTimes: true,
  selectedAdhanId: 'qatami',
  prayerAdhans: {
    Fajr: 'qatami',
    Jumuah: 'qatami',
    Asr: 'qatami',
    Maghrib: 'qatami',
    Isha: 'qatami',
  },

  // Adhkar alerts (matching screenshot states)
  morningAdhkar: true,
  morningHour: 5,
  morningMinute: 40,
  eveningAdhkar: true,
  eveningHour: 16,
  eveningMinute: 18,
  sleepAdhkar: false,
  sleepHour: 23,
  sleepMinute: 0,
  lastTenDaysDua: false,
  lastTenDaysHour: 2,
  lastTenDaysMinute: 0,

  // Acts of worship alerts (matching screenshot states)
  prophetPrayer: false,
  fastingMondayThursday: false,
  fastingOffsetDays: 1,
  kahfReminder: true,
  kahfHour: 11,
  kahfMinute: 0,
  duhaPrayer: false,
  duhaHour: 9,
  duhaMinute: 0,
  witrPrayer: false,
  witrHour: 22,
  witrMinute: 0,
  fridayLastHour: true,
  fridayLastHourTime: '4:49 م',
  charityReminder: true,
  whiteDaysFasting: false,
  whiteDaysOffsetDays: 1,

  // Tasbih counter settings (matching screenshot states)
  tasbihSound: false,
  tasbihHaptics: true,
  tasbihSaveLastCount: true,

  // Legacy
  dailyQuran: true,
  dailyQuranHour: 21,
  dailyQuranMinute: 0,
  fridayKahf: true,
};

const STORAGE_SETTINGS_KEY = '@uns_notification_settings_v1';

class NotificationService {
  private isInitialized = false;
  private previewPlayer: AudioPlayer | null = null;
  private currentPreviewId: string | null = null;
  private previewListeners: Set<() => void> = new Set();

  /**
   * Initialize notification channels (Android) and setup listeners
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const settings = await this.getSettings();
      await this.createChannels(settings.selectedAdhanId);
      this.isInitialized = true;

      // Reschedule active notifications in background
      this.scheduleAll(settings);
    } catch (err) {
      console.warn('Failed to initialize NotificationService:', err);
    }
  }

  /**
   * Create Android Notification Channels with high priority and selected Adhan sound
   */
  public async createChannels(selectedAdhanId: string = 'makkah'): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const adhanOpt =
        ADHAN_OPTIONS.find((a) => a.id === selectedAdhanId) || ADHAN_OPTIONS[0];

      await Notifications.setNotificationChannelAsync('default', {
        name: 'إشعارات أُنس العامة',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('prayers', {
        name: 'مواقيت الصلاة والأذان',
        description: `تنبيهات دخول أوقات الصلوات بصوت الأذان (${adhanOpt.name})`,
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#10b981',
        sound: adhanOpt.soundFileName,
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('adhkar', {
        name: 'أذكار الصباح والمساء',
        description: 'تذكير أذكار الصباح والمساء اليومية',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('quran', {
        name: 'ورد القرآن الكريم',
        description: 'تذكير القراءة اليومية وسورة الكهف',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
        enableVibrate: true,
      });
    } catch (err) {
      console.warn('Error creating notification channels:', err);
    }
  }

  /**
   * Check if notifications permissions are granted
   */
  public async checkPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      );
    }
    try {
      const settings = await Notifications.getPermissionsAsync();
      return (
        settings.granted ||
        settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
        settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
      );
    } catch {
      return false;
    }
  }

  /**
   * Request notification permissions from user
   */
  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') return true;
        const res = await Notification.requestPermission();
        return res === 'granted';
      }
      return false;
    }

    try {
      const settings = await this.getSettings();
      await this.createChannels(settings.selectedAdhanId);
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      const granted = status === 'granted';
      if (!granted) {
        Alert.alert(
          'تفعيل التنبيهات',
          'يرجى السماح للتطبيق بإرسال الإشعارات من إعدادات الهاتف لتصلك مواقيت الصلاة والأذكار في وقتها المبارك.',
          [{ text: 'حسناً', style: 'default' }]
        );
      }
      return granted;
    } catch (err) {
      console.warn('Error requesting notification permissions:', err);
      return false;
    }
  }

  /**
   * Load saved settings or defaults
   */
  public async getSettings(): Promise<NotificationSettings> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...parsed,
          prayerAdhans: {
            ...DEFAULT_NOTIFICATION_SETTINGS.prayerAdhans,
            ...(parsed.prayerAdhans || {}),
          },
        };
      }
    } catch {}
    return DEFAULT_NOTIFICATION_SETTINGS;
  }

  /**
   * Update notification settings and reschedule
   */
  public async updateSettings(
    newSettings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    try {
      await AsyncStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
    } catch {}

    // Update channels with newly selected adhan if changed
    if (newSettings.selectedAdhanId) {
      await this.createChannels(newSettings.selectedAdhanId);
    }

    // Reschedule everything with the updated settings
    await this.scheduleAll(updated);
    return updated;
  }

  /**
   * Clear all scheduled notifications
   */
  public async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (err) {
      console.warn('Failed to cancel notifications:', err);
    }
  }

  /**
   * Reschedule all active notifications based on settings
   */
  public async scheduleAll(settings?: NotificationSettings): Promise<void> {
    const activeSettings = settings || (await this.getSettings());
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) return;

    // Clear prior scheduled notifications to prevent duplicates
    await this.cancelAll();

    // 1. Morning Adhkar
    if (activeSettings.morningAdhkar) {
      await this.scheduleMorningAdhkar(
        activeSettings.morningHour,
        activeSettings.morningMinute
      );
    }

    // 2. Evening Adhkar
    if (activeSettings.eveningAdhkar) {
      await this.scheduleEveningAdhkar(
        activeSettings.eveningHour,
        activeSettings.eveningMinute
      );
    }

    // 3. Daily Quran Reading Reminder
    if (activeSettings.dailyQuran) {
      await this.scheduleDailyQuran(
        activeSettings.dailyQuranHour ?? 21,
        activeSettings.dailyQuranMinute ?? 0
      );
    }

    // 4. Friday Surah Al-Kahf
    if (activeSettings.fridayKahf) {
      await this.scheduleFridayKahf();
    }

    // 5. Daily Prayer Times Reminders with Selected Adhan
    if (activeSettings.prayerTimes) {
      await this.schedulePrayerTimes(activeSettings.selectedAdhanId);
    }
  }

  /**
   * Schedule Daily Morning Adhkar (Default 07:00 AM)
   */
  private async scheduleMorningAdhkar(hour: number, minute: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'أذكار الصباح 🌿',
          body: 'أصبحنا وأصبح الملك لله.. ابدأ يومك بذكر الله وحصّن نفسك وأهلك بأذكار الصباح.',
          sound: 'default',
          color: '#10b981',
          data: { type: 'adhkar_morning', route: '/(tabs)/' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: 'adhkar',
          hour,
          minute,
        },
      });
    } catch (err) {
      console.warn('Failed to schedule morning adhkar:', err);
    }
  }

  /**
   * Schedule Daily Evening Adhkar (Default 05:30 PM)
   */
  private async scheduleEveningAdhkar(hour: number, minute: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'أذكار المساء 🌙',
          body: 'أمسينا وأمسى الملك لله.. أقبل المساء بحمد الله، رطّب لسانك الآن بأذكار المساء.',
          sound: 'default',
          color: '#10b981',
          data: { type: 'adhkar_evening', route: '/(tabs)/' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: 'adhkar',
          hour,
          minute,
        },
      });
    } catch (err) {
      console.warn('Failed to schedule evening adhkar:', err);
    }
  }

  /**
   * Schedule Daily Quran Reading Reminder (Default 09:00 PM)
   */
  private async scheduleDailyQuran(hour: number, minute: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'ورد القرآن الكريم 📖',
          body: 'دقائق معدودة مع كتاب الله تنير دربك وتملأ ليلتك سكينة وبركة.. لا تهجر مصحفك.',
          sound: 'default',
          color: '#10b981',
          data: { type: 'quran_daily', route: '/(tabs)/quran' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: 'quran',
          hour,
          minute,
        },
      });
    } catch (err) {
      console.warn('Failed to schedule daily quran reminder:', err);
    }
  }

  /**
   * Schedule Friday Al-Kahf Reminder (Every Friday at 10:00 AM)
   */
  private async scheduleFridayKahf(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'سورة الكهف نورٌ بين الجمعتين 🕊️',
          body: 'جمعة مباركة.. اغتنم بركة هذا اليوم العظيم بقراءة سورة الكهف والإكثار من الصلاة على الحبيب ﷺ.',
          sound: 'default',
          color: '#10b981',
          data: { type: 'friday_kahf', route: '/surah/18' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: 'quran',
          weekday: 6, // 6 = Friday in expo-notifications
          hour: 10,
          minute: 0,
        },
      });
    } catch (err) {
      console.warn('Failed to schedule Friday Kahf reminder:', err);
    }
  }

  /**
   * Schedule Prayer Times for today and upcoming hours with chosen Adhan sound
   */
  private async schedulePrayerTimes(selectedAdhanId: string = 'makkah'): Promise<void> {
    try {
      const loc = await getUserLocation();
      const today = new Date();
      const times = await getPrayerTimesForDate(today, loc);

      const adhanOpt =
        ADHAN_OPTIONS.find((a) => a.id === selectedAdhanId) || ADHAN_OPTIONS[0];

      const PRAYER_NAMES_AR: Record<string, string> = {
        Fajr: 'صلاة الفجر',
        Dhuhr: 'صلاة الظهر',
        Asr: 'صلاة العصر',
        Maghrib: 'صلاة المغرب',
        Isha: 'صلاة العشاء',
      };

      const nowMs = Date.now();

      for (const [key, nameAr] of Object.entries(PRAYER_NAMES_AR)) {
        const timeStr = times[key];
        if (!timeStr) continue;

        const [hStr, mStr] = timeStr.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);

        if (isNaN(h) || isNaN(m)) continue;

        // Calculate Date for today
        const prayerDate = new Date();
        prayerDate.setHours(h, m, 0, 0);

        // If today's prayer time hasn't passed yet, schedule for today
        if (prayerDate.getTime() > nowMs + 10000) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `حان الآن موعد ${nameAr} 🕌`,
              body: `حيّ على الصلاة، حيّ على الفلاح.. حان وقت ${nameAr} حسب التوقيت المحلي لـ ${loc.city}.`,
              sound: adhanOpt.soundFileName,
              color: '#10b981',
              data: {
                type: 'prayer',
                prayerId: key,
                adhanId: selectedAdhanId,
                route: '/(tabs)/qibla',
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              channelId: 'prayers',
              date: prayerDate,
            },
          });
        }

        // Also schedule daily recurring trigger for tomorrow and beyond
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `حان الآن موعد ${nameAr} 🕌`,
            body: `حيّ على الصلاة، حيّ على الفلاح.. حان وقت ${nameAr} المبارك.`,
            sound: adhanOpt.soundFileName,
            color: '#10b981',
            data: {
              type: 'prayer',
              prayerId: key,
              adhanId: selectedAdhanId,
              route: '/(tabs)/qibla',
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            channelId: 'prayers',
            hour: h,
            minute: m,
          },
        });
      }
    } catch (err) {
      console.warn('Failed to schedule prayer times:', err);
    }
  }

  /**
   * Preview/listen to an Adhan audio option in settings
   */
  public async previewAdhan(adhanId: string): Promise<void> {
    if (this.currentPreviewId === adhanId && this.previewPlayer) {
      // Toggle off if already playing
      this.stopPreview();
      return;
    }

    this.stopPreview();

    const adhan = ADHAN_OPTIONS.find((a) => a.id === adhanId);
    if (!adhan) return;

    try {
      this.currentPreviewId = adhanId;
      this.notifyPreviewListeners();

      const source =
        Platform.OS === 'web' ? { uri: adhan.remoteUrl } : adhan.localSource;

      const player = createAudioPlayer(source);
      this.previewPlayer = player;

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          this.stopPreview();
        }
      });

      player.play();
    } catch (err) {
      console.warn(`Failed to play adhan preview for [${adhanId}]:`, err);
      this.stopPreview();
    }
  }

  /**
   * Stop playing adhan preview
   */
  public stopPreview(): void {
    if (this.previewPlayer) {
      try {
        this.previewPlayer.pause();
        this.previewPlayer.remove();
      } catch {}
      this.previewPlayer = null;
    }
    this.currentPreviewId = null;
    this.notifyPreviewListeners();
  }

  public getCurrentPreviewId(): string | null {
    return this.currentPreviewId;
  }

  public subscribePreview(listener: () => void): () => void {
    this.previewListeners.add(listener);
    return () => {
      this.previewListeners.delete(listener);
    };
  }

  private notifyPreviewListeners(): void {
    this.previewListeners.forEach((l) => l());
  }

  /**
   * Play Adhan audio directly (e.g. when prayer time arrives or in test)
   */
  public async playSelectedAdhan(selectedAdhanId?: string): Promise<void> {
    const settings = await this.getSettings();
    const adhanId = selectedAdhanId || settings.selectedAdhanId;
    await this.previewAdhan(adhanId);
  }

  /**
   * Send an immediate test notification with the chosen Adhan audio
   */
  public async sendTestNotification(): Promise<boolean> {
    try {
      const granted = await this.requestPermissions();
      if (!granted) return false;

      const settings = await this.getSettings();
      const adhanOpt =
        ADHAN_OPTIONS.find((a) => a.id === settings.selectedAdhanId) ||
        ADHAN_OPTIONS[0];

      const title = 'حان الآن موعد الأذان 🕌';
      const body = `حيّ على الصلاة، حيّ على الفلاح.. (${adhanOpt.name} - ${adhanOpt.subtitle})`;

      // Start playing the adhan sound immediately for local preview
      this.playSelectedAdhan(settings.selectedAdhanId);

      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        'Notification' in window
      ) {
        new Notification(title, {
          body,
          icon: '/favicon.png',
        });
        return true;
      }

      await this.createChannels(settings.selectedAdhanId);

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: adhanOpt.soundFileName,
          color: '#10b981',
          data: { test: true, adhanId: settings.selectedAdhanId },
        },
        trigger: null, // triggers immediately
      });

      return true;
    } catch (err) {
      console.warn('Failed to send test notification:', err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
