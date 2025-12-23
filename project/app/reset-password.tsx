import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { phone } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please enter and confirm your new password.');
      return;
    }
    if (newPassword.length < 6 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      Alert.alert('Error', 'Password must be at least 6 characters and include both letters and digits.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Your password has been reset. Please log in with your new password.');
      router.replace('/login-register');
    }, 1200);
  };

  const handleBack = () => {
    Alert.alert(
      'Are you sure?',
      'You are advised to reset your password before leaving this page. Are you sure you want to go back?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
          <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
            <ChevronLeft size={28} color={theme.colors.text} onPress={handleBack} style={styles.backButton} /> 
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Reset Password</Text> 
            <View style={styles.headerRight} /> 
          </View> 
          <View style={styles.content}>
            <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>Set a new password for your account {phone ? `(${phone})` : ''}.</Text>
            <View style={[
              styles.passwordInputContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border
              }
            ]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="New Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword(v => !v)}>
                {showNewPassword ? <EyeOff size={22} color={theme.colors.textSecondary} /> : <Eye size={22} color={theme.colors.textSecondary} />}
              </TouchableOpacity>
            </View>
            <View style={[
              styles.passwordInputContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border
              }
            ]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="Confirm New Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(v => !v)}>
                {showConfirmPassword ? <EyeOff size={22} color={theme.colors.textSecondary} /> : <Eye size={22} color={theme.colors.textSecondary} />}
              </TouchableOpacity>
            </View>
            <Text style={[styles.passwordRequirement, { color: theme.colors.textSecondary }]}>Password must be at least 6 characters and include both letters and digits.</Text>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: newPassword && confirmPassword ? '#EF5350' : '#CCCCCC', opacity: loading ? 0.7 : 1 }]}
              onPress={handleResetPassword}
              disabled={!newPassword || !confirmPassword || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.resetButtonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  headerRight: { width: 36 },
  content: { flex: 1, padding: 24, justifyContent: 'flex-start' },
  instructions: { fontSize: 14, fontFamily: 'Inter-Regular', marginBottom: 12 },
  passwordInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1
  },
  input: { flex: 1, height: 48, borderRadius: 8, paddingHorizontal: 16, fontSize: 16, fontFamily: 'Inter-Regular', borderWidth: 1 },
  passwordInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  eyeIcon: { position: 'absolute', right: 12, padding: 4 },
  passwordRequirement: { fontSize: 12, fontFamily: 'Inter-Regular', marginBottom: 8, marginLeft: 2 },
  resetButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  resetButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },
}); 