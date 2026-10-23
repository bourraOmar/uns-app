import React from 'react';
import { StyleSheet, View, Image, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';

interface IslamicBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * IslamicBackground
 * Unified professional background across the entire app.
 * Features a dual-color linear gradient (Islamic Midnight Navy -> Rich Emerald)
 * overlaid with the Pinterest-style intricate Islamic geometric starburst pattern.
 */
export default function IslamicBackground({ children, style }: IslamicBackgroundProps) {
  const { isDark } = useAppTheme();

  // Two principal colors gradient
  // Dark mode: Deep Islamic Midnight Navy (#081226) -> Rich Emerald Teal (#042828)
  // Light mode: Warm Pearl Cream (#fbf9f5) -> Soft Golden Sand (#ede6d8)
  const gradientColors = isDark
    ? (['#081226', '#042828'] as const)
    : (['#fbf9f5', '#ede6d8'] as const);

  if (!children) {
    // Used as self-closing background layer: <IslamicBackground />
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={require('@/assets/images/islamic_bg_pattern.jpg')}
          style={[
            styles.patternImage,
            { opacity: isDark ? 0.085 : 0.22 },
          ]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Used as wrapper: <IslamicBackground>{children}</IslamicBackground>
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={require('@/assets/images/islamic_bg_pattern.jpg')}
        style={[
          styles.patternImage,
          { opacity: isDark ? 0.085 : 0.22 },
        ]}
        resizeMode="cover"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  patternImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});
