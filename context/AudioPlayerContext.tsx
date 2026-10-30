import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { RECITERS_DATA, Reciter } from '@/data/reciters';
import surahsData from '@/data/surahs.json';
import { backgroundSoundService } from '@/services/backgroundSoundService';

export interface SurahItem {
  id: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: string;
  verses_count: number;
  start_page: number;
  vocalized_name: string;
}

interface AudioPlayerContextType {
  currentSurah: SurahItem | null;
  currentReciter: Reciter;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  playbackProgress: number;
  positionMillis: number;
  durationMillis: number;
  currentSpeed: number;
  quranVolume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  isPlayerModalVisible: boolean;
  playSurah: (surahId: number, targetReciter?: Reciter) => Promise<void>;
  togglePlay: () => Promise<void>;
  seekTo: (millis: number) => Promise<void>;
  nextSurah: () => void;
  prevSurah: () => void;
  setSpeed: (speed: number) => Promise<void>;
  setVolume: (vol: number) => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  openPlayerModal: () => void;
  closePlayerModal: () => void;
  stopAudio: () => Promise<void>;
}

const DEFAULT_RECITER: Reciter = RECITERS_DATA.find((r) => r.id === '92') || RECITERS_DATA[0] || {
  id: '92',
  name: 'ياسر الدوسري',
  englishName: 'Yasser Al-Dosari',
  rewaya: 'حفص عن عاصم - مرتل',
  server: 'https://cdn.mp3quran.net/audio/yasser-dosari/r1/',
};

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<AudioPlayer | null>(null);

  const [currentSurahId, setCurrentSurahId] = useState<number | null>(null);
  const [currentReciter, setCurrentReciter] = useState<Reciter>(DEFAULT_RECITER);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  const [quranVolume, setQuranVolume] = useState(1.0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);

  const isShuffleRef = useRef(isShuffle);
  isShuffleRef.current = isShuffle;

  const isRepeatRef = useRef(isRepeat);
  isRepeatRef.current = isRepeat;

  const currentSurahIdRef = useRef(currentSurahId);
  currentSurahIdRef.current = currentSurahId;

  const currentReciterRef = useRef(currentReciter);
  currentReciterRef.current = currentReciter;

  const currentSpeedRef = useRef(currentSpeed);
  currentSpeedRef.current = currentSpeed;

  const quranVolumeRef = useRef(quranVolume);
  quranVolumeRef.current = quranVolume;

  // Initialize Audio mode for background playback
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  // Sync background sound playback with Quran playback
  useEffect(() => {
    backgroundSoundService.setQuranPlaying(isPlaying);
  }, [isPlaying]);

  const getRandomSurahId = (currentId: number | null): number => {
    const candidates = surahsData.map((s) => s.id).filter((id) => id !== currentId);
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex] || 1;
  };

  const getAudioUrl = (surahId: number, reciterObj: Reciter): string => {
    let base = reciterObj.server;

    if (
      !base ||
      base.includes('server6.mp3quran.net') ||
      base.includes('server8.mp3quran.net') ||
      base.includes('server10.mp3quran.net') ||
      base.includes('server12.mp3quran.net')
    ) {
      const found = RECITERS_DATA.find((r) => r.id === reciterObj.id || r.name === reciterObj.name);
      if (found?.server) {
        base = found.server;
      }
    }

    if (!base) {
      base = 'https://cdn.mp3quran.net/audio/yasser-dosari/r1/';
    }

    base = base.replace('http://', 'https://');
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const padded = String(surahId).padStart(3, '0');
    return `${cleanBase}${padded}.mp3`;
  };

  const playSurah = useCallback(
    async (surahId: number, targetReciter?: Reciter) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const activeReciter = targetReciter || currentReciterRef.current;
      const reciterChanged = targetReciter && targetReciter.id !== currentReciterRef.current.id;

      if (targetReciter && reciterChanged) {
        setCurrentReciter(targetReciter);
      }

      // If toggling the same surah with the same reciter
      if (!reciterChanged && currentSurahIdRef.current === surahId && soundRef.current) {
        try {
          if (soundRef.current.playing) {
            soundRef.current.pause();
            setIsPlaying(false);
          } else {
            soundRef.current.play();
            setIsPlaying(true);
          }
          return;
        } catch (err) {
          console.warn('Error toggling play/pause:', err);
        }
      }

      // Stop and unload existing sound
      if (soundRef.current) {
        try {
          soundRef.current.pause();
          soundRef.current.remove();
        } catch {}
        soundRef.current = null;
      }

      const audioUri = getAudioUrl(surahId, activeReciter);
      setCurrentSurahId(surahId);
      setIsLoadingAudio(true);
      setIsPlaying(false);
      setPlaybackProgress(0);

      try {
        const newPlayer = createAudioPlayer(audioUri, { updateInterval: 350 });
        soundRef.current = newPlayer;

        newPlayer.addListener('playbackStatusUpdate', (status) => {
          setIsPlaying(status.playing);
          const posMs = Math.round(status.currentTime * 1000);
          const durMs = Math.round(status.duration * 1000);
          setPositionMillis(posMs);
          if (durMs > 0) {
            setDurationMillis(durMs);
            setPlaybackProgress(status.currentTime / status.duration);
          }
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackProgress(0);
            setPositionMillis(0);

            if (isRepeatRef.current && currentSurahIdRef.current) {
              playSurah(currentSurahIdRef.current, currentReciterRef.current);
            } else if (isShuffleRef.current) {
              playSurah(getRandomSurahId(currentSurahIdRef.current), currentReciterRef.current);
            } else if (currentSurahIdRef.current && currentSurahIdRef.current < 114) {
              playSurah(currentSurahIdRef.current + 1, currentReciterRef.current);
            } else if (currentSurahIdRef.current === 114) {
              playSurah(1, currentReciterRef.current);
            }
          }
        });

        if (quranVolumeRef.current !== 1.0) {
          newPlayer.volume = quranVolumeRef.current;
        }
        if (currentSpeedRef.current !== 1.0) {
          newPlayer.playbackRate = currentSpeedRef.current;
        }

        newPlayer.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.warn('Failed to load/play audio:', audioUri, err);
        setIsPlaying(false);
        Alert.alert(
          'تعذر تشغيل الصوت',
          'يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً.'
        );
      } finally {
        setIsLoadingAudio(false);
      }
    },
    []
  );

  const togglePlay = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (soundRef.current) {
      try {
        if (soundRef.current.playing) {
          soundRef.current.pause();
          setIsPlaying(false);
        } else {
          soundRef.current.play();
          setIsPlaying(true);
        }
        return;
      } catch (err) {
        console.warn('Error toggling play:', err);
      }
    }

    // If no sound is loaded, play current surah or start from Al-Fatihah
    playSurah(currentSurahIdRef.current || 1, currentReciterRef.current);
  }, [playSurah]);

  const seekTo = useCallback(async (millis: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.seekTo(millis / 1000);
        setPositionMillis(millis);
      } catch (err) {
        console.warn('Error seeking:', err);
      }
    }
  }, []);

  const nextSurah = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isShuffleRef.current) {
      playSurah(getRandomSurahId(currentSurahIdRef.current), currentReciterRef.current);
    } else if (currentSurahIdRef.current && currentSurahIdRef.current < 114) {
      playSurah(currentSurahIdRef.current + 1, currentReciterRef.current);
    } else {
      playSurah(1, currentReciterRef.current);
    }
  }, [playSurah]);

  const prevSurah = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isShuffleRef.current) {
      playSurah(getRandomSurahId(currentSurahIdRef.current), currentReciterRef.current);
    } else if (currentSurahIdRef.current && currentSurahIdRef.current > 1) {
      playSurah(currentSurahIdRef.current - 1, currentReciterRef.current);
    } else {
      playSurah(114, currentReciterRef.current);
    }
  }, [playSurah]);

  const setSpeed = useCallback(async (speed: number) => {
    setCurrentSpeed(speed);
    if (soundRef.current) {
      try {
        soundRef.current.playbackRate = speed;
      } catch (err) {
        console.warn('Error setting rate:', err);
      }
    }
  }, []);

  const setVolume = useCallback(async (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setQuranVolume(clamped);
    if (soundRef.current) {
      try {
        soundRef.current.volume = clamped;
      } catch {}
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRepeat((prev) => !prev);
  }, []);

  const openPlayerModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlayerModalVisible(true);
  }, []);

  const closePlayerModal = useCallback(() => {
    setIsPlayerModalVisible(false);
  }, []);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        soundRef.current.pause();
        soundRef.current.remove();
      } catch {}
      soundRef.current = null;
    }
    setCurrentSurahId(null);
    setIsPlaying(false);
    setPlaybackProgress(0);
    setPositionMillis(0);
    setDurationMillis(0);
    setIsPlayerModalVisible(false);
  }, []);

  const currentSurah = surahsData.find((s) => s.id === currentSurahId) || null;

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSurah: currentSurah as SurahItem | null,
        currentReciter,
        isPlaying,
        isLoadingAudio,
        playbackProgress,
        positionMillis,
        durationMillis,
        currentSpeed,
        quranVolume,
        isShuffle,
        isRepeat,
        isPlayerModalVisible,
        playSurah,
        togglePlay,
        seekTo,
        nextSurah,
        prevSurah,
        setSpeed,
        setVolume,
        toggleShuffle,
        toggleRepeat,
        openPlayerModal,
        closePlayerModal,
        stopAudio,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
