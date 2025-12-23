import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, User, Check } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';

// Simple in-memory storage for demonstration (in real app, use AsyncStorage)
declare global {
  var savedProfileData: any;
}

if (typeof global.savedProfileData === 'undefined') {
  global.savedProfileData = null;
}

export default function RealNameEditScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { userInfo, setLoggedIn, isLoggedIn } = useAuth();
  const [realName, setRealName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = () => {
    if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.realName) {
      setRealName(global.savedProfileData.personalInfo.realName);
    }
  };

  const handleSave = () => {
    if (!realName.trim()) {
      Alert.alert('Error', 'Please enter your real name');
      return;
    }

    // Save the real name to shared storage
    if (!global.savedProfileData) {
      global.savedProfileData = { personalInfo: {} };
    }
    if (!global.savedProfileData.personalInfo) {
      global.savedProfileData.personalInfo = {};
    }
    global.savedProfileData.personalInfo.realName = realName.trim();

    // If user doesn't have a custom username set, update the main username to use real name
    if (isLoggedIn && userInfo) {
      // Check if user has a custom username set, if not, use real name
      const hasCustomUsername = global.savedProfileData.personalInfo.champsUsername;
      if (!hasCustomUsername && (userInfo.username === 'DefaultUser123' || userInfo.username.startsWith('DefaultUser'))) {
        // Create a clean username from real name (remove spaces, special chars)
        const cleanUsername = realName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanUsername.length >= 3) {
          const updatedUserInfo = {
            ...userInfo,
            username: cleanUsername
          };
          setLoggedIn(true, updatedUserInfo);
        }
      }
    }

    Alert.alert('Success', 'Real name updated successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleTextChange = (text: string) => {
    setRealName(text);
    setHasChanges(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <TouchableOpacity 
            onPress={handleCancel} 
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Real Name</Text>
          <TouchableOpacity 
            onPress={handleSave}
            style={[styles.okButton, { backgroundColor: theme.colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <User size={32} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Real Name</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter your full legal name
            </Text>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              value={realName}
              onChangeText={handleTextChange}
              placeholder="Enter your full name"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus={true}
              maxLength={50}
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
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
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
  okButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  okButtonText: {
    color: '#FFFFFF',
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
  inputContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  textInput: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  guidelinesContainer: {
    marginTop: 8,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  guideline: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 4,
  },
}); 