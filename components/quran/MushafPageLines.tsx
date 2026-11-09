import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MushafWord } from '@/services/quranMushafService';
import { toEasternArabicNumerals } from '@/data/quranPages';

interface MushafPageLinesProps {
  pageNumber: number;
  linesMap: Record<number, (MushafWord & { verseKey: string })[]>;
  textColor: string;
  activeVerseKey?: string | null;
  onWordPress?: (verseKey: string) => void;
  onWordLongPress?: (verseKey: string) => void;
  isLastPage?: boolean;
}

export default function MushafPageLines({
  pageNumber,
  linesMap,
  textColor,
  activeVerseKey,
  onWordPress,
  onWordLongPress,
  isLastPage,
}: MushafPageLinesProps) {
  const lineNumbers = Object.keys(linesMap).map(Number).sort((a, b) => a - b);
  const fontName = `p${pageNumber}`;

  return (
    <View style={styles.pageContainer}>
      <View style={styles.linesWrapper}>
        {lineNumbers.map((lineNum) => {
          const words = linesMap[lineNum] || [];
          return (
            <View key={lineNum} style={styles.lineRow}>
              {words.map((w) => {
                const isActive = activeVerseKey === w.verseKey;
                return (
                  <TouchableOpacity
                    key={w.id}
                    activeOpacity={0.7}
                    onPress={() => onWordPress?.(w.verseKey)}
                    onLongPress={() => onWordLongPress?.(w.verseKey)}
                    delayLongPress={300}
                    style={styles.wordTouch}
                  >
                    <Text
                      style={[
                        styles.wordText,
                        {
                          fontFamily: fontName,
                          color: isActive ? '#0f8e5d' : textColor,
                        },
                      ]}
                    >
                      {w.code_v1 || w.code_v2 || w.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* Centered Page Number */}
      <View style={styles.pageNumberRow}>
        <Text style={styles.pageNumberText}>
          {toEasternArabicNumerals(pageNumber)}
        </Text>
      </View>

      {/* Page Separator Line */}
      {!isLastPage && <View style={styles.pageDivider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  linesWrapper: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  lineRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 1,
  },
  wordTouch: {
    paddingHorizontal: 0.5,
  },
  wordText: {
    fontSize: 21,
    lineHeight: 38,
    textAlign: 'center',
    includeFontPadding: false,
  },
  pageNumberRow: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 6,
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    fontVariant: ['tabular-nums'],
  },
  pageDivider: {
    width: '90%',
    maxWidth: 380,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginVertical: 16,
  },
});
