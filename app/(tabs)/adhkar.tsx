import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useScrollCollapse } from '@/context/ScrollCollapseContext';
import { useAppTheme } from '@/context/ThemeContext';
import IslamicBackground from '@/components/IslamicBackground';

const SECTION_ICONS = {
  duas: require('@/assets/icons/section_duas.png'),
  adhkar: require('@/assets/icons/section_adhkar.png'),
  fadael: require('@/assets/icons/section_fadael.png'),
};

const GRID_ICONS = {
  tasbih: require('@/assets/icons/grid_tasbih.png'),
  ruqyah: require('@/assets/icons/app_ruqyah.png'),
  hajj: require('@/assets/icons/app_hajj_dua.png'),
  ramadan: require('@/assets/icons/app_ramadan.png'),
};

interface FeaturedSection {
  id: string;
  title: string;
  subtitle: string;
  customIcon: any;
  type: 'duas' | 'adhkar' | 'fadael';
}

interface GridItem {
  id: string;
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: any;
  route: string;
}

const FEATURED_SECTIONS: FeaturedSection[] = [
  {
    id: 'duas',
    title: 'قسم الأدعية',
    subtitle: 'أدعية مختارة موثوقة من القرآن والسنة',
    customIcon: SECTION_ICONS.duas,
    type: 'duas',
  },
  {
    id: 'adhkar',
    title: 'قسم الأذكار',
    subtitle: 'أذكار الصباح والمساء والصلاة',
    customIcon: SECTION_ICONS.adhkar,
    type: 'adhkar',
  },
  {
    id: 'fadael',
    title: 'قسم الفضائل',
    subtitle: 'فضائل الذكر والصلاة على النبي ﷺ',
    customIcon: SECTION_ICONS.fadael,
    type: 'fadael',
  },
];

const GRID_SECTIONS: GridItem[] = [
  {
    id: 'tasbih',
    title: 'المسبحة',
    subtitle: 'عدّاد تسبيح بسيط وسريع',
    customIcon: GRID_ICONS.tasbih,
    route: '/tasbih',
  },
  {
    id: 'ruqyah',
    title: 'الرقية الشرعية',
    subtitle: 'آيات وأدعية للتحصين والشفاء',
    customIcon: GRID_ICONS.ruqyah,
    route: '/dhikr/ruqyah',
  },
  {
    id: 'ramadan',
    title: 'سنن رمضان والصيام',
    subtitle: 'أدعية الإفطار وقيام الليل',
    customIcon: GRID_ICONS.ramadan,
    route: '/dhikr/ramadan',
  },
  {
    id: 'hajj',
    title: 'أعمال الحج',
    subtitle: 'مناسك الحج والتلبية والأدعية',
    customIcon: GRID_ICONS.hajj,
    route: '/dhikr/hajj',
  },
  {
    id: 'sleep',
    title: 'أذكار النوم',
    subtitle: 'تحصين النفس والسكينة قبل النوم',
    icon: 'bed-outline',
    route: '/dhikr/sleep',
  },
  {
    id: 'wake_up',
    title: 'أذكار الاستيقاظ',
    subtitle: 'حمد النعمة وبركة الصباح الجديد',
    icon: 'sunny-outline',
    route: '/dhikr/wake_up',
  },
];

