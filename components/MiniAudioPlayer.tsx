import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { useAppTheme } from '@/context/ThemeContext';

interface MiniAudioPlayerProps {
  bottomOffset?: number;
  style?: StyleProp<ViewStyle>;
}

export default function MiniAudioPlayer({
  bottomOffset = Platform.OS === 'ios' ? 100 : 92,
  style,
}: MiniAudioPlayerProps) {
  const { isDark } = useAppTheme();
  const {
    currentSurah,
    currentReciter,
    isPlaying,
    isLoadingAudio,
    togglePlay,
    nextSurah,
    openPlayerModal,
    isPlayerModalVisible,
  } = useAudioPlayer();

  // Hide if no audio is playing/paused or if the full player modal is open
  if (!currentSurah || isPlayerModalVisible) {
    return null;
  }

  const handlePillPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openPlayerModal();
  };

  const handlePlayToggle = (e: any) => {
    e.stopPropagation?.();
    togglePlay();
  };

  const handleNext = (e: any) => {
    e.stopPropagation?.();
    nextSurah();
  };

  const blurBg = isDark
    ? Platform.OS === 'ios' ? 'rgba(17, 24, 39, 0.72)' : 'rgba(15, 23, 42, 0.92)'
    : Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(226, 232, 240, 0.9)';
  const borderTopColor = isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const iconColor = isDark ? '#ffffff' : '#0f172a';

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: bottomOffset },
        style,
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.pillContainer}
        activeOpacity={0.92}
        onPress={handlePillPress}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 65 : 85}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blurContent,
            { backgroundColor: blurBg, borderColor, borderTopColor },
          ]}
        >
          {/* LEFT SIDE: Circular Mic Badge + Surah & Reciter Details */}
          <View style={styles.leftInfoSection}>
            <View style={styles.micCircle}>
              <Ionicons name="mic" size={18} color="#10b981" />
            </View>

            <View style={styles.textColumn}>
              {/* Surah Number + English Name (Arabic Name) */}
              <Text style={[styles.surahTitleText, { color: textColor }]} numberOfLines={1}>
                {currentSurah.id}. {currentSurah.name_simple} ({currentSurah.name_arabic})
              </Text>

              {/* Reciter Name - Green text directly underneath */}
              <Text style={styles.reciterNameText} numberOfLines={1}>
                {currentReciter.name || currentReciter.englishName}
              </Text>
            </View>
          </View>

          {/* RIGHT SIDE: Play/Pause + Fast Forward / Next Controls */}
          <View style={styles.controlsRow}>
            {/* Play / Pause Button */}
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={handlePlayToggle}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              {isLoadingAudio ? (
                <ActivityIndicator size="small" color={isDark ? '#ffffff' : '#10b981'} />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={20}
                  color={iconColor}
                  style={isPlaying ? undefined : { marginLeft: 2 }}
                />
              )}
            </TouchableOpacity>

            {/* Next Track Button (Matching the double forward chevron in screenshot) */}
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={handleNext}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Ionicons name="play-forward" size={19} color={iconColor} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    borderRadius: 26,
  },
  blurContent: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor:
      Platform.OS === 'ios' ? 'rgba(17, 24, 39, 0.72)' : 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: 'rgba(255, 255, 255, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 16,
  },
  leftInfoSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  micCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  surahTitleText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
    textAlign: 'left',
  },
  reciterNameText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11.5,
    color: '#10b981',
    marginTop: -1,
    textAlign: 'left',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
