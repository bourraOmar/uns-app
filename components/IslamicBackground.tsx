import React from 'react';
import { StyleSheet, View, Image, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';

interface IslamicBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  forceTheme?: 'dark' | 'light';
}

/**
 * IslamicBackground
 * Unified professional background across the entire app.
 * Features a dual-color linear gradient (Islamic Midnight Navy -> Rich Emerald)
 * overlaid with the Pinterest-style intricate Islamic geometric starburst pattern.
 * Always renders the signature dark Islamic theme to match white typography and dark cards.
 */
export default function IslamicBackground({ children, style, forceTheme }: IslamicBackgroundProps) {
  const { isDark } = useAppTheme();
  
  // Use signature dark gradient by default so all screens maintain high contrast and luxury dark styling
  const effectiveDark = forceTheme ? forceTheme === 'dark' : true;

  const gradientColors = effectiveDark
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
            { opacity: effectiveDark ? 0.085 : 0.22 },
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
          { opacity: effectiveDark ? 0.085 : 0.22 },
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
