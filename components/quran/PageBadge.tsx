import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { toEasternArabicNumerals } from '@/data/quranPages';

interface PageBadgeProps {
  number: number;
}

export default function PageBadge({ number }: PageBadgeProps) {
  const arabicNum = toEasternArabicNumerals(number);

  return (
    <View style={styles.container}>
      <Svg width={64} height={26} viewBox="0 0 64 26">
        {/* Left wing finial */}
        <Path
          d="M 2 13 C 6 8, 12 9, 15 13 C 12 17, 6 18, 2 13 Z"
          stroke="#10b981"
          strokeWidth={0.9}
          fill="rgba(6, 78, 59, 0.4)"
        />
        {/* Right wing finial */}
        <Path
          d="M 62 13 C 58 8, 52 9, 49 13 C 52 17, 58 18, 62 13 Z"
          stroke="#10b981"
          strokeWidth={0.9}
          fill="rgba(6, 78, 59, 0.4)"
        />
        {/* Center oval body */}
        <Ellipse
          cx={32}
          cy={13}
          rx={20}
          ry={10}
          stroke="#10b981"
          strokeWidth={1.2}
          fill="#1e293b"
        />
        {/* Inner thin highlight */}
        <Ellipse
          cx={32}
          cy={13}
          rx={17.5}
          ry={7.5}
          stroke="rgba(52, 211, 153, 0.3)"
          strokeWidth={0.8}
          fill="none"
        />
      </Svg>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.textWrapper}>
          <Text style={styles.badgeText}>{arabicNum}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 64,
    height: 26,
    alignSelf: 'center',
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#e2e8f0',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 16,
  },
});
