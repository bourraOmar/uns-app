import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Chapter {
  id: number;
  revelation_place: string;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

type TabFilter = 'all' | 'makki' | 'madani';

export default function QuranScreen() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TabFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://api.quran.com/api/v4/chapters?language=ar');
      const json = await res.json();
      if (json.chapters) {
        setChapters(json.chapters);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  const filteredChapters = chapters.filter((c) => {
    if (filter === 'makki' && c.revelation_place !== 'makkah') return false;
    if (filter === 'madani' && c.revelation_place !== 'madinah') return false;

    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.name_arabic.includes(q) ||
      c.name_simple.toLowerCase().includes(q) ||
      c.id.toString() === q
    );
  });

  const renderSurahCard = ({ item }: { item: Chapter }) => {
    const isMadani = item.revelation_place === 'madinah';

    return (
      <TouchableOpacity
        style={styles.surahCard}
        activeOpacity={0.8}
        onPress={() => {
          // Surah details or reader
        }}
      >
        {/* Left Arrow Icon */}
        <Ionicons name="chevron-back" size={20} color="#64748b" />

        {/* Center Information */}
        <View style={styles.surahDetails}>
          <Text style={styles.surahTitle}>سورة {item.name_arabic}</Text>
          <Text style={styles.surahSubtitle}>
            {item.verses_count} آية • {isMadani ? 'مدنية' : 'مكية'}
          </Text>
        </View>

        {/* Right Green Number Badge */}
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{item.id}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>سور القرآن الكريم</Text>
          <Text style={styles.headerSubtitle}>تصفح واقرأ جميع سور القرآن الكريم المكتوبة بالتشكيل</Text>
        </View>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="...ابحث عن اسم السورة أو رقمها (الكهف، 18، Yasin)"
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Category Chips */}
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[styles.chip, filter === 'madani' && styles.chipActive]}
          onPress={() => setFilter('madani')}
        >
          <Text style={[styles.chipText, filter === 'madani' && styles.chipTextActive]}>
            مدنية (28) 🕌
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filter === 'makki' && styles.chipActive]}
          onPress={() => setFilter('makki')}
        >
          <Text style={[styles.chipText, filter === 'makki' && styles.chipTextActive]}>
            مكية (86) 🕋
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filter === 'all' && styles.chipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>
            الكل (114)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Surahs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filteredChapters}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSurahCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1527',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#162238',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#162238',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#162238',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  chipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 90,
    gap: 12,
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#162238',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  surahDetails: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 16,
  },
  surahTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  surahSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  numberBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10b981',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
