import React, { useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import { useScrollCollapse } from '@/context/ScrollCollapseContext';
import azkarData from '@/data/azkar.json';

interface AdhkarCategoryItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  categoryKey: string;
  count: number;
}

const ADHKAR_CATEGORIES: AdhkarCategoryItem[] = [
  {
    id: 'tasbih',
    title: 'المسبحة الإلكترونية',
    subtitle: 'عداد ذكي • المس أي مكان في الشاشة للتسبيح بسهولة',
    iconName: 'time-outline',
    categoryKey: 'تسابيح',
    count: 33,
  },
  {
    id: 'morning',
    title: 'أذكار الصباح',
    subtitle: '25 ذكراً • أذكار الصباح كاملة ومحصنة للبدء باليوم',
    iconName: 'sunny-outline',
    categoryKey: 'أذكار الصباح',
    count: 25,
  },
  {
    id: 'evening',
    title: 'أذكار المساء',
    subtitle: '25 ذكراً • أذكار المساء للتحصين والسكينة والراحة',
    iconName: 'moon-outline',
    categoryKey: 'أذكار المساء',
    count: 25,
  },
  {
    id: 'after_prayer',
    title: 'أذكار الصلاة',
    subtitle: '9 أذكار • أذكار ما بعد السلام من الصلاة المفروضة',
    iconName: 'file-tray-outline',
    categoryKey: 'أذكار بعد السلام من الصلاة المفروضة',
    count: 9,
  },
  {
    id: 'sleep',
    title: 'أذكار النوم',
    subtitle: '10 أذكار • أذكار النوم للتحصين والاطمئنان قبل النوم',
    iconName: 'bed-outline',
    categoryKey: 'أذكار النوم',
    count: 10,
  },
  {
    id: 'wake_up',
    title: 'أذكار الاستيقاظ',
    subtitle: '3 أذكار • أذكار الاستيقاظ من النوم',
    iconName: 'alarm-outline',
    categoryKey: 'أذكار الاستيقاظ',
    count: 3,
  },
];

type FilterType = 'all' | 'morning_evening' | 'tasbih' | 'other';

export default function AdhkarScreen() {
  const router = useRouter();
  const { onScroll } = useScrollCollapse();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Tasbih state inside expanded tasbih
  const [tasbihValue, setTasbihValue] = useState(0);

  // Adhkar counting state
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});

  const handleTasbihPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTasbihValue((prev) => prev + 1);
  };

  const handleDhikrCount = (uniqueKey: string, max: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const curr = dhikrCounts[uniqueKey] || 0;
    if (curr < max) {
      setDhikrCounts((prev) => ({ ...prev, [uniqueKey]: curr + 1 }));
      if (curr + 1 === max) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const filteredCategories = ADHKAR_CATEGORIES.filter((cat) => {
    if (filter === 'morning_evening') {
      if (cat.id !== 'morning' && cat.id !== 'evening') return false;
    }
    if (filter === 'tasbih') {
      if (cat.id !== 'tasbih') return false;
    }

    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return cat.title.toLowerCase().includes(q) || cat.subtitle.toLowerCase().includes(q);
  });

  const getAzkarItemsForCategory = (catKey: string): any[] => {
    const raw = (azkarData as any)[catKey];
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.flat(Infinity);
    }
    return [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            <Text style={styles.headerTitle}>قسم الأذكار</Text>
            <Text style={styles.headerSubtitle}>أدعية وأذكار اليوم والليلة والمسبحة الذكية</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="...ابحث عن ذكر أو تسبيح (صباح، استغفار، نوم)"
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

        {/* Filter Horizontal Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              الكل (7)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'morning_evening' && styles.filterChipActive]}
            onPress={() => setFilter('morning_evening')}
          >
            <Text style={[styles.filterChipText, filter === 'morning_evening' && styles.filterChipTextActive]}>
              الصباح والمساء 🌼
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'tasbih' && styles.filterChipActive]}
            onPress={() => setFilter('tasbih')}
          >
            <Text style={[styles.filterChipText, filter === 'tasbih' && styles.filterChipTextActive]}>
              المسبحة والتسابيح 📿
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Adhkar Categories List */}
        <View style={styles.categoriesList}>
          {filteredCategories.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemsList = getAzkarItemsForCategory(item.categoryKey);

            return (
              <View key={item.id} style={styles.categoryCard}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  activeOpacity={0.8}
                  onPress={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-back'}
                    size={20}
                    color="#64748b"
                  />

                  <View style={styles.cardDetails}>
                    <Text style={styles.categoryTitle}>{item.title}</Text>
                    <Text style={styles.categorySubtitle}>{item.subtitle}</Text>
                  </View>

                  <View style={styles.iconCircle}>
                    <Ionicons name={item.iconName as any} size={22} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedWrapper}>
                    {item.id === 'tasbih' ? (
                      /* Interactive Tasbih Counter */
                      <View style={styles.tasbihInteractiveArea}>
                        <TouchableOpacity
                          style={styles.bigTasbihButton}
                          activeOpacity={0.8}
                          onPress={handleTasbihPress}
                        >
                          <Text style={styles.tasbihCountNum}>{tasbihValue}</Text>
                          <Text style={styles.tasbihTapHint}>المس للتسبيح</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.tasbihResetBtn}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setTasbihValue(0);
                          }}
                        >
                          <Ionicons name="refresh" size={16} color="#94a3b8" />
                          <Text style={styles.tasbihResetText}>تصفير العداد</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* List of Adhkar items */
                      <View style={styles.azkarItemsList}>
                        {itemsList.map((azkar, idx) => {
                          const key = `${item.id}_${idx}`;
                          const target = parseInt(azkar.count || '1', 10);
                          const current = dhikrCounts[key] || 0;
                          const done = current >= target;

                          return (
                            <TouchableOpacity
                              key={idx}
                              style={[
                                styles.azkarItemBox,
                                done && styles.azkarItemBoxDone,
                              ]}
                              activeOpacity={0.85}
                              onPress={() => handleDhikrCount(key, target)}
                            >
                              <Text style={styles.azkarContentText}>
                                {azkar.content?.replace(/\\n/g, '').replace(/', '/g, '').trim()}
                              </Text>
                              {azkar.description ? (
                                <Text style={styles.azkarDescText}>{azkar.description}</Text>
                              ) : null}
                              <View style={styles.azkarItemFooter}>
                                <View
                                  style={[
                                    styles.countBadge,
                                    done && styles.countBadgeDone,
                                  ]}
                                >
                                  <Text style={styles.countBadgeText}>
                                    {current} / {target}
                                  </Text>
                                </View>
                                <Text style={styles.azkarFooterHint}>
                                  {done ? 'تم بحمد الله ✓' : 'اضغط للتكرار'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'right',
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
  filterChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
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
  cardDetails: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#101a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedWrapper: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  tasbihInteractiveArea: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  bigTasbihButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 3,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tasbihCountNum: {
    fontSize: 42,
    fontWeight: '900',
    color: '#10b981',
  },
  tasbihTapHint: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  tasbihResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#101a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tasbihResetText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  azkarItemsList: {
    gap: 12,
    paddingTop: 12,
  },
  azkarItemBox: {
    backgroundColor: '#101a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  azkarItemBoxDone: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  azkarContentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    lineHeight: 26,
  },
  azkarDescText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 18,
  },
  azkarItemFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  countBadge: {
    backgroundColor: '#162238',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeDone: {
    backgroundColor: '#10b981',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  azkarFooterHint: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
