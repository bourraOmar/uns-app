import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export interface NotificationSettings {
  morningAdhkar: boolean;
  morningHour: number;
  morningMinute: number;
  eveningAdhkar: boolean;
  eveningHour: number;
  eveningMinute: number;
  prayerTimes: boolean;
  dailyQuran: boolean;
  dailyQuranHour: number;
  dailyQuranMinute: number;
  fridayKahf: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  morningAdhkar: true,
  morningHour: 7,
  morningMinute: 0,
  eveningAdhkar: true,
  eveningHour: 17,
  eveningMinute: 30,
  prayerTimes: true,
  dailyQuran: true,
  dailyQuranHour: 21,
  dailyQuranMinute: 0,
  fridayKahf: true,
};

const STORAGE_SETTINGS_KEY = '@uns_notification_settings_v1';

class NotificationService {
  private isInitialized = false;

  /**
   * Initialize notification channels (Android) and setup listeners
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.createChannels();
      this.isInitialized = true;

      // Reschedule active notifications in background
      this.scheduleAll();
    } catch (err) {
      console.warn('Failed to initialize NotificationService:', err);
    }
  }

  /**
   * Create Android Notification Channels with high priority
   */
  public async createChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
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
        description: 'تنبيهات دخول أوقات الصلوات الخمس',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#10b981',
        sound: 'default',
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
      return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
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
      await this.createChannels();
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
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
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
        activeSettings.dailyQuranHour,
        activeSettings.dailyQuranMinute
      );
    }

    // 4. Friday Surah Al-Kahf
    if (activeSettings.fridayKahf) {
      await this.scheduleFridayKahf();
    }

    // 5. Daily Prayer Times Reminders
    if (activeSettings.prayerTimes) {
      await this.schedulePrayerTimes();
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
          weekday: 6, // 6 = Friday in expo-notifications (1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat)
          hour: 10,
          minute: 0,
        },
      });
    } catch (err) {
      console.warn('Failed to schedule Friday Kahf reminder:', err);
    }
  }

  /**
   * Schedule Prayer Times for today and upcoming hours
   */
  private async schedulePrayerTimes(): Promise<void> {
    try {
      const loc = await getUserLocation();
      const today = new Date();
      const times = await getPrayerTimesForDate(today, loc);

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
              sound: 'default',
              color: '#10b981',
              data: { type: 'prayer', prayerId: key, route: '/(tabs)/qibla' },
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
            sound: 'default',
            color: '#10b981',
            data: { type: 'prayer', prayerId: key, route: '/(tabs)/qibla' },
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
   * Send an immediate test notification to verify device receipt
   */
  public async sendTestNotification(): Promise<boolean> {
    try {
      const granted = await this.requestPermissions();
      if (!granted) return false;

      const title = 'تطبيق أُنس يعمل بنجاح 🌿';
      const body = 'تم ضبط نظام التنبيهات بنجاح! ستصلك أذكار الصباح والمساء ومواقيت الصلاة في مواعيدها المباركة بإذن الله.';

      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
        new Notification(title, {
          body,
          icon: '/favicon.png',
        });
        return true;
      }

      await this.createChannels();

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          color: '#10b981',
          data: { test: true },
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
