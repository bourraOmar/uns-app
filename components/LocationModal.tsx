import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Switch,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CityLocation,
  POPULAR_CITIES,
  requestDeviceGpsLocation,
} from '@/services/prayerTimesService';

interface LocationModalProps {
  visible: boolean;
  currentLocation: CityLocation;
  onClose: () => void;
  onApplyLocation: (location: CityLocation) => void;
}

export default function LocationModal({
  visible,
  currentLocation,
  onClose,
  onApplyLocation,
}: LocationModalProps) {
  const [isAutoLocation, setIsAutoLocation] = useState(false);
  const [localCity, setLocalCity] = useState<CityLocation | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Sub-view: Picking city from list
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCity = localCity || currentLocation;

  // Load saved auto-location preference on mount
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem('@uns_auto_location').then((val) => {
      if (isMounted && val !== null) {
        setIsAutoLocation(val === 'true');
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = () => {
    setLocalCity(null);
    setShowCityPicker(false);
    setSearchQuery('');
    onClose();
  };

  const handleToggleAuto = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAutoLocation(value);

    if (value) {
      setIsGpsLoading(true);
      try {
        const gpsLoc = await requestDeviceGpsLocation();
        setLocalCity(gpsLoc);
      } catch {
        // keep current
      } finally {
        setIsGpsLoading(false);
      }
    }
  };

  const handleSelectCity = (city: CityLocation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalCity(city);
    setIsAutoLocation(false);
    setShowCityPicker(false);
    setSearchQuery('');
  };

  const handleApply = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('@uns_auto_location', isAutoLocation ? 'true' : 'false');
    await AsyncStorage.setItem('@uns_user_location', JSON.stringify(selectedCity));
    onApplyLocation(selectedCity);
    setLocalCity(null);
    onClose();
  };

  const filteredCities = POPULAR_CITIES.filter(
    (c) =>
      c.city.includes(searchQuery.trim()) ||
      c.country.includes(searchQuery.trim())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle Bar */}
              <View style={styles.dragBar} />

              {/* Header: Close Button on Left, Title in Center */}
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>

                <Text style={styles.modalTitle}>تعديل الموقع</Text>

                <View style={{ width: 36 }} />
              </View>

              {!showCityPicker ? (
                /* Main Options View */
                <View>
                  {/* Settings Box */}
                  <View style={styles.settingsBox}>
                    {/* Row 1: Auto Location */}
                    <View style={styles.settingRow}>
                      {/* Left: Switch */}
                      {isGpsLoading ? (
                        <ActivityIndicator size="small" color="#4ade80" />
                      ) : (
                        <Switch
                          value={isAutoLocation}
                          onValueChange={handleToggleAuto}
                          trackColor={{ false: '#334155', true: '#10b981' }}
                          thumbColor="#ffffff"
                        />
                      )}

                      {/* Right: Icon + Label */}
                      <View style={styles.labelWithIconRow}>
                        <Text style={styles.settingLabelText}>تحديد الموقع تلقائي</Text>
                        <View style={styles.iconCircle}>
                          <Ionicons name="navigate" size={16} color="#4ade80" />
                        </View>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.rowDivider} />

                    {/* Row 2: Selected Location */}
                    <TouchableOpacity
                      style={styles.settingRow}
                      activeOpacity={0.7}
                      onPress={() => setShowCityPicker(true)}
                    >
                      {/* Left: City Name + Chevron */}
                      <View style={styles.cityValueRow}>
                        <Ionicons name="chevron-back" size={16} color="#94a3b8" />
                        <Text style={styles.cityValueText} numberOfLines={1}>
                          {selectedCity.city}
                        </Text>
                      </View>

                      {/* Right: Icon + Label */}
                      <View style={styles.labelWithIconRow}>
                        <Text style={styles.settingLabelText}>الموقع المحدد</Text>
                        <View style={styles.iconCircle}>
                          <Ionicons name="location-outline" size={17} color="#4ade80" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Apply Button */}
                  <TouchableOpacity
                    style={styles.applyBtn}
                    activeOpacity={0.85}
                    onPress={handleApply}
                  >
                    <Text style={styles.applyBtnText}>تطبيق التعديل</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* City Search & Picker View */
                <View style={styles.pickerContainer}>
                  {/* Search Bar */}
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#94a3b8" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="ابحث عن مدينتك..."
                      placeholderTextColor="#64748b"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Cities Scroll List */}
                  <ScrollView
                    style={styles.citiesScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredCities.map((item, idx) => {
                      const isSelected = item.city === selectedCity.city;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.cityItemRow,
                            isSelected && styles.cityItemRowActive,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleSelectCity(item)}
                        >
                          {isSelected ? (
                            <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                          ) : (
                            <View style={{ width: 20 }} />
                          )}
                          <Text
                            style={[
                              styles.cityItemText,
                              isSelected && styles.cityItemTextActive,
                            ]}
                          >
                            {item.city}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {filteredCities.length === 0 && (
                      <View style={styles.emptyResults}>
                        <Text style={styles.emptyResultsText}>
                          لم يتم العثور على مدينة مطابقة
                        </Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Return to main settings */}
                  <TouchableOpacity
                    style={styles.backBtn}
                    activeOpacity={0.7}
                    onPress={() => setShowCityPicker(false)}
                  >
                    <Text style={styles.backBtnText}>رجوع</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#16231d',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  dragBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#24352c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },

  /* Settings Box */
  settingsBox: {
    backgroundColor: '#111b16',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f3328',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabelText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14.5,
    color: '#ffffff',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 16,
  },
  cityValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '55%',
  },
  cityValueText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13.5,
    color: '#cbd5e1',
  },

  /* Apply Button */
  applyBtn: {
    backgroundColor: '#0c5237',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#15803d',
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  applyBtnText: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 16,
    color: '#86efac',
  },

  /* City Picker Subview */
  pickerContainer: {
    maxHeight: 340,
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#111b16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f3328',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'right',
  },
  citiesScroll: {
    maxHeight: 220,
  },
  cityItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  cityItemRowActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  cityItemText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'right',
  },
  cityItemTextActive: {
    color: '#34d399',
    fontFamily: 'Cairo_700Bold',
  },
  emptyResults: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#64748b',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  backBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#94a3b8',
  },
});
