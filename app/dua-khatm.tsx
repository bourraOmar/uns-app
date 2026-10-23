import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import IslamicBackground from '@/components/IslamicBackground';

const DUA_KHATM_PARAGRAPHS = [
  {
    id: 1,
    text: 'صَدَقَ اللهُ العَظِيمُ الَّذِي لَا إِلَهَ إِلَّا هُوَ المُتَوَحِّدُ فِي الجَلَالِ بِكَمَالِ الجَمَالِ تَعْظِيماً وَتَكْبِيراً، المُتَفَرِّدُ بِتَصْرِيفِ الأَحْوَالِ عَلَى التَّفْصِيلِ وَالإِجْمَالِ تَقْدِيراً وَتَدْبِيراً، المُتَعَالِي بِعَظَمَتِهِ وَمَجْدِهِ الَّذِي نَزَّلَ الفُرْقَانَ عَلَى عَبْدِهِ لِيَكُونَ لِلْعَالَمِينَ نَذِيراً.',
  },
  {
    id: 2,
    text: 'اللَّهُمَّ ارْحَمْنِي بِالقُرْآنِ، وَاجْعَلْهُ لِي إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً.',
  },
  {
    id: 3,
    text: 'اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ، وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ، وَارْزُقْنِي تِلَاوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ العَالَمِينَ.',
  },
  {
    id: 4,
    text: 'اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ المَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ.',
  },
  {
    id: 5,
    text: 'اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ، وَخَيْرَ عَمَلِي خَوَاتِمَهُ، وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ فِيهِ.',
  },
  {
    id: 6,
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِيشَةً هَنِيَّةً، وَمِيتَةً سَوِيَّةً، وَمَرَدّاً غَيْرَ مُخْزٍ وَلَا فَاضِحٍ.',
  },
  {
    id: 7,
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ المَسْأَلَةِ، وَخَيْرَ الدُّعَاءِ، وَخَيْرَ النَّجَاحِ، وَخَيْرَ العِلْمِ، وَخَيْرَ العَمَلِ، وَخَيْرَ الثَّوَابِ، وَخَيْرَ الحَيَاةِ، وَخَيْرَ المَمَاتِ، وَثَبِّتْنِي وَثَقِّلْ مَوَازِينِي، وَحَقِّقْ إِيمَانِي، وَارْفَعْ دَرَجَتِي، وَتَقَبَّلْ صَلَاتِي، وَاغْفِرْ خَطِيئَاتِي، وَأَسْأَلُكَ العُلَا مِنَ الجَنَّةِ.',
  },
  {
    id: 8,
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مُوجِبَاتِ رَحْمَتِكَ، وَعَزَائِمَ مَغْفِرَتِكَ، وَالسَّلَامَةَ مِنْ كُلِّ إِثْمٍ، وَالغَنِيمَةَ مِنْ كُلِّ بِرٍّ، وَالفَوْزَ بِالجَنَّةِ، وَالنَّجَاةَ مِنَ النَّارِ.',
  },
  {
    id: 9,
    text: 'اللَّهُمَّ أَحْسِنْ عَاقِبَتَنَا فِي الأُمُورِ كُلِّهَا، وَأَجِرْنَا مِنْ خِزْيِ الدُّنْيَا وَعَذَابِ الآخِرَةِ.',
  },
  {
    id: 10,
    text: 'اللَّهُمَّ اقْسِمْ لَنَا مِنْ خَشْيَتِكَ مَا تَحُولُ بِهِ بَيْنَنَا وَبَيْنَ مَعْصِيَتِكَ، وَمِنْ طَاعَتِكَ مَا تُبَلِّغُنَا بِهِ جَنَّتَكَ، وَمِنَ اليَقِينِ مَا تُهَوِّنُ بِهِ عَلَيْنَا مَصَائِبَ الدُّنْيَا، وَمَتِّعْنَا بِأَسْمَاعِنَا وَأَبْصَارِنَا وَقُوَّاتِنَا مَا أَحْيَيْتَنَا، وَاجْعَلْهُ الوَارِثَ مِنَّا، وَاجْعَلْ ثَأْرَنَا عَلَى مَنْ ظَلَمَنَا، وَانْصُرْنَا عَلَى مَنْ عَادَانَا، وَلَا تَجْعَلْ مُصِيبَتَنَا فِي دِينِنَا، وَلَا تَجْعَلِ الدُّنْيَا أَكْبَرَ هَمِّنَا وَلَا مَبْلَغَ عِلْمِنَا، وَلَا تُسَلِّطْ عَلَيْنَا مَنْ لَا يَرْحَمُنَا.',
  },
  {
    id: 11,
    text: 'اللَّهُمَّ لَا تَدَعْ لَنَا ذَنْباً إِلَّا غَفَرْتَهُ، وَلَا هَمّاً إِلَّا فَرَّجْتَهُ، وَلَا دَيْناً إِلَّا قَضَيْتَهُ، وَلَا حَاجَةً مِنْ حَوَائِجِ الدُّنْيَا وَالآخِرَةِ هِيَ لَكَ رِضاً وَلَنَا فِيهَا صَلَاحٌ إِلَّا قَضَيْتَهَا يَا أَرْحَمَ الرَّاحِمِينَ.',
  },
  {
    id: 12,
    text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ، وَصَلَّى اللهُ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَأَصْحَابِهِ الأَخْيَارِ، وَسَلَّمَ تَسْلِيماً كَثِيراً.',
  },
];

