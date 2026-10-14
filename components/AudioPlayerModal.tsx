import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Reciter } from '@/data/reciters';

interface SurahItem {
  id: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: string;
  verses_count: number;
  start_page: number;
  vocalized_name: string;
}

interface AudioPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  surah: SurahItem | null;
  reciter: Reciter;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  positionMillis: number;
  durationMillis: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (millis: number) => void;
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

export default function AudioPlayerModal({
  visible,
  onClose,
  surah,
  reciter,
  isPlaying,
  isLoadingAudio,
  positionMillis,
  durationMillis,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  currentSpeed,
  onSpeedChange,
}: AudioPlayerModalProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [scrubbingPosition, setScrubbingPosition] = useState<number | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up sleep timer on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, []);

  // Format milliseconds to mm:ss or hh:mm:ss
  const formatTime = (millis: number) => {
    if (!millis || isNaN(millis) || millis < 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const effectivePosition = scrubbingPosition !== null ? scrubbingPosition : positionMillis;
  const progressRatio = durationMillis > 0 ? Math.min(1, Math.max(0, effectivePosition / durationMillis)) : 0;
  const remainingMillis = Math.max(0, durationMillis - effectivePosition);

  // Cycle playback speed
  const handleCycleSpeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = SPEED_OPTIONS.indexOf(currentSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    onSpeedChange(SPEED_OPTIONS[nextIndex]);
  };

  // Cycle sleep timer: Off -> 15m -> 30m -> 60m -> Off
  const handleCycleSleepTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (sleepTimerMinutes === null) {
      setSleepTimerMinutes(15);
      sleepTimerRef.current = setTimeout(() => {
        if (isPlaying) onTogglePlay();
        setSleepTimerMinutes(null);
      }, 15 * 60 * 1000);
    } else if (sleepTimerMinutes === 15) {
      setSleepTimerMinutes(30);
      sleepTimerRef.current = setTimeout(() => {
        if (isPlaying) onTogglePlay();
        setSleepTimerMinutes(null);
      }, 30 * 60 * 1000);
    } else if (sleepTimerMinutes === 30) {
      setSleepTimerMinutes(60);
      sleepTimerRef.current = setTimeout(() => {
        if (isPlaying) onTogglePlay();
        setSleepTimerMinutes(null);
      }, 60 * 60 * 1000);
    } else {
      setSleepTimerMinutes(null);
    }
  };

  // Share Surah recitation
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!surah) return;
    try {
      await Share.share({
        message: `سورة ${surah.name_arabic} - ${surah.name_simple}\nبصوت القارئ: ${reciter.englishName || reciter.name}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Jump to Quran Mushaf reading page for the current surah
  const handleOpenMushaf = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push('/quran' as any);
  };

  // Scrubber touch handler
  const handleScrubPress = (event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    const barWidth = Dimensions.get('window').width - 40; // padding 20 on each side
    const ratio = Math.min(1, Math.max(0, locationX / barWidth));
    const targetMillis = ratio * durationMillis;
    Haptics.selectionAsync();
    onSeek(targetMillis);
  };

  if (!surah) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Subtle Ambient Glowing Blue Light at bottom right matching screenshot */}
        <View style={styles.ambientGlow} pointerEvents="none" />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* 1. TOP HEADER & HANDLE */}
          <View style={styles.topSection}>
            {/* Grabber Handle */}
            <TouchableOpacity
              style={styles.handleTouchable}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 30, right: 30 }}
            >
              <View style={styles.grabberPill} />
            </TouchableOpacity>

            {/* Background Sound Capsule Button */}
            <TouchableOpacity
              style={styles.bgSoundCapsule}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="chevron-down" size={14} color="#ffffff" style={styles.bgSoundChevron} />
              <Text style={styles.bgSoundText}>Background sound</Text>
            </TouchableOpacity>
          </View>

          {/* 2. SPACER / ARTWORK AREA */}
          <View style={styles.centerCanvas}>
            {/* Elegant large reciter watermark / subtle aura */}
            <View style={styles.micAuraCircle}>
              <Ionicons name="mic-outline" size={90} color="rgba(255, 255, 255, 0.05)" />
            </View>
          </View>

          {/* 3. TRACK & RECITER INFO SECTION */}
          <View style={styles.trackInfoSection}>
            {/* Left: Avatar + Title & Subtitle */}
            <View style={styles.leftInfoGroup}>
              {/* Circular Avatar */}
              <View style={styles.avatarCircle}>
                <Ionicons name="mic" size={22} color="#34d399" />
              </View>

              {/* Title & Artist */}
              <View style={styles.namesColumn}>
                <Text style={styles.surahTitle} numberOfLines={1}>
                  {surah.name_simple}
                </Text>
                <Text style={styles.reciterSubtitle} numberOfLines={1}>
                  {reciter.englishName || reciter.name}
                </Text>
              </View>
            </View>

            {/* Right: Star Favorite Button */}
            <TouchableOpacity
              style={styles.starButton}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsFavorited(!isFavorited);
              }}
            >
              <Ionicons
                name={isFavorited ? 'star' : 'star-outline'}
                size={24}
                color={isFavorited ? '#fbbf24' : '#ffffff'}
              />
            </TouchableOpacity>
          </View>

          {/* 4. MAIN CONTROLS ROW */}
          <View style={styles.controlsRow}>
            {/* Speed Toggle (1x) */}
            <TouchableOpacity
              style={styles.speedButton}
              activeOpacity={0.7}
              onPress={handleCycleSpeed}
            >
              <Text style={styles.speedText}>{currentSpeed}x</Text>
            </TouchableOpacity>

            {/* Previous Track Button */}
            <TouchableOpacity
              style={styles.skipButton}
              activeOpacity={0.7}
              onPress={onPrev}
            >
              <Ionicons name="play-skip-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Big Play / Pause Button in Center */}
            <TouchableOpacity
              style={styles.centerPlayButton}
              activeOpacity={0.85}
              onPress={onTogglePlay}
            >
              {isLoadingAudio ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={36}
                  color="#ffffff"
                  style={isPlaying ? undefined : { marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>

            {/* Next Track Button */}
            <TouchableOpacity
              style={styles.skipButton}
              activeOpacity={0.7}
              onPress={onNext}
            >
              <Ionicons name="play-skip-forward" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Sleep Timer Icon */}
            <TouchableOpacity
              style={styles.sleepButton}
              activeOpacity={0.7}
              onPress={handleCycleSleepTimer}
            >
              <Image
                source={require('@/assets/icons/player_sleep.png')}
                style={{
                  width: 20,
                  height: 20,
                  tintColor: sleepTimerMinutes !== null ? '#34d399' : '#94a3b8',
                }}
                resizeMode="contain"
              />
              {sleepTimerMinutes !== null && (
                <Text style={styles.sleepTimerBadgeText}>{sleepTimerMinutes}m</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 5. PROGRESS BAR & TIMERS */}
          <View style={styles.progressSection}>
            {/* Touch Scrubber Track */}
            <TouchableOpacity
              style={styles.progressBarTouchTarget}
              activeOpacity={1}
              onPress={handleScrubPress}
            >
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
              </View>
            </TouchableOpacity>

            {/* Timers Row */}
            <View style={styles.timersRow}>
              <Text style={styles.timeElapsedText}>{formatTime(effectivePosition)}</Text>
              <Text style={styles.timeRemainingText}>
                {durationMillis > 0 ? `-${formatTime(remainingMillis)}` : '-0:00'}
              </Text>
            </View>
          </View>

          {/* 6. BOTTOM UTILITY BAR */}
          <View style={styles.bottomUtilityBar}>
            {/* Volume Icon */}
            <TouchableOpacity
              style={styles.utilityIconButton}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="volume-medium-outline" size={23} color="#94a3b8" />
            </TouchableOpacity>

            {/* Arabic Calligraphy Letter "ق" (Jump to Mushaf) */}
            <TouchableOpacity
              style={styles.utilityIconButton}
              activeOpacity={0.7}
              onPress={handleOpenMushaf}
            >
              <Text style={styles.qafLetterText}>ق</Text>
            </TouchableOpacity>

            {/* Share Audio Icon */}
            <TouchableOpacity
              style={styles.utilityIconButton}
              activeOpacity={0.7}
              onPress={handleShare}
            >
              <Image
                source={require('@/assets/icons/player_share.png')}
                style={{ width: 22, height: 22, tintColor: '#94a3b8' }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Queue / Tracks List Icon */}
            <TouchableOpacity
              style={styles.utilityIconButton}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Ionicons name="list" size={23} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#070b13', // Deep midnight space matching screenshot
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },

  /* AMBIENT BLUE/CYAN GLOW AT BOTTOM-RIGHT */
  ambientGlow: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(14, 116, 218, 0.28)',
  },

  /* TOP SECTION */
  topSection: {
    alignItems: 'center',
    paddingTop: 6,
  },
  handleTouchable: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grabberPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  bgSoundCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 6,
    gap: 6,
  },
  bgSoundChevron: {
    marginRight: 2,
  },
  bgSoundText: {
    fontSize: 13,
    color: '#ffffff',
    fontFamily: 'Cairo_600SemiBold',
  },

  /* CANVAS CENTER SPACER */
  centerCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micAuraCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* TRACK & RECITER INFO SECTION */
  trackInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 26,
  },
  leftInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  namesColumn: {
    flex: 1,
  },
  surahTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#ffffff',
    lineHeight: 28,
  },
  reciterSubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 1,
  },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* CONTROLS ROW */
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginBottom: 24,
  },
  speedButton: {
    minWidth: 36,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
  },
  skipButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepButton: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepTimerBadgeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 9,
    color: '#34d399',
    marginTop: 1,
  },

  /* PROGRESS BAR & TIMERS */
  progressSection: {
    paddingHorizontal: 22,
    marginBottom: 20,
  },
  progressBarTouchTarget: {
    paddingVertical: 10,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  timersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeElapsedText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
  timeRemainingText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#94a3b8',
  },

  /* BOTTOM UTILITY BAR */
  bottomUtilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
  },
  utilityIconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qafLetterText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
