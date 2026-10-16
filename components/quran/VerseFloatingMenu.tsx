import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface VerseFloatingMenuProps {
  visible: boolean;
  onTafsir: () => void;
  onBookmark: () => void;
  onPlay: () => void;
  onShare: () => void;
  isBookmarked: boolean;
  isPlaying: boolean;
  isLoadingAudio?: boolean;
}

export default function VerseFloatingMenu({
  visible,
  onTafsir,
  onBookmark,
  onPlay,
  onShare,
  isBookmarked,
  isPlaying,
  isLoadingAudio,
}: VerseFloatingMenuProps) {
  if (!visible) return null;

  return (
    <View style={styles.floatingMenuContainer} pointerEvents="box-none">
      {/* 1. TOP PILL: "تفسير الآية المحددة" */}
      <TouchableOpacity
        style={styles.tafsirPill}
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTafsir();
        }}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 100}
          tint="dark"
          style={styles.tafsirBlur}
        >
          <Text style={styles.tafsirText}>تفسير الآية المحددة</Text>
          <Ionicons name="reorder-two-outline" size={22} color="#f8fafc" />
        </BlurView>
      </TouchableOpacity>

      {/* 2. BOTTOM PILL: Bookmark | Play | Share */}
      <View style={styles.actionsPill}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 100}
          tint="dark"
          style={styles.actionsBlur}
        >
          {/* Bookmark Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBookmark();
            }}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isBookmarked ? '#34d399' : '#f8fafc'}
            />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.btnDivider} />

          {/* Play / Pause Verse Recitation Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPlay();
            }}
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={23}
                color="#ffffff"
                style={isPlaying ? undefined : { marginLeft: 2 }}
              />
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.btnDivider} />

          {/* Share Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onShare();
            }}
          >
            <Ionicons name="share-outline" size={22} color="#f8fafc" />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingMenuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 999,
  },

  /* 1. TOP TAFSIR PILL */
  tafsirPill: {
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  tafsirBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 22,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 41, 59, 0.72)' : 'rgba(30, 41, 59, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 23,
  },
  tafsirText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#f8fafc',
    includeFontPadding: false,
  },

  /* 2. BOTTOM ACTIONS PILL (Bookmark | Play | Share) */
  actionsPill: {
    width: 200,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  actionsBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 41, 59, 0.72)' : 'rgba(30, 41, 59, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    paddingHorizontal: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});
