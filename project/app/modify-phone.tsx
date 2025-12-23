import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Phone, 
  Shield,
  MessageSquare,
  CheckCircle,
  User,
  X,
  HelpCircle
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type ScreenMode = 'bound' | 'verification-method' | 'verification-form';

export default function ModifyPhoneScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [screenMode, setScreenMode] = useState<ScreenMode>('bound');
  const [selectedMethod, setSelectedMethod] = useState<'phone' | 'realname'>('phone');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  
  // Mock current user's phone number (this would come from user context/state)
  const currentPhoneNumber = '0772908010'; // The phone number used in development
  const maskedPhoneNumber = `${currentPhoneNumber.slice(0, 3)}*****${currentPhoneNumber.slice(-3)}`;

  const showInstructionsModalWithAnimation = () => {
    setShowInstructionsModal(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideInstructionsModalWithAnimation = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowInstructionsModal(false);
    });
  };

  const handleChangePhoneNumber = () => {
    showInstructionsModalWithAnimation();
  };

  const handleProceedToVerification = () => {
    hideInstructionsModalWithAnimation();
    setScreenMode('verification-form');
  };

  const handleVerificationMethodContinue = () => {
    setScreenMode('verification-form');
  };

  const handleSendVerificationCode = async () => {
    if (!newPhoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your new phone number');
      return;
    }

    try {
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert('Success', 'Verification code sent to your new phone number');
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    }
  };

  const handleSubmitChange = async () => {
    if (!newPhoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your new phone number');
      return;
    }

    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    Alert.alert(
      'Success',
      'Phone number changed successfully!',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  const renderInstructionsModal = () => (
    <Modal
      visible={showInstructionsModal}
      transparent={true}
      animationType="none"
      onRequestClose={hideInstructionsModalWithAnimation}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={hideInstructionsModalWithAnimation}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Change Phone Number Instructions
            </Text>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
              1. The new phone number has not been registered with a SportsWee account
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
              2. The new phone number's real name information must match your account's real name information
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
              3. Phone numbers that have been deregistered from SportsWee do not support changing
            </Text>
            
            <TouchableOpacity 
              style={[styles.gotItButton, { backgroundColor: '#EF5350' }]}
              onPress={handleProceedToVerification}
              activeOpacity={0.8}
            >
              <Text style={styles.gotItButtonText}>I Got It</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );

  const renderBoundPhoneScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.centerContainer}>
        <View style={[styles.phoneIcon, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.iconWrapper}>
            <Phone size={32} color="#EF5350" />
            <View style={styles.checkmarkOverlay}>
              <CheckCircle size={16} color="#4CAF50" />
            </View>
          </View>
        </View>
        
        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          Phone Number Bound
        </Text>
        
        <Text style={[styles.phoneNumberDisplay, { color: theme.colors.text }]}>
          {maskedPhoneNumber}
        </Text>
        
        <Text style={[styles.warningText, { color: '#EF5350' }]}>
          Note: One phone number can only be bound to one SportsWee account.
        </Text>
        <Text style={[styles.warningText, { color: '#EF5350' }]}>
          The bound phone number will be used as an important method for identity verification. Please operate carefully!
        </Text>
        
        <TouchableOpacity
          style={[styles.changeButton, { backgroundColor: '#EF5350' }]}
          onPress={handleChangePhoneNumber}
          activeOpacity={0.8}
        >
          <Text style={styles.changeButtonText}>
            Change Phone Number
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderVerificationMethodScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.methodContainer}>
        <TouchableOpacity
          style={[
            styles.methodOption,
            {
              backgroundColor: theme.colors.backgroundSecondary,
              borderColor: '#EF5350',
              borderWidth: 2
            }
          ]}
          onPress={() => setSelectedMethod('phone')}
          activeOpacity={0.7}
        >
          <Phone size={32} color="#EF5350" />
          <View style={styles.methodTextContainer}>
            <Text style={[styles.methodTitle, { color: theme.colors.text }]}>
              Method 1:
            </Text>
            <Text style={[styles.methodSubtitle, { color: '#EF5350' }]}>
              Phone Number Verification
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: '#EF5350' }]}
          onPress={handleVerificationMethodContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderVerificationFormScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
            New Phone Number
          </Text>
          <View style={[styles.inputContainer, { 
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border 
          }]}>
            <Phone size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              value={newPhoneNumber}
              onChangeText={setNewPhoneNumber}
              placeholder="Enter new phone number"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </View>

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
                onChangeText={setVerificationCode}
                placeholder="Enter verification code"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                maxLength={6}
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

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: '#EF5350' }]}
          onPress={handleSubmitChange}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            Next Step
          </Text>
        </TouchableOpacity>

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
      </View>
    </ScrollView>
  );

  const getHeaderTitle = () => {
    switch (screenMode) {
      case 'bound':
        return 'Bind Phone Number';
      case 'verification-form':
        return 'Phone Verification';
      default:
        return 'Modify Phone Number';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity 
          onPress={() => {
            if (screenMode === 'bound') {
              router.back();
            } else {
              setScreenMode('bound');
            }
          }} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {getHeaderTitle()}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {screenMode === 'bound' && renderBoundPhoneScreen()}
      {screenMode === 'verification-form' && renderVerificationFormScreen()}

      {renderInstructionsModal()}
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
  centerContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  phoneIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  iconWrapper: {
    position: 'relative',
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  phoneNumberDisplay: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 32,
    letterSpacing: 2,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  changeButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 40,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  methodContainer: {
    paddingTop: 20,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  methodTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  methodTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 32,
    marginTop: 8,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  formContainer: {
    paddingTop: 20,
  },
  formField: {
    marginBottom: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  modalBody: {
    padding: 20,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  gotItButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
}); 