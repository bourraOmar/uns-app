import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect, Path, Line, Circle } from 'react-native-svg';

interface SurahBannerProps {
  title: string;
}

export default function SurahBanner({ title }: SurahBannerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const bannerWidth = Math.min(windowWidth - 36, 420);
  const bannerHeight = 52;

  return (
    <View style={[styles.container, { width: bannerWidth }]}>
      {/* Top rule line with end accents */}
      <View style={[styles.ruleLineContainer, { width: bannerWidth }]}>
        <Svg width={bannerWidth} height={6} viewBox={`0 0 ${bannerWidth} 6`}>
          <Line x1={20} y1={3} x2={bannerWidth - 20} y2={3} stroke="#10b981" strokeWidth={0.8} opacity={0.65} />
          <Circle cx={20} cy={3} r={1.8} fill="#10b981" />
          <Circle cx={bannerWidth - 20} cy={3} r={1.8} fill="#10b981" />
        </Svg>
      </View>

      {/* Main Ornate Frame */}
      <View style={[styles.frameContainer, { width: bannerWidth, height: bannerHeight }]}>
        <Svg width={bannerWidth} height={bannerHeight} viewBox={`0 0 ${bannerWidth} ${bannerHeight}`}>
          {/* Main banner background */}
          <Rect
            x={1}
            y={1}
            width={bannerWidth - 2}
            height={bannerHeight - 2}
            rx={8}
            ry={8}
            fill="#064e3b"
            fillOpacity={0.65}
            stroke="#10b981"
            strokeWidth={1.4}
          />

          {/* Inner border line */}
          <Rect
            x={4}
            y={4}
            width={bannerWidth - 8}
            height={bannerHeight - 8}
            rx={6}
            ry={6}
            fill="none"
            stroke="#34d399"
            strokeWidth={0.7}
            strokeOpacity={0.5}
          />

          {/* Left Arabesque Ornament */}
          <Path
            d="M 10 26 C 14 16, 26 14, 38 20 C 30 24, 26 28, 38 32 C 26 38, 14 36, 10 26 Z"
            fill="#10b981"
            fillOpacity={0.35}
            stroke="#34d399"
            strokeWidth={0.9}
          />
          <Circle cx={16} cy={26} r={2} fill="#34d399" />
          <Circle cx={26} cy={26} r={1.6} fill="#10b981" />

          {/* Right Arabesque Ornament (mirrored) */}
          <Path
            d={`M ${bannerWidth - 10} 26 C ${bannerWidth - 14} 16, ${bannerWidth - 26} 14, ${bannerWidth - 38} 20 C ${bannerWidth - 30} 24, ${bannerWidth - 26} 28, ${bannerWidth - 38} 32 C ${bannerWidth - 26} 38, ${bannerWidth - 14} 36, ${bannerWidth - 10} 26 Z`}
            fill="#10b981"
            fillOpacity={0.35}
            stroke="#34d399"
            strokeWidth={0.9}
          />
          <Circle cx={bannerWidth - 16} cy={26} r={2} fill="#34d399" />
          <Circle cx={bannerWidth - 26} cy={26} r={1.6} fill="#10b981" />
        </Svg>

        {/* Surah Title Calligraphy/Text */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.titleWrapper}>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        </View>
      </View>

      {/* Bottom rule line with end accents */}
      <View style={[styles.ruleLineContainer, { width: bannerWidth }]}>
        <Svg width={bannerWidth} height={6} viewBox={`0 0 ${bannerWidth} 6`}>
          <Line x1={20} y1={3} x2={bannerWidth - 20} y2={3} stroke="#10b981" strokeWidth={0.8} opacity={0.65} />
          <Circle cx={20} cy={3} r={1.8} fill="#10b981" />
          <Circle cx={bannerWidth - 20} cy={3} r={1.8} fill="#10b981" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  ruleLineContainer: {
    height: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  frameContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
