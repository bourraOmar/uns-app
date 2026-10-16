import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useScrollCollapse } from '@/context/ScrollCollapseContext';
import { DUA_CATEGORIES, DuaCategory, DuaItem } from '@/data/duas';

type FilterTab = 'all' | 'quran' | 'prophet';

export default function DuasScreen() {
  const router = useRouter();
  const { onScroll, searchQuery, setSearchPlaceholder, openSearch } = useScrollCollapse();
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

  useEffect(() => {
    setSearchPlaceholder('ابحث عن دعاء أو مناسبة (سفر، شفاء، استخارة...)...');
  }, [setSearchPlaceholder]);

  const filteredCategories = DUA_CATEGORIES.filter((cat) => {
    // Filter by tab
    if (selectedFilter === 'quran' && cat.group !== 'quran') return false;
    if (selectedFilter === 'prophet' && cat.group !== 'prophet') return false;

    // Filter by search
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const matchesTitle = cat.title.toLowerCase().includes(query) || cat.subtitle.toLowerCase().includes(query);
    const matchesItem = cat.duas.some(
      (d) => d.content.toLowerCase().includes(query) || d.title.toLowerCase().includes(query)
    );
    return matchesTitle || matchesItem;
  });

  const totalDuasCount = DUA_CATEGORIES.reduce((acc, cat) => {
    const num = parseInt(cat.countText, 10) || cat.duas.length;
    return acc + num;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
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
            <Text style={styles.headerTitle}>قسم الأدعية</Text>
            <Text style={styles.headerSubtitle}>أدعية مباركة من القرآن الكريم والسنة النبوية</Text>
          </View>
        </View>

        {/* Search Bar Trigger */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={openSearch}
        >
          <Ionicons name="search" size={20} color="#64748b" />
          <Text style={[styles.searchInputPlaceholder, !!searchQuery && styles.searchInputActiveText]}>
            {searchQuery || 'ابحث عن دعاء أو مناسبة (سفر، شفاء، استخارة...)'}
          </Text>
        </TouchableOpacity>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'all' && styles.filterChipActiveGreen,
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'all' && styles.filterChipTextActiveGreen,
              ]}
            >
              الكل ({DUA_CATEGORIES.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'quran' && styles.filterChipActiveGreen,
            ]}
            onPress={() => setSelectedFilter('quran')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'quran' && styles.filterChipTextActiveGreen,
              ]}
            >
              📖 أدعية من القرآن
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'prophet' && styles.filterChipActiveGreen,
            ]}
            onPress={() => setSelectedFilter('prophet')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'prophet' && styles.filterChipTextActiveGreen,
              ]}
            >
              🕌 الأدعية النبوية
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Duas Category Cards List */}
        <View style={styles.cardsList}>
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => {
              const isExpanded = expandedCatId === category.id;
              return (
                <View key={category.id} style={styles.cardWrapper}>
                  <TouchableOpacity
                    style={styles.cardHeader}
                    activeOpacity={0.8}
                    onPress={() => setExpandedCatId(isExpanded ? null : category.id)}
                  >
                    {/* Left chevron indicator */}
                    <Ionicons
                      name={isExpanded ? 'chevron-down' : 'chevron-back'}
                      size={20}
                      color="#64748b"
                    />

                    {/* Middle Info */}
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{category.title}</Text>
                      <Text style={styles.cardSubtitle}>
                        {category.countText} • {category.subtitle}
                      </Text>
                    </View>

                    {/* Right Icon Box */}
                    <View style={styles.cardIconBox}>
                      <Ionicons name={category.iconName as any} size={22} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Duas List */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {category.duas.map((dua) => (
                        <View key={dua.id} style={styles.duaItem}>
                          <Text style={styles.duaItemTitle}>{dua.title}</Text>
                          <Text style={styles.duaItemText}>{dua.content}</Text>
                          {dua.reference ? (
                            <Text style={styles.duaItemRef}>{dua.reference}</Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCircleIcon}>
                <Ionicons name="close" size={26} color="#f8fafc" />
              </View>
              <Text style={styles.emptyTitle}>لا توجد نتائج لما تبحث عنه!</Text>
              <Text style={styles.emptySubtitle}>
                لم نعثر على دعاء باسم &quot;{searchQuery}&quot;
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1527',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginBottom: 16,
    gap: 10,
  },
  searchInputPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'right',
    fontFamily: 'Cairo_600SemiBold',
  },
  searchInputActiveText: {
    color: '#ffffff',
  },
  chipsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    backgroundColor: '#162238',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterChipActiveGreen: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterChipTextActiveGreen: {
    color: '#ffffff',
    fontWeight: '800',
  },
  cardsList: {
    gap: 12,
  },
  cardWrapper: {
    backgroundColor: '#162238',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  cardInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#101a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 14,
  },
  duaItem: {
    backgroundColor: '#101a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  duaItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
    textAlign: 'right',
    marginBottom: 8,
  },
  duaItemText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'right',
    lineHeight: 26,
    fontWeight: '600',
  },
  duaItemRef: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 140,
  },
  emptyCircleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#162238',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 19,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 13,
    color: '#85998a',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
});
