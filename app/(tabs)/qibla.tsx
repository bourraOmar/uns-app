import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import IslamicBackground from '@/components/IslamicBackground';

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export default function QiblaScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [hasSensor, setHasSensor] = useState(true);
  const [locationName, setLocationName] = useState('جاري تحديد الموقع...');
  const [loading, setLoading] = useState(true);
  const [aligned, setAligned] = useState(false);

  useEffect(() => {
    initQibla();
  }, []);

  const calculateQiblaDirection = (lat: number, lng: number) => {
    const phiK = (KAABA_LAT * Math.PI) / 180.0;
    const lambdaK = (KAABA_LNG * Math.PI) / 180.0;
    const phi = (lat * Math.PI) / 180.0;
    const lambda = (lng * Math.PI) / 180.0;
    const psi =
      (180.0 / Math.PI) *
      Math.atan2(
        Math.sin(lambdaK - lambda),
        Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
      );
    return Math.round((psi + 360) % 360);
  };

  const initQibla = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      let userLat = KAABA_LAT;
      let userLng = KAABA_LNG;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        userLat = loc.coords.latitude;
        userLng = loc.coords.longitude;
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: userLat,
          longitude: userLng,
        });
        if (geo?.city || geo?.region) {
          setLocationName(geo.city || geo.region || 'موقعك الحالي');
        }
      } else {
        setLocationName('مكة المكرمة (افتراضي)');
      }

      const qAngle = calculateQiblaDirection(userLat, userLng);
      setQiblaAngle(qAngle);

      // Check Magnetometer availability
      const isAvailable = await Magnetometer.isAvailableAsync();
      setHasSensor(isAvailable);

      if (isAvailable) {
        Magnetometer.setUpdateInterval(100);
        Magnetometer.addListener((data) => {
          let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
          angle = (angle + 360) % 360;
          const roundedHeading = Math.round(angle);
          setHeading(roundedHeading);

          // Check if aligned with Qibla within 4 degrees
          const diff = Math.abs(roundedHeading - qAngle);
          if (diff <= 3 || diff >= 357) {
            if (!aligned) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setAligned(true);
          } else {
            setAligned(false);
          }
        });
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const qiblaRelativeAngle = (qiblaAngle - heading + 360) % 360;

  return (
    <View style={styles.container}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
            جاري معايرة البوصلة وتحديد الموقع...
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.headerBox}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>بوصلة الكعبة المشرفة</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={colors.tint} />
              <Text style={[styles.locationText, { color: colors.tabIconDefault }]}>{locationName}</Text>
            </View>
          </View>

          {/* Compass Dial */}
          <View style={[styles.compassWrapper, { borderColor: aligned ? '#10b981' : colors.border }]}>
            {/* Compass Circle */}
            <View
              style={[
                styles.compassCircle,
                {
                  backgroundColor: colors.card,
                  borderColor: aligned ? '#10b981' : colors.tint,
                  transform: [{ rotate: `${-heading}deg` }],
                },
              ]}
            >
              <Text style={[styles.cardinalN, { color: colors.tint }]}>N</Text>
              <Text style={[styles.cardinalE, { color: colors.tabIconDefault }]}>E</Text>
              <Text style={[styles.cardinalS, { color: colors.tabIconDefault }]}>S</Text>
              <Text style={[styles.cardinalW, { color: colors.tabIconDefault }]}>W</Text>

              {/* Kaaba Direction Needle */}
              <View
                style={[
                  styles.needleContainer,
                  {
                    transform: [{ rotate: `${qiblaAngle}deg` }],
                  },
                ]}
              >
                <View style={styles.kaabaIconBox}>
                  <Text style={{ fontSize: 28 }}>🕋</Text>
                  <View style={[styles.needlePointer, { backgroundColor: aligned ? '#10b981' : '#9333ea' }]} />
                </View>
              </View>
            </View>

            {/* Center Degree Display */}
            <View style={[styles.centerAngleBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.angleDegreeText, { color: aligned ? '#10b981' : colors.text }]}>
                {qiblaAngle}°
              </Text>
              <Text style={[styles.angleLabel, { color: colors.tabIconDefault }]}>زاوية القبلة</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: aligned ? '#10b98120' : `${colors.tint}15`,
                borderColor: aligned ? '#10b981' : colors.border,
              },
            ]}
          >
            <Ionicons
              name={aligned ? 'checkmark-circle' : 'compass-outline'}
              size={20}
              color={aligned ? '#10b981' : colors.tint}
            />
            <Text
              style={[
                styles.statusText,
                { color: aligned ? '#10b981' : colors.text },
              ]}
            >
              {aligned ? 'أنت متجه مباشرة نحو الكعبة المشرفة!' : 'حرّك الهاتف حتى تتطابق مع مؤشر الكعبة'}
            </Text>
          </View>

          {!hasSensor && (
            <Text style={styles.sensorWarning}>
              ملاحظة: جهازك لا يدعم مستشعر البوصلة المغناطيسي، الزاوية محسوبة رقمياً ({qiblaAngle}°).
            </Text>
          )}
        </View>
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    right: 0,
    top: -2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(51, 65, 85, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  compassWrapper: {
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  compassCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinalN: {
    position: 'absolute',
    top: 8,
    fontSize: 16,
    fontWeight: '900',
  },
  cardinalS: {
    position: 'absolute',
    bottom: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  cardinalE: {
    position: 'absolute',
    right: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  cardinalW: {
    position: 'absolute',
    left: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  needleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  kaabaIconBox: {
    alignItems: 'center',
    marginTop: 18,
  },
  needlePointer: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginTop: 4,
  },
  centerAngleBox: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  angleDegreeText: {
    fontSize: 22,
    fontWeight: '900',
  },
  angleLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sensorWarning: {
    fontSize: 11,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
  },
});