export default function DuaKhatmScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(20);

  const fullText = DUA_KHATM_PARAGRAPHS.map((p) => p.text).join('\n\n');

  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${fullText}\n\n[دعاء ختم القرآن الكريم - تطبيق أُنس]`,
      });
    } catch {}
  };

  return (
    <View style={styles.safeArea}>
      <IslamicBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* TOP HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/quran' as any))}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={22} color="#f8fafc" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>دعاء ختم القرآن الكريم</Text>

          <View style={styles.headerActionsRight}>
            <TouchableOpacity
              style={styles.headerCircleBtn}
              activeOpacity={0.75}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={18} color="#f8fafc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerCircleBtn}
              activeOpacity={0.75}
              onPress={handleCopy}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={17}
                color={copied ? '#34d399' : '#f8fafc'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* BANNER CARD */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerEmblemWrapper}>
              <Image
                source={require('@/assets/images/quran_circle_emblem.png')}
                style={styles.bannerEmblemImg}
                resizeMode="cover"
              />
            </View>

            <Text style={styles.bannerMainTitle}>دعاء ختم القرآن الكريم</Text>
            <Text style={styles.bannerSubTitle}>
              تقبل الله منكم صالح الأعمال، وجعل القرآن ربيع قلوبكم ونور صدوركم وجلاء أحزانكم
            </Text>

            {/* FONT SIZE CONTROLS & COPY PILL */}
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.controlPill}
                onPress={() => setFontSize((prev) => Math.min(28, prev + 2))}
                activeOpacity={0.75}
              >
                <Text style={styles.controlPillText}>+ أ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlPill}
                onPress={() => setFontSize((prev) => Math.max(16, prev - 2))}
                activeOpacity={0.75}
              >
                <Text style={styles.controlPillText}>- أ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlPill, copied && styles.controlPillActive]}
                onPress={handleCopy}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={14}
                  color={copied ? '#34d399' : '#94a3b8'}
                />
                <Text style={[styles.controlPillText, copied && { color: '#34d399' }]}>
                  {copied ? 'تم النسخ' : 'نسخ الدعاء'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* DUA TEXT CARD */}
          <View style={styles.duaTextCard}>
            {DUA_KHATM_PARAGRAPHS.map((item, index) => (
              <View key={item.id} style={styles.paragraphWrapper}>
                <Text style={[styles.duaParagraphText, { fontSize, lineHeight: fontSize * 1.85 }]}>
                  {item.text}
                </Text>

                {index < DUA_KHATM_PARAGRAPHS.length - 1 && (
                  <View style={styles.ornamentDivider}>
                    <View style={styles.dividerLine} />
                    <MaterialCommunityIcons name="star-four-points" size={14} color="#34d399" />
                    <View style={styles.dividerLine} />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* BOTTOM ACTIONS */}
          <View style={styles.bottomButtonsWrapper}>
            <TouchableOpacity
              style={styles.primaryIndexBtn}
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace('/(tabs)/quran' as any);
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.primaryIndexBtnText}>العودة إلى المصحف الشريف</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryRestartBtn}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace({ pathname: '/surah/[id]', params: { id: '1' } });
              }}
            >
              <Ionicons name="book-outline" size={18} color="#34d399" />
              <Text style={styles.secondaryRestartBtnText}>بدء ختمة جديدة من سورة الفاتحة</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090f1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#f8fafc',
    textAlign: 'center',
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  /* BANNER */
  bannerCard: {
    backgroundColor: '#122026',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerEmblemWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#304a3f',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  bannerEmblemImg: {
    width: 60,
    height: 60,
  },
  bannerMainTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  bannerSubTitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)',
  },
  controlPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  controlPillText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#cbd5e1',
  },

  /* TEXT CARD */
  duaTextCard: {
    backgroundColor: '#122026',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  paragraphWrapper: {
    marginBottom: 14,
  },
  duaParagraphText: {
    fontFamily: 'Amiri_400Regular',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  ornamentDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(52, 211, 153, 0.25)',
  },

  /* BOTTOM BUTTONS */
  bottomButtonsWrapper: {
    gap: 10,
    marginTop: 4,
  },
  primaryIndexBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryIndexBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  secondaryRestartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
  },
  secondaryRestartBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#34d399',
  },
});
