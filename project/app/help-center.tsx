import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, X, CreditCard as Edit, Mail, Apple, RotateCcw, UserX, FileText, ChevronRight, Headphones } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HelpCenterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showVerificationHelp, showPartnerModal, showModal } = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('account-issues');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPartnerModalState, setShowPartnerModalState] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [partnerSlideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  // Auto-show verification modal if user came from verification screen
  useEffect(() => {
    if (showVerificationHelp === 'true') {
      setTimeout(() => {
        showVerificationModalWithAnimation();
      }, 300);
    }
  }, [showVerificationHelp]);

  // Auto-show verification modal if coming from "Didn't receive code" button
  useEffect(() => {
    if (showModal === 'didntReceiveCode') {
      setTimeout(() => {
        showVerificationModalWithAnimation();
      }, 300);
    }
  }, [showModal]);

  // Auto-show partner modal if param is set
  useEffect(() => {
    if (showPartnerModal === 'true') {
      setShowPartnerModalState(true);
      setTimeout(() => {
        Animated.timing(partnerSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 300);
    }
  }, [showPartnerModal]);

  const topIcons = [
    { id: 'account-application', icon: Edit, label: t('Account Application') },
    { id: 'feedback-complaints', icon: Mail, label: t('Feedback & Complaints') },
    { id: 'apple-subscription', icon: Apple, label: t('Apple Subscription Recovery') },
    { id: 'account-cancellation', icon: UserX, label: t('Account Cancellation') },
    { id: 'account-recovery', icon: RotateCcw, label: t('Account Recovery') },
    { id: 'complaint-report', icon: FileText, label: t('Complaint Report') },
  ];

  const categoryTabs = [
    { id: 'account-issues', label: t('Account Issues') },
    { id: 'feature-issues', label: t('Feature Issues') },
    { id: 'other-issues', label: t('Other Issues') },
  ];

  const getQuestionsForCategory = (category: string) => {
    switch (category) {
      case 'account-issues':
        return [
          { id: 'account-seal-process', title: t('Account Seal Application Process'), hasArrow: true },
          { id: 'purchase-membership', title: t('Purchasing membership or recharging SportWee coins, gold coins without arrival'), hasArrow: true },
          { id: 'continuous-subscription', title: t('Continuous Subscription Cancellation Method'), hasArrow: true },
          { id: 'verification-code', title: t('Cannot Receive Verification Code'), hasArrow: true },
          { id: 'real-name-verification', title: t('Unable to Pass SportWee Real Name Verification'), hasArrow: true },
          { id: 'apple-recharge-issue', title: t('Apple Phone Recharge Encountered Problem Recharge Failed'), hasArrow: true },
          { id: 'modify-phone-password', title: t('How to Modify Login Phone Number or Password'), hasArrow: true },
          { id: 'account-attention-issue', title: t('Account Attention Issue'), hasArrow: true },
        ];
      case 'feature-issues':
        return [
          { id: 'app-crashes', title: t('App Crashes or Freezes Frequently'), hasArrow: true },
          { id: 'live-streaming', title: t('Live Streaming Video Not Loading'), hasArrow: true },
          { id: 'match-predictions', title: t('Match Prediction Features Not Working'), hasArrow: true },
          { id: 'notification-issues', title: t('Push Notifications Not Received'), hasArrow: true },
          { id: 'data-sync', title: t('Data Synchronization Problems'), hasArrow: true },
          { id: 'search-function', title: t('Search Function Not Responding'), hasArrow: true },
        ];
      case 'other-issues':
        return [
          { id: 'general-feedback', title: t('General Feedback and Suggestions'), hasArrow: true },
          { id: 'partnership-inquiry', title: t('Partnership and Business Inquiries'), hasArrow: true },
          { id: 'technical-support', title: t('Technical Support Request'), hasArrow: true },
          { id: 'content-report', title: t('Report Inappropriate Content'), hasArrow: true },
          { id: 'accessibility', title: t('Accessibility Features Request'), hasArrow: true },
          { id: 'language-support', title: t('Language Support Issues'), hasArrow: true },
        ];
      default:
        return [];
    }
  };

  const handleIconPress = (iconId: string) => {
    console.log(`Icon pressed: ${iconId}`);
    // Add navigation logic for each icon
    switch (iconId) {
      case 'account-application':
        // Navigate to account application screen
        break;
      case 'feedback-complaints':
        // Navigate to feedback screen
        break;
      case 'apple-subscription':
        // Navigate to Apple subscription recovery
        break;
      case 'account-cancellation':
        // Navigate to account cancellation
        break;
      case 'account-recovery':
        // Navigate to account recovery
        break;
      case 'complaint-report':
        // Navigate to complaint report
        break;
      default:
        break;
    }
  };

  const handleQuestionPress = (questionId: string) => {
    console.log(`Question pressed: ${questionId}`);
    
    // Show modal specifically for verification code issues
    if (questionId === 'verification-code') {
      showVerificationModalWithAnimation();
    }
    // Add navigation logic for other questions
  };

  const showVerificationModalWithAnimation = () => {
    setShowVerificationModal(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideVerificationModalWithAnimation = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowVerificationModal(false);
    });
  };

  const handleCustomerService = () => {
    console.log('Customer service pressed');
    // Add customer service logic
  };

  const hidePartnerModalWithAnimation = () => {
    Animated.timing(partnerSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPartnerModalState(false);
    });
  };

  const renderTopIcons = () => (
    <View style={styles.topIconsContainer}>
      {topIcons.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.topIconItem, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => handleIconPress(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.background }]}>
            <item.icon size={24} color={theme.colors.text} />
          </View>
          <Text style={[styles.iconLabel, { color: theme.colors.text }]} numberOfLines={2}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategoryTabs = () => (
    <View style={styles.categoryContainer}>
      <Text style={[styles.commonQuestionsTitle, { color: theme.colors.primary }]}>
        {t('Common Questions')}
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabsContainer}
      >
        {categoryTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.categoryTab,
              {
                backgroundColor: selectedCategory === tab.id ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.primary,
              }
            ]}
            onPress={() => setSelectedCategory(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryTabText,
                {
                  color: selectedCategory === tab.id ? '#FFFFFF' : theme.colors.primary,
                }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderQuestionsList = () => {
    const questions = getQuestionsForCategory(selectedCategory);
    
    return (
      <View style={styles.questionsContainer}>
        {questions.map((question) => (
          <TouchableOpacity
            key={question.id}
            style={[styles.questionItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => handleQuestionPress(question.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.questionText, { color: theme.colors.text }]} numberOfLines={2}>
              {question.title}
            </Text>
            {question.hasArrow && (
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderVerificationHelpModal = () => (
    <Modal
      visible={showVerificationModal}
      transparent={true}
      animationType="none"
      onRequestClose={hideVerificationModalWithAnimation}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={hideVerificationModalWithAnimation}
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
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Can't Receive Verification Code</Text>
            <TouchableOpacity onPress={hideVerificationModalWithAnimation} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* SUMMARY SECTION */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#EF5350', fontSize: 16, fontFamily: 'Inter-SemiBold', marginBottom: 8 }}>
                Quick Fix (Most Common Issues):
              </Text>
              <Text style={{ color: '#EF5350', fontSize: 15, fontFamily: 'Inter-Regular', marginBottom: 4 }}>
                • Check your phone number is correct
              </Text>
              <Text style={{ color: '#EF5350', fontSize: 15, fontFamily: 'Inter-Regular', marginBottom: 4 }}>
                • Make sure phone has signal & is not suspended
              </Text>
              <Text style={{ color: '#EF5350', fontSize: 15, fontFamily: 'Inter-Regular', marginBottom: 4 }}>
                • Turn off SMS blocking/spam filters
              </Text>
              <Text style={{ color: '#EF5350', fontSize: 15, fontFamily: 'Inter-Regular', marginBottom: 4 }}>
                • Wait if you tried too many times today
              </Text>
            </View>
            {/* DETAILED SECTION */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Common Solutions:</Text>
            <View style={styles.solutionItem}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>1. Wrong Phone Number</Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>• Double-check and re-enter your phone number</Text>
            </View>
            <View style={styles.solutionItem}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>2. No Signal/Phone Issues</Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>• Contact carrier if phone is suspended</Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>• Move to area with better signal</Text>
            </View>
            <View style={styles.solutionItem}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>3. SMS Blocking</Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>• Turn off spam blocking in phone settings</Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>• Check for SMS filter apps and disable them</Text>
            </View>
            <View style={styles.solutionItem}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>4. Too Many Attempts</Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>• Wait 24 hours before trying again</Text>
            </View>
            <View style={styles.solutionItem}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>5. Still Having Issues?</Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>• Contact customer support below</Text>
            </View>
            <TouchableOpacity 
              style={[styles.gotItButton, { backgroundColor: '#EF5350' }]}
              onPress={hideVerificationModalWithAnimation}
              activeOpacity={0.8}
            >
              <Text style={styles.gotItButtonText}>I Got It</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderPartnerModal = () => (
    <Modal
      visible={showPartnerModalState}
      transparent={true}
      animationType="none"
      onRequestClose={hidePartnerModalWithAnimation}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={hidePartnerModalWithAnimation}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateY: partnerSlideAnim }]
            }
          ]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>How to Contact for Business Partnership</Text>
            <TouchableOpacity onPress={hidePartnerModalWithAnimation} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>For partnership matters, please select the appropriate email below based on the type of cooperation. Our team will reply to you. Welcome to inquire~</Text>
            <Text style={[styles.conditionText, { color: theme.colors.textSecondary, marginTop: 12 }]}>Advertising: <Text style={{ color: '#E53935' }}>ad@champs.com</Text></Text>
            <Text style={[styles.conditionText, { color: theme.colors.textSecondary, marginTop: 8 }]}>Business Partnership: <Text style={{ color: '#E53935' }}>partner@champs.com</Text></Text>
            <TouchableOpacity 
              style={[styles.gotItButton, { backgroundColor: '#EF5350' }]}
              onPress={hidePartnerModalWithAnimation}
              activeOpacity={0.8}
            >
              <Text style={styles.gotItButtonText}>I Got It</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Help Center
        </Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Icons Grid */}
        {renderTopIcons()}

        {/* Category Tabs */}
        {renderCategoryTabs()}
        
        {/* Questions List */}
        {renderQuestionsList()}

        {/* Extra spacing for better scrolling */}
        <View style={styles.extraSpacing} />
      </ScrollView>

      {/* Bottom Customer Service Button */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[styles.customerServiceButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCustomerService}
          activeOpacity={0.8}
        >
          <Headphones size={20} color="#FFFFFF" />
          <Text style={styles.customerServiceText}>
            Online Customer Service (9:30-22:00)
          </Text>
        </TouchableOpacity>
      </View>

      {renderVerificationHelpModal()}
      {renderPartnerModal()}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  topIconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  topIconItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  commonQuestionsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  categoryTabsContainer: {
    paddingRight: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  categoryTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  questionsContainer: {
    marginTop: 16,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    marginRight: 12,
  },
  extraSpacing: {
    height: 40,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  customerServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  customerServiceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    lineHeight: 22,
  },
  conditionsList: {
    marginBottom: 20,
  },
  conditionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  solutionItem: {
    marginBottom: 20,
  },
  solutionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  solutionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
  },
  solutionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
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