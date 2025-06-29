import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Eye, EyeOff, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      isValid: minLength && hasUppercase && hasLowercase && hasNumber,
      errors: [
        !minLength && 'Password must be at least 6 characters',
        !hasUppercase && 'Password must contain at least one uppercase letter',
        !hasLowercase && 'Password must contain at least one lowercase letter',
        !hasNumber && 'Password must contain at least one number'
      ].filter(Boolean)
    };
  };

  const handleSave = () => {
    if (!formData.currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    
    if (!formData.newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert('Error', passwordValidation.errors.join('\n'));
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }
    
    // Here you would typically call an API to change the password
    Alert.alert('Success', 'Password changed successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleCancel = () => {
    // Check if user has entered any password data
    const hasPasswordData = formData.currentPassword || formData.newPassword || formData.confirmPassword;
    
    if (hasPasswordData) {
      Alert.alert(
        'Cancel Password Change',
        'You are advised to change password. Are you sure you want to cancel?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleVerificationCodeModification = () => {
    // Navigate to verification code screen
    router.push('/ver-code-set-password');
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
        
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Change Password</Text>
        
        <TouchableOpacity 
          onPress={handleSave}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <View style={styles.content}>
        {/* Current Password */}
        <View style={[styles.inputSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Current Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={formData.currentPassword}
                onChangeText={(text) => handleInputChange('currentPassword', text)}
                placeholder="Please enter current password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showPasswords.current}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('current')}
                activeOpacity={0.7}
              >
                {showPasswords.current ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* New Password */}
        <View style={[styles.inputSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={formData.newPassword}
                onChangeText={(text) => handleInputChange('newPassword', text)}
                placeholder="Please set new password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showPasswords.new}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('new')}
                activeOpacity={0.7}
              >
                {showPasswords.new ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={[styles.inputSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                placeholder="Please enter again"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showPasswords.confirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('confirm')}
                activeOpacity={0.7}
              >
                {showPasswords.confirm ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.passwordRequirements}>
          <Text style={[styles.requirementsTitle, { color: '#EF5350' }]}>Password must contain:</Text>
          <View style={styles.requirementsList}>
            <Text style={[styles.requirementItem, { color: theme.colors.textSecondary }]}>• At least 6 characters</Text>
            <Text style={[styles.requirementItem, { color: theme.colors.textSecondary }]}>• At least one uppercase letter</Text>
            <Text style={[styles.requirementItem, { color: theme.colors.textSecondary }]}>• At least one lowercase letter</Text>
            <Text style={[styles.requirementItem, { color: theme.colors.textSecondary }]}>• At least one number</Text>
          </View>
        </View>

        {/* Verification Code */}
        <View style={[styles.inputSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <TouchableOpacity
            style={styles.verificationRow}
            onPress={handleVerificationCodeModification}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Verification Code</Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    minWidth: 60,
  },
  cancelButton: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  inputSection: {
    marginHorizontal: 0,
    marginBottom: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  inputRow: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordRequirements: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  requirementsList: {
    gap: 4,
  },
  requirementItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
}); 