import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface BackgroundSoundItem {
  id: string;
  name: string;
  nameArabic: string;
  icon: string;
  iconFamily: 'ionicons' | 'material';
  source: any | null;
  videoSource?: any | null;
  isBuiltIn?: boolean;
  remoteAudioUrl?: string;
  remoteVideoUrl?: string;
}

const STORAGE_DOWNLOADED_KEY = '@uns_downloaded_sounds_v2';

export const BACKGROUND_SOUNDS: BackgroundSoundItem[] = [
  {
    id: 'none',
    name: 'No sounds',
    nameArabic: 'بدون صوت',
    icon: 'remove-circle-outline',
    iconFamily: 'ionicons',
    source: null,
    videoSource: null,
    isBuiltIn: true,
  },
  {
    id: 'rain',
    name: 'Rain',
    nameArabic: 'مطر',
    icon: 'rainy-outline',
    iconFamily: 'ionicons',
    source: null,
    remoteAudioUrl: 'https://quran-al-karim.vercel.app/sounds/rain.mp3',
    videoSource: require('@/assets/videos/background.mp4'),
    isBuiltIn: false,
  },
  {
    id: 'birds',
    name: 'Birds',
    nameArabic: 'طيور',
    icon: 'leaf-outline',
    iconFamily: 'ionicons',
    source: null,
    remoteAudioUrl: 'https://quran-al-karim.vercel.app/sounds/forest.mp3',
    videoSource: require('@/assets/videos/background.mp4'),
    isBuiltIn: false,
  },
  {
    id: 'fire',
    name: 'Fire',
    nameArabic: 'نار',
    icon: 'flame-outline',
    iconFamily: 'ionicons',
    source: null,
    remoteAudioUrl: 'https://quran-al-karim.vercel.app/sounds/fire.mp3',
    videoSource: require('@/assets/videos/background.mp4'),
    isBuiltIn: false,
  },
  {
    id: 'wave',
    name: 'Wave',
    nameArabic: 'أمواج',
    icon: 'water-outline',
    iconFamily: 'ionicons',
    source: null,
    remoteAudioUrl: 'https://quran-al-karim.vercel.app/sounds/beach.mp3',
    videoSource: require('@/assets/videos/background.mp4'),
    isBuiltIn: false,
  },
  {
    id: 'wind',
    name: 'Wind',
    nameArabic: 'رياح',
    icon: 'cloudy-outline',
    iconFamily: 'ionicons',
    source: null,
    remoteAudioUrl: 'https://quran-al-karim.vercel.app/sounds/wind.mp3',
    videoSource: require('@/assets/videos/background.mp4'),
    isBuiltIn: false,
  },
];

type Listener = () => void;

class BackgroundSoundManager {
  private soundInstance: Audio.Sound | null = null;
  private currentSoundId: string = 'none';
  private volume: number = 0.35;
  private isQuranPlaying: boolean = false;
  private listeners: Set<Listener> = new Set();
  private isPreviewing: boolean = false;
  private downloadedSoundIds: Set<string> = new Set();
  private downloadingIds: Set<string> = new Set();

  constructor() {
    this.initDownloadedList();
  }

