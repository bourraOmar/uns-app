import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * AnimatedGradientBackground:
 * Dignified, serene, dark spiritual Islamic gradient for the Quran player.
 * Clean, reverent, 100% native, and battery-friendly without any distracting 3D shaders or textures.
 */
export function AnimatedGradientBackground({ mode }: { mode?: string }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Primary Deep Islamic Dark Emerald to Midnight Charcoal Gradient */}
      <LinearGradient
        colors={['#09130f', '#0f241a', '#0b1a13', '#050907']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Gentle Top Ambient Lighting */}
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.07)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Subtle Center Serene Glow */}
      <LinearGradient
        colors={['transparent', 'rgba(16, 185, 129, 0.04)', 'transparent']}
        locations={[0.15, 0.5, 0.85]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

export { AnimatedGradientBackground as RubberFluid };
