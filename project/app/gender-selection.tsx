import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Users, Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

// Simple in-memory storage for demonstration (in real app, use AsyncStorage)
declare global {
  var savedProfileData: any;
}

if (typeof global.savedProfileData === 'undefined') {
  global.savedProfileData = null;
}

export default function GenderSelectionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = () => {
    if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.gender) {
      setSelectedGender(global.savedProfileData.personalInfo.gender);
    }
  };

  const genderOptions = [
    {
      id: 'male',
      label: 'Male',
      icon: '♂️'
    },
    {
      id: 'female',
      label: 'Female',
      icon: '♀️'
    }
  ];

  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
  };

  const handleSave = () => {
    if (!selectedGender) {
      Alert.alert('Selection Required', 'Please select your gender');
      return;
    }

    // Save the gender to shared storage
    if (!global.savedProfileData) {
      global.savedProfileData = { personalInfo: {} };
    }
    if (!global.savedProfileData.personalInfo) {
      global.savedProfileData.personalInfo = {};
    }
    global.savedProfileData.personalInfo.gender = selectedGender;

    Alert.alert(
      'Gender Saved',
      `Your gender has been set to ${selectedGender === 'male' ? 'Male' : 'Female'}.`,
      [{ 
        text: 'OK', 
        onPress: () => router.back()
      }]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity 
          onPress={handleCancel} 
          style={styles.cancelButton}
          activeOpacity={0.7}
        >
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Gender</Text>
                 <TouchableOpacity 
           onPress={handleSave}
           style={styles.saveButton}
           activeOpacity={0.7}
         >
           <Text style={[styles.saveText, { color: theme.colors.primary }]}>OK</Text>
         </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Title and Description */}
        <View style={styles.titleContainer}>
          <Users size={32} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Select Your Gender</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            This information helps us personalize your experience
          </Text>
        </View>

        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: selectedGender === option.id ? theme.colors.primary : theme.colors.border
                }
              ]}
              onPress={() => handleGenderSelect(option.id as 'male' | 'female')}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionIcon}>
                  <Text style={styles.genderEmoji}>{option.icon}</Text>
                </View>
                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                  {option.label}
                </Text>
              </View>
              
              {selectedGender === option.id && (
                <View style={[styles.checkContainer, { backgroundColor: theme.colors.primary }]}>
                  <Check size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Information */}
        <View style={[styles.infoContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Privacy Notice</Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Your gender information is private and secure. It's only used to enhance your app experience and won't be shared with other users unless you choose to display it on your profile.
          </Text>
        </View>

        {/* Selected Gender Display */}
        {selectedGender && (
          <View style={[styles.selectedContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.selectedLabel, { color: theme.colors.textSecondary }]}>Selected:</Text>
            <View style={styles.selectedGender}>
              <Text style={styles.selectedEmoji}>
                {selectedGender === 'male' ? '♂️' : '♀️'}
              </Text>
              <Text style={[styles.selectedText, { color: theme.colors.primary }]}>
                {selectedGender === 'male' ? 'Male' : 'Female'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 16,
  },
  genderEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  selectedContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  selectedGender: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  selectedText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
}); 