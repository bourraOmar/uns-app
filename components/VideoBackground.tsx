import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

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
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
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
