import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Phone } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

// Simple in-memory storage for demonstration (in real app, use AsyncStorage)
declare global {
  var savedProfileData: any;
}

if (typeof global.savedProfileData === 'undefined') {
  global.savedProfileData = null;
}

export default function PhoneNumberEditScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = () => {
    if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.phoneNumber) {
      setPhoneNumber(global.savedProfileData.personalInfo.phoneNumber);
    }
  };

  // Phone number formatting for Uganda
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('256')) {
      const match = cleaned.match(/^(256)(\d{3})(\d{3})(\d{3})$/);
      if (match) {
        return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
      }
    } else if (cleaned.startsWith('0')) {
      const match = cleaned.match(/^(0)(\d{3})(\d{3})(\d{3})$/);
      if (match) {
        return `${match[1]}${match[2]} ${match[3]} ${match[4]}`;
      }
    }
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return text;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleSave = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Number Required', 'Please enter your phone number');
      return;
    }

    // Save the phone number to shared storage
    if (!global.savedProfileData) {
      global.savedProfileData = { personalInfo: {} };
    }
    if (!global.savedProfileData.personalInfo) {
      global.savedProfileData.personalInfo = {};
    }
    global.savedProfileData.personalInfo.phoneNumber = phoneNumber.trim();

    Alert.alert(
      'Phone Number Saved',
      'Your phone number has been saved successfully.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton} activeOpacity={0.7}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Phone Number</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} activeOpacity={0.7}>
            <Text style={[styles.saveText, { color: theme.colors.primary }]}>OK</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Phone size={32} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Enter Phone Number</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Your phone number helps secure your account
            </Text>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              placeholder="Enter phone number"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  cancelButton: { padding: 8, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', flex: 1, textAlign: 'center' },
  saveButton: { padding: 8, borderRadius: 8 },
  saveText: { fontSize: 16, fontFamily: 'Inter-SemiBold' },
  content: { flex: 1, padding: 16 },
  titleContainer: { alignItems: 'center', marginBottom: 32, paddingTop: 20 },
  title: { fontSize: 24, fontFamily: 'Inter-Bold', marginTop: 12, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 22 },
  inputContainer: { borderRadius: 16, padding: 16, marginBottom: 24 },
  textInput: { fontSize: 18, fontFamily: 'Inter-Regular', minHeight: 50, textAlign: 'center' },
}); 