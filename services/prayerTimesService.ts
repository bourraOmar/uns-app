import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface PrayerTime {
  id: 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'Midnight';
  name: string;
  time: string; // Formatted e.g. "5:17 ص"
  rawTime: string; // "05:17" (24h)
  timestamp: number; // Unix epoch ms for today
}

export interface PrayerTimesData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  dateStr: string;
  prayers: Record<string, PrayerTime>;
  upcomingPrayerId: string;
  remainingSeconds: number;
}

export interface CityLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const POPULAR_CITIES: CityLocation[] = [
  // المغرب
  { city: 'آسفي، المغرب', country: 'المغرب', latitude: 32.2994, longitude: -9.2372 },
  { city: 'الدار البيضاء، المغرب', country: 'المغرب', latitude: 33.5731, longitude: -7.5898 },
  { city: 'الرباط، المغرب', country: 'المغرب', latitude: 34.0209, longitude: -6.8416 },
  { city: 'مراكش، المغرب', country: 'المغرب', latitude: 31.6295, longitude: -7.9811 },
  { city: 'فاس، المغرب', country: 'المغرب', latitude: 34.0331, longitude: -5.0003 },
  { city: 'طنجة، المغرب', country: 'المغرب', latitude: 35.7595, longitude: -5.8340 },
  { city: 'أكادير، المغرب', country: 'المغرب', latitude: 30.4278, longitude: -9.5981 },
  { city: 'وجدة، المغرب', country: 'المغرب', latitude: 34.6867, longitude: -1.9114 },
  { city: 'مكناس، المغرب', country: 'المغرب', latitude: 33.8938, longitude: -5.5516 },
  { city: 'تطوان، المغرب', country: 'المغرب', latitude: 35.5785, longitude: -5.3684 },
  { city: 'العيون، المغرب', country: 'المغرب', latitude: 27.1253, longitude: -13.1625 },

  // السعودية
  { city: 'مكة المكرمة، السعودية', country: 'السعودية', latitude: 21.4225, longitude: 39.8262 },
  { city: 'المدينة المنورة، السعودية', country: 'السعودية', latitude: 24.4672, longitude: 39.6111 },
  { city: 'الرياض، السعودية', country: 'السعودية', latitude: 24.7136, longitude: 46.6753 },
  { city: 'جدة، السعودية', country: 'السعودية', latitude: 21.4858, longitude: 39.1925 },
  { city: 'الدمام، السعودية', country: 'السعودية', latitude: 26.4207, longitude: 50.0888 },

  // مصر
  { city: 'القاهرة، مصر', country: 'مصر', latitude: 30.0444, longitude: 31.2357 },
  { city: 'الإسكندرية، مصر', country: 'مصر', latitude: 31.2001, longitude: 29.9187 },

  // الإمارات
  { city: 'دبي، الإمارات', country: 'الإمارات', latitude: 25.2048, longitude: 55.2708 },
  { city: 'أبوظبي، الإمارات', country: 'الإمارات', latitude: 24.4539, longitude: 54.3773 },

  // عواصم ودول أخرى
  { city: 'القدس الشريف، فلسطين', country: 'فلسطين', latitude: 31.7683, longitude: 35.2137 },
  { city: 'الجزائر، الجزائر', country: 'الجزائر', latitude: 36.7538, longitude: 3.0588 },
  { city: 'تونس، تونس', country: 'تونس', latitude: 36.8065, longitude: 10.1815 },
  { city: 'إسطنبول، تركيا', country: 'تركيا', latitude: 41.0082, longitude: 28.9784 },
  { city: 'عمّان، الأردن', country: 'الأردن', latitude: 31.9454, longitude: 35.9284 },
  { city: 'الكويت، الكويت', country: 'الكويت', latitude: 29.3759, longitude: 47.9774 },
  { city: 'الدوحة، قطر', country: 'قطر', latitude: 25.2854, longitude: 51.5310 },
  { city: 'بغداد، العراق', country: 'العراق', latitude: 33.3152, longitude: 44.3661 },
  { city: 'مسقط، عُمان', country: 'عُمان', latitude: 23.5859, longitude: 58.4059 },
  { city: 'المنامة، البحرين', country: 'البحرين', latitude: 26.2285, longitude: 50.5860 },
];

const DEFAULT_COORDS: CityLocation = {
  city: 'آسفي، المغرب',
  country: 'المغرب',
  latitude: 32.2994,
  longitude: -9.2372,
};

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
  Midnight: 'منتصف الليل',
};

// Convert 24h string "HH:mm" to Arabic 12h formatted string "5:17 ص"
export function formatTo12HourArabic(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const isPM = h >= 12;
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;

  const mFormatted = m.toString().padStart(2, '0');
  const period = isPM ? 'م' : 'ص';
  return `${h}:${mFormatted} ${period}`;
}

