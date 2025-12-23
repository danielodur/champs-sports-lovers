import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, TouchableWithoutFeedback, Keyboard, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Headphones } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { formatPhoneNumber } from '../utils/phoneFormatter';
import { useTranslation } from 'react-i18next';

export default function VerificationCodeSetPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    newPassword: '',
    confirmPassword: '',
    verificationCode: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });

  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const verificationCodeRef = useRef<TextInput>(null);


  // Clear countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      handleCancel();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [formData]);



  // Start countdown timer
  const startCountdown = () => {
    setCountdown(40);
    setIsCountdownActive(true);
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsCountdownActive(false);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Check if form is ready for verification code
  const isFormReadyForCode = () => {
    if (!formData.phoneNumber || !formData.newPassword || !formData.confirmPassword) {
      return false;
    }
    
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      return false;
    }
    
    return true;
  };

  // Check if form is ready for submission
  const isFormReadyForSubmit = () => {
    return isFormReadyForCode() && formData.verificationCode.length === 4;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phoneNumber') {
      const formattedValue = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else if (field === 'verificationCode') {
      // Only allow numbers and limit to 4 digits
      const newValue = value.replace(/[^0-9]/g, '').slice(0, 4);
      setFormData(prev => ({
        ...prev,
        [field]: newValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleGetCode = () => {
    if (!isFormReadyForCode() && !codeSent) {
      Alert.alert('Error', 'Please complete all required fields and ensure passwords meet requirements');
      return;
    }
    
    if (isCountdownActive) {
      return; // Prevent multiple sends during countdown
    }
    
    // Here you would typically call an API to send verification code
    setCodeSent(true);
    startCountdown();
    
    // Focus on verification code input after a short delay
    setTimeout(() => {
      verificationCodeRef.current?.focus();
    }, 100);
    
    const message = codeSent ? 'Verification code resent to your phone' : 'Verification code has been sent to your phone';
    Alert.alert('Success', message);
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

  const handleSubmit = () => {
    if (!formData.phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
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
    
    if (!formData.verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }
    
    // Here you would typically call an API to reset password with verification code
    Alert.alert('Success', 'You have successfully set password.', [
      { text: 'OK', onPress: () => router.push('/profile-page') }
    ]);
  };



  const handleCancel = () => {
    // Check if user has entered any data
    const hasData = formData.phoneNumber || formData.newPassword || formData.confirmPassword || formData.verificationCode;
    
    if (hasData) {
      Alert.alert(
        'Exit Verification',
        'Are you sure you want to exit?',
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

  const handleCustomerCare = () => {
    router.push('/help-center');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity 
          onPress={handleCancel}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Set Password</Text>
        
        <TouchableOpacity 
          onPress={handleCustomerCare}
          style={styles.customerCareButton}
          activeOpacity={0.7}
        >
          <Headphones size={24} color="#EF5350" />
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.content}>
        {/* Phone Number */}
        <View style={styles.inputSection}>
                    <TextInput
            style={[styles.textInput, { 
              color: theme.colors.text, 
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.backgroundSecondary 
            }]}
            value={formData.phoneNumber}
            onChangeText={(text) => handleInputChange('phoneNumber', text)}
            placeholder="0772 908 010"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
            autoCapitalize="none"
            />
        </View>

        {/* New Password */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
                        <TextInput
              style={[styles.textInput, { 
                color: theme.colors.text, 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.backgroundSecondary 
              }]}
              value={formData.newPassword}
              onChangeText={(text) => handleInputChange('newPassword', text)}
              placeholder="Enter new password"
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

        {/* Confirm Password */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, { 
                color: theme.colors.text, 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.backgroundSecondary 
              }]}
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              placeholder="Confirm new password"
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

        {/* Verification Code Section */}
        <View style={styles.verificationSection}>
          <View style={styles.verificationRow}>
            <TextInput
              ref={verificationCodeRef}
              style={[styles.verificationInput, { 
                color: theme.colors.text, 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.backgroundSecondary 
              }]}
              value={formData.verificationCode}
              onChangeText={(text) => handleInputChange('verificationCode', text)}
              placeholder="1234"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={4}

            />
            <TouchableOpacity
              style={[styles.getCodeButton, { 
                backgroundColor: (isFormReadyForCode() && !isCountdownActive) || formData.verificationCode.length > 0 ? '#EF5350' : theme.colors.textSecondary,
                opacity: (isFormReadyForCode() && !isCountdownActive) || (!isCountdownActive && codeSent) ? 1 : 0.6
              }]}
              onPress={handleGetCode}
              activeOpacity={0.8}
              disabled={(!isFormReadyForCode() && !codeSent) || isCountdownActive}
            >
              <Text style={[styles.getCodeText, { 
                color: '#FFFFFF',
                textAlign: 'center'
              }]}>
                {isCountdownActive ? `Resend Code in\n${countdown}s` : (codeSent ? 'Resend Code' : 'Get Code')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { 
            backgroundColor: '#EF5350',
            opacity: isFormReadyForSubmit() ? 1 : 0.6
          }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!isFormReadyForSubmit()}
        >
          <Text style={[styles.submitButtonText, {
            color: '#FFFFFF'
          }]}>Submit</Text>
        </TouchableOpacity>


        </View>
      </TouchableWithoutFeedback>
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
  backButton: {
    padding: 4,
  },
  customerCareButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputSection: {
    marginBottom: 12,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingRight: 50,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 8,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
  verificationSection: {
    marginBottom: 20,
  },
  verificationRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  verificationInput: {
    width: 160,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
  },
  getCodeButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 200,
  },
  getCodeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    lineHeight: 18,
  },
  submitButton: {
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
}); 