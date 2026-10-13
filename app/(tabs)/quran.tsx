import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Chapter {
  id: number;
  revelation_place: string;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

export default function QuranScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  useEffect(() => {
    fetchChapters();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://api.quran.com/api/v4/chapters?language=ar');
      const json = await res.json();
      if (json.chapters) {
        setChapters(json.chapters);
        setFilteredChapters(json.chapters);
      }
    } catch {
      // offline fallback or cached
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFilteredChapters(chapters);
    } else {
      const q = text.trim();
      const filtered = chapters.filter(
        (c) =>
          c.name_arabic.includes(q) ||
          c.name_simple.toLowerCase().includes(q.toLowerCase()) ||
          c.id.toString() === q
      );
      setFilteredChapters(filtered);
    }
  };

  const playSurahAudio = async (surahId: number) => {
    try {
      if (playingId === surahId && sound) {
        await sound.stopAsync();
        setPlayingId(null);
        return;
      }
      if (sound) {
        await sound.unloadAsync();
      }
      const padId = surahId.toString().padStart(3, '0');
      // Afasy recitation audio URL
      const audioUrl = `https://server8.mp3quran.net/afs/${padId}.mp3`;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingId(surahId);

      // Save last read
      const surahObj = chapters.find((c) => c.id === surahId);
      if (surahObj) {
        await AsyncStorage.setItem(
          'last_read_quran',
          JSON.stringify({ surahName: surahObj.name_arabic, surahId: surahObj.id, page: 1 })
        );
      }
    } catch {
      setPlayingId(null);
    }
  };

  const renderSurahItem = ({ item }: { item: Chapter }) => {
    const isPlaying = playingId === item.id;
    return (
      <View
        style={[
          styles.surahCard,
          {
            backgroundColor: colors.card,
            borderColor: isPlaying ? colors.tint : colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => playSurahAudio(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={36}
            color={isPlaying ? '#10b981' : colors.tint}
          />
        </TouchableOpacity>

        <View style={styles.surahInfo}>
          <Text style={[styles.surahName, { color: colors.text }]}>سورة {item.name_arabic}</Text>
          <Text style={[styles.surahMeta, { color: colors.tabIconDefault }]}>
            {item.revelation_place === 'makkah' ? 'مكية' : 'مدنية'} • {item.verses_count} آية
          </Text>
        </View>

        <View style={[styles.numberBadge, { backgroundColor: `${colors.tint}15` }]}>
          <Text style={[styles.numberText, { color: colors.tint }]}>{item.id}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.tabIconDefault} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="ابحث عن اسم السورة أو رقمها..."
          placeholderTextColor={colors.tabIconDefault}
          value={search}
          onChangeText={handleSearch}
          textAlign="right"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.tabIconDefault} />
          </TouchableOpacity>
        )}
      </View>

      {/* Surahs List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>جاري تحميل السور...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChapters}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSurahItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="book-outline" size={48} color={colors.tabIconDefault} />
              <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>لا توجد نتائج مطابقة</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  playButton: {
    marginRight: 12,
  },
  surahInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 14,
  },
  surahName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  surahMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
});
