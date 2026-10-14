import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  const homeTabBarStyle = {
    backgroundColor: '#1e293b',
    borderTopColor: '#334155',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 76 : 64,
    paddingBottom: Platform.OS === 'ios' ? 18 : 8,
    paddingTop: 8,
    position: 'absolute' as const,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  };

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#0f8e5d',
        tabBarInactiveTintColor: '#8ba7c0',
        tabBarStyle: { display: 'none' }, // By default hidden on any screen
        headerShown: false,
      }}>
      {/* Tab 5: Duas */}
      <Tabs.Screen
        name="duas"
        options={{
          title: 'الأدعية',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <FontAwesome5 name="praying-hands" size={20} color={color} />
            </View>
          ),
        }}
      />

      {/* Tab 4: Adhkar & Tasbih */}
      <Tabs.Screen
        name="adhkar"
        options={{
          title: 'الأذكار',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons name="counter" size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* Tab 3: Reciters */}
      <Tabs.Screen
        name="reciters"
        options={{
          title: 'القراء',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons name="account-voice" size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* Tab 2: Quran */}
      <Tabs.Screen
        name="quran"
        options={{
          title: 'المصحف',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name="book-outline" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Tab 1: Home (Main screen) - ONLY page where menu bar is visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarStyle: homeTabBarStyle,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name="home-outline" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Hide secondary screens */}
      <Tabs.Screen
        name="qibla"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
});
