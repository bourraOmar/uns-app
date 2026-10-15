import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

interface VideoBackgroundProps {
  source?: any;
  overlayOpacity?: number;
}

// Local video placed at assets/videos/background.mp4
const LOCAL_BACKGROUND_VIDEO = require('@/assets/videos/background.mp4');

/**
 * VideoBackground:
 * Renders the user's custom video background (assets/videos/background.mp4)
 * seamlessly looping in the background across iOS, Android, and Web.
 */
export function VideoBackground({
  source = LOCAL_BACKGROUND_VIDEO,
  overlayOpacity = 0.35,
}: VideoBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Video
        source={source}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
        shouldPlay
        useNativeControls={false}
      />
      {/* Subtle tint overlay to keep Islamic typography and cards crisp */}
      <View
        style={[
          styles.overlay,
          { backgroundColor: `rgba(7, 11, 19, ${overlayOpacity})` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});
