import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import MiniAudioPlayer from '@/components/MiniAudioPlayer';

// --- CUSTOM SVG ICONS MATCHING SCREENSHOT EXACTLY ---

// 1. Square Open Book Icon (Used for المصحف)
function MushafSquareBookIcon({ size = 22, color = '#cbd5e1' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5H10.5C11.5 6.5 12 7.2 12 8V18.5C11.5 17.8 10.5 17.2 9.5 17.2H4V6.5Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <Path
        d="M20 6.5H13.5C12.5 6.5 12 7.2 12 8V18.5C12.5 17.8 13.5 17.2 14.5 17.2H20V6.5Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 2. Open Book with Radiating Rays Icon (Used for المُشغّل / Player)
function PlayerBookRaysIcon({ size = 22, color = '#cbd5e1' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2.5V5.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M6 4.5L8.5 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M18 4.5L15.5 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path
        d="M4.5 10.5H10.5C11.5 10.5 12 11.2 12 12V19.5C11.5 18.8 10.5 18.3 9.5 18.3H4.5V10.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path
        d="M19.5 10.5H13.5C12.5 10.5 12 11.2 12 12V19.5C12.5 18.8 13.5 18.3 14.5 18.3H19.5V10.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 3. Mosque / Gate Facade Icon (Used for الخدمات / Services)
function ServicesMosqueIcon({ size = 22, color = '#cbd5e1' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21V12C4 10 6 7 12 7C18 7 20 10 20 12V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 21V15C8.5 13.5 10 12.5 12 12.5C14 12.5 15.5 13.5 15.5 15V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M12 3V7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M2.5 21H21.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Menu items matching screenshot from left to right:
// الخدمات (Far Left) -> الأذكار -> المصحف -> المُشغّل -> الرئيسية (Far Right)
const TAB_ITEMS = [
  {
    name: 'duas',
    label: 'الخدمات',
    renderIcon: (color: string) => <ServicesMosqueIcon size={21} color={color} />,
  },
  {
    name: 'adhkar',
    label: 'الأذكار',
    renderIcon: (color: string) => (
      <MaterialCommunityIcons name="format-quote-close" size={22} color={color} />
    ),
  },
  {
    name: 'quran',
    label: 'المصحف',
    renderIcon: (color: string) => <MushafSquareBookIcon size={21} color={color} />,
  },
  {
    name: 'reciters',
    label: 'المُشغّل',
    renderIcon: (color: string) => <PlayerBookRaysIcon size={21} color={color} />,
  },
  {
    name: 'index',
    label: 'الرئيسية',
    renderIcon: (color: string) => <Ionicons name="home-outline" size={20} color={color} />,
  },
];

// Custom Floating Tab Bar Component
function FloatingTabBar({ state, navigation }: any) {
  const currentRoute = state.routes[state.index];

  // Hide on screens that have their own custom floating action bar (like reciters and qibla)
  if (currentRoute?.name === 'qibla' || currentRoute?.name === 'reciters') {
    return null;
  }

  return (
    <>
      <MiniAudioPlayer bottomOffset={Platform.OS === 'ios' ? 100 : 92} />
      <View style={styles.floatingBarContainer} pointerEvents="box-none">
      <BlurView
        intensity={Platform.OS === 'ios' ? 75 : 90}
        tint="dark"
        style={styles.floatingMenuBar}
      >
        {TAB_ITEMS.map((item) => {
          const isFocused = currentRoute?.name === item.name;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!isFocused) {
              navigation.navigate(item.name);
            }
          };

          if (isFocused) {
            return (
              <TouchableOpacity
                key={item.name}
                onPress={onPress}
                activeOpacity={0.8}
                style={styles.activePillTouchable}
              >
                <BlurView
                  intensity={Platform.OS === 'ios' ? 40 : 60}
                  tint="dark"
                  style={styles.floatingMenuItemActivePill}
                >
                  {item.renderIcon('#34d399')}
                  <Text style={styles.floatingMenuItemActiveText}>{item.label}</Text>
                </BlurView>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={item.name}
              style={styles.floatingMenuItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              {item.renderIcon('#8ba7c0')}
              <Text style={styles.floatingMenuItemText}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="duas" options={{ title: 'الأدعية' }} />
      <Tabs.Screen name="adhkar" options={{ title: 'الأذكار' }} />
      <Tabs.Screen name="reciters" options={{ title: 'القراء' }} />
      <Tabs.Screen name="quran" options={{ title: 'المصحف' }} />
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="qibla" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },
  floatingMenuBar: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 41, 59, 0.55)' : 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderTopColor: 'rgba(255, 255, 255, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  floatingMenuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 54,
    gap: 3,
  },
  floatingMenuItemText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#8ba7c0',
  },
  activePillTouchable: {
    borderRadius: 22,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingMenuItemActivePill: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(15, 142, 93, 0.28)' : 'rgba(15, 142, 93, 0.35)',
    borderWidth: 1.2,
    borderColor: 'rgba(52, 211, 153, 0.5)',
    borderTopColor: 'rgba(110, 231, 183, 0.8)',
    borderRadius: 22,
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 16,
    minWidth: 70,
    gap: 2,
  },
  floatingMenuItemActiveText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#34d399',
    textShadowColor: 'rgba(52, 211, 153, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
