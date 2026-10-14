import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RECITERS_DATA, Reciter } from '@/data/reciters';

export default function RecitersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filteredReciters = RECITERS_DATA.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return r.name.toLowerCase().includes(q) || r.rewaya.toLowerCase().includes(q);
  });

  const renderReciterCard = ({ item }: { item: Reciter }) => (
    <TouchableOpacity
      style={styles.reciterCard}
      activeOpacity={0.8}
      onPress={() => {
        // Option to navigate to reciter audio player or play sample
      }}
    >
      <View style={styles.micCircle}>
        <Ionicons name="mic-outline" size={32} color="#10b981" />
      </View>
      <Text style={styles.reciterName}>{item.name}</Text>
      <View style={styles.rewayaBadge}>
        <Text style={styles.rewayaText}>{item.rewaya}</Text>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>قُرّاء القرآن الكريم</Text>
          <Text style={styles.headerSubtitle}>استمع إلى تلاوات خاشعة بأصوات أشهر القراء في العالم الإسلامي</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن اسم القارئ (عبد الباسط، المعيقلي، العفاسي...)"
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

      {/* 2-Column Grid */}
      <FlatList
        data={filteredReciters}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderReciterCard}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 40,
    gap: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
    flexDirection: 'row-reverse',
  },
  reciterCard: {
    flex: 1,
    backgroundColor: '#162238',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    alignItems: 'center',
  },
  micCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  reciterName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  rewayaBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewayaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'center',
  },
});
