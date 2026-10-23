import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import IslamicBackground from '@/components/IslamicBackground';

const DUA_RUB_EL_HIZB_ICON = require('@/assets/icons/dua_rub_el_hizb.png');
const AFTER_PRAYER_ICON = require('@/assets/icons/app_after_prayer.png');
const PRAYER_ADHKAR_ICON = require('@/assets/icons/app_prayer_adhkar.png');
const HAJJ_DUA_ICON = require('@/assets/icons/app_hajj_dua.png');

interface CategoryItemDef {
  id: string;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: any;
  route: string;
}

interface SectionDef {
  title: string;
  items: CategoryItemDef[];
}

const SECTIONS_CONFIG: Record<string, SectionDef> = {
  // Screenshot 1: قسم الأذكار
  adhkar: {
    title: 'قسم الأذكار',
    items: [
      { id: 'morning', title: 'أذكار الصباح', icon: 'sunny-outline', route: '/dhikr/morning' },
      { id: 'evening', title: 'أذكار المساء', icon: 'moon-outline', route: '/dhikr/evening' },
      { id: 'prayer', title: 'أذكار الصلاة', customIcon: PRAYER_ADHKAR_ICON, route: '/dhikr/prayer' },
      { id: 'after_prayer', title: 'أذكار بعد الصلاة', customIcon: AFTER_PRAYER_ICON, route: '/dhikr/after_prayer' },
      { id: 'wake_up', title: 'أذكار الاستيقاظ', icon: 'sunny-outline', route: '/dhikr/wake_up' },
      { id: 'sleep', title: 'أذكار النوم', icon: 'bed-outline', route: '/dhikr/sleep' },
    ],
  },

  // Screenshot 2: قسم الفضائل
  fadael: {
    title: 'قسم الفضائل',
    items: [
      { id: 'fadael_dhikr', title: 'فضل الذكر', icon: 'finger-print-outline', route: '/dhikr/fadael_dhikr' },
      { id: 'fadael_salawat', title: 'فضل الصلاة على النبي', icon: 'heart-outline', route: '/dhikr/fadael_salawat' },
      { id: 'fadael_kaaba', title: 'فضائل تعظيم البيت الحرام', icon: 'cube-outline', route: '/dhikr/fadael_kaaba' },
      { id: 'fadael_madinah', title: 'فضائل المدينة المنورة', icon: 'business-outline', route: '/dhikr/fadael_madinah' },
      { id: 'fadael_tasbih', title: 'فضل التسبيح والتحميد والتهليل والتكبير', icon: 'sparkles-outline', route: '/dhikr/fadael_tasbih' },
    ],
  },

  // Screenshot 3: قسم الأدعية (With Flaticon Rub-el-Hizb icon)
  duas: {
    title: 'قسم الأدعية',
    items: [
      {
        id: 'quranic_duas',
        title: 'أدعية من القرآن',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/quranic_duas',
      },
      {
        id: 'prophets_duas',
        title: 'أدعية النبي',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/prophets_duas',
      },
      {
        id: 'hajj',
        title: 'أدعية الحج والعمرة',
        customIcon: HAJJ_DUA_ICON,
        route: '/dhikr/hajj',
      },
      {
        id: 'travel',
        title: 'دعاء السفر',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/travel',
      },
      {
        id: 'farewell',
        title: 'دعاء المسافر للمقيم',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/farewell',
      },
      {
        id: 'sayyid_istighfar',
        title: 'دعاء سيد الاستغفار',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/sayyid_istighfar',
      },
      {
        id: 'new_clothes',
        title: 'دعاء لُبس الثوب الجديد',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/new_clothes',
      },
      {
        id: 'wearing_new_clothes',
        title: 'الدعاء لمن لبس ثوباً جديداً',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/wearing_new_clothes',
      },
      {
        id: 'vehicle_riding',
        title: 'دعاء الركوب (السيارة وما نحوها)',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/vehicle_riding',
      },
      {
        id: 'difficult_affair',
        title: 'دعاء من استصعب عليه أمر',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/difficult_affair',
      },
      {
        id: 'anguish_distress',
        title: 'دعاء الكرب',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/anguish_distress',
      },
      {
        id: 'grief_sorrow',
        title: 'دعاء الهم والحزن',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/grief_sorrow',
      },
      {
        id: 'visiting_sick',
        title: 'الدعاء للمريض في عيادته',
        customIcon: DUA_RUB_EL_HIZB_ICON,
        route: '/dhikr/visiting_sick',
      },
    ],
  },
};

export default function CategorySectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useAppTheme();

  const section = (id && SECTIONS_CONFIG[id]) || SECTIONS_CONFIG.duas;

  const colors = {
    title: isDark ? '#ffffff' : '#0f172a',
    headerBtnBg: isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(241, 245, 249, 0.85)',
    headerBtnBorder: isDark ? '#334155' : '#cbd5e1',
    headerBtnIcon: isDark ? '#f8fafc' : '#1e293b',
    cardBg: isDark ? 'rgba(26, 38, 57, 0.82)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: isDark ? 'rgba(51, 65, 85, 0.55)' : 'rgba(226, 232, 240, 0.85)',
    iconBadgeBg: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.12)',
    iconBadgeBorder: isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.25)',
    iconColor: isDark ? '#34d399' : '#059669',
    chevron: isDark ? '#64748b' : '#94a3b8',
  };

  const handleItemPress = (item: CategoryItemDef) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.route as any);
  };

  return (
    <View style={styles.container}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* TOP BAR MATCHING SCREENSHOTS */}
        <View style={styles.topHeader}>
          {/* Back Circular Button on Left */}
          <TouchableOpacity
            style={[
              styles.circleNavBtn,
              { backgroundColor: colors.headerBtnBg, borderColor: colors.headerBtnBorder },
            ]}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/adhkar' as any);
              }
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.headerBtnIcon} />
          </TouchableOpacity>

          {/* Title on Right */}
          <Text style={[styles.screenTitle, { color: colors.title }]}>
            {section.title}
          </Text>
        </View>

        {/* LIST OF PILL CARDS */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.listContainer}>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pillCard,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.78}
                onPress={() => handleItemPress(item)}
              >
                {/* Left: Chevron */}
                <Ionicons name="chevron-back" size={18} color={colors.chevron} />

                {/* Right: Title & Icon (in RTL layout) */}
                <View style={styles.pillInfo}>
                  <Text style={[styles.pillTitle, { color: colors.title }]}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: colors.iconBadgeBg,
                        borderColor: colors.iconBadgeBorder,
                      },
                    ]}
                  >
                    {item.customIcon ? (
                      <Image
                        source={item.customIcon}
                        style={{ width: 24, height: 24, tintColor: colors.iconColor }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons name={item.icon as any} size={20} color={colors.iconColor} />
                    )}
                  </View>
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

  /* TOP HEADER */
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
    fontSize: 28,
    letterSpacing: -0.3,
  },
  circleNavBtn: {
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

  /* SCROLL CONTENT */
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 6,
  },
  listContainer: {
    gap: 10,
  },
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  pillInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  pillTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    textAlign: 'right',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
