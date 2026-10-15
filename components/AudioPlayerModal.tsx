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
  FlatList,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Reciter } from '@/data/reciters';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';
import { getSyncedVerses, SyncedVerse } from '@/services/quranTimingService';
import surahsData from '@/data/surahs.json';
import {
  BACKGROUND_SOUNDS,
  backgroundSoundService,
  BackgroundSoundItem,
} from '@/services/backgroundSoundService';

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
  onSelectSurah?: (surahId: number) => void;
  quranVolume?: number;
  onQuranVolumeChange?: (volume: number) => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
  isRepeat?: boolean;
  onToggleRepeat?: () => void;
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

type SleepTimerOption = null | 15 | 30 | 60 | 'end_of_surah';

const SURAH_ENGLISH_TRANSLATIONS: Record<number, string> = {
  1: 'The Opening',
  2: 'The Cow',
  3: 'Family of Imran',
  4: 'The Women',
  5: 'The Table Spread',
  6: 'The Cattle',
  7: 'The Heights',
  8: 'The Spoils of War',
  9: 'The Repentance',
  10: 'Jonah',
  11: 'Hud',
  12: 'Joseph',
  13: 'The Thunder',
  14: 'Abraham',
  15: 'The Rocky Tract',
  16: 'The Bee',
  17: 'The Night Journey',
  18: 'The Cave',
  19: 'Mary',
  20: 'Ta-Ha',
  21: 'The Prophets',
  22: 'The Pilgrimage',
  23: 'The Believers',
  24: 'The Light',
  25: 'The Criterion',
  26: 'The Poets',
  27: 'The Ant',
  28: 'The Stories',
  29: 'The Spider',
  30: 'The Romans',
  31: 'Luqman',
  32: 'The Prostration',
  33: 'The Combined Forces',
  34: 'Sheba',
  35: 'Originator',
  36: 'Ya-Sin',
  37: 'Those Who Set The Ranks',
  38: 'The Letter Saad',
  39: 'The Troops',
  40: 'The Forgiver',
  41: 'Explained in Detail',
  42: 'The Consultation',
  43: 'The Ornaments of Gold',
  44: 'The Smoke',
  45: 'The Crouching',
  46: 'The Wind-Curved Sandhills',
  47: 'Muhammad',
  48: 'The Victory',
  49: 'The Rooms',
  50: 'The Letter Qaf',
  51: 'The Winnowing Winds',
  52: 'The Mount',
  53: 'The Star',
  54: 'The Moon',
  55: 'The Beneficent',
  56: 'The Inevitable',
  57: 'The Iron',
  58: 'The Pleading Woman',
  59: 'The Exile',
  60: 'She That Is To Be Examined',
  61: 'The Ranks',
  62: 'The Congregation',
  63: 'The Hypocrites',
  64: 'Mutual Disillusion',
  65: 'The Divorce',
  66: 'The Prohibition',
  67: 'The Sovereignty',
  68: 'The Pen',
  69: 'The Reality',
  70: 'The Ascending Stairways',
  71: 'Noah',
  72: 'The Jinn',
  73: 'The Enshrouded One',
  74: 'The Cloaked One',
  75: 'The Resurrection',
  76: 'Man',
  77: 'The Emissaries',
  78: 'The Tidings',
  79: 'Those Who Drag Forth',
  80: 'He Frowned',
  81: 'The Overthrowing',
  82: 'The Cleaving',
  83: 'The Defrauding',
  84: 'The Splitting Open',
  85: 'The Mansions of the Stars',
  86: 'The Nightcomer',
  87: 'The Most High',
  88: 'The Overwhelming',
  89: 'The Dawn',
  90: 'The City',
  91: 'The Sun',
  92: 'The Night',
  93: 'The Morning Hours',
  94: 'The Relief',
  95: 'The Fig',
  96: 'The Clot',
  97: 'The Power',
  98: 'The Clear Proof',
  99: 'The Earthquake',
  100: 'The Courser',
  101: 'The Calamity',
  102: 'The Rivalry in World Increase',
  103: 'The Declining Day',
  104: 'The Traducer',
  105: 'The Elephant',
  106: 'Quraysh',
  107: 'The Small Kindness',
  108: 'The Abundance',
  109: 'The Disbelievers',
  110: 'The Divine Support',
  111: 'The Palm Fiber',
  112: 'The Sincerity',
  113: 'The Daybreak',
  114: 'Mankind',
};

interface AnimatedVerseRowProps {
  item: SyncedVerse;
  index: number;
  isActive: boolean;
  distance: number;
  onPress: () => void;
}