// Format seconds into "HH:mm:ss"
export function formatSecondsToCountdown(seconds: number): string {
  if (seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Human readable Arabic duration, e.g. "ساعة و52 د" or "25 دقيقة"
export function formatRemainingArabicText(seconds: number): string {
  if (seconds <= 0) return 'حان وقت الأذان';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    if (hours === 1) return `ساعة و${minutes} د`;
    if (hours === 2) return `ساعتان و${minutes} د`;
    return `${hours} س و${minutes} د`;
  }
  if (hours > 0) {
    if (hours === 1) return '1 ساعة';
    if (hours === 2) return 'ساعتان';
    return `${hours} ساعات`;
  }
  if (minutes > 0) {
    return `${minutes} دقيقة`;
  }
  return `${seconds} ثوانٍ`;
}

/**
 * Standard astronomical prayer times calculation (pure math, 100% offline fallback)
 */
function calculateAstronomicalPrayerTimes(lat: number, lng: number, date: Date) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();

  // Julian date
  const a = Math.floor((14 - m) / 12);
  const y1 = y + 4800 - a;
  const m1 = m + 12 * a - 3;
  const JDate =
    d +
    Math.floor((153 * m1 + 2) / 5) +
    365 * y1 +
    Math.floor(y1 / 4) -
    Math.floor(y1 / 100) +
    Math.floor(y1 / 400) -
    32045;

  const D = JDate - 2451545.0;
  // Mean anomaly of the Sun
  const g = 357.529 + 0.98560028 * D;
  const q = 280.459 + 0.98564736 * D;
  // Geocentric apparent celestial longitude of the Sun
  const L = q + 1.915 * Math.sin((g * Math.PI) / 180) + 0.02 * Math.sin((2 * g * Math.PI) / 180);
  // Mean obliquity of the ecliptic
  const e = 23.439 - 0.00000036 * D;
  // Sun declination
  const decl =
    Math.asin(Math.sin((e * Math.PI) / 180) * Math.sin((L * Math.PI) / 180)) * (180 / Math.PI);
  // Equation of time
  const RA =
    Math.atan2(
      Math.cos((e * Math.PI) / 180) * Math.sin((L * Math.PI) / 180),
      Math.cos((L * Math.PI) / 180)
    ) *
    (180 / Math.PI);
  let RA_normalized = RA;
  while (RA_normalized < 0) RA_normalized += 360;
  while (RA_normalized >= 360) RA_normalized -= 360;
  const EqT = (q / 15 - RA_normalized / 15) * 60; // in minutes

  // Timezone offset in hours
  const timezone = -date.getTimezoneOffset() / 60;

  // Solar noon
  const noon = 12 + timezone - lng / 15 - EqT / 60;

  // Angles (Standard Egyptian / MWL)
  const fajrAngle = 18;
  const ishaAngle = 17;

  const latRad = (lat * Math.PI) / 180;
  const declRad = (decl * Math.PI) / 180;

  const hourAngle = (angle: number) => {
    const cosHA =
      (-Math.sin((angle * Math.PI) / 180) - Math.sin(latRad) * Math.sin(declRad)) /
      (Math.cos(latRad) * Math.cos(declRad));
    if (cosHA > 1 || cosHA < -1) return null;
    return Math.acos(cosHA) * (180 / Math.PI);
  };

  const sunriseHA = hourAngle(0.833) || 90;
  const fajrHA = hourAngle(fajrAngle) || 108;
  const ishaHA = hourAngle(ishaAngle) || 108;

  // Asr (Shafi'i/Hanbali/Maliki: shadow factor = 1)
  const asrAlt =
    Math.atan(1 / (1 + Math.tan(Math.abs(latRad - declRad)))) * (180 / Math.PI);
  const asrHA =
    Math.acos(
      (Math.sin((asrAlt * Math.PI) / 180) - Math.sin(latRad) * Math.sin(declRad)) /
        (Math.cos(latRad) * Math.cos(declRad))
    ) *
    (180 / Math.PI);

  const fajrDec = noon - fajrHA / 15;
  const sunriseDec = noon - sunriseHA / 15;
  const dhuhrDec = noon + 2 / 60; // 2 mins after solar zenith
  const asrDec = noon + asrHA / 15;
  const maghribDec = noon + sunriseHA / 15;
  const ishaDec = noon + ishaHA / 15;
  const midnightDec = maghribDec + (24 + fajrDec - maghribDec) / 2;

  const toHHMM = (dec: number) => {
    let dNorm = dec;
    while (dNorm < 0) dNorm += 24;
    while (dNorm >= 24) dNorm -= 24;
    const h = Math.floor(dNorm);
    const m = Math.floor((dNorm - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return {
    Fajr: toHHMM(fajrDec),
    Sunrise: toHHMM(sunriseDec),
    Dhuhr: toHHMM(dhuhrDec),
    Asr: toHHMM(asrDec),
    Maghrib: toHHMM(maghribDec),
    Isha: toHHMM(ishaDec),
    Midnight: toHHMM(midnightDec),
  };
}

/**
 * Fetch online prayer times or compute astronomical offline times
 */
export async function getPrayerTimesForDate(
  date: Date = new Date(),
  coords = DEFAULT_COORDS
): Promise<Record<string, string>> {
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const cacheKey = `@uns_prayer_times_${dateKey}_${coords.latitude.toFixed(2)}_${coords.longitude.toFixed(2)}`;

  // 1. Try Cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // 2. Try Aladhan API
  try {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=3`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const t = json?.data?.timings;
      if (t) {
        const result: Record<string, string> = {
          Fajr: t.Fajr?.slice(0, 5) || '05:17',
          Sunrise: t.Sunrise?.slice(0, 5) || '06:38',
          Dhuhr: t.Dhuhr?.slice(0, 5) || '12:24',
          Asr: t.Asr?.slice(0, 5) || '15:39',
          Maghrib: t.Maghrib?.slice(0, 5) || '18:08',
          Isha: t.Isha?.slice(0, 5) || '19:25',
          Midnight: t.Midnight?.slice(0, 5) || '23:43',
        };
        AsyncStorage.setItem(cacheKey, JSON.stringify(result)).catch(() => {});
        return result;
      }
    }
  } catch {
    // network failure / timeout -> gracefully fall back to pure math
  }

  // 3. Astronomical Math Fallback
  const mathTimes = calculateAstronomicalPrayerTimes(coords.latitude, coords.longitude, date);
  AsyncStorage.setItem(cacheKey, JSON.stringify(mathTimes)).catch(() => {});
  return mathTimes;
}

/**
 * Get or request user's actual location
 */
export async function getUserLocation(): Promise<{
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}> {
  try {
    const saved = await AsyncStorage.getItem('@uns_user_location');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      let city = 'موقعي الحالي';
      let country = 'المغرب';
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo?.city || geo?.region) {
          city = geo.city || geo.region || 'موقعي الحالي';
          country = geo.country || country;
        }
      } catch {}

      const locObj = { city, country, latitude: lat, longitude: lng };
      AsyncStorage.setItem('@uns_user_location', JSON.stringify(locObj)).catch(() => {});
      return locObj;
    }
  } catch {}

  return DEFAULT_COORDS;
}

/**
 * Force fetch fresh GPS location directly from device hardware
 */
export async function requestDeviceGpsLocation(): Promise<CityLocation> {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const res = await Location.requestForegroundPermissionsAsync();
      status = res.status;
    }

    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      let city = 'موقعي الحالي';
      let country = 'المغرب';
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo?.city || geo?.region) {
          city = geo.city || geo.region || 'موقعي الحالي';
          if (geo.country) country = geo.country;
        }
      } catch {}

      const locObj: CityLocation = { city: `${city}، ${country}`, country, latitude: lat, longitude: lng };
      await AsyncStorage.setItem('@uns_user_location', JSON.stringify(locObj));
      return locObj;
    }
  } catch {}

  return DEFAULT_COORDS;
}

/**
 * Calculate the currently upcoming prayer and seconds left
 */
export function calculateUpcomingPrayer(
  rawTimes: Record<string, string>,
  now: Date = new Date()
): { upcomingId: string; secondsRemaining: number; nextPrayerName: string } {
  // Only the 5 obligatory prayers have Athan / upcoming prayer status
  const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  const nowMs = now.getTime();

  for (const id of prayerOrder) {
    const raw = rawTimes[id];
    if (!raw) continue;
    const [h, m] = raw.split(':').map((n) => parseInt(n, 10));
    const pDate = new Date(now);
    pDate.setHours(h, m, 0, 0);

    if (pDate.getTime() > nowMs) {
      const diffSec = Math.floor((pDate.getTime() - nowMs) / 1000);
      return {
        upcomingId: id,
        secondsRemaining: diffSec,
        nextPrayerName: PRAYER_NAMES_AR[id] || id,
      };
    }
  }

  // If after Isha, next prayer is tomorrow's Fajr
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fajrRaw = rawTimes.Fajr || '05:17';
  const [h, m] = fajrRaw.split(':').map((n) => parseInt(n, 10));
  tomorrow.setHours(h, m, 0, 0);

  const diffSec = Math.max(0, Math.floor((tomorrow.getTime() - nowMs) / 1000));
  return {
    upcomingId: 'Fajr',
    secondsRemaining: diffSec,
    nextPrayerName: 'الفجر',
  };
}