  private async initDownloadedList() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_DOWNLOADED_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        const baseDir = `${FileSystem.documentDirectory || ''}ambient/`;
        for (const id of ids) {
          const soundItem = BACKGROUND_SOUNDS.find((s) => s.id === id);
          if (soundItem) {
            const audioDest = `${baseDir}${id}.mp3`;
            const fileInfo = await FileSystem.getInfoAsync(audioDest);
            if (fileInfo.exists) {
              this.downloadedSoundIds.add(id);
              soundItem.source = { uri: audioDest };
            }
          }
        }
      }
      this.notify();
    } catch {}
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.warn('Listener error in BackgroundSoundManager:', err);
      }
    });
  }

  public getCurrentSoundId(): string {
    return this.currentSoundId;
  }

  public getCurrentSound(): BackgroundSoundItem {
    return (
      BACKGROUND_SOUNDS.find((s) => s.id === this.currentSoundId) || BACKGROUND_SOUNDS[0]
    );
  }

  public getVolume(): number {
    return this.volume;
  }

  public getSounds(): BackgroundSoundItem[] {
    return BACKGROUND_SOUNDS;
  }

  public isDownloaded(soundId: string): boolean {
    const item = BACKGROUND_SOUNDS.find((s) => s.id === soundId);
    if (!item) return false;
    if (item.isBuiltIn) return true;
    return this.downloadedSoundIds.has(soundId);
  }

  public isDownloading(soundId: string): boolean {
    return this.downloadingIds.has(soundId);
  }

  public async downloadSound(soundId: string): Promise<boolean> {
    const soundItem = BACKGROUND_SOUNDS.find((s) => s.id === soundId);
    if (!soundItem || !soundItem.remoteAudioUrl) return false;

    this.downloadingIds.add(soundId);
    this.notify();

    try {
      const baseDir = `${FileSystem.documentDirectory || ''}ambient/`;
      const dirInfo = await FileSystem.getInfoAsync(baseDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
      }

      const audioDest = `${baseDir}${soundId}.mp3`;
      await FileSystem.downloadAsync(soundItem.remoteAudioUrl, audioDest);
      soundItem.source = { uri: audioDest };

      if (soundItem.remoteVideoUrl) {
        try {
          const videoDest = `${baseDir}${soundId}.mp4`;
          await FileSystem.downloadAsync(soundItem.remoteVideoUrl, videoDest);
          soundItem.videoSource = { uri: videoDest };
        } catch {
          soundItem.videoSource = require('@/assets/videos/background.mp4');
        }
      } else {
        soundItem.videoSource = require('@/assets/videos/background.mp4');
      }

      this.downloadedSoundIds.add(soundId);
      await AsyncStorage.setItem(
        STORAGE_DOWNLOADED_KEY,
        JSON.stringify(Array.from(this.downloadedSoundIds))
      );
      this.downloadingIds.delete(soundId);
      this.notify();
      return true;
    } catch (err) {
      console.warn(`Failed to download ambient sound [${soundId}]:`, err);
      this.downloadingIds.delete(soundId);
      this.notify();
      return false;
    }
  }

  public async setQuranPlaying(isPlaying: boolean) {
    this.isQuranPlaying = isPlaying;
    if (!this.soundInstance || this.currentSoundId === 'none') return;

    try {
      const status = await this.soundInstance.getStatusAsync();
      if (status.isLoaded) {
        if (isPlaying && !status.isPlaying) {
          await this.soundInstance.playAsync();
        } else if (!isPlaying && status.isPlaying && !this.isPreviewing) {
          await this.soundInstance.pauseAsync();
        }
      }
    } catch (err) {
      console.warn('Error syncing background sound with Quran playback:', err);
    }
  }

  public async selectSound(soundId: string) {
    if (this.currentSoundId === soundId) {
      // Tapping active sound toggles it off
      await this.selectSound('none');
      return;
    }

    // Stop and unload previous sound
    if (this.soundInstance) {
      try {
        await this.soundInstance.stopAsync();
        await this.soundInstance.unloadAsync();
      } catch {}
      this.soundInstance = null;
    }

    this.currentSoundId = soundId;
    this.notify();

    if (soundId === 'none') {
      return;
    }

    const soundItem = BACKGROUND_SOUNDS.find((s) => s.id === soundId);
    if (!soundItem) return;

    // Check if downloaded
    if (!this.isDownloaded(soundId)) {
      const ok = await this.downloadSound(soundId);
      if (!ok) return;
    }

    const source = soundItem.source || {
      uri: `${FileSystem.documentDirectory || ''}ambient/${soundId}.mp3`,
    };

    try {
      const shouldPlay = this.isQuranPlaying;
      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay,
          isLooping: true,
          volume: this.volume,
        }
      );
      this.soundInstance = sound;

      // If Quran is not playing, preview briefly for 3 seconds
      if (!this.isQuranPlaying) {
        this.isPreviewing = true;
        await sound.playAsync();
        setTimeout(async () => {
          if (this.isPreviewing && !this.isQuranPlaying && this.soundInstance === sound) {
            try {
              await sound.pauseAsync();
            } catch {}
            this.isPreviewing = false;
          }
        }, 3200);
      }
    } catch (err) {
      console.warn(`Failed to load background sound [${soundId}]:`, err);
    }
  }

  public async setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.notify();

    if (this.soundInstance) {
      try {
        await this.soundInstance.setVolumeAsync(this.volume);
      } catch (err) {
        console.warn('Failed to set background sound volume:', err);
      }
    }
  }

  public async unload() {
    if (this.soundInstance) {
      try {
        await this.soundInstance.stopAsync();
        await this.soundInstance.unloadAsync();
      } catch {}
      this.soundInstance = null;
    }
    this.currentSoundId = 'none';
    this.notify();
  }
}

export const backgroundSoundService = new BackgroundSoundManager();
