import { Audio } from 'expo-av';

export interface BackgroundSoundItem {
  id: string;
  name: string;
  nameArabic: string;
  icon: string;
  iconFamily: 'ionicons' | 'material';
  source: any | null;
}

export const BACKGROUND_SOUNDS: BackgroundSoundItem[] = [
  {
    id: 'none',
    name: 'Off',
    nameArabic: 'إيقاف',
    icon: 'volume-mute-outline',
    iconFamily: 'ionicons',
    source: null,
  },
  {
    id: 'rain',
    name: 'Rain',
    nameArabic: 'مطر',
    icon: 'rainy-outline',
    iconFamily: 'ionicons',
    source: require('@/assets/sounds/rain.mp3'),
  },
  {
    id: 'beach',
    name: 'Beach Waves',
    nameArabic: 'أمواج البحر',
    icon: 'waves',
    iconFamily: 'material',
    source: require('@/assets/sounds/beach.mp3'),
  },
  {
    id: 'forest',
    name: 'Forest Birds',
    nameArabic: 'غابة وطيور',
    icon: 'leaf-outline',
    iconFamily: 'ionicons',
    source: require('@/assets/sounds/forest.mp3'),
  },
  {
    id: 'wind',
    name: 'Calm Wind',
    nameArabic: 'رياح هادئة',
    icon: 'weather-windy',
    iconFamily: 'material',
    source: require('@/assets/sounds/wind.mp3'),
  },
  {
    id: 'fire',
    name: 'Campfire',
    nameArabic: 'موقد نار',
    icon: 'flame-outline',
    iconFamily: 'ionicons',
    source: require('@/assets/sounds/fire.mp3'),
  },
];

type Listener = () => void;

class BackgroundSoundManager {
  private soundInstance: Audio.Sound | null = null;
  private currentSoundId: string = 'none';
  private volume: number = 0.35; // Default gentle ambient volume 35%
  private isQuranPlaying: boolean = false;
  private listeners: Set<Listener> = new Set();
  private isPreviewing: boolean = false;

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
    if (!soundItem || !soundItem.source) return;

    try {
      const shouldPlay = this.isQuranPlaying;
      const { sound } = await Audio.Sound.createAsync(
        soundItem.source,
        {
          shouldPlay,
          isLooping: true,
          volume: this.volume,
        }
      );
      this.soundInstance = sound;

      // If Quran is not playing, preview the sound briefly for 3 seconds so the user can hear their choice
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
