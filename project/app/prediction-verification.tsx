import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Phone, 
  User, 
  Shield,
  MessageSquare,
  HelpCircle
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function PredictionVerificationScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone number validation (assuming international format)
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone.trim());
  };

  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (!hasUnsavedChanges && text.trim() !== '') {
      setHasUnsavedChanges(true);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    if (!hasUnsavedChanges && text.trim() !== '') {
      setHasUnsavedChanges(true);
    }
  };

  const handleVerificationCodeChange = (text: string) => {
    setVerificationCode(text);
    if (!hasUnsavedChanges && text.trim() !== '') {
      setHasUnsavedChanges(true);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      // Simulate sending verification code
      setIsCodeSent(true);
      setCountdown(30);
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert('Success', 'Verification code sent to your phone number');
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    }
  };

  const handleSubmitVerification = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit verification code');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Development credentials for testing
      if (fullName.toLowerCase() === 'baby' && phoneNumber === '0772908010' && verificationCode === '1234') {
        Alert.alert(
          'Verification Successful',
          'You can now access your prediction numbers',
          [
            {
              text: 'Continue',
              onPress: () => router.push('/prediction-numbers')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Invalid credentials. For development, use:\nName: Baby\nPhone: 0772908010\nCode: 1234');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    IconComponent: any,
    keyboardType: any = 'default',
    maxLength?: number,
    editable: boolean = true
  ) => (
    <View style={styles.formField}>
      <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <View style={[styles.inputContainer, { 
        backgroundColor: theme.colors.backgroundSecondary,
        borderColor: theme.colors.border 
      }]}>
        <IconComponent size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.textInput, { 
            color: theme.colors.text,
            opacity: editable ? 1 : 0.6
          }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
        />
      </View>
    </View>
  );

  const renderVerificationField = () => (
    <View style={styles.formField}>
      <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
        Verification Code
      </Text>
      <View style={styles.verificationRow}>
        <View style={[styles.inputContainer, { 
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: theme.colors.border,
          flex: 1,
          marginRight: 12
        }]}>
          <MessageSquare size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.textInput, { color: theme.colors.text }]}
            value={verificationCode}
            onChangeText={handleVerificationCodeChange}
            placeholder="Enter verification code"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
        <TouchableOpacity
          style={[styles.codeButton, { 
            backgroundColor: countdown > 0 ? theme.colors.backgroundSecondary : '#EF5350',
            opacity: countdown > 0 ? 0.6 : 1
          }]}
          onPress={handleSendVerificationCode}
          disabled={countdown > 0}
          activeOpacity={0.8}
        >
          <Text style={[styles.codeButtonText, {
            color: countdown > 0 ? theme.colors.textSecondary : '#FFFFFF'
          }]}>
            {countdown > 0 ? `${countdown}s` : 'Get Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWarnings = () => (
    <View style={[styles.warningsContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.warningsTitle, { color: theme.colors.text }]}>
        Important Notes:
      </Text>
      <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
        1. Each verification allows access to one account only. Once verified for another account, previous access will be revoked.
      </Text>
      <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
        2. To ensure account and fund security, phone number verification must match your registration information.
      </Text>
      <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
        3. Phone number cannot be virtual, temporary, or shared cards.
      </Text>
      <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
        4. For verification issues, please contact <Text style={{ color: '#EF5350' }}>Account Support</Text> for online customer service.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity 
          onPress={handleBackPress} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Verification
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {renderFormField(
            'Full Name',
            fullName,
            handleFullNameChange,
            'Enter your full name',
            User,
            'default',
            50
          )}

          {renderFormField(
            'Phone Number',
            phoneNumber,
            handlePhoneNumberChange,
            'Enter Phone Number',
            Phone,
            'phone-pad',
            15
          )}

          {renderVerificationField()}

          <TouchableOpacity
            style={[styles.submitButton, { 
              backgroundColor: '#EF5350',
              opacity: isSubmitting ? 0.7 : 1 
            }]}
            onPress={handleSubmitVerification}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Shield size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Verifying...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        {renderWarnings()}

        <TouchableOpacity 
          style={styles.helpButton} 
          activeOpacity={0.7}
          onPress={() => router.push('/help-center?showVerificationHelp=true')}
        >
          <HelpCircle size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            Can't receive verification code?
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    marginBottom: 20,
  },
  formField: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  codeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  warningsContainer: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  warningsTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: 6,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
}); 