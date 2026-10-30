import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import surahsData from '@/data/surahs.json';
import quranUthmaniData from '@/data/quran_uthmani.json';
import { toEasternArabicNumerals } from '@/data/quranPages';
import { SurahItem } from '@/context/AudioPlayerContext';
import AyahFrame from '@/components/quran/AyahFrame';
import VerseFloatingMenu from '@/components/quran/VerseFloatingMenu';
import TafsirModal from '@/components/quran/TafsirModal';
import IslamicBackground from '@/components/IslamicBackground';
import { useAppTheme } from '@/context/ThemeContext';

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

  const getOfflineVerses = (chapterId: number): VerseData[] => {
    const rawList = (quranUthmaniData as Record<string, string[]>)[chapterId.toString()];
    if (!rawList || rawList.length === 0) return OFFLINE_FATIHA_VERSES;
    return rawList.map((text, idx) => ({
      id: idx + 1,
      verse_number: idx + 1,
      text_uthmani: text,
    }));
  };

  const [verses, setVerses] = useState<VerseData[]>(() => getOfflineVerses(surahId));

  // Selected verse state for floating menu
  const [selectedVerse, setSelectedVerse] = useState<VerseData | null>(null);

  // Tafsir modal state
  const [isTafsirVisible, setIsTafsirVisible] = useState<boolean>(false);

  // Bookmarked verses list
  const [bookmarkedVerses, setBookmarkedVerses] = useState<string[]>([]);

  // Single verse audio playback state
  const versePlayerRef = useRef<AudioPlayer | null>(null);
  const [playingVerseNum, setPlayingVerseNum] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (versePlayerRef.current) {
        versePlayerRef.current.remove();
        versePlayerRef.current = null;
      }
    };
  }, []);

  const loadBookmarks = async () => {
    try {
      const saved = await AsyncStorage.getItem('@uns_verse_bookmarks');
      if (saved) setBookmarkedVerses(JSON.parse(saved));
    } catch {}
  };

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    const timer = setTimeout(() => {
      setVerses(getOfflineVerses(surahId));
      loadBookmarks();

      if (currentSurah) {
        const item = {
          surahId: currentSurah.id,
          surahName: `سورة ${currentSurah.name_arabic}`,
          page: currentSurah.start_page,
          versesCount: currentSurah.verses_count,
          revelationPlace: currentSurah.revelation_place,
          timeAgo: 'اليوم',
        };
        AsyncStorage.setItem('@uns_last_read', JSON.stringify(item)).catch(() => {});
        AsyncStorage.getItem('@uns_recent_readings')
          .then((saved) => {
            const list = saved ? JSON.parse(saved) : [];
            const filtered = list.filter((r: any) => r.surahId !== currentSurah.id);
            AsyncStorage.setItem(
              '@uns_recent_readings',
              JSON.stringify([{ id: currentSurah.id.toString(), ...item }, ...filtered].slice(0, 10))
            ).catch(() => {});
          })
          .catch(() => {});
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [surahId, currentSurah]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressActiveRef = useRef(false);

  const startVerseLongPress = (verse: VerseData) => {
    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      handleVerseLongPress(verse);
    }, 320);
  };

  const cancelVerseLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handleNextSurah = () => {
    if (nextSurah) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.replace({ pathname: '/surah/[id]', params: { id: nextSurah.id.toString() } });
    }
  };

  const handleVerseLongPress = (verse: VerseData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedVerse(verse);
  };

  const handleVersePress = () => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    if (selectedVerse) {
      setSelectedVerse(null);
    }
  };

  const handleToggleBookmark = async (verse: VerseData) => {
    const key = `${surahId}:${verse.verse_number}`;
    const isAlready = bookmarkedVerses.includes(key);
    const updated = isAlready
      ? bookmarkedVerses.filter((k) => k !== key)
      : [...bookmarkedVerses, key];
    setBookmarkedVerses(updated);
    try {
      await AsyncStorage.setItem('@uns_verse_bookmarks', JSON.stringify(updated));
    } catch {}
  };

  const handlePlayVerse = async (verse: VerseData) => {
    if (playingVerseNum === verse.verse_number && versePlayerRef.current) {
      versePlayerRef.current.pause();
      versePlayerRef.current.remove();
      versePlayerRef.current = null;
      setPlayingVerseNum(null);
      return;
    }

    try {
      setIsLoadingAudio(true);
      if (versePlayerRef.current) {
        versePlayerRef.current.remove();
        versePlayerRef.current = null;
      }
      const pad3 = (n: number) => n.toString().padStart(3, '0');
      const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${pad3(surahId)}${pad3(verse.verse_number)}.mp3`;
      const player = createAudioPlayer(audioUrl);
      versePlayerRef.current = player;
      setPlayingVerseNum(verse.verse_number);

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          player.remove();
          if (versePlayerRef.current === player) {
            versePlayerRef.current = null;
          }
          setPlayingVerseNum(null);
        }
      });

      player.play();
    } catch {
      // Keep silent
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleShareVerse = async (verse: VerseData) => {
    try {
      await Share.share({
        message: `${verse.text_uthmani}\n\n[سورة ${currentSurah.name_arabic}: الآية ${toEasternArabicNumerals(verse.verse_number)}]`,
      });
    } catch {}
  };

  const { isDark } = useAppTheme();

  const colors = {
    headerCardBg: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.94)',
    headerCardBorder: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.95)',
    backBtnBg: isDark ? '#0f172a' : 'rgba(241, 245, 249, 0.95)',
    backBtnBorder: isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 0.9)',
    backBtnIcon: isDark ? '#f8fafc' : '#0f172a',
    headerTitle: isDark ? '#f8fafc' : '#0f172a',
    headerMetaText: isDark ? '#94a3b8' : '#64748b',
    surahCardBg: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.95)',
    surahCardBorder: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.95)',
    verseText: isDark ? '#f8fafc' : '#0f172a',
    basmalahTint: isDark ? '#f8fafc' : '#0f172a',
    nextSurahBg: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.95)',
    nextSurahBorder: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.45)',
    nextSurahTitle: isDark ? '#f8fafc' : '#0f172a',
    nextSurahSubtitle: isDark ? '#4ade80' : '#059669',
    finishSurahsBg: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.95)',
    finishSurahsBorder: isDark ? '#334155' : '#cbd5e1',
    finishSurahsText: isDark ? '#f8fafc' : '#0f172a',
    revelationBadgeBg: isDark ? 'rgba(15, 142, 93, 0.15)' : 'rgba(16, 185, 129, 0.12)',
    revelationBadgeText: isDark ? '#4ade80' : '#047857',
  };

  const isFatiha = currentSurah.id === 1;
  const showBasmalahHeader = currentSurah.id !== 1 && currentSurah.id !== 9;
  const isSelectedBookmark = selectedVerse
    ? bookmarkedVerses.includes(`${surahId}:${selectedVerse.verse_number}`)
    : false;
  const isSmallSurah = currentSurah.verses_count <= 11;

  return (
    <View style={styles.safeArea}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          translucent
          backgroundColor="transparent"
        />

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isSmallSurah && styles.smallSurahScrollContent,
          ]}
        >
          {/* HEADER BLOCK (Matching Website Header Block) */}
          <View
            style={[
              styles.headerCard,
              { backgroundColor: colors.headerCardBg, borderColor: colors.headerCardBorder },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: colors.backBtnBg, borderColor: colors.backBtnBorder },
              ]}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/quran' as any))}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.backBtnIcon} />
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: colors.headerTitle }]}>
                سورة {currentSurah.name_arabic}
              </Text>
              <View style={styles.headerMetaRow}>
                <View
                  style={[
                    styles.revelationBadge,
                    { backgroundColor: colors.revelationBadgeBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.revelationBadgeText,
                      { color: colors.revelationBadgeText },
                    ]}
                  >
                    {currentSurah.revelation_place === 'makkah' ? 'مكية' : 'مدنية'}
                  </Text>
                </View>
                <Text style={[styles.headerMetaText, { color: colors.headerMetaText }]}>
                  رقم {currentSurah.id} • {currentSurah.verses_count} آية
                </Text>
              </View>
            </View>
          </View>

          <View style={isSmallSurah ? styles.smallSurahWrapper : undefined}>
            <View style={isSmallSurah ? styles.smallSurahCenterCard : undefined}>
              {/* MAIN SURAH TEXT CARD */}
              <View
                style={[
                  styles.surahTextCard,
                  { backgroundColor: colors.surahCardBg, borderColor: colors.surahCardBorder },
                  isSmallSurah && { marginBottom: 0 },
                ]}
              >
                {/* Basmalah for Surahs other than Al-Fatiha and At-Tawbah */}
                {showBasmalahHeader && (
                  <View style={styles.basmalahWrapper}>
                    <Image
                      source={require('@/assets/images/basmalah.png')}
                      style={[styles.basmalahImage, { tintColor: colors.basmalahTint }]}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {/* Verses List */}
                <View style={styles.versesWrapper}>
                  {/* For Surah Al-Fatihah: Verse 1 is Basmalah */}
                  {isFatiha && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPressIn={() => startVerseLongPress(verses[0])}
                      onPressOut={cancelVerseLongPress}
                      onPress={() => {
                        if (isLongPressActiveRef.current) {
                          isLongPressActiveRef.current = false;
                          return;
                        }
                        if (selectedVerse) {
                          setSelectedVerse(selectedVerse.verse_number === 1 ? null : verses[0]);
                        }
                      }}
                      onLongPress={() => handleVerseLongPress(verses[0])}
                      delayLongPress={320}
                      style={[
                        styles.fatihaBasmalahWrapper,
                        selectedVerse?.verse_number === 1 && styles.selectedBasmalahWrapper,
                      ]}
                    >
                      <Image
                        source={require('@/assets/images/basmalah.png')}
                        style={[styles.fatihaBasmalahImage, { tintColor: colors.basmalahTint }]}
                        resizeMode="contain"
                      />
                      <AyahFrame number={1} />
                    </TouchableOpacity>
                  )}

                  {/* Quran Continuous Flow Paragraph with Interactive Highlight on Long Press */}
                  <Text
                    style={[styles.surahParagraph, { color: colors.verseText }]}
                    onPress={handleVersePress}
                  >
                    {verses.map((verse) => {
                      if (isFatiha && verse.verse_number === 1) return null;
                      const isSelected = selectedVerse?.verse_number === verse.verse_number;
                      return (
                        <React.Fragment key={verse.id || verse.verse_number}>
                          <Text
                            onPressIn={() => startVerseLongPress(verse)}
                            onPressOut={cancelVerseLongPress}
                            onPress={() => {
                              if (isLongPressActiveRef.current) {
                                isLongPressActiveRef.current = false;
                                return;
                              }
                              if (selectedVerse) {
                                setSelectedVerse(
                                  selectedVerse.verse_number === verse.verse_number ? null : verse
                                );
                              }
                            }}
                            onLongPress={() => handleVerseLongPress(verse)}
                            suppressHighlighting={false}
                            style={[
                              styles.verseText,
                              { color: colors.verseText },
                              isSelected && styles.selectedVerseHighlight,
                            ]}
                          >
                            {verse.text_uthmani}
                          </Text>
                          <Text> </Text>
                          <Text
                            onPressIn={() => startVerseLongPress(verse)}
                            onPressOut={cancelVerseLongPress}
                            onPress={() => {
                              if (isLongPressActiveRef.current) {
                                isLongPressActiveRef.current = false;
                                return;
                              }
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedVerse(
                                selectedVerse?.verse_number === verse.verse_number ? null : verse
                              );
                            }}
                            onLongPress={() => handleVerseLongPress(verse)}
                          >
                            <AyahFrame number={verse.verse_number} />
                          </Text>
                          <Text> </Text>
                        </React.Fragment>
                      );
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* BUTTON TO CONTINUE READING NEXT SURAH */}
            {nextSurah ? (
              <TouchableOpacity
                style={[
                  styles.nextSurahButton,
                  { backgroundColor: colors.nextSurahBg, borderColor: colors.nextSurahBorder },
                ]}
                activeOpacity={0.85}
                onPress={handleNextSurah}
              >
                <View style={styles.nextSurahArrowCircle}>
                  <Ionicons name="arrow-back" size={20} color="#ffffff" />
                </View>

                <View style={styles.nextSurahTextWrapper}>
                  <Text style={[styles.nextSurahSubtitle, { color: colors.nextSurahSubtitle }]}>
                    السورة التالية
                  </Text>
                  <Text style={[styles.nextSurahTitle, { color: colors.nextSurahTitle }]}>
                    قراءة سورة {nextSurah.name_arabic}
                  </Text>
                </View>

                <View style={styles.nextSurahBadge}>
                  <Ionicons
                    name="book-outline"
                    size={20}
                    color={colors.nextSurahSubtitle}
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.finishSurahsButton,
                  { backgroundColor: colors.finishSurahsBg, borderColor: colors.finishSurahsBorder },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/dua-khatm');
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
                <Text style={[styles.finishSurahsText, { color: colors.finishSurahsText }]}>
                  ختام القرآن الكريم • دعاء الختم
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* FLOATING CONTEXT MENU OVERLAY (Rendered ON TOP of ScrollView with highest elevation & soft backdrop) */}
        {selectedVerse && (
          <View style={styles.floatingMenuBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSelectedVerse(null)}
            />
            <View style={styles.floatingMenuFloatingBox}>
              <VerseFloatingMenu
                visible={true}
                onTafsir={() => setIsTafsirVisible(true)}
                onBookmark={() => handleToggleBookmark(selectedVerse)}
                onPlay={() => handlePlayVerse(selectedVerse)}
                onShare={() => handleShareVerse(selectedVerse)}
                isBookmarked={isSelectedBookmark}
                isPlaying={playingVerseNum === selectedVerse.verse_number}
                isLoadingAudio={isLoadingAudio}
              />
            </View>
          </View>
        )}

        {/* TAFSIR MODAL */}
        {selectedVerse && (
          <TafsirModal
            visible={isTafsirVisible}
            onClose={() => setIsTafsirVisible(false)}
            surahName={currentSurah.name_arabic}
            surahId={currentSurah.id}
            verseNumber={selectedVerse.verse_number}
            verseText={selectedVerse.text_uthmani}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  smallSurahScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  smallSurahWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  smallSurahCenterCard: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },

  /* FLOATING MENU BACKDROP & POSITIONING */
  floatingMenuBackdrop: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  floatingMenuFloatingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    zIndex: 10000,
    elevation: 10000,
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
    gap: 12,
    marginBottom: 20,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  selectedBasmalahWrapper: {
    backgroundColor: 'rgba(74, 222, 128, 0.28)',
    borderRadius: 14,
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
  selectedVerseHighlight: {
    backgroundColor: 'rgba(74, 222, 128, 0.28)',
    color: '#ffffff',
    borderRadius: 8,
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
