import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [locationName, setLocationName] = useState('مكة المكرمة');
  const [timings, setTimings] = useState<PrayerTimings>({
    Fajr: '05:08',
    Sunrise: '06:24',
    Dhuhr: '12:12',
    Asr: '15:35',
    Maghrib: '18:01',
    Isha: '19:31',
  });
  const [loading, setLoading] = useState(false);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: string }>({
    name: 'المغرب',
    time: '18:01',
    remaining: '01:25:40',
  });
  const [lastRead, setLastRead] = useState({ surahName: 'الكهف', surahId: 18, page: 293 });

  useEffect(() => {
    loadLocationAndPrayers();
    loadLastRead();
  }, []);

  const loadLastRead = async () => {
    try {
      const saved = await AsyncStorage.getItem('last_read_quran');
      if (saved) {
        setLastRead(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  };

  const loadLocationAndPrayers = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo?.city || geo?.region) {
          setLocationName(geo.city || geo.region || 'موقعك الحالي');
        }
        fetchPrayerTimes(loc.coords.latitude, loc.coords.longitude);
      } else {
        fetchPrayerTimes(21.4225, 39.8262); // Makkah default
      }
    } catch {
      fetchPrayerTimes(21.4225, 39.8262);
    }
  };

  const fetchPrayerTimes = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const date = new Date();
      const res = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(date.getTime() / 1000)}?latitude=${lat}&longitude=${lng}&method=4`);
      const json = await res.json();
      if (json.data?.timings) {
        setTimings(json.data.timings);
      }
    } catch {
      // fallback offline times
    } finally {
      setLoading(false);
    }
  };

  const prayersList = [
    { key: 'Fajr', name: 'الفجر', time: timings.Fajr, icon: 'cloudy-night-outline' },
    { key: 'Sunrise', name: 'الشروق', time: timings.Sunrise, icon: 'sunny-outline' },
    { key: 'Dhuhr', name: 'الظهر', time: timings.Dhuhr, icon: 'sunny' },
    { key: 'Asr', name: 'العصر', time: timings.Asr, icon: 'partly-sunny-outline' },
    { key: 'Maghrib', name: 'المغرب', time: timings.Maghrib, icon: 'sunset-outline' },
    { key: 'Isha', name: 'العشاء', time: timings.Isha, icon: 'moon-outline' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>السلام عليكم ورحمة الله</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.tint} />
              <Text style={[styles.locationText, { color: colors.tabIconDefault }]}>{locationName}</Text>
            </View>
          </View>
          <View style={[styles.logoBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.logoText, { color: colors.tint }]}>أُنس</Text>
          </View>
        </View>

        {/* Next Prayer Highlight Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.tint }]}>
          <View style={styles.heroCardHeader}>
            <View>
              <Text style={styles.heroCardSubtitle}>الصلاة القادمة</Text>
              <Text style={styles.heroCardTitle}>{nextPrayer.name}</Text>
            </View>
            <View style={styles.heroTimeBadge}>
              <Ionicons name="time-outline" size={18} color="#ffffff" />
              <Text style={styles.heroTimeText}>{nextPrayer.time}</Text>
            </View>
          </View>
          <View style={styles.heroCountdownContainer}>
            <Text style={styles.heroCountdownLabel}>متبقي على الأذان</Text>
            <Text style={styles.heroCountdownTimer}>{nextPrayer.remaining}</Text>
          </View>
        </View>

        {/* Prayer Times Row */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>مواقيت الصلاة اليوم</Text>
          {loading && <ActivityIndicator size="small" color={colors.tint} />}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prayersScroll}>
          {prayersList.map((p) => (
            <View
              key={p.key}
              style={[
                styles.prayerItem,
                {
                  backgroundColor: p.name === nextPrayer.name ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={p.icon as any}
                size={22}
                color={p.name === nextPrayer.name ? '#ffffff' : colors.tint}
              />
              <Text
                style={[
                  styles.prayerName,
                  { color: p.name === nextPrayer.name ? '#ffffff' : colors.text },
                ]}
              >
                {p.name}
              </Text>
              <Text
                style={[
                  styles.prayerTime,
                  { color: p.name === nextPrayer.name ? '#ffffff' : colors.tabIconDefault },
                ]}
              >
                {p.time}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Last Read Quran Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={() => router.push('/quran' as any)}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: `${colors.tint}20` }]}>
              <Ionicons name="bookmark" size={20} color={colors.tint} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>متابعة الورد القرآني</Text>
              <Text style={[styles.cardSubtitle, { color: colors.tabIconDefault }]}>
                سورة {lastRead.surahName} • صفحة {lastRead.page}
              </Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.tabIconDefault} />
          </View>
        </TouchableOpacity>

        {/* Quick Tools Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24, marginBottom: 12 }]}>
          الخدمات والأدوات
        </Text>

        <View style={styles.toolsGrid}>
          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/adhkar' as any)}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="sparkles" size={24} color="#10b981" />
            </View>
            <Text style={[styles.toolTitle, { color: colors.text }]}>الأذكار اليومية</Text>
            <Text style={[styles.toolDesc, { color: colors.tabIconDefault }]}>حصن المسلم كاملاً</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/qibla' as any)}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="compass" size={24} color="#8b5cf6" />
            </View>
            <Text style={[styles.toolTitle, { color: colors.text }]}>بوصلة القبلة</Text>
            <Text style={[styles.toolDesc, { color: colors.tabIconDefault }]}>مستشعر دقيق مباشر</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/adhkar' as any)}
          >
            <View style={[styles.toolIconBox, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="finger-print" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.toolTitle, { color: colors.text }]}>السبحة الذكية</Text>
            <Text style={[styles.toolDesc, { color: colors.tabIconDefault }]}>مع اهتزاز حقيقي</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/quran' as any)}
          >
            <View style={[styles.toolIconBox, { backgroundColor: `${colors.tint}20` }]}>
              <Ionicons name="radio" size={24} color={colors.tint} />
            </View>
            <Text style={[styles.toolTitle, { color: colors.text }]}>إذاعة القرآن</Text>
            <Text style={[styles.toolDesc, { color: colors.tabIconDefault }]}>بث مباشر 24/7</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Verse Inspiration Card */}
        <View style={[styles.verseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.verseBismillah, { color: colors.tint }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          <Text style={[styles.verseText, { color: colors.text }]}>
            "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
          </Text>
          <Text style={[styles.verseRef, { color: colors.tabIconDefault }]}>سورة الرعد • آية 28</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#4a6b8c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  heroCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroCardSubtitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  heroCardTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 2,
  },
  heroTimeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroTimeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  heroCountdownContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  heroCountdownLabel: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroCountdownTimer: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  prayersScroll: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingBottom: 8,
  },
  prayerItem: {
    width: 76,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  prayerName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  prayerTime: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  cardHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  toolsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    alignItems: 'flex-end',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  toolIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: 11,
  },
  verseCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  verseBismillah: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  verseRef: {
    fontSize: 12,
    marginTop: 8,
  },
});
