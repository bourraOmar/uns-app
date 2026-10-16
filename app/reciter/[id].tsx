import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { RECITERS_DATA, Reciter } from '@/data/reciters';
import surahsData from '@/data/surahs.json';
import { useAudioPlayer, SurahItem } from '@/context/AudioPlayerContext';
import MiniAudioPlayer from '@/components/MiniAudioPlayer';

export default function ReciterProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    rewaya?: string;
    server?: string;
  }>();

  // Find reciter info
  const reciter = useMemoReciter(params);

  // Global Audio Player Context
  const {
    currentSurah,
    currentReciter,
    isPlaying,
    isLoadingAudio,
    playSurah,
    togglePlay,
    openPlayerModal,
  } = useAudioPlayer();

  // Master Big Play/Pause button in Spotify header
  const handleToggleMasterPlay = () => {
    if (currentSurah && currentReciter.id === reciter.id) {
      togglePlay();
    } else {
      // Start with Surah Al-Fatihah (1) with this reciter
      playSurah(1, reciter);
    }
  };

  // Header component with Spotify Cover, Reciter Info, Big Play Button, and Table Columns Header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Large Spotify Album Cover Container */}
      <View style={styles.albumCoverBox}>
        <Ionicons name="mic-outline" size={80} color="#94a3b8" />
      </View>

      {/* 2. Playlist / Reciter Metadata */}
      <Text style={styles.playlistTag}>قائمة التشغيل</Text>
      <Text style={styles.reciterName}>{reciter.name}</Text>
      <Text style={styles.reciterStats}>
        برواية {reciter.rewaya.replace(' - مرتل', '')} ▪ {surahsData.length} سورة
      </Text>

      {/* 3. Spotify Control Actions Row (Big Play Button on the Right) */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.bigPlayButton}
          activeOpacity={0.85}
          onPress={handleToggleMasterPlay}
        >
          {isLoadingAudio ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color="#ffffff"
              style={isPlaying ? undefined : { marginLeft: 3 }}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* 4. Spotify Tracks Table Columns Header */}
      <View style={styles.tableHeaderRow}>
        <Text style={styles.colVersesHeader}>VERSES</Text>
        <Text style={styles.colRevelationHeader}>REVELATION</Text>
        <Text style={styles.colSurahHeader}>السورة</Text>
        <Text style={styles.colNumberHeader}>#</Text>
      </View>
    </View>
  );

  // Each Surah Track Item in the Spotify Table
  const renderSurahTrack = ({ item }: { item: SurahItem }) => {
    const isCurrentPlaying = currentSurah?.id === item.id && currentReciter.id === reciter.id;
    const revelation = item.revelation_place === 'makkah' ? 'Makkah' : 'Madinah';

    return (
      <TouchableOpacity
        style={[styles.trackRow, isCurrentPlaying && styles.trackRowActive]}
        activeOpacity={0.75}
        onPress={() => {
          playSurah(item.id, reciter);
          openPlayerModal();
        }}
      >
        {/* Column 4: Verses Count */}
        <Text style={[styles.colVersesText, isCurrentPlaying && styles.textActive]}>
          {item.verses_count}
        </Text>

        {/* Column 3: Revelation Place */}
        <Text style={[styles.colRevelationText, isCurrentPlaying && styles.textActive]}>
          {revelation}
        </Text>

        {/* Column 2: Surah Names (Arabic bold + English simple) */}
        <View style={styles.colSurahInfo}>
          <Text style={[styles.surahNameArabic, isCurrentPlaying && styles.textActive]}>
            {item.name_arabic}
          </Text>
          <Text style={styles.surahNameSimple}>{item.name_simple}</Text>
        </View>

        {/* Column 1: Track Number or Playing Equalizer Icon */}
        <View style={styles.colNumberContainer}>
          {isCurrentPlaying && isLoadingAudio ? (
            <ActivityIndicator size="small" color="#34d399" />
          ) : isCurrentPlaying && isPlaying ? (
            <Ionicons name="volume-high" size={16} color="#34d399" />
          ) : (
            <Text style={[styles.trackNumberText, isCurrentPlaying && styles.textActive]}>
              {item.id}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* TOP NAVIGATION BAR */}
      <View style={styles.topNavBar}>
        <View style={{ width: 40 }} />

        {/* Right: Circular Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.75}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-forward" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {/* SURAHS LIST / TRACKS TABLE */}
      <FlatList
        data={surahsData as SurahItem[]}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={renderSurahTrack}
        contentContainerStyle={[
          styles.listContent,
          currentSurah ? { paddingBottom: 110 } : { paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* SPOTIFY-STYLE FLOATING MINI-PLAYER (MATCHING SCREENSHOT) */}
      <MiniAudioPlayer bottomOffset={Platform.OS === 'ios' ? 24 : 16} />
    </SafeAreaView>
  );
}

// Hook to resolve reciter data from params or defaults
function useMemoReciter(params: {
  id: string;
  name?: string;
  rewaya?: string;
  server?: string;
}) {
  const [reciter, setReciter] = useState<Reciter>(() => {
    const found = RECITERS_DATA.find((r) => r.id === params.id || r.name === params.name);
    return {
      id: params.id || found?.id || '1',
      name: params.name || found?.name || 'إبراهيم الأخضر',
      rewaya: params.rewaya || found?.rewaya || 'حفص عن عاصم - مرتل',
      server: params.server || found?.server || 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/',
    };
  });

  useEffect(() => {
    const found = RECITERS_DATA.find((r) => r.id === params.id || r.name === params.name);
    setReciter({
      id: params.id || found?.id || '1',
      name: params.name || found?.name || 'إبراهيم الأخضر',
      rewaya: params.rewaya || found?.rewaya || 'حفص عن عاصم - مرتل',
      server: params.server || found?.server || 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/',
    });
  }, [params.id, params.name, params.rewaya, params.server]);

  return reciter;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Spotify dark slate navy matching screenshot
  },

  /* TOP NAVIGATION */
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* SPOTIFY HEADER */
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  albumCoverBox: {
    width: 150,
    height: 150,
    borderRadius: 24,
    backgroundColor: '#172235',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  playlistTag: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  reciterName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 34,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 44,
  },
  reciterStats: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },

  /* SPOTIFY CONTROLS ROW */
  controlsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  bigPlayButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3b526d', // Spotify slate-blue button matching screenshot
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  /* SPOTIFY TABLE HEADER */
  tableHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 4,
  },
  colNumberHeader: {
    width: 32,
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  colSurahHeader: {
    flex: 2,
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'right',
    paddingRight: 8,
  },
  colRevelationHeader: {
    flex: 1.5,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  colVersesHeader: {
    width: 60,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  /* TRACK ROW */
  listContent: {
    paddingHorizontal: 16,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  trackRowActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  colNumberContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackNumberText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#64748b',
  },
  colSurahInfo: {
    flex: 2,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  surahNameArabic: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'right',
  },
  surahNameSimple: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  colRevelationText: {
    flex: 1.5,
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  colVersesText: {
    width: 60,
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  textActive: {
    color: '#34d399',
  },

  /* NOW PLAYING FLOATING MINI PLAYER */
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  miniPlayerProgressBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: '#334155',
  },
  miniPlayerProgressBarFill: {
    height: '100%',
    backgroundColor: '#34d399',
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  miniPlayerPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlayerInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginHorizontal: 12,
  },
  miniPlayerSurahTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  miniPlayerReciterSubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    color: '#94a3b8',
  },
  miniPlayerCloseBtn: {
    padding: 6,
  },
});