const AnimatedVerseRow = React.memo(
  ({ item, index, isActive, distance, onPress }: AnimatedVerseRowProps) => {
    const targetDistanceOpacity = isActive
      ? 1.0
      : distance === 1
      ? 0.45
      : distance === 2
      ? 0.28
      : distance === 3
      ? 0.16
      : 0.08;

    const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
    const distanceAnim = useRef(new Animated.Value(targetDistanceOpacity)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(activeAnim, {
          toValue: isActive ? 1 : 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(distanceAnim, {
          toValue: targetDistanceOpacity,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, [isActive, targetDistanceOpacity]);

    const scale = activeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.97, 1.05],
    });

    const inactiveTextOpacity = activeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });

    const activeTextOpacity = activeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={styles.verseTouchable}
      >
        <Animated.View
          style={[
            styles.verseItem,
            {
              transform: [{ scale }],
              opacity: distanceAnim,
            },
          ]}
        >
          {/* Inactive Verse Text */}
          <Animated.Text
            style={[
              styles.verseText,
              styles.inactiveVerseText,
              { opacity: inactiveTextOpacity },
            ]}
          >
            {item.text}
          </Animated.Text>

          {/* Active Glowing Mint Green Verse Text */}
          <Animated.Text
            style={[
              styles.verseText,
              styles.activeVerseText,
              StyleSheet.absoluteFill,
              { opacity: activeTextOpacity },
            ]}
          >
            {item.text}
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    );
  },
  (prev, next) => {
    return (
      prev.item.verseKey === next.item.verseKey &&
      prev.item.text === next.item.text &&
      prev.isActive === next.isActive &&
      prev.distance === next.distance
    );
  }
);

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
  onSelectSurah,
  quranVolume = 1.0,
  onQuranVolumeChange,
  isShuffle = false,
  onToggleShuffle,
  isRepeat = false,
  onToggleRepeat,
}: AudioPlayerModalProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [scrubbingPosition, setScrubbingPosition] = useState<number | null>(null);
  const [sleepTimer, setSleepTimer] = useState<SleepTimerOption>(null);
  const [showVerses, setShowVerses] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');
  const [syncedVerses, setSyncedVerses] = useState<SyncedVerse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [activeVerseIndex, setActiveVerseIndex] = useState<number>(-1);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [activeBgSoundId, setActiveBgSoundId] = useState<string>(
    backgroundSoundService.getCurrentSoundId()
  );
  const [bgVolume, setBgVolume] = useState<number>(backgroundSoundService.getVolume());
  const [showBgSoundSheet, setShowBgSoundSheet] = useState<boolean>(false);
  const [showVolumeCard, setShowVolumeCard] = useState<boolean>(false);

  const quranTrackRef = useRef<View>(null);
  const quranTrackLayoutRef = useRef<{ pageX: number; width: number } | null>(null);
  const bgTrackRef = useRef<View>(null);
  const bgTrackLayoutRef = useRef<{ pageX: number; width: number } | null>(null);

  useEffect(() => {
    const unsubscribe = backgroundSoundService.subscribe(() => {
      setActiveBgSoundId(backgroundSoundService.getCurrentSoundId());
      setBgVolume(backgroundSoundService.getVolume());
    });
    return unsubscribe;
  }, []);

  const activeBgSound = useMemo(() => {
    return BACKGROUND_SOUNDS.find((s) => s.id === activeBgSoundId) || BACKGROUND_SOUNDS[0];
  }, [activeBgSoundId]);

  const handleQuranVolumeTouch = (evt: GestureResponderEvent) => {
    const pageX = evt.nativeEvent.pageX;
    const layout = quranTrackLayoutRef.current;
    if (layout && layout.width > 0) {
      const relX = Math.max(0, Math.min(pageX - layout.pageX, layout.width));
      const newVol = relX / layout.width;
      onQuranVolumeChange?.(newVol);
    }
  };

  const handleBgSoundVolumeTouch = (evt: GestureResponderEvent) => {
    const pageX = evt.nativeEvent.pageX;
    const layout = bgTrackLayoutRef.current;
    if (layout && layout.width > 0) {
      const relX = Math.max(0, Math.min(pageX - layout.pageX, layout.width));
      const newVol = relX / layout.width;
      backgroundSoundService.setVolume(newVol);
    }
  };

  const flatListRef = useRef<FlatList<SyncedVerse> | null>(null);
  const queueFlatListRef = useRef<FlatList | null>(null);
  const progressBarRef = useRef<View>(null);
  const progressBarLayoutRef = useRef<{ pageX: number; width: number }>({
    pageX: 22,
    width: Dimensions.get('window').width - 44,
  });
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtered surahs for the Continue Playing playlist search
  const filteredQueueSurahs = useMemo(() => {
    if (!queueSearch.trim()) return surahsData;
    const q = queueSearch.trim().toLowerCase();
    return surahsData.filter((s) => {
      const eng = SURAH_ENGLISH_TRANSLATIONS[s.id]?.toLowerCase() || '';
      return (
        s.name_simple.toLowerCase().includes(q) ||
        s.name_arabic.includes(q) ||
        eng.includes(q) ||
        String(s.id).includes(q)
      );
    });
  }, [queueSearch]);

  // Auto-scroll queue to currently playing surah when opened
  useEffect(() => {
    if (showQueue && surah?.id && queueFlatListRef.current) {
      const idx = surahsData.findIndex((s) => s.id === surah.id);
      if (idx !== -1) {
        setTimeout(() => {
          try {
            queueFlatListRef.current?.scrollToIndex({
              index: idx,
              animated: true,
              viewPosition: 0.35,
            });
          } catch {}
        }, 150);
      }
    }
  }, [showQueue]);

  // Fetch synced verses whenever surah or reciter changes
  useEffect(() => {
    if (!surah) return;
    let isCancelled = false;

    const loadVerses = async () => {
      setIsLoadingVerses(true);
      const readId = parseInt(reciter.id) || 5; // Default to Al-Ajmi if non-numeric
      const data = await getSyncedVerses(surah.id, readId, durationMillis);
      if (!isCancelled) {
        setSyncedVerses(data);
        setIsLoadingVerses(false);
      }
    };

    loadVerses();

    return () => {
      isCancelled = true;
    };
  }, [surah?.id, reciter?.id]);

  // Clean up sleep timer on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
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

  // Determine effective active verse index
  const effectiveActiveIndex = useMemo(() => {
    if (!syncedVerses || syncedVerses.length === 0) return 0;
    const found = syncedVerses.findIndex(
      (v) => effectivePosition >= v.startTime && effectivePosition < v.endTime
    );
    if (found !== -1) return found;

    // If before first verse or near start, highlight first verse
    if (effectivePosition <= syncedVerses[0].startTime) return 0;

    // If after last verse
    if (effectivePosition >= syncedVerses[syncedVerses.length - 1].endTime) {
      return syncedVerses.length - 1;
    }

    // Find latest started verse
    for (let i = syncedVerses.length - 1; i >= 0; i--) {
      if (effectivePosition >= syncedVerses[i].startTime) {
        return i;
      }
    }
    return 0;
  }, [effectivePosition, syncedVerses]);

  // Update active verse index and auto-scroll
  useEffect(() => {
    if (!syncedVerses || syncedVerses.length === 0) return;

    if (effectiveActiveIndex !== activeVerseIndex) {
      setActiveVerseIndex(effectiveActiveIndex);

      if (showVerses && !isUserScrollingRef.current && flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({
            index: effectiveActiveIndex,
            animated: true,
            viewPosition: 0.5,
          });
        } catch (e) {
          // ignore index out of bounds
        }
      }
    }
  }, [effectiveActiveIndex, showVerses]);

  // Center active verse immediately when opening verses view
  useEffect(() => {
    if (showVerses && flatListRef.current && effectiveActiveIndex >= 0) {
      const timer = setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: effectiveActiveIndex,
            animated: true,
            viewPosition: 0.5,
          });
        } catch (e) {
          // ignore
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [showVerses]);

  // Cycle playback speed
  const handleCycleSpeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = SPEED_OPTIONS.indexOf(currentSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    onSpeedChange(SPEED_OPTIONS[nextIndex]);
  };

  // End of Surah watcher for sleep timer
  useEffect(() => {
    if (sleepTimer === 'end_of_surah' && isPlaying && durationMillis > 0) {
      if (positionMillis >= durationMillis - 1200) {
        if (isPlaying) {
          onTogglePlay();
        }
        setSleepTimer(null);
      }
    }
  }, [positionMillis, durationMillis, sleepTimer, isPlaying]);

  // Set sleep timer directly
  const selectSleepTimer = (option: SleepTimerOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    setSleepTimer(option);

    if (typeof option === 'number') {
      sleepTimerRef.current = setTimeout(() => {
        if (isPlaying) onTogglePlay();
        setSleepTimer(null);
      }, option * 60 * 1000);
    }
  };

  // Cycle sleep timer: Off -> 15m -> 30m -> 60m -> نهاية السورة -> Off
  const handleCycleSleepTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sleepTimer === null) {
      selectSleepTimer(15);
    } else if (sleepTimer === 15) {
      selectSleepTimer(30);
    } else if (sleepTimer === 30) {
      selectSleepTimer(60);
    } else if (sleepTimer === 60) {
      selectSleepTimer('end_of_surah');
    } else {
      selectSleepTimer(null);
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

  // Timeline Scrubber Gesture Handlers (Tap + Continuous Drag)
  const updateScrubbingFromPageX = (pageX: number) => {
    if (durationMillis <= 0) return 0;
    const { pageX: barX, width: barWidth } = progressBarLayoutRef.current;
    if (barWidth <= 0) return 0;
    const relativeX = Math.max(0, Math.min(pageX - barX, barWidth));
    const ratio = relativeX / barWidth;
    const targetMillis = Math.round(ratio * durationMillis);
    setScrubbingPosition(targetMillis);
    return targetMillis;
  };

  const handleScrubberGrant = (evt: GestureResponderEvent) => {
    setIsScrubbing(true);
    progressBarRef.current?.measure((x, y, width, height, pageX) => {
      if (width > 0) {
        progressBarLayoutRef.current = { pageX, width };
      }
    });
    Haptics.selectionAsync();
    updateScrubbingFromPageX(evt.nativeEvent.pageX);
  };

  const handleScrubberMove = (evt: GestureResponderEvent) => {
    updateScrubbingFromPageX(evt.nativeEvent.pageX);
  };

  const handleScrubberRelease = (evt: GestureResponderEvent) => {
    const finalMillis = updateScrubbingFromPageX(evt.nativeEvent.pageX);
    setIsScrubbing(false);
    setScrubbingPosition(null);
    onSeek(finalMillis);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVersePress = (verse: SyncedVerse, index: number) => {
    Haptics.selectionAsync();
    setActiveVerseIndex(index);
    onSeek(verse.startTime);
    try {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    } catch (e) {
      // ignore
    }
  };

  const halfCanvasPadding = canvasHeight > 0 ? Math.max(80, (canvasHeight - 65) / 2) : 180;

  if (!surah) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* FULLSCREEN VIDEO BACKGROUND */}
        <AnimatedGradientBackground />

        {/* Soft veil behind verses so text glows brilliantly over video */}
        {showVerses && <View style={styles.versesOverlayScrim} pointerEvents="none" />}

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* 1. TOP HEADER: HANDLE & CAPSULE BUTTON */}
          <View style={styles.topSection}>
            {/* Grabber Handle */}
            <TouchableOpacity
              style={styles.handleTouchable}
              onPress={onClose}
              hitSlop={{ top: 14, bottom: 14, left: 40, right: 40 }}
            >
              <View style={styles.grabberPill} />
            </TouchableOpacity>

            {/* Background Sound Capsule Button - Always displayed */}
            <TouchableOpacity
              style={[
                styles.bgSoundCapsule,
                activeBgSound.id !== 'none' && styles.bgSoundCapsuleActive,
              ]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowBgSoundSheet((prev) => !prev);
              }}
            >
              <Ionicons
                name={showBgSoundSheet ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={activeBgSound.id !== 'none' ? '#34d399' : '#ffffff'}
                style={styles.bgSoundChevron}
              />
              <Text
                style={[
                  styles.bgSoundText,
                  activeBgSound.id !== 'none' && styles.bgSoundTextActive,
                ]}
              >
                {activeBgSound.id !== 'none' ? activeBgSound.nameArabic : 'Background sound'}
              </Text>
              {activeBgSound.id !== 'none' && <View style={styles.bgSoundActiveDot} />}
            </TouchableOpacity>
          </View>

          {/* 2. CENTER CANVAS: PLAYLIST QUEUE / SCROLLABLE VERSES / MIC WATERMARK DISC */}
          <View
            style={styles.centerCanvas}
            onLayout={(e) => {
              const { height } = e.nativeEvent.layout;
              if (height > 0 && Math.abs(height - canvasHeight) > 2) {
                setCanvasHeight(height);
              }
            }}
          >
            {showQueue ? (
              <BlurView
                intensity={Platform.OS === 'ios' ? 70 : 85}
                tint="dark"
                style={styles.queueCardContainer}
              >
                {/* 1. Header: Continue Playing + Shuffle & Repeat Buttons */}
                <View style={styles.queueHeaderRow}>
                  <Text style={styles.queueHeaderTitle}>Continue Playing</Text>
                  <View style={styles.queueHeaderActions}>
                    <TouchableOpacity
                      style={[styles.queueIconBtn, isShuffle && styles.queueIconBtnActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onToggleShuffle?.();
                      }}
                    >
                      <Ionicons
                        name="shuffle"
                        size={17}
                        color={isShuffle ? '#34d399' : '#cbd5e1'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.queueIconBtn, isRepeat && styles.queueIconBtnActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onToggleRepeat?.();
                      }}
                    >
                      <Ionicons
                        name="repeat"
                        size={17}
                        color={isRepeat ? '#34d399' : '#cbd5e1'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Search Input Capsule */}
                <View style={styles.queueSearchCapsule}>
                  <Ionicons name="search" size={17} color="#94a3b8" />
                  <TextInput
                    style={styles.queueSearchTextInput}
                    placeholder="Search"
                    placeholderTextColor="#64748b"
                    value={queueSearch}
                    onChangeText={setQueueSearch}
                    autoCorrect={false}
                  />
                  {queueSearch.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setQueueSearch('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 3. Playlist / Tracks List */}
                <FlatList
                  ref={queueFlatListRef}
                  data={filteredQueueSurahs}
                  keyExtractor={(item) => String(item.id)}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.queueListContent}
                  renderItem={({ item }) => {
                    const isCurrent = item.id === surah?.id;
                    const englishSubtitle =
                      SURAH_ENGLISH_TRANSLATIONS[item.id] || `${item.verses_count} Verses`;

                    return (
                      <TouchableOpacity
                        style={[styles.queueItemRow, isCurrent && styles.queueItemRowActive]}
                        activeOpacity={0.75}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          if (isCurrent) {
                            onTogglePlay();
                          } else {
                            onSelectSurah?.(item.id);
                          }
                        }}
                      >
                        {/* Number Box */}
                        <View style={[styles.queueNumberBox, isCurrent && styles.queueNumberBoxActive]}>
                          <Text style={styles.queueNumberText}>{item.id}</Text>
                        </View>

                        {/* Surah Title & Subtitle */}
                        <View style={styles.queueInfoCol}>
                          <Text style={styles.queueSurahName} numberOfLines={1}>
                            {item.name_simple} ({item.name_arabic})
                          </Text>
                          <Text style={styles.queueSurahSubtitle} numberOfLines={1}>
                            {englishSubtitle}
                          </Text>
                        </View>

                        {/* Action: White Play/Pause Button if active, else Reorder Handle */}
                        {isCurrent ? (
                          <View style={styles.queuePlayCircle}>
                            <Ionicons
                              name={isPlaying ? 'pause' : 'play'}
                              size={15}
                              color="#0f172a"
                              style={isPlaying ? undefined : { marginLeft: 1.5 }}
                            />
                          </View>
                        ) : (
                          <View style={styles.queueHandleIcon}>
                            <Ionicons name="menu-outline" size={20} color="#64748b" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </BlurView>
            ) : showVerses ? (
              isLoadingVerses && syncedVerses.length === 0 ? (
                <View style={styles.lyricsLoadingCenter}>
                  <ActivityIndicator size="large" color="#34d399" />
                  <Text style={styles.lyricsLoadingText}>جاري تحميل الآيات...</Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  style={styles.versesFlatList}
                  data={syncedVerses}
                  keyExtractor={(item) => item.verseKey}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.versesListContent,
                    {
                      paddingTop: halfCanvasPadding,
                      paddingBottom: halfCanvasPadding,
                    },
                  ]}
                  onScrollBeginDrag={() => {
                    isUserScrollingRef.current = true;
                    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
                  }}
                  onScrollEndDrag={() => {
                    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
                    scrollTimeoutRef.current = setTimeout(() => {
                      isUserScrollingRef.current = false;
                    }, 2500);
                  }}
                  initialNumToRender={15}
                  maxToRenderPerBatch={15}
                  windowSize={21}
                  onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToIndex({
                        index: info.index,
                        animated: true,
                        viewPosition: 0.5,
                      });
                    }, 80);
                  }}
                  renderItem={({ item, index }) => (
                    <AnimatedVerseRow
                      item={item}
                      index={index}
                      isActive={index === effectiveActiveIndex}
                      distance={Math.abs(index - effectiveActiveIndex)}
                      onPress={() => handleVersePress(item, index)}
                    />
                  )}
                />
              )
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.micAuraCircle}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowVerses(true);
                }}
              >
                <Ionicons name="mic-outline" size={80} color="rgba(255, 255, 255, 0.25)" />
              </TouchableOpacity>
            )}
          </View>

          {/* 3. BOTTOM PLAYER CONTROLS SECTION - NEVER CHANGES! EXACT MATCH TO SCREENSHOT */}
          <View style={styles.bottomSection}>
            {/* 1. Track & Reciter Info */}
            <View style={styles.trackInfoSection}>
              {/* Left: Avatar + Surah Title */}
              <TouchableOpacity
                style={styles.leftInfoGroup}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowVerses(!showVerses);
                }}
              >
                <View style={styles.avatarCircle}>
                  <Ionicons name="mic" size={20} color="#34d399" />
                </View>
                <Text style={styles.surahTitle} numberOfLines={1}>
                  {surah.name_simple}
                </Text>
              </TouchableOpacity>

              {/* Right: Reciter Arabic Name + Favorite Star */}
              <View style={styles.rightInfoGroup}>
                <Text style={styles.reciterArabicName} numberOfLines={1}>
                  {reciter.name}
                </Text>
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
                    size={25}
                    color={isFavorited ? '#fbbf24' : '#ffffff'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Main Controls Row */}
            <View style={styles.controlsRow}>
              {/* Speed Toggle (1x) */}
              <TouchableOpacity
                style={styles.speedButton}
                activeOpacity={0.7}
                onPress={handleCycleSpeed}
              >
                <View style={styles.speedBadge}>
                  <Text style={styles.speedText}>{currentSpeed}x</Text>
                </View>
              </TouchableOpacity>

              {/* Previous Track Button */}
              <TouchableOpacity
                style={styles.skipButton}
                activeOpacity={0.7}
                onPress={onPrev}
              >
                <Ionicons name="play-skip-back" size={26} color="#ffffff" />
              </TouchableOpacity>

              {/* Big Play / Pause Button */}
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
                    size={42}
                    color="#ffffff"
                    style={isPlaying ? undefined : { marginLeft: 3 }}
                  />
                )}
              </TouchableOpacity>

              {/* Next Track Button */}
              <TouchableOpacity
                style={styles.skipButton}
                activeOpacity={0.7}
                onPress={onNext}
              >
                <Ionicons name="play-skip-forward" size={26} color="#ffffff" />
              </TouchableOpacity>

              {/* Sleep Timer Icon (Click to cycle: Off -> 15m -> 30m -> 60m -> سورة -> Off) */}
              <TouchableOpacity
                style={styles.sleepButton}
                activeOpacity={0.7}
                onPress={handleCycleSleepTimer}
              >
                <Image
                  source={require('@/assets/icons/player_sleep.png')}
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: sleepTimer !== null ? '#34d399' : '#cbd5e1',
                  }}
                  resizeMode="contain"
                />
                {sleepTimer !== null && (
                  <Text style={styles.sleepTimerBadgeText}>
                    {sleepTimer === 'end_of_surah' ? 'سورة' : `${sleepTimer}m`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 3. Progress Bar & Timers */}
            <View style={styles.progressSection}>
              <View
                ref={progressBarRef}
                style={styles.progressBarTouchTarget}
                onLayout={() => {
                  progressBarRef.current?.measure((x, y, width, height, pageX) => {
                    if (width > 0) {
                      progressBarLayoutRef.current = { pageX, width };
                    }
                  });
                }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleScrubberGrant}
                onResponderMove={handleScrubberMove}
                onResponderRelease={handleScrubberRelease}
                onResponderTerminate={() => {
                  setIsScrubbing(false);
                  setScrubbingPosition(null);
                }}
              >
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
                  <View
                    style={[
                      styles.progressBarThumb,
                      {
                        left: `${progressRatio * 100}%`,
                        transform: [{ translateX: -progressRatio * (isScrubbing ? 16 : 12) }],
                      },
                      isScrubbing && styles.progressBarThumbActive,
                    ]}
                  />
                </View>
              </View>

              <View style={styles.timersRow}>
                <Text style={styles.timeElapsedText}>{formatTime(effectivePosition)}</Text>
                <Text style={styles.timeRemainingText}>
                  {durationMillis > 0 ? `-${formatTime(remainingMillis)}` : '-0:00'}
                </Text>
              </View>
            </View>

            {/* 4. Bottom Utility Bar */}
            <View style={styles.bottomUtilityBar}>
              {/* Volume Icon (Toggles Dual-Volume Card) */}
              <TouchableOpacity
                style={styles.utilityIconButton}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowVolumeCard((prev) => !prev);
                }}
              >
                <Ionicons
                  name={showVolumeCard ? 'volume-high' : 'volume-medium-outline'}
                  size={24}
                  color={showVolumeCard ? '#ffffff' : activeBgSound.id !== 'none' ? '#34d399' : '#94a3b8'}
                />
              </TouchableOpacity>

              {/* Arabic Calligraphy Letter "ق" (Toggles Verses) */}
              <TouchableOpacity
                style={styles.utilityIconButton}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (showVerses) {
                    setShowVerses(false);
                  } else {
                    setShowVerses(true);
                    setShowQueue(false);
                  }
                }}
              >
                <Text style={[styles.qafLetterText, showVerses && styles.qafLetterTextActive]}>
                  ق
                </Text>
              </TouchableOpacity>

              {/* Share / Broadcast Recitation Icon */}
              <TouchableOpacity
                style={styles.utilityIconButton}
                activeOpacity={0.7}
                onPress={handleShare}
              >
                <Ionicons name="radio-outline" size={22} color="#94a3b8" />
              </TouchableOpacity>

              {/* Queue / Tracks List Icon (Toggles Continue Playing) */}
              <TouchableOpacity
                style={styles.utilityIconButton}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (showQueue) {
                    setShowQueue(false);
                  } else {
                    setShowQueue(true);
                    setShowVerses(false);
                  }
                }}
              >
                <Ionicons
                  name={showQueue ? 'list' : 'list-outline'}
                  size={24}
                  color={showQueue ? '#34d399' : '#94a3b8'}
                />
              </TouchableOpacity>
            </View>

            {/* 5. DUAL-VOLUME CONTROL CARD (Exact match to screenshot) */}
            {showVolumeCard && (
              <BlurView
                intensity={Platform.OS === 'ios' ? 70 : 85}
                tint="dark"
                style={styles.dualVolumeCard}
              >
                {/* 1. Quran Recitation Volume */}
                <View style={styles.volumeChannelRow}>
                  <Text style={styles.volumeChannelLabel}>Quran</Text>
                  <View style={styles.channelSliderRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onQuranVolumeChange?.(quranVolume > 0 ? 0 : 1);
                      }}
                    >
                      <Ionicons
                        name={quranVolume === 0 ? 'volume-mute' : 'volume-low-outline'}
                        size={18}
                        color={quranVolume === 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.7)'}
                      />
                    </TouchableOpacity>

                    <View
                      ref={quranTrackRef}
                      style={styles.channelTrackTouchable}
                      onLayout={() => {
                        quranTrackRef.current?.measure((x, y, width, height, pageX) => {
                          if (width > 0) {
                            quranTrackLayoutRef.current = { pageX, width };
                          }
                        });
                      }}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={(e) => {
                        quranTrackRef.current?.measure((x, y, width, height, pageX) => {
                          if (width > 0) {
                            quranTrackLayoutRef.current = { pageX, width };
                          }
                        });
                        Haptics.selectionAsync();
                        handleQuranVolumeTouch(e);
                      }}
                      onResponderMove={handleQuranVolumeTouch}
                    >
                      <View style={styles.channelTrackBg}>
                        <View style={[styles.channelTrackFill, { width: `${quranVolume * 100}%` }]} />
                        <View
                          style={[
                            styles.channelPillThumb,
                            {
                              left: `${quranVolume * 100}%`,
                              transform: [{ translateX: -quranVolume * 28 }],
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onQuranVolumeChange?.(1);
                      }}
                    >
                      <Ionicons name="volume-high" size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Background Sound Volume */}
                <View style={[styles.volumeChannelRow, { marginTop: 14 }]}>
                  <Text style={styles.volumeChannelLabel}>Background sound</Text>
                  <View style={styles.channelSliderRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.selectionAsync();
                        backgroundSoundService.setVolume(bgVolume > 0 ? 0 : 0.35);
                      }}
                    >
                      <Ionicons
                        name={bgVolume === 0 ? 'volume-mute' : 'volume-low-outline'}
                        size={18}
                        color={bgVolume === 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.7)'}
                      />
                    </TouchableOpacity>

                    <View
                      ref={bgTrackRef}
                      style={styles.channelTrackTouchable}
                      onLayout={() => {
                        bgTrackRef.current?.measure((x, y, width, height, pageX) => {
                          if (width > 0) {
                            bgTrackLayoutRef.current = { pageX, width };
                          }
                        });
                      }}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={(e) => {
                        bgTrackRef.current?.measure((x, y, width, height, pageX) => {
                          if (width > 0) {
                            bgTrackLayoutRef.current = { pageX, width };
                          }
                        });
                        Haptics.selectionAsync();
                        handleBgSoundVolumeTouch(e);
                      }}
                      onResponderMove={handleBgSoundVolumeTouch}
                    >
                      <View style={styles.channelTrackBg}>
                        <View style={[styles.channelTrackFill, { width: `${bgVolume * 100}%` }]} />
                        <View
                          style={[
                            styles.channelPillThumb,
                            {
                              left: `${bgVolume * 100}%`,
                              transform: [{ translateX: -bgVolume * 28 }],
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.selectionAsync();
                        backgroundSoundService.setVolume(1);
                      }}
                    >
                      <Ionicons name="volume-high" size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            )}
          </View>
        </SafeAreaView>

        {/* 4. BACKGROUND SOUND BOTTOM SHEET OVERLAY */}
        {showBgSoundSheet && (
          <View style={styles.bgSoundOverlayBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowBgSoundSheet(false)}
            />
            <BlurView
              intensity={Platform.OS === 'ios' ? 70 : 85}
              tint="dark"
              style={styles.bgSoundSheetCard}
            >
              {/* Grabber handle */}
              <View style={styles.bgSoundSheetGrabber} />

              {/* Header */}
              <View style={styles.bgSoundSheetHeader}>
                <View style={styles.bgSoundSheetHeaderTextGroup}>
                  <Text style={styles.bgSoundSheetTitle}>أصوات الطبيعة الخلفية</Text>
                  <Text style={styles.bgSoundSheetSubtitle}>
                    صوت هادئ ومريح يرافق التلاوة العطرة
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.bgSoundSheetCloseBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowBgSoundSheet(false);
                  }}
                >
                  <Ionicons name="close" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Ambient Sounds Grid */}
              <View style={styles.bgSoundsGrid}>
                {BACKGROUND_SOUNDS.map((sound) => {
                  const isSelected = activeBgSoundId === sound.id;
                  return (
                    <TouchableOpacity
                      key={sound.id}
                      style={[
                        styles.bgSoundCard,
                        isSelected && styles.bgSoundCardActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        backgroundSoundService.selectSound(sound.id);
                      }}
                    >
                      <View
                        style={[
                          styles.bgSoundCardIconBox,
                          isSelected && styles.bgSoundCardIconBoxActive,
                        ]}
                      >
                        {sound.iconFamily === 'material' ? (
                          <MaterialCommunityIcons
                            name={sound.icon as any}
                            size={24}
                            color={isSelected ? '#34d399' : '#94a3b8'}
                          />
                        ) : (
                          <Ionicons
                            name={sound.icon as any}
                            size={24}
                            color={isSelected ? '#34d399' : '#94a3b8'}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.bgSoundCardNameArabic,
                          isSelected && styles.bgSoundCardNameArabicActive,
                        ]}
                        numberOfLines={1}
                      >
                        {sound.nameArabic}
                      </Text>
                      <Text style={styles.bgSoundCardNameEnglish} numberOfLines={1}>
                        {sound.name}
                      </Text>

                      {isSelected && (
                        <View style={styles.bgSoundCardActiveBadge}>
                          <Ionicons name="checkmark-circle" size={15} color="#34d399" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </BlurView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#070b13',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },

  /* TOP SECTION */
  topSection: {
    alignItems: 'center',
    paddingTop: 4,
  },
  handleTouchable: {
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grabberPill: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  bgSoundCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: 6,
    gap: 6,
  },
  bgSoundCapsuleActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  bgSoundChevron: {
    marginRight: 2,
  },
  bgSoundText: {
    fontSize: 13,
    color: '#ffffff',
    fontFamily: 'Cairo_600SemiBold',
  },
  bgSoundTextActive: {
    color: '#34d399',
  },
  bgSoundActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
    marginLeft: 2,
  },

  /* CENTER CANVAS */
  centerCanvas: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  micAuraCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* BOTTOM CONTROLS SECTION */
  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 14 : 22,
    gap: 16,
  },

  /* TRACK & RECITER INFO SECTION */
  trackInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  leftInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  surahTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#ffffff',
  },
  rightInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reciterArabicName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'right',
  },
  starButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* CONTROLS ROW */
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  speedButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#cbd5e1',
  },
  skipButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayButton: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepTimerBadgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
    color: '#34d399',
    marginTop: 1,
  },

  /* PROGRESS BAR & TIMERS */
  progressSection: {
    paddingHorizontal: 22,
  },
  progressBarTouchTarget: {
    paddingVertical: 14,
    justifyContent: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  progressBarThumb: {
    position: 'absolute',
    top: -4.25,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  progressBarThumbActive: {
    top: -6.25,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#34d399',
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  timersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 1,
  },
  timeElapsedText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.2,
  },
  timeRemainingText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.2,
  },

  /* BOTTOM UTILITY BAR */
  bottomUtilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  utilityIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qafLetterText: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 27,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 34,
  },
  qafLetterTextActive: {
    color: '#34d399',
    textShadowColor: 'rgba(52, 211, 153, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  versesOverlayScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 12, 22, 0.65)',
  },

  /* =======================================================
   * SPOTIFY-STYLE SYNCED VERSES (LYRICS) STYLES
   * ======================================================= */
  lyricsBackdrop: {
    flex: 1,
    backgroundColor: '#131e2d', // Rich deep midnight slate matching screenshot
  },
  lyricsSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  lyricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  lyricsHeaderLeft: {
    alignItems: 'flex-start',
  },
  lyricsSubtitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  lyricsTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#ffffff',
  },
  lyricsMinimizeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    gap: 6,
  },
  lyricsMinimizeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
  lyricsLoadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  lyricsLoadingText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#94a3b8',
  },
  versesFlatList: {
    width: '100%',
    flex: 1,
  },
  versesListContent: {
    paddingHorizontal: 22,
  },
  verseTouchable: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseItem: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  verseText: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 30,
    lineHeight: 60,
    textAlign: 'center',
    width: '100%',
  },
  activeVerseText: {
    color: '#38ef7d', // Vibrant glowing neon mint green matching screenshot
    textShadowColor: 'rgba(56, 239, 125, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  inactiveVerseText: {
    color: '#ffffff',
  },
  lyricsBottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
    paddingHorizontal: 22,
    gap: 16,
  },
  lyricsProgressSection: {
    width: '100%',
  },
  lyricsProgressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  lyricsControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  lyricsToggleActiveButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34d399',
    marginTop: 3,
  },
  lyricsCenterPlayButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  repeatButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* QUEUE / CONTINUE PLAYING CARD (FROSTED GLASS / MATCHING USER SCREENSHOT) */
  queueCardContainer: {
    width: '92%',
    height: '95%',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(15, 23, 42, 0.62)' : 'rgba(15, 23, 42, 0.88)',
    borderRadius: 28,
    borderWidth: 1,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  queueHeaderTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 19,
    color: '#ffffff',
  },
  queueHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueIconBtnActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  queueSearchCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 10,
    gap: 10,
  },
  queueSearchTextInput: {
    flex: 1,
    color: '#ffffff',
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    padding: 0,
    textAlign: 'left',
  },
  queueListContent: {
    paddingBottom: 16,
    gap: 6,
  },
  queueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  queueItemRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  queueNumberBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  queueNumberBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  queueNumberText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  queueInfoCol: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  queueSurahName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  queueSurahSubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  queuePlayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  queueHandleIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* BACKGROUND SOUND BOTTOM SHEET (FROSTED GLASS / GLASSMORPHISM) */
  bgSoundOverlayBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  bgSoundSheetCard: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(15, 23, 42, 0.62)' : 'rgba(15, 23, 42, 0.88)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 40 : 26,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 26,
  },
  bgSoundSheetGrabber: {
    width: 42,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  bgSoundSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bgSoundSheetHeaderTextGroup: {
    flex: 1,
    alignItems: 'flex-start',
  },
  bgSoundSheetTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  bgSoundSheetSubtitle: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  bgSoundSheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  /* DUAL-VOLUME CONTROL CARD (Exact match to screenshot) */
  dualVolumeCard: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 58, 138, 0.45)' : 'rgba(15, 23, 42, 0.88)',
    borderRadius: 22,
    borderWidth: 1,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderTopColor: 'rgba(255, 255, 255, 0.32)',
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  volumeChannelRow: {
    width: '100%',
  },
  volumeChannelLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'left',
    marginBottom: 6,
  },
  channelSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelTrackTouchable: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  channelTrackBg: {
    width: '100%',
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  channelTrackFill: {
    height: '100%',
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
  },
  channelPillThumb: {
    position: 'absolute',
    top: 6,
    width: 28,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },

  /* SOUNDS GRID */
  bgSoundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  bgSoundCard: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    position: 'relative',
  },
  bgSoundCardActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    borderColor: '#34d399',
    borderTopColor: '#6ee7b7',
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  bgSoundCardIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bgSoundCardIconBoxActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.26)',
    borderColor: 'rgba(52, 211, 153, 0.6)',
  },
  bgSoundCardNameArabic: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
  },
  bgSoundCardNameArabicActive: {
    color: '#34d399',
  },
  bgSoundCardNameEnglish: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 2,
  },
  bgSoundCardActiveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
