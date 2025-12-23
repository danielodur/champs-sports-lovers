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

export default function ChampsUsernameEditScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { userInfo, setLoggedIn, isLoggedIn } = useAuth();
  const [username, setUsername] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = () => {
    if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.champsUsername) {
      setUsername(global.savedProfileData.personalInfo.champsUsername);
    }
  };

  const handleUsernameChange = (text: string) => {
    // Remove spaces and special characters except underscore and numbers
    const cleanText = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleanText);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your Champs username');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    // Save the username to shared storage
    if (!global.savedProfileData) {
      global.savedProfileData = { personalInfo: {} };
    }
    if (!global.savedProfileData.personalInfo) {
      global.savedProfileData.personalInfo = {};
    }
    global.savedProfileData.personalInfo.champsUsername = username.trim();

    // Update the username in useAuth store to reflect across all screens
    if (isLoggedIn && userInfo) {
      const updatedUserInfo = {
        ...userInfo,
        username: username.trim() // Update the main username that displays everywhere
      };
      setLoggedIn(true, updatedUserInfo);
    }

    Alert.alert('Success', 'Username updated successfully', [
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Champs Username</Text>
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
            <Text style={[styles.title, { color: theme.colors.text }]}>Champs Username</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Create your unique username
            </Text>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={[styles.usernameInputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <Text style={[styles.atSymbol, { color: theme.colors.textSecondary }]}>@</Text>
              <TextInput
                style={[styles.usernameInput, { color: theme.colors.text }]}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="username"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
            
            {username && (
              <View style={styles.previewContainer}>
                <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>Preview:</Text>
                <Text style={[styles.previewText, { color: theme.colors.primary }]}>@{username}</Text>
              </View>
            )}
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
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  atSymbol: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  previewText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
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