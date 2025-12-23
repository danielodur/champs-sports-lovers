import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, X, Wallet, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Simple in-memory storage for demonstration
declare global {
  var savedProfileData: any;
}

type DeletionStep = 'initial' | 'balance-check' | 'deletion-form' | 'final-confirmation';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<DeletionStep>('initial');
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [canProceed, setCanProceed] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  
  // Get user's actual phone number
  const getUserPhone = (): string => {
    // Try to get from Supabase profile
    if (profile?.phone) {
      return profile.phone;
    }
    // Try to get from user metadata
    if (user?.phone) {
      return user.phone;
    }
    // Try to get from legacy storage
    if (global.savedProfileData?.personalInfo?.phoneNumber) {
      return global.savedProfileData.personalInfo.phoneNumber;
    }
    // Fallback for demo/testing
    return '1234567890';
  };

  // Mask phone number: first 3 digits + ***** + last 3 digits
  const maskPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, ''); // Remove non-numeric characters
    if (cleaned.length < 6) return phone; // Too short to mask properly
    
    const firstThree = cleaned.slice(0, 3);
    const lastThree = cleaned.slice(-3);
    return `${firstThree}*****${lastThree}`;
  };

  const userPhone = getUserPhone();
  const maskedPhoneNumber = maskPhoneNumber(userPhone);
  
  // Form states
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [applicationReason, setApplicationReason] = useState('');
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  
  // Sample user balance - in production, fetch from API
  const [userBalance] = useState({
    coins: 0,
    champsCoins: 0,
    vouchers: 0,
  });

  const deletionReasons = [
    'Privacy Concerns',
    'Not Using Anymore',
    'Too Many Notifications',
    'Found Better Alternative',
    'Account Security Issues',
    'Other',
  ];

  // Start countdown when risk modal is shown
  useEffect(() => {
    if (showRiskModal && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanProceed(true);
    }
  }, [showRiskModal, countdown]);

  const showRiskModalWithAnimation = () => {
    setShowRiskModal(true);
    setCountdown(10);
    setCanProceed(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideRiskModalWithAnimation = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowRiskModal(false);
    });
  };

  const handleUseBalance = () => {
    Alert.alert(
      'Use Balance First',
      'Please use or withdraw your remaining balance before deleting your account.',
      [{ text: 'OK' }]
    );
  };

  const handleStartVerification = () => {
    // Show risk modal first
    showRiskModalWithAnimation();
  };

  const handleContinueAfterWarning = () => {
    if (!canProceed) {
      Alert.alert('Please Wait', `Please read the risk notice carefully (${countdown}s remaining)`);
      return;
    }
    hideRiskModalWithAnimation();
    
    // Check if user has balance
    const hasBalance = userBalance.coins > 0 || userBalance.champsCoins > 0 || userBalance.vouchers > 0;
    
    if (hasBalance) {
      // Show balance check screen if user has balance
      setCurrentStep('balance-check');
    } else {
      // Go directly to deletion form if no balance
      setCurrentStep('deletion-form');
    }
  };

  const handleProceedFromBalance = () => {
    // After using balance, proceed to deletion form
    setCurrentStep('deletion-form');
  };

  const handleSendVerificationCode = () => {
    Alert.alert(
      'Verification Code Sent', 
      `A verification code has been sent to ${maskedPhoneNumber}`
    );
    // In production, send to actual phone number: userPhone
  };

  const handleSubmitDeletion = () => {
    Keyboard.dismiss();
    
    // Validate required fields
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter verification code');
      return;
    }
    if (!selectedReason) {
      Alert.alert('Error', 'Please select deletion reason');
      return;
    }

    // Proceed to final confirmation screen
    setCurrentStep('final-confirmation');
  };

  const handleFinalDelete = () => {
    // Submit deletion request
    console.log('Account deletion submitted:', {
      phoneNumber: userPhone, // Actual phone number
      maskedPhone: maskedPhoneNumber, // For display
      verificationCode,
      reason: selectedReason,
      applicationReason,
    });
    
    Alert.alert(
      'Request Submitted',
      'Your account deletion request has been submitted. It will be processed within 24-48 hours. You will receive a notification once completed.',
      [
        {
          text: 'OK',
          onPress: () => {
            // In production, log out user and redirect to login
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const renderInitialScreen = () => (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Account Verification Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.accountIconCircle}>
          <View style={styles.accountCard}>
            <View style={styles.accountCardHeader}>
              <View style={styles.userIconCircle}>
                <View style={styles.userIconDot} />
              </View>
            </View>
            <View style={styles.accountCardBody}>
              <View style={styles.cardLine} />
              <View style={styles.cardLineShort} />
            </View>
          </View>
          <View style={styles.warningBadge}>
            <AlertTriangle size={24} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.initialTitle, { color: theme.colors.text }]}>
        Apply to Delete Champs Sports Account
      </Text>
      
      {/* Subtitle */}
      <Text style={[styles.initialSubtitle, { color: theme.colors.textSecondary }]}>
        Before applying for deletion, the Champs Sports team will verify your account to ensure your account property is safe
      </Text>

      {/* Verification Button */}
      <TouchableOpacity
        style={[styles.verificationButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleStartVerification}
        activeOpacity={0.8}
      >
        <Text style={styles.verificationButtonText}>
          Account Verification, Apply for Deletion
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderBalanceCheck = () => (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Wallet Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.walletIconCircle}>
          <Wallet size={60} color="#EF5350" />
        </View>
      </View>

      {/* Balance Warning */}
      <Text style={[styles.balanceWarningTitle, { color: theme.colors.text }]}>
        Your Account Has Balance
      </Text>
      <Text style={[styles.balanceWarningSubtitle, { color: theme.colors.textSecondary }]}>
        Please use it before deleting
      </Text>

      {/* Balance Display */}
      <View style={[styles.balanceContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <View style={styles.coinIconContainer}>
              <View style={[styles.coinIcon, { backgroundColor: '#EF5350' }]} />
            </View>
            <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
              Champs Coins
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <View style={styles.coinIconContainer}>
              <View style={[styles.coinIcon, { backgroundColor: '#FFA726' }]} />
            </View>
            <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
              Gold Coins
            </Text>
          </View>
        </View>
        
        <View style={styles.balanceRow}>
          <View style={styles.balanceValueItem}>
            <Text style={[styles.balanceValue, { color: theme.colors.text }]}>
              {userBalance.champsCoins}
            </Text>
          </View>
          <View style={styles.balanceValueItem}>
            <Text style={[styles.balanceValue, { color: theme.colors.text }]}>
              {userBalance.coins}
            </Text>
          </View>
        </View>
      </View>

      {/* Use Balance Button */}
      <TouchableOpacity
        style={[styles.useBalanceButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleUseBalance}
        activeOpacity={0.8}
      >
        <Text style={styles.useBalanceButtonText}>
          Use Balance
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const scrollViewRef = React.useRef<ScrollView>(null);

  const renderDeletionForm = () => (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Phone Number */}
        <View style={styles.formSection}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>
            Phone Number
          </Text>
          <Text style={[styles.phoneNumberDisplay, { color: theme.colors.text }]}>
            {maskedPhoneNumber}
          </Text>
        </View>

        {/* Verification Code */}
        <View style={styles.formSection}>
          <View style={styles.verificationRow}>
            <View style={styles.verificationInputContainer}>
              <Text style={[styles.formLabel, { color: theme.colors.text }]}>
                Verification Code
              </Text>
              <TextInput
                style={[
                  styles.verificationInput,
                  { 
                    color: theme.colors.text,
                    borderBottomColor: theme.colors.border,
                  }
                ]}
                placeholder="Please enter verification code"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="number-pad"
                value={verificationCode}
                onChangeText={setVerificationCode}
              />
            </View>
            <TouchableOpacity
              style={styles.getCodeButton}
              onPress={handleSendVerificationCode}
              activeOpacity={0.7}
            >
              <Text style={[styles.getCodeText, { color: theme.colors.primary }]}>
                Get Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Deletion Reason */}
        <View style={styles.formSection}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>
            Deletion Reason
          </Text>
          <TouchableOpacity
            style={[
              styles.reasonSelector,
              { borderBottomColor: theme.colors.border }
            ]}
            onPress={() => setShowReasonPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.reasonText,
              { color: selectedReason ? theme.colors.text : theme.colors.textSecondary }
            ]}>
              {selectedReason || 'Please select'}
            </Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Other Reason */}
        <View style={styles.formSection}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>
            Other Reason <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <View style={[styles.textAreaContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <TextInput
              style={[
                styles.textAreaInput,
                { color: theme.colors.text }
              ]}
              placeholder="Please enter"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={6}
              maxLength={500}
              value={applicationReason}
              onChangeText={setApplicationReason}
              textAlignVertical="top"
              returnKeyType="default"
              blurOnSubmit={false}
              scrollEnabled={false}
              onFocus={() => {
                // Scroll to show text area above keyboard
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 250);
              }}
            />
          </View>
        </View>

        <View style={styles.extraSpacing} />
      </ScrollView>

      {/* Next Step Button */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmitDeletion}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            Next Step
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderFinalConfirmation = () => (
    <>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.finalScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sad Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.sadIconCircle}>
            <Text style={styles.sadEmoji}>😢</Text>
          </View>
        </View>

        {/* Emotional Title */}
        <Text style={[styles.finalTitle, { color: theme.colors.text }]}>
          We're Sorry to See You Go
        </Text>
        
        {/* Emotional Message */}
        <Text style={[styles.finalMessage, { color: theme.colors.textSecondary }]}>
          Your journey with Champs Sports has been valuable to us.
        </Text>

        {/* Warning Points */}
        <View style={[styles.warningBox, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.warningTitle, { color: '#EF5350' }]}>
            What You'll Lose:
          </Text>
          <Text style={[styles.warningPoint, { color: theme.colors.textSecondary }]}>
            • All your match predictions and history
          </Text>
          <Text style={[styles.warningPoint, { color: theme.colors.textSecondary }]}>
            • Your level, achievements, and badges
          </Text>
          <Text style={[styles.warningPoint, { color: theme.colors.textSecondary }]}>
            • All saved favorites and preferences
          </Text>
          <Text style={[styles.warningPoint, { color: theme.colors.textSecondary }]}>
            • Your community connections and messages
          </Text>
          <Text style={[styles.warningPoint, { color: theme.colors.textSecondary }]}>
            • Access to exclusive content and features
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Buttons at Bottom */}
      <View style={[styles.fixedBottomButtons, { backgroundColor: theme.colors.background }]}>
        {/* Cancel Button */}
        <TouchableOpacity
          style={[styles.cancelDeletionButton, { borderColor: theme.colors.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelDeletionText, { color: theme.colors.primary }]}>
            Keep My Account
          </Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.finalDeleteButton, { backgroundColor: '#DC2626' }]}
          onPress={handleFinalDelete}
          activeOpacity={0.8}
        >
          <Text style={styles.finalDeleteButtonText}>
            Delete Permanently
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderRiskModal = () => (
    <Modal
      visible={showRiskModal}
      transparent={true}
      animationType="none"
      onRequestClose={hideRiskModalWithAnimation}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => {
            if (canProceed) {
              hideRiskModalWithAnimation();
            }
          }}
        />
        <Animated.View 
          style={[
            styles.riskModalContent,
            {
              backgroundColor: theme.colors.backgroundSecondary,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Modal Header */}
          <View style={styles.riskModalHeader}>
            <AlertTriangle size={40} color="#EF5350" />
            <Text style={[styles.riskModalTitle, { color: theme.colors.text }]}>
              Deletion Risk Notice
            </Text>
          </View>

          {/* Risk Content */}
          <ScrollView 
            style={styles.riskModalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.riskSection}>
              <Text style={[styles.riskText, { color: theme.colors.text }]}>
                1. Before deleting your account, please make sure to use or withdraw all virtual assets in your account (including but not limited to coins, Champs Coins, vouchers, etc.), and confirm that your membership, weekly card, and Champs benefits have expired.
              </Text>
            </View>

            <View style={styles.riskSection}>
              <Text style={[styles.riskText, { color: theme.colors.text }]}>
                2. If this account is a real-name verified account, we will verify your real-name authentication information and conduct face recognition verification before deletion. This is to prevent someone from maliciously deleting your account information and causing damage to your legitimate rights and interests. We promise that the facial recognition information collected during the deletion process will not be stored or used for other purposes by Champs Sports.
              </Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                { 
                  backgroundColor: canProceed ? theme.colors.primary : '#8B5A2B',
                  opacity: canProceed ? 1 : 0.7,
                }
              ]}
              onPress={handleContinueAfterWarning}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {canProceed ? 'I Have Read' : `Please Read (${countdown})`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderReasonPickerModal = () => (
    <Modal
      visible={showReasonPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowReasonPicker(false)}
    >
      <View style={styles.pickerModalOverlay}>
        <TouchableOpacity 
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setShowReasonPicker(false)}
        />
        <View style={[styles.pickerContent, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
              Select Reason
            </Text>
            <TouchableOpacity onPress={() => setShowReasonPicker(false)}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {deletionReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.pickerItem,
                  { 
                    backgroundColor: selectedReason === reason 
                      ? theme.colors.backgroundSecondary 
                      : 'transparent' 
                  }
                ]}
                onPress={() => {
                  setSelectedReason(reason);
                  setShowReasonPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.pickerItemText,
                  { color: selectedReason === reason ? theme.colors.primary : theme.colors.text }
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Account Deletion
        </Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content based on current step */}
      {currentStep === 'initial' && renderInitialScreen()}
      {currentStep === 'balance-check' && renderBalanceCheck()}
      {currentStep === 'deletion-form' && renderDeletionForm()}
      {currentStep === 'final-confirmation' && renderFinalConfirmation()}

      {/* Risk Modal */}
      {renderRiskModal()}
      
      {/* Reason Picker Modal */}
      {renderReasonPickerModal()}
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
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
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
  closeButton: {
    padding: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  finalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  // Initial Screen
  iconContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  accountIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  accountCard: {
    width: 60,
    height: 70,
    backgroundColor: '#E57373',
    borderRadius: 6,
    padding: 8,
  },
  accountCardHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  userIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF5350',
  },
  accountCardBody: {
    gap: 4,
  },
  cardLine: {
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  cardLineShort: {
    height: 3,
    width: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  warningBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF5350',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1A1A1A',
  },
  initialTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  initialSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  verificationButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  verificationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  // Balance Check Screen
  walletIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceWarningTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceWarningSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 40,
  },
  balanceContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  balanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  balanceValueItem: {
    alignItems: 'center',
    flex: 1,
  },
  coinIconContainer: {
    marginBottom: 8,
  },
  coinIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  balanceValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  useBalanceButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useBalanceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  // Deletion Form
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
  },
  phoneNumberDisplay: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  verificationInputContainer: {
    flex: 1,
    marginRight: 12,
  },
  verificationInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  getCodeButton: {
    paddingBottom: 12,
  },
  getCodeText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  formInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  reasonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reasonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textAreaContainer: {
    borderRadius: 12,
    padding: 16,
    minHeight: 180,
    marginTop: 12,
  },
  textAreaInput: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    minHeight: 130,
    maxHeight: 180,
  },
  optional: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  extraSpacing: {
    height: 200,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  // Risk Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  riskModalContent: {
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  riskModalHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 16,
  },
  riskModalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
  },
  riskModalBody: {
    paddingHorizontal: 20,
  },
  riskSection: {
    marginBottom: 20,
  },
  riskText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  // Reason Picker Modal
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    flex: 1,
  },
  pickerContent: {
    maxHeight: SCREEN_HEIGHT * 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  // Final Confirmation Screen
  sadIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sadEmoji: {
    fontSize: 48,
  },
  finalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  finalMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  warningBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 0,
  },
  warningTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 10,
  },
  warningPoint: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
  },
  finalNote: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  finalButtonsContainer: {
    gap: 12,
    paddingHorizontal: 0,
    marginBottom: 20,
    marginTop: 4,
  },
  fixedBottomButtons: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  cancelDeletionButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  cancelDeletionText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  finalDeleteButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

