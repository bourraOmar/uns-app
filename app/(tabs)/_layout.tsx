import React, { useRef, useEffect, useMemo } from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Image,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useScrollCollapse } from '@/context/ScrollCollapseContext';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

// --- FLATICON CUSTOM ICONS FOR MENU BAR ---
const TAB_ICONS = {
  home: require('@/assets/icons/tab_home.png'),
  reciters: require('@/assets/icons/tab_reciters.png'),
  quran: require('@/assets/icons/tab_quran.png'),
  adhkar: require('@/assets/icons/tab_adhkar.png'),
  duas: require('@/assets/icons/tab_duas.png'),
};

// Menu items matching screenshot from left to right:
// الخدمات (Far Left) -> الأذكار -> المصحف -> المُشغّل -> الرئيسية (Far Right)
const TAB_ITEMS = [
  {
    name: 'duas',
    label: 'الخدمات',
    renderIcon: (color: string) => (
      <Image
        source={TAB_ICONS.duas}
        style={{ width: 22, height: 22, tintColor: color }}
        resizeMode="contain"
      />
    ),
  },
  {
    name: 'adhkar',
    label: 'الأذكار',
    renderIcon: (color: string) => (
      <Image
        source={TAB_ICONS.adhkar}
        style={{ width: 22, height: 22, tintColor: color }}
        resizeMode="contain"
      />
    ),
  },
  {
    name: 'quran',
    label: 'المصحف',
    renderIcon: (color: string) => (
      <Image
        source={TAB_ICONS.quran}
        style={{ width: 22, height: 22, tintColor: color }}
        resizeMode="contain"
      />
    ),
  },
  {
    name: 'reciters',
    label: 'المُشغّل',
    renderIcon: (color: string) => (
      <Image
        source={TAB_ICONS.reciters}
        style={{ width: 22, height: 22, tintColor: color }}
        resizeMode="contain"
      />
    ),
  },
  {
    name: 'index',
    label: 'الرئيسية',
    renderIcon: (color: string) => (
      <Image
        source={TAB_ICONS.home}
        style={{ width: 22, height: 22, tintColor: color }}
        resizeMode="contain"
      />
    ),
  },
];

// Returns the icon corresponding to the current active page
function getPageIcon(routeName: string) {
  let iconSource = TAB_ICONS.home;
  switch (routeName) {
    case 'duas':
      iconSource = TAB_ICONS.duas;
      break;
    case 'adhkar':
      iconSource = TAB_ICONS.adhkar;
      break;
    case 'quran':
      iconSource = TAB_ICONS.quran;
      break;
    case 'reciters':
      iconSource = TAB_ICONS.reciters;
      break;
    case 'index':
    default:
      iconSource = TAB_ICONS.home;
      break;
  }
  return (
    <Image
      source={iconSource}
      style={{ width: 22, height: 22, tintColor: '#ffffff' }}
      resizeMode="contain"
    />
  );
}