export default function AdhkarScreen() {
  const router = useRouter();
  const { onScroll } = useScrollCollapse();
  const { isDark } = useAppTheme();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const colors = {
    title: isDark ? '#ffffff' : '#0f172a',
    subtitle: isDark ? '#94a3b8' : '#64748b',
    headerBtnBg: isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(241, 245, 249, 0.85)',
    headerBtnBorder: isDark ? '#334155' : '#cbd5e1',
    headerBtnIcon: isDark ? '#f8fafc' : '#1e293b',
    cardBg: isDark ? 'rgba(26, 38, 57, 0.78)' : 'rgba(255, 255, 255, 0.85)',
    cardBorder: isDark ? 'rgba(51, 65, 85, 0.55)' : 'rgba(226, 232, 240, 0.85)',
    iconBadgeBg: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.12)',
    iconBadgeBorder: isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.25)',
    iconColor: isDark ? '#34d399' : '#059669',
    chevron: isDark ? '#64748b' : '#94a3b8',
    modalBg: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    sheetBg: isDark ? '#1e293b' : '#ffffff',
    sheetBorder: isDark ? '#334155' : '#e2e8f0',
  };

  const handleFeaturedPress = (section: FeaturedSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (section.type === 'adhkar') {
      router.push('/category/adhkar' as any);
    } else if (section.type === 'duas') {
      router.push('/category/duas' as any);
    } else if (section.type === 'fadael') {
      router.push('/category/fadael' as any);
    }
  };

  const handleGridPress = (item: GridItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.route as any);
  };

  // Filter grid items if searching
  const filteredGrid = GRID_SECTIONS.filter((it) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return it.title.toLowerCase().includes(q) || it.subtitle.toLowerCase().includes(q);
  });

  const filteredFeatured = FEATURED_SECTIONS.filter((it) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return it.title.toLowerCase().includes(q) || it.subtitle.toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* TOP BAR MATCHING SCREENSHOT 1 */}
        <View style={styles.topHeader}>
          {/* Left Actions: Profile/Services, Favorites/Bookmarks, Search */}
          <View style={styles.leftActions}>
            {/* 1. Profile / Khadamat shortcut */}
            <TouchableOpacity
              style={[
                styles.circleActionBtn,
                { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder },
              ]}
              activeOpacity={0.75}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/duas' as any);
              }}
            >
              <Ionicons name="person-outline" size={18} color={colors.headerBtnIcon} />
            </TouchableOpacity>

            {/* 2. Bookmarks / Favorites shortcut */}
            <TouchableOpacity
              style={[
                styles.circleActionBtn,
                { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder },
              ]}
              activeOpacity={0.75}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/dhikr/morning' as any);
              }}
            >
              <Ionicons name="bookmark-outline" size={18} color={colors.headerBtnIcon} />
            </TouchableOpacity>

            {/* 3. Search Toggle */}
            <TouchableOpacity
              style={[
                styles.circleActionBtn,
                { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder },
                showSearch && styles.circleActionBtnActive,
              ]}
              activeOpacity={0.75}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSearch(!showSearch);
              }}
            >
              <Ionicons
                name={showSearch ? 'close-outline' : 'search-outline'}
                size={18}
                color={showSearch ? '#10b981' : colors.headerBtnIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Right: Screen Title "الأذكار" */}
          <Text style={[styles.screenTitle, { color: colors.title }]}>الأذكار</Text>
        </View>

        {/* Collapsible Search Input */}
        {showSearch && (
          <View style={styles.searchBarWrapper}>
            <View
              style={[
                styles.searchBarContainer,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <Ionicons name="search" size={18} color={colors.subtitle} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="ابحث عن قسم أو ذكر (صباح، رقية، حج، مسبحة)..."
                placeholderTextColor={colors.subtitle}
                style={[styles.searchInput, { color: colors.title }]}
                textAlign="right"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.subtitle} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* MAIN SCROLL VIEW */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* SECTION 1: TOP 3 HORIZONTAL FEATURED CARDS */}
          <View style={styles.featuredSection}>
            {filteredFeatured.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.featuredCard,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.82}
                onPress={() => handleFeaturedPress(section)}
              >
                {/* Left: Chevron */}
                <Ionicons name="chevron-back" size={20} color={colors.chevron} />

                {/* Middle: Text details */}
                <View style={styles.featuredDetails}>
                  <Text style={[styles.featuredTitle, { color: colors.title }]}>
                    {section.title}
                  </Text>
                  <Text style={[styles.featuredSubtitle, { color: colors.subtitle }]}>
                    {section.subtitle}
                  </Text>
                </View>

                {/* Right: Emerald Icon Circle Badge */}
                <View
                  style={[
                    styles.iconBadgeLarge,
                    {
                      backgroundColor: colors.iconBadgeBg,
                      borderColor: colors.iconBadgeBorder,
                    },
                  ]}
                >
                  <Image
                    source={section.customIcon}
                    style={{ width: 26, height: 26, tintColor: colors.iconColor }}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* SECTION 2: 2-COLUMN GRID OF SPECIALIZED DHIKR CARDS */}
          <View style={styles.gridSection}>
            {filteredGrid.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.gridCard,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.82}
                onPress={() => handleGridPress(item)}
              >
                {/* Top Center: Emerald Icon Badge */}
                <View
                  style={[
                    styles.iconBadgeMedium,
                    {
                      backgroundColor: colors.iconBadgeBg,
                      borderColor: colors.iconBadgeBorder,
                    },
                  ]}
                >
                  {item.customIcon ? (
                    <Image
                      source={item.customIcon}
                      style={{ width: 22, height: 22, tintColor: colors.iconColor }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons name={item.icon!} size={22} color={colors.iconColor} />
                  )}
                </View>

                {/* Bottom Center: Title & Subtitle */}
                <View style={styles.gridTextContainer}>
                  <Text
                    style={[styles.gridTitle, { color: colors.title }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.gridSubtitle, { color: colors.subtitle }]}
                    numberOfLines={2}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  /* TOP BAR */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  screenTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 32,
    letterSpacing: -0.3,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  circleActionBtnActive: {
    borderColor: '#10b981',
  },

  /* SEARCH BAR */
  searchBarWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    padding: 0,
  },

  /* SCROLL CONTENT */
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Extra space for floating bottom tab bar
  },

  /* FEATURED SECTION (TOP 3 HORIZONTAL CARDS) */
  featuredSection: {
    gap: 12,
    marginBottom: 14,
  },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  featuredDetails: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 14,
  },
  featuredTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
    marginBottom: 2,
  },
  featuredSubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 12.5,
  },
  iconBadgeLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* GRID SECTION (2 COLUMNS) */
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    minHeight: 140,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBadgeMedium: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  gridTextContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  gridTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 4,
  },
  gridSubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 17,
  },

  /* MODAL BOTTOM SHEET */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748b',
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalSheetTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 19,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionsList: {
    gap: 10,
  },
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  modalOptionInfo: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  modalOptionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  modalOptionSub: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 12,
  },
  modalOptionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
