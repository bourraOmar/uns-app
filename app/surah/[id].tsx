import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import surahsData from '@/data/surahs.json';
import { toEasternArabicNumerals } from '@/data/quranPages';
import { SurahItem } from '@/context/AudioPlayerContext';

interface VerseData {
  id: number;
  verse_number: number;
  text_uthmani: string;
}

const OFFLINE_FATIHA_VERSES: VerseData[] = [
  { id: 1, verse_number: 1, text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
  { id: 2, verse_number: 2, text_uthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ' },
  { id: 3, verse_number: 3, text_uthmani: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
  { id: 4, verse_number: 4, text_uthmani: 'مَـٰلِكِ يَوْمِ ٱلدِّينِ' },
  { id: 5, verse_number: 5, text_uthmani: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
  { id: 6, verse_number: 6, text_uthmani: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
  { id: 7, verse_number: 7, text_uthmani: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' },
];

export default function SurahReaderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const surahId = parseInt(id || '1', 10);
  const currentSurah = (surahsData as SurahItem[]).find((s) => s.id === surahId) || (surahsData[0] as SurahItem);
  const nextSurah = (surahsData as SurahItem[]).find((s) => s.id === surahId + 1);

  const [verses, setVerses] = useState<VerseData[]>(
    surahId === 1 ? OFFLINE_FATIHA_VERSES : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(surahId !== 1);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    loadSurahVerses(surahId);
  }, [surahId]);

  const loadSurahVerses = async (chapterId: number) => {
    if (chapterId === 1) {
      setVerses(OFFLINE_FATIHA_VERSES);
      setIsLoading(false);
      return;
    }

    const cacheKey = `@uns_surah_verses_v1_${chapterId}`;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setVerses(JSON.parse(cached));
        setIsLoading(false);
        return;
      }
    } catch {}

    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.quran.com/api/v4/verses/by_chapter/${chapterId}?fields=text_uthmani&per_page=300`
      );
      if (!res.ok) throw new Error('Failed to fetch verses');
      const data = await res.json();
      const rawVerses: any[] = data.verses || [];

      const formatted: VerseData[] = rawVerses.map((v) => ({
        id: v.id,
        verse_number: v.verse_number,
        text_uthmani: v.text_uthmani,
      }));

      setVerses(formatted);
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(formatted));
      } catch {}
    } catch {
      // Keep silent fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextSurah = () => {
    if (nextSurah) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.replace({ pathname: '/surah/[id]', params: { id: nextSurah.id.toString() } });
    }
  };

  const isFatiha = currentSurah.id === 1;
  const showBasmalahHeader = currentSurah.id !== 1 && currentSurah.id !== 9;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER BLOCK (Matching Website Header Block) */}
        <View style={styles.headerCard}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={22} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>سورة {currentSurah.name_arabic}</Text>
            <View style={styles.headerMetaRow}>
              <View style={styles.revelationBadge}>
                <Text style={styles.revelationBadgeText}>
                  {currentSurah.revelation_place === 'makkah' ? 'مكية' : 'مدنية'}
                </Text>
              </View>
              <Text style={styles.headerMetaText}>
                رقم {currentSurah.id} • {currentSurah.verses_count} آية
              </Text>
            </View>
          </View>
        </View>

        {/* MAIN SURAH TEXT CARD (Matching Website Surah Text Area) */}
        <View style={styles.surahTextCard}>
          {/* Basmalah for Surahs other than Al-Fatiha and At-Tawbah */}
          {showBasmalahHeader && (
            <View style={styles.basmalahWrapper}>
              <Image
                source={require('@/assets/images/basmalah.png')}
                style={styles.basmalahImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Loading Indicator */}
          {isLoading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>جاري تحميل الآيات...</Text>
            </View>
          ) : (
            <View style={styles.versesWrapper}>
              {/* For Surah Al-Fatihah: Verse 1 is Basmalah */}
              {isFatiha && (
                <View style={styles.fatihaBasmalahWrapper}>
                  <Image
                    source={require('@/assets/images/basmalah.png')}
                    style={styles.fatihaBasmalahImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.ayahNumber}> (١) </Text>
                </View>
              )}

              {/* Quran Continuous Flow Paragraph */}
              <Text style={styles.surahParagraph}>
                {verses.map((verse) => {
                  if (isFatiha && verse.verse_number === 1) return null;
                  const numStr = toEasternArabicNumerals(verse.verse_number);
                  return (
                    <React.Fragment key={verse.id || verse.verse_number}>
                      <Text style={styles.verseText}>{verse.text_uthmani}</Text>
                      <Text style={styles.ayahNumber}> ({numStr}) </Text>
                    </React.Fragment>
                  );
                })}
              </Text>
            </View>
          )}
        </View>

        {/* BUTTON TO CONTINUE READING NEXT SURAH */}
        {nextSurah ? (
          <TouchableOpacity
            style={styles.nextSurahButton}
            activeOpacity={0.85}
            onPress={handleNextSurah}
          >
            <View style={styles.nextSurahArrowCircle}>
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </View>

            <View style={styles.nextSurahTextWrapper}>
              <Text style={styles.nextSurahSubtitle}>السورة التالية</Text>
              <Text style={styles.nextSurahTitle}>
                قراءة سورة {nextSurah.name_arabic}
              </Text>
            </View>

            <View style={styles.nextSurahBadge}>
              <Ionicons name="book-outline" size={20} color="#4ade80" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.finishSurahsButton}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="#4ade80" />
            <Text style={styles.finishSurahsText}>
              ختام القرآن الكريم • العودة للفهرس
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingBottom: 96,
  },

  /* HEADER BLOCK */
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: '#f8fafc',
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  revelationBadge: {
    backgroundColor: 'rgba(15, 142, 93, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  revelationBadgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#4ade80',
  },
  headerMetaText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12.5,
    color: '#94a3b8',
  },

  /* SURAH TEXT AREA */
  surahTextCard: {
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  /* BASMALAH */
  basmalahWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 6,
  },
  basmalahImage: {
    width: 240,
    height: 48,
    tintColor: '#f8fafc',
    opacity: 0.9,
  },
  fatihaBasmalahWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  fatihaBasmalahImage: {
    width: 210,
    height: 42,
    tintColor: '#f8fafc',
    opacity: 0.9,
  },

  /* VERSES TEXT FLOW */
  versesWrapper: {
    width: '100%',
  },
  surahParagraph: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 22.5,
    lineHeight: 52,
    color: '#f8fafc',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  verseText: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 22.5,
    lineHeight: 52,
    color: '#f8fafc',
    includeFontPadding: false,
  },
  ayahNumber: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
    color: '#4ade80',
    includeFontPadding: false,
  },

  /* LOADING */
  loadingWrapper: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#94a3b8',
  },

  /* NEXT SURAH BUTTON */
  nextSurahButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  nextSurahArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f8e5d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextSurahTextWrapper: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 14,
  },
  nextSurahSubtitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#4ade80',
    marginBottom: 2,
  },
  nextSurahTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#f8fafc',
  },
  nextSurahBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 142, 93, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* FINISH SURAHS BUTTON */
  finishSurahsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  finishSurahsText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#f8fafc',
  },
});
