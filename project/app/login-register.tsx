import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Platform, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy, Eye, EyeOff } from 'lucide-react-native';
import { useTheme, useThemeMode } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const { t } = useTranslation();
  const { setLoggedIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!agreedToTerms) return;
    if (!username || !password) {
      Alert.alert(t('Error'), t('Please enter both username and password'));
      return;
    }
    
    try {
      console.log('Login pressed with:', { username, password });
      
      // Set logged in state with user info - generate professional Dicebear avatar
      const finalUsername = username || 'DefaultUser123';
      const backgroundColors = ['ffdfbf', 'f0f0f0', 'e8f4fd', 'fff2e6', 'f8f8ff', 'f0fff0', 'fffacd', 'f5f5dc'];
      const seedHash = finalUsername.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const colorIndex = Math.abs(seedHash) % backgroundColors.length;
      const backgroundColor = backgroundColors[colorIndex];
      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(finalUsername)}&backgroundColor=${backgroundColor}&size=160`;
      
      // ✅ CRITICAL FIX: Set authentication state BEFORE navigation
      console.log('🔐 Setting authentication state...');
      setLoggedIn(true, {
        username: finalUsername,
        avatar: avatarUrl
      });
      
      console.log('✅ Login successful, preparing navigation...');
      console.log('📝 User data set:', { username: finalUsername, avatar: avatarUrl });
      
      // ✅ ENHANCED NAVIGATION: Multiple navigation attempts with different strategies
      const navigateToProfile = () => {
        try {
          console.log('🚀 Attempting navigation to profile...');
          
          // Strategy 1: Replace with specific tab path
          router.replace('/(tabs)/profile');
          
          // Strategy 2: Fallback after delay
          setTimeout(() => {
            router.replace('/(tabs)/profile');
            console.log('🔄 Fallback navigation executed');
          }, 200);
          
          console.log('✅ Navigation commands executed');
        } catch (navError) {
          console.error('❌ Navigation error:', navError);
          
          // Strategy 3: Emergency fallback
          setTimeout(() => {
            router.push('/(tabs)/profile');
            console.log('🆘 Emergency navigation executed');
          }, 500);
        }
      };
      
      // Execute navigation immediately
      navigateToProfile();
      
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert(t('Error'), 'Login failed. Please try again.');
    }
  };

  const handleRecoverAccount = () => {
    router.push('/recover-account');
  };

  const handleRegister = () => {
    router.push('/register-and-login');
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`${provider} login pressed`);
    // Add your social login logic here
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button and Recover Account */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} 
            style={[styles.backButton, { marginTop: 40 }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.recoverButton, { marginTop: 40 }]} 
            onPress={handleRecoverAccount}
            activeOpacity={0.7}
          >
            <Text style={[styles.recoverText, { color: theme.colors.textSecondary }]}>
              Recover Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoBackground, { backgroundColor: theme.colors.primary }]}>
              <Trophy size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.appName, { color: theme.colors.text }]}>Champs</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                },
                Platform.select({ web: { outlineStyle: 'none' } as any })
              ]}
              placeholder={t('Enter your username')}
              placeholderTextColor={theme.colors.textSecondary}
              value={username}
              onChangeText={setUsername}
            />
            
            <View style={[
              styles.passwordContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border
              }
            ]}>
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    color: theme.colors.text
                  },
                  Platform.select({ web: { outlineStyle: 'none' } as any })
                ]}
                placeholder={t('Enter your password')}
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword}
              activeOpacity={0.7}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.colors.textSecondary }]}>
                {t('Forgot Password?')}
              </Text>
            </TouchableOpacity>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkboxInner,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: agreedToTerms ? theme.colors.primary : 'transparent'
                  }
                ]} />
              </TouchableOpacity>
              <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                I have read and agree to the{' '}
                <Text style={{ color: theme.colors.primary }}>User Agreement</Text> and{' '}
                <Text style={{ color: theme.colors.primary }}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton, 
                { 
                  backgroundColor: agreedToTerms ? '#EF5350' : '#CCCCCC',
                  opacity: agreedToTerms ? 1 : 0.6
                }
              ]}
              disabled={!agreedToTerms}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.loginButtonText,
                { color: agreedToTerms ? '#FFFFFF' : '#999999' }
              ]}>
                {t('Login/Register')}
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleRegister}
              activeOpacity={0.7}
            >
              <Text style={[styles.registerButtonText, { color: theme.colors.textSecondary }]}>
                {t('Login/Register with Code')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />

        {/* Social Login Icons at Bottom */}
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#000000' }]}
            onPress={() => handleSocialLogin('X')}
            activeOpacity={0.7}
          >
            <Text style={styles.xIcon}>𝕏</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#25D366' }]}
            onPress={() => handleSocialLogin('WhatsApp')}
            activeOpacity={0.7}
          >
            <Text style={styles.whatsappIcon}>💬</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
            onPress={() => handleSocialLogin('Facebook')}
            activeOpacity={0.7}
          >
            <Text style={styles.facebookIcon}>f</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  recoverButton: {
    padding: 8,
    borderRadius: 8,
  },
  recoverText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 500,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    padding: 4,
    borderRadius: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  checkboxInner: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  loginButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  registerButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  registerButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  bottomSpacer: {
    height: 60,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingBottom: 20,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  socialIcon: {
    width: 32,
    height: 32,
  },
  xIcon: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  whatsappIcon: {
    fontSize: 20,
  },
  facebookIcon: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});