import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { toEasternArabicNumerals } from '@/data/quranPages';
import { useAppTheme } from '@/context/ThemeContext';

interface TafsirModalProps {
  visible: boolean;
  onClose: () => void;
  surahName: string;
  surahId: number;
  verseNumber: number;
  verseText: string;
}

export default function TafsirModal({
  visible,
  onClose,
  surahName,
  surahId,
  verseNumber,
  verseText,
}: TafsirModalProps) {
  const { isDark } = useAppTheme();
  const [tafsirText, setTafsirText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const colors = {
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBorder: isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.95)',
    headerBorder: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.85)',
    closeBtnBg: isDark ? '#0f172a' : 'rgba(241, 245, 249, 0.95)',
    closeBtnBorder: isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 0.8)',
    closeBtnIcon: isDark ? '#f8fafc' : '#0f172a',
    title: isDark ? '#f8fafc' : '#0f172a',
    subtitle: isDark ? '#34d399' : '#059669',
    ayahBoxBg: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(241, 245, 249, 0.95)',
    ayahBoxBorder: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.35)',
    ayahText: isDark ? '#34d399' : '#047857',
    label: isDark ? '#94a3b8' : '#64748b',
    paragraph: isDark ? '#f8fafc' : '#1e293b',
  };

  useEffect(() => {
    if (visible && surahId && verseNumber) {
      loadTafsir();
    }
  }, [visible, surahId, verseNumber]);

  const loadTafsir = async () => {
    setIsLoading(true);
    setTafsirText('');
    try {
      const res = await fetch(
        `https://api.quran.com/api/v4/tafsirs/16/by_ayah/${surahId}:${verseNumber}`
      );
      if (!res.ok) throw new Error('Failed to load tafsir');
      const data = await res.json();
      const rawText = data?.tafsir?.text || '';
      // Strip HTML tags like <span class="green">
      const cleaned = rawText.replace(/<[^>]*>?/gm, '');
      setTafsirText(cleaned || 'لا يتوفر تفسير ميسر لهذه الآية حالياً.');
    } catch {
      setTafsirText('تعذر تحميل التفسير. يرجى التحقق من الاتصال بالإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  const arabicVerseNum = toEasternArabicNumerals(verseNumber);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.headerBorder }]}>
            <TouchableOpacity
              style={[
                styles.closeBtn,
                { backgroundColor: colors.closeBtnBg, borderColor: colors.closeBtnBorder },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.closeBtnIcon} />
            </TouchableOpacity>

            <View style={styles.modalHeaderTitleBlock}>
              <Text style={[styles.modalTitle, { color: colors.title }]}>
                تفسير الآية ({arabicVerseNum})
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.subtitle }]}>
                سورة {surahName} • التفسير الميسر
              </Text>
            </View>
          </View>

          {/* Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Ayah Calligraphy Box */}
            <View
              style={[
                styles.ayahBox,
                { backgroundColor: colors.ayahBoxBg, borderColor: colors.ayahBoxBorder },
              ]}
            >
              <Text style={[styles.ayahText, { color: colors.ayahText }]}>{verseText}</Text>
            </View>

            {/* Tafsir Content */}
            <View style={styles.tafsirContent}>
              <Text style={[styles.tafsirHeaderLabel, { color: colors.label }]}>بيان التفسير:</Text>
              {isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={styles.loadingText}>جاري جلب التفسير الميسر...</Text>
                </View>
              ) : (
                <Text style={[styles.tafsirParagraph, { color: colors.paragraph }]}>{tafsirText}</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.6)',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitleBlock: {
    alignItems: 'flex-end',
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
    color: '#f8fafc',
  },
  modalSubtitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#34d399',
    marginTop: 2,
  },
  scrollContent: {
    padding: 18,
  },
  ayahBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 16,
  },
  ayahText: {
    fontFamily: 'Amiri_700Bold',
    fontSize: 20,
    lineHeight: 44,
    color: '#34d399',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  tafsirContent: {
    paddingHorizontal: 4,
  },
  tafsirHeaderLabel: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'right',
    marginBottom: 8,
  },
  tafsirParagraph: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    lineHeight: 30,
    color: '#e2e8f0',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
  },
});