// Custom Floating & Collapsible Tab Bar Component
function FloatingTabBar({ state, navigation }: any) {
  const currentRoute = state.routes[state.index];

  // Hide only on qibla full screen compass
  if (currentRoute?.name === 'qibla') {
    return null;
  }

  const {
    isCollapsed,
    setIsCollapsed,
    triggerSearch,
    setCurrentRouteName,
    isSearchActive,
    searchQuery,
    setSearchQuery,
    searchPlaceholder,
    openSearch,
    closeSearch,
  } = useScrollCollapse();
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

  const keyboardTranslateY = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates.height;
      const shift = -(height - (Platform.OS === 'ios' ? 14 : 6));
      Animated.timing(keyboardTranslateY, {
        toValue: shift,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 200,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardTranslateY, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (isSearchActive) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    }
  }, [isSearchActive]);

  const isEnglishQuery = useMemo(() => {
    return /^[a-zA-Z0-9\s-_'.,]+$/.test(searchQuery.trim());
  }, [searchQuery]);

  useEffect(() => {
    if (currentRoute?.name) {
      setCurrentRouteName(currentRoute.name);
      if (currentRoute.name === 'index') {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(true);
      }
    }
  }, [currentRoute?.name]);

  const collapseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(collapseAnim, {
      toValue: isCollapsed ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isCollapsed]);

  const handlePageIconPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Tap page icon to expand back into full 5-item menu
    setIsCollapsed(false);
  };

  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openSearch();
  };

  // Interpolations for floating mini player (above expanded bar)
  const floatingPlayerTranslateY = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 68],
  });
  const floatingPlayerOpacity = collapseAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0, 0],
  });
  const floatingPlayerScale = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  // Interpolations for expanded 5-item bar
  const expandedBarOpacity = collapseAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0, 0],
  });
  const expandedBarTranslateY = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });
  const expandedBarScale = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });

  // Interpolations for collapsed dock row
  const dockRowOpacity = collapseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 1],
  });
  const dockRowTranslateY = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
  });
  const dockRowScale = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const hasActiveAudio = !!currentSurah && !isPlayerModalVisible && !isSearchActive;

  return (
    <Animated.View
      style={[
        styles.floatingBarContainer,
        {
          transform: [{ translateY: keyboardTranslateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      {/* 1. FLOATING MINI PLAYER (ABOVE 5-ITEM BAR IN EXPANDED STATE) */}
      {hasActiveAudio && (
        <Animated.View
          style={[
            styles.floatingMiniPlayerAnimWrapper,
            {
              transform: [
                { translateY: floatingPlayerTranslateY },
                { scale: floatingPlayerScale },
              ],
              opacity: floatingPlayerOpacity,
            },
          ]}
          pointerEvents={isCollapsed ? 'none' : 'auto'}
        >
          <TouchableOpacity
            style={styles.floatingMiniPlayerPill}
            activeOpacity={0.92}
            onPress={openPlayerModal}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 70 : 90}
              tint="dark"
              style={styles.floatingMiniPlayerBlur}
            >
              <View style={styles.floatingMiniPlayerLeft}>
                <Image
                  source={require('@/assets/images/reciter_avatar_default.png')}
                  style={styles.floatingAvatar}
                  resizeMode="cover"
                />
                <View style={styles.floatingTextColumn}>
                  <Text style={styles.floatingSurahTitle} numberOfLines={1}>
                    {currentSurah.id}. {currentSurah.name_simple}({currentSurah.name_arabic})
                  </Text>
                  <Text style={styles.floatingReciterName} numberOfLines={1}>
                    {currentReciter.englishName || currentReciter.name}
                  </Text>
                </View>
              </View>

              <View style={styles.floatingControls}>
                <TouchableOpacity
                  style={styles.floatingIconButton}
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {isLoadingAudio ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={20}
                      color="#ffffff"
                      style={isPlaying ? undefined : { marginLeft: 2 }}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.floatingIconButton}
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    nextSurah();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="play-forward" size={19} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 2. EXPANDED 5-ITEM FLOATING TAB BAR */}
      <Animated.View
        style={[
          styles.expandedBarWrapper,
          {
            opacity: expandedBarOpacity,
            transform: [
              { translateY: expandedBarTranslateY },
              { scale: expandedBarScale },
            ],
          },
        ]}
        pointerEvents={isCollapsed ? 'none' : 'auto'}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 75 : 90}
          tint="dark"
          style={styles.floatingMenuBar}
        >
          {TAB_ITEMS.map((item) => {
            const isFocused = currentRoute?.name === item.name;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (!isFocused) {
                navigation.navigate(item.name);
              } else if (currentRoute?.name !== 'index') {
                setIsCollapsed(true);
              }
            };

            if (isFocused) {
              return (
                <TouchableOpacity
                  key={item.name}
                  onPress={onPress}
                  activeOpacity={0.8}
                  style={styles.activePillTouchable}
                >
                  <BlurView
                    intensity={Platform.OS === 'ios' ? 40 : 60}
                    tint="dark"
                    style={styles.floatingMenuItemActivePill}
                  >
                    {item.renderIcon('#34d399')}
                    <Text style={styles.floatingMenuItemActiveText}>{item.label}</Text>
                  </BlurView>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={item.name}
                style={styles.floatingMenuItem}
                onPress={onPress}
                activeOpacity={0.7}
              >
                {item.renderIcon('#8ba7c0')}
                <Text style={styles.floatingMenuItemText}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </Animated.View>

      {/* 3. COLLAPSED DOCK ROW (SEARCH ICON + MINI PLAYER + PAGE ICON) */}
      <Animated.View
        style={[
          styles.collapsedDockWrapper,
          {
            opacity: dockRowOpacity,
            transform: [
              { translateY: dockRowTranslateY },
              { scale: dockRowScale },
            ],
          },
        ]}
        pointerEvents={isCollapsed ? 'auto' : 'none'}
      >
        {isSearchActive ? (
          <>
            {/* Active Search Capsule on Left / Center matching screenshot */}
            <BlurView
              intensity={Platform.OS === 'ios' ? 75 : 90}
              tint="dark"
              style={styles.dockSearchCapsule}
            >
              {/* Clear / Close X Button on the Left */}
              <TouchableOpacity
                style={styles.searchCloseCircle}
                onPress={() => {
                  if (searchQuery.length > 0) {
                    setSearchQuery('');
                  } else {
                    closeSearch();
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={14} color="#f8fafc" />
              </TouchableOpacity>

              {/* Search Text Input in the Center */}
              <TextInput
                ref={searchInputRef}
                style={styles.dockSearchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
                textAlign={isEnglishQuery ? 'left' : 'right'}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />

              {/* Search Magnifying Glass Icon on the Right */}
              <Ionicons name="search" size={20} color="#94a3b8" style={{ marginLeft: 4 }} />
            </BlurView>

            {/* Right Circle: Current Page Icon (taps to close search & toggle menu) */}
            <TouchableOpacity
              style={styles.dockCircleButton}
              activeOpacity={0.8}
              onPress={() => {
                closeSearch();
                handlePageIconPress();
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 75 : 90}
                tint="dark"
                style={styles.dockCircleBlur}
              >
                {getPageIcon(currentRoute?.name)}
              </BlurView>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Left Circle: Search Icon */}
            <TouchableOpacity
              style={styles.dockCircleButton}
              activeOpacity={0.8}
              onPress={handleSearchPress}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 75 : 90}
                tint="dark"
                style={styles.dockCircleBlur}
              >
                <Ionicons name="search" size={20} color="#ffffff" />
              </BlurView>
            </TouchableOpacity>

            {/* Center: Docked Mini Player Pill */}
            {hasActiveAudio ? (
              <TouchableOpacity
                style={styles.dockedMiniPlayerContainer}
                activeOpacity={0.9}
                onPress={openPlayerModal}
              >
                <BlurView
                  intensity={Platform.OS === 'ios' ? 75 : 90}
                  tint="dark"
                  style={styles.dockedMiniPlayerBlur}
                >
                  <Image
                    source={require('@/assets/images/reciter_avatar_default.png')}
                    style={styles.dockedAvatar}
                    resizeMode="cover"
                  />

                  <View style={styles.dockedTextColumn}>
                    <Text style={styles.dockedSurahTitle} numberOfLines={1}>
                      {currentSurah.id}. {currentSurah.name_simple}({currentSurah.name_arabic})
                    </Text>
                  </View>

                  <View style={styles.dockedControls}>
                    <TouchableOpacity
                      style={styles.dockedControlBtn}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        togglePlay();
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      {isLoadingAudio ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Ionicons
                          name={isPlaying ? 'pause' : 'play'}
                          size={18}
                          color="#ffffff"
                          style={isPlaying ? undefined : { marginLeft: 1 }}
                        />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.dockedControlBtn}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        nextSurah();
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <Ionicons name="play-forward" size={17} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {/* Right Circle: Current Page Icon (taps to expand menu) */}
            <TouchableOpacity
              style={styles.dockCircleButton}
              activeOpacity={0.8}
              onPress={handlePageIconPress}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 75 : 90}
                tint="dark"
                style={styles.dockCircleBlur}
              >
                {getPageIcon(currentRoute?.name)}
              </BlurView>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="duas" options={{ title: 'الأدعية' }} />
      <Tabs.Screen name="adhkar" options={{ title: 'الأذكار' }} />
      <Tabs.Screen name="reciters" options={{ title: 'القراء' }} />
      <Tabs.Screen name="quran" options={{ title: 'المصحف' }} />
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="qibla" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 14,
    right: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },

  /* 1. FLOATING MINI PLAYER (EXPANDED) */
  floatingMiniPlayerAnimWrapper: {
    width: '100%',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    borderRadius: 26,
  },
  floatingMiniPlayerPill: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
  },
  floatingMiniPlayerBlur: {
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
  floatingMiniPlayerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  floatingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 7,
    backgroundColor: '#1e293b',
  },
  floatingTextColumn: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  floatingSurahTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  floatingReciterName: {
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: -1,
  },
  floatingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  floatingIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 2. EXPANDED 5-ITEM FLOATING TAB BAR */
  expandedBarWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },
  floatingMenuBar: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 41, 59, 0.55)' : 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderTopColor: 'rgba(255, 255, 255, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  floatingMenuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 54,
    gap: 3,
  },
  floatingMenuItemText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#8ba7c0',
  },
  activePillTouchable: {
    borderRadius: 22,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingMenuItemActivePill: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(15, 142, 93, 0.28)' : 'rgba(15, 142, 93, 0.35)',
    borderWidth: 1.2,
    borderColor: 'rgba(52, 211, 153, 0.5)',
    borderTopColor: 'rgba(110, 231, 183, 0.8)',
    borderRadius: 22,
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 16,
    minWidth: 70,
    gap: 2,
  },
  floatingMenuItemActiveText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#34d399',
    textShadowColor: 'rgba(52, 211, 153, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* 3. COLLAPSED DOCK ROW (MATCHING SCREENSHOT) */
  collapsedDockWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dockCircleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  dockCircleBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 41, 59, 0.72)' : 'rgba(30, 41, 59, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
  },
  dockedMiniPlayerContainer: {
    flex: 1,
    height: 48,
    marginHorizontal: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  dockedMiniPlayerBlur: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 41, 59, 0.72)' : 'rgba(30, 41, 59, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 7,
    paddingRight: 12,
  },
  dockedAvatar: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: '#1e293b',
  },
  dockedTextColumn: {
    flex: 1,
    marginLeft: 8,
    marginRight: 6,
    justifyContent: 'center',
  },
  dockedSurahTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  dockedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dockedControlBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ACTIVE SEARCH CAPSULE (MATCHING SCREENSHOT) */
  dockSearchCapsule: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 41, 59, 0.75)' : 'rgba(30, 41, 59, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  dockSearchInput: {
    flex: 1,
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#f8fafc',
    textAlign: 'right',
    paddingHorizontal: 8,
  },
  searchCloseCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
