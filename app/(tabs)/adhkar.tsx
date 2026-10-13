import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import azkarData from '@/data/azkar.json';

const TASBIH_PRESETS = [
  'سُبْحَانَ اللَّهِ',
  'الْحَمْدُ لِلَّهِ',
  'لَا إِلَٰهَ إِلَّا اللَّهُ',
  'اللَّهُ أَكْبَرُ',
  'أَسْتَغْفِرُ اللَّهَ',
  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
  'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
];

export default function AdhkarScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [activeTab, setActiveTab] = useState<'adhkar' | 'tasbih'>('adhkar');
  const [selectedCategory, setSelectedCategory] = useState<string>('أذكار الصباح');

  // Tasbih state
  const [tasbihCount, setTasbihCount] = useState(0);
  const [selectedZikr, setSelectedZikr] = useState(TASBIH_PRESETS[0]);
  const [targetCount, setTargetCount] = useState(33);

  // Adhkar progress state
  const [adhkarCounts, setAdhkarCounts] = useState<Record<string, number>>({});

  const handleTasbihPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = tasbihCount + 1;
    setTasbihCount(next);
    if (next % targetCount === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const resetTasbih = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTasbihCount(0);
  };

  const handleDhikrCardPress = (id: string, maxCount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = adhkarCounts[id] || 0;
    if (current < maxCount) {
      setAdhkarCounts((prev) => ({ ...prev, [id]: current + 1 }));
      if (current + 1 === maxCount) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const currentAzkarList = (azkarData as any)[selectedCategory] || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Segmented Switcher */}
      <View style={[styles.segmentedWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'tasbih' && { backgroundColor: colors.tint },
          ]}
          onPress={() => setActiveTab('tasbih')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'tasbih' ? '#ffffff' : colors.tabIconDefault },
            ]}
          >
            السبحة الذكية
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'adhkar' && { backgroundColor: colors.tint },
          ]}
          onPress={() => setActiveTab('adhkar')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'adhkar' ? '#ffffff' : colors.tabIconDefault },
            ]}
          >
            الأذكار اليومية
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tasbih' ? (
        /* ================= TASBIH TAB ================= */
        <ScrollView contentContainerStyle={styles.tasbihContent} showsVerticalScrollIndicator={false}>
          {/* Zikr Preset Horizontal Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
            {TASBIH_PRESETS.map((z) => (
              <TouchableOpacity
                key={z}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: selectedZikr === z ? colors.tint : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedZikr(z);
                  setTasbihCount(0);
                }}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    { color: selectedZikr === z ? '#ffffff' : colors.text },
                  ]}
                >
                  {z}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Current Zikr Display */}
          <Text style={[styles.currentZikrText, { color: colors.text }]}>{selectedZikr}</Text>

          {/* Big Interactive Tasbih Button */}
          <TouchableOpacity
            style={[styles.tasbihButton, { backgroundColor: colors.card, borderColor: colors.tint }]}
            activeOpacity={0.85}
            onPress={handleTasbihPress}
          >
            <View style={[styles.tasbihInnerGlow, { backgroundColor: `${colors.tint}12` }]}>
              <Text style={[styles.tasbihBigNumber, { color: colors.tint }]}>{tasbihCount}</Text>
              <Text style={[styles.tasbihTargetSub, { color: colors.tabIconDefault }]}>
                الهدف: {targetCount} • اضغط هنا
              </Text>
            </View>
          </TouchableOpacity>

          {/* Target & Reset Controls */}
          <View style={styles.tasbihControls}>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={resetTasbih}
            >
              <Ionicons name="refresh" size={18} color={colors.tabIconDefault} />
              <Text style={[styles.controlBtnText, { color: colors.tabIconDefault }]}>تصفير</Text>
            </TouchableOpacity>

            <View style={styles.targetsRow}>
              {[33, 100].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.targetBtn,
                    {
                      backgroundColor: targetCount === t ? colors.tint : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setTargetCount(t)}
                >
                  <Text
                    style={[
                      styles.targetBtnText,
                      { color: targetCount === t ? '#ffffff' : colors.text },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ================= ADHKAR TAB ================= */
        <View style={{ flex: 1 }}>
          {/* Category Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {Object.keys(azkarData).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === cat ? colors.tint : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selectedCategory === cat ? '#ffffff' : colors.text },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Adhkar Cards List */}
          <ScrollView contentContainerStyle={styles.adhkarList} showsVerticalScrollIndicator={false}>
            {currentAzkarList.map((item: any, idx: number) => {
              const current = adhkarCounts[`${selectedCategory}_${idx}`] || 0;
              const max = parseInt(item.count || '1', 10);
              const isCompleted = current >= max;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.adhkarCard,
                    {
                      backgroundColor: isCompleted ? `${colors.tint}08` : colors.card,
                      borderColor: isCompleted ? '#10b981' : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleDhikrCardPress(`${selectedCategory}_${idx}`, max)}
                >
                  <Text style={[styles.dhikrText, { color: colors.text }]}>{item.content}</Text>
                  {item.description ? (
                    <Text style={[styles.dhikrDesc, { color: colors.tabIconDefault }]}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.dhikrFooter}>
                    <View
                      style={[
                        styles.counterBadge,
                        { backgroundColor: isCompleted ? '#10b981' : colors.tint },
                      ]}
                    >
                      <Text style={styles.counterBadgeText}>
                        {current} / {max}
                      </Text>
                    </View>
                    <Text style={[styles.dhikrTapHint, { color: colors.tabIconDefault }]}>
                      {isCompleted ? 'تم بحمد الله ✓' : 'انقر للعد'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentedWrapper: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tasbihContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  presetsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 20,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentZikrText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  tasbihButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    shadowColor: '#4a6b8c',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  tasbihInnerGlow: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasbihBigNumber: {
    fontSize: 54,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  tasbihTargetSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  tasbihControls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  controlBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  targetsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  targetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  targetBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  categoryScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  adhkarList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  adhkarCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  dhikrText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    lineHeight: 26,
  },
  dhikrDesc: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 18,
  },
  dhikrFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  counterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dhikrTapHint: {
    fontSize: 12,
    fontWeight: '600',
  },
});
