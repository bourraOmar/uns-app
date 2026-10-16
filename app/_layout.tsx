import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import {
  useFonts,
  Amiri_400Regular,
  Amiri_700Bold,
} from '@expo-google-fonts/amiri';
import {
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';
import { Rakkas_400Regular } from '@expo-google-fonts/rakkas';

import { useColorScheme } from '@/components/useColorScheme';
import { AudioPlayerProvider, useAudioPlayer } from '@/context/AudioPlayerContext';
import AudioPlayerModal from '@/components/AudioPlayerModal';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Amiri_400Regular,
    Amiri_700Bold,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
    Rakkas_400Regular,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AudioPlayerProvider>
      <RootLayoutNav />
    </AudioPlayerProvider>
  );
}

function GlobalAudioPlayerModal() {
  const {
    isPlayerModalVisible,
    closePlayerModal,
    currentSurah,
    currentReciter,
    isPlaying,
    isLoadingAudio,
    positionMillis,
    durationMillis,
    togglePlay,
    nextSurah,
    prevSurah,
    seekTo,
    currentSpeed,
    setSpeed,
    playSurah,
    quranVolume,
    setVolume,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
  } = useAudioPlayer();

  return (
    <AudioPlayerModal
      visible={isPlayerModalVisible}
      onClose={closePlayerModal}
      surah={currentSurah}
      reciter={currentReciter}
      isPlaying={isPlaying}
      isLoadingAudio={isLoadingAudio}
      positionMillis={positionMillis}
      durationMillis={durationMillis}
      onTogglePlay={togglePlay}
      onNext={nextSurah}
      onPrev={prevSurah}
      onSeek={seekTo}
      currentSpeed={currentSpeed}
      onSpeedChange={setSpeed}
      onSelectSurah={(surahId) => playSurah(surahId)}
      quranVolume={quranVolume}
      onQuranVolumeChange={setVolume}
      isShuffle={isShuffle}
      onToggleShuffle={toggleShuffle}
      isRepeat={isRepeat}
      onToggleRepeat={toggleRepeat}
    />
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="reciter/[id]" options={{ headerShown: false }} />
      </Stack>
      <GlobalAudioPlayerModal />
    </ThemeProvider>
  );
}
