import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { toEasternArabicNumerals } from '@/data/quranPages';

interface AyahFrameProps {
  number: number;
  width?: number;
  height?: number;
}

export default function AyahFrame({ number, width = 25, height = 35 }: AyahFrameProps) {
  const numStr = toEasternArabicNumerals(number);
  const isThreeDigits = number >= 100;
  const isTwoDigits = number >= 10 && number < 100;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 60 100"
        style={StyleSheet.absoluteFill}
      >
        {/* Outer Islamic scalloped arch cartouche matching user's frame-design_14949848 icon */}
        <Path
          d="
            M 30 2
            C 33 6, 37 9, 41 11
            C 45 10, 48 12, 49 16
            C 52 16, 55 19, 55 23
            C 57 24, 58 26, 58 30
            L 58 70
            C 58 74, 57 76, 55 77
            C 55 81, 52 84, 49 84
            C 48 88, 45 90, 41 89
            C 37 91, 33 94, 30 98
            C 27 94, 23 91, 19 89
            C 15 90, 12 88, 11 84
            C 8 84, 5 81, 5 77
            C 3 76, 2 74, 2 70
            L 2 30
            C 2 26, 3 24, 5 23
            C 5 19, 8 16, 11 16
            C 12 12, 15 10, 19 11
            C 23 9, 27 6, 30 2
            Z
          "
          fill="rgba(15, 142, 93, 0.18)"
          stroke="#10b981"
          strokeWidth={2.4}
          strokeLinejoin="round"
        />

        {/* Inner thin decorative accent line */}
        <Path
          d="
            M 30 7
            C 32 10, 35 12, 38 14
            C 41 14, 43 15, 44 18
            C 46 19, 48 21, 49 24
            C 50 25, 51 27, 51 30
            L 51 70
            C 51 73, 50 75, 49 76
            C 48 79, 46 81, 44 82
            C 43 85, 41 86, 38 86
            C 35 88, 32 90, 30 93
            C 28 90, 25 88, 22 86
            C 19 86, 17 85, 16 82
            C 14 81, 12 79, 11 76
            C 10 75, 9 73, 9 70
            L 9 30
            C 9 27, 10 25, 11 24
            C 12 21, 14 19, 16 18
            C 17 15, 19 14, 22 14
            C 25 12, 28 10, 30 7
            Z
          "
          fill="none"
          stroke="rgba(74, 222, 128, 0.35)"
          strokeWidth={1}
        />
      </Svg>

      <Text
        style={[
          styles.numberText,
          {
            fontSize: isThreeDigits ? 9 : isTwoDigits ? 11 : 12,
          },
        ]}
      >
        {numStr}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  numberText: {
    fontFamily: 'Cairo_700Bold',
    color: '#4ade80',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 14,
  },
});
