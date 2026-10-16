import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { toEasternArabicNumerals } from '@/data/quranPages';

interface VerseMedallionProps {
  number: number;
  size?: number;
}

export default function VerseMedallion({ number, size = 26 }: VerseMedallionProps) {
  const arabicNum = toEasternArabicNumerals(number);
  const radius = size / 2;
  const strokeWidth = 1.3;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer decorative ring */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - 1.5}
          stroke="#10b981"
          strokeWidth={strokeWidth}
          fill="rgba(6, 78, 59, 0.55)"
        />
        {/* Inner thin accent ring */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - 3.8}
          stroke="rgba(52, 211, 153, 0.4)"
          strokeWidth={0.8}
          fill="none"
        />
        {/* Tiny quadrant accent marks */}
        <Circle cx={radius} cy={2.2} r={1} fill="#34d399" />
        <Circle cx={radius} cy={size - 2.2} r={1} fill="#34d399" />
        <Circle cx={2.2} cy={radius} r={1} fill="#34d399" />
        <Circle cx={size - 2.2} cy={radius} r={1} fill="#34d399" />
      </Svg>
      {/* Number text */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.numberWrapper}>
          <Text
            style={[
              styles.numberText,
              { fontSize: number > 99 ? 8.5 : number > 9 ? 10 : 11 },
            ]}
          >
            {arabicNum}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  numberWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontFamily: 'Cairo_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 14,
  },
});
