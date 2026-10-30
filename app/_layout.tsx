import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import 'react-native-reanimated';
import {
  useFonts,
  Amiri_400Regular,
  Amiri_700Bold,
} from '@expo-google-fonts/amiri';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';
import { Rakkas_400Regular } from '@expo-google-fonts/rakkas';

import { AudioPlayerProvider, useAudioPlayer } from '@/context/AudioPlayerContext';
import { ScrollCollapseProvider } from '@/context/ScrollCollapseContext';
import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { notificationService } from '@/services/notificationService';
import AudioPlayerModal from '@/components/AudioPlayerModal';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Amiri_400Regular,
    Amiri_700Bold,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
    Rakkas_400Regular,
  });

  useEffect(() => {
    if (error) {
      console.warn('Font load error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppThemeProvider>
      <AudioPlayerProvider>
        <ScrollCollapseProvider>
          <RootLayoutNav />
        </ScrollCollapseProvider>
      </AudioPlayerProvider>
    </AppThemeProvider>
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
  const { isDark } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    // Initialize notification channels and reschedule
    notificationService.initialize();

    // Listen to notification responses (when user taps on notification)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;
      if (typeof route === 'string' && route.length > 0) {
        router.push(route as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
        <Stack.Screen name="reciter/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="surah/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="tasbih" options={{ headerShown: false }} />
        <Stack.Screen name="dhikr/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="dua-khatm" options={{ headerShown: false }} />
        <Stack.Screen name="custom-daily-apps" options={{ headerShown: false }} />
        <Stack.Screen name="prayer-settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications-settings" options={{ headerShown: false }} />
      </Stack>
      <GlobalAudioPlayerModal />
    </ThemeProvider>
  );
}
