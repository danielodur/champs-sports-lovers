import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, X, CreditCard as Edit, Mail, RotateCcw, UserX, FileText, ChevronRight, Headphones } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import UnsuccessfulTransactionsModal from './common-accounts-issues/unsuccessful-transactions';
import HowToAppealDeleteAccountModal from './common-accounts-issues/how-to-appeal-delete-account';
import CannotReceiveVerificationModal from './common-accounts-issues/cannot-receive-verification';
import HowToChangePasswordAndNumberModal from './common-accounts-issues/how-to-change-password-and-number';
import HowToDeleteAccountModal from './common-accounts-issues/how-to-delete-account';
import AppCrushAndFreezeModal from './common-feature-issues/app-crush-and-freeze';
import StreamingAndVideoIssuesModal from './common-feature-issues/streaming-and-video-issues';
import FirstOrderNoReturnPolicyModal from './common-feature-issues/first-order-no-return-policy';
import HowToUseCoinsModal from './common-feature-issues/how-to-use-coins';
import CreateInteractivePlatformModal from './common-feature-issues/create-interactive-platform';
import OtherIssuesModal from './common-other-issues/other-issues';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HelpCenterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showVerificationHelp, showPartnerModal, showModal } = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('account-issues');
  const [showPartnerModalState, setShowPartnerModalState] = useState(false);
  const [partnerSlideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [showHowToAppealModal, setShowHowToAppealModal] = useState(false);
  const [showUnsuccessfulTransactionsModal, setShowUnsuccessfulTransactionsModal] = useState(false);
  const [showCannotReceiveVerificationModal, setShowCannotReceiveVerificationModal] = useState(false);
  const [showChangePasswordNumberModal, setShowChangePasswordNumberModal] = useState(false);
  const [showHowToDeleteAccountModal, setShowHowToDeleteAccountModal] = useState(false);
  const [showAppCrushAndFreezeModal, setShowAppCrushAndFreezeModal] = useState(false);
  const [showStreamingAndVideoIssuesModal, setShowStreamingAndVideoIssuesModal] = useState(false);
  const [showFirstOrderNoReturnPolicyModal, setShowFirstOrderNoReturnPolicyModal] = useState(false);
  const [showHowToUseCoinsModal, setShowHowToUseCoinsModal] = useState(false);
  const [showCreateInteractivePlatformModal, setShowCreateInteractivePlatformModal] = useState(false);
  const [showOtherIssuesModal, setShowOtherIssuesModal] = useState(false);
  const [otherIssuesModalType, setOtherIssuesModalType] = useState<'partnership' | 'technical-support' | 'user-reviews' | null>(null);

  // Auto-show verification modal if user came from verification screen
  useEffect(() => {
    if (showVerificationHelp === 'true') {
      setTimeout(() => {
        setShowCannotReceiveVerificationModal(true);
      }, 300);
    }
  }, [showVerificationHelp]);

  // Auto-show verification modal if coming from "Didn't receive code" button
  useEffect(() => {
    if (showModal === 'didntReceiveCode') {
      setTimeout(() => {
        setShowCannotReceiveVerificationModal(true);
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
    { id: 'account-application', icon: Edit, label: t('Account Appeal') },
    { id: 'feedback-complaints', icon: Mail, label: t('Complaints & Feedback') },
    { id: 'account-cancellation', icon: UserX, label: t('Delete Account') },
    { id: 'account-recovery', icon: RotateCcw, label: t('Account Recovery') },
    { id: 'complaint-report', icon: FileText, label: t('Report') },
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
          { id: 'account-seal-process', title: t('How Can I Appeal for Account Deletion?'), hasArrow: true },
          { id: 'purchase-membership', title: t('Unsuccessful Transactions?'), hasArrow: true },
          { id: 'verification-code', title: t('Cannot Receive Verification Code'), hasArrow: true },
          { id: 'change-password-number', title: t('How to Change Password Or Number'), hasArrow: true },
          { id: 'how-to-delete-account', title: t('How to Delete Account'), hasArrow: true },
        ];
      case 'feature-issues':
        return [
          { id: 'app-crashes', title: t('App Crashes or Freezes Frequently'), hasArrow: true },
          { id: 'live-streaming', title: t('Live Streaming Video Not Loading'), hasArrow: true },
          { id: 'first-order-no-return', title: t('First Order\'s No Return Policy'), hasArrow: true },
          { id: 'how-to-use-coins', title: t('How can I Use Champs Coins, Vouchers, Top Up?'), hasArrow: true },
          { id: 'create-interactive-platform', title: t('How can I Activate Interactive Platform?'), hasArrow: true },
        ];
      case 'other-issues':
        return [
          { id: 'general-feedback', title: t('General Feedback and Suggestions'), hasArrow: true },
          { id: 'partnership-inquiry', title: t('Partnership and Business Inquiries'), hasArrow: true },
          { id: 'technical-support', title: t('Technical Support Request'), hasArrow: true },
          { id: 'content-report', title: t('Report Inappropriate Content'), hasArrow: true },
          { id: 'user-reviews', title: t('Champs User Reviews'), hasArrow: true },
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
        // Navigate to account appeals screen
        router.push('/help-center/account-appeals');
        break;
      case 'feedback-complaints':
        // Navigate to complaints & feedback screen
        router.push('/help-center/complaints-and-feedback');
        break;
      case 'account-cancellation':
        // Navigate to delete account screen
        router.push('/help-center/delete-account');
        break;
      case 'account-recovery':
        // Navigate to account recovery
        router.push('/recover-account');
        break;
      case 'complaint-report':
        // Navigate to report screen
        router.push('/help-center/report');
        break;
      default:
        break;
    }
  };

  const handleQuestionPress = (questionId: string) => {
    console.log(`Question pressed: ${questionId}`);
    
    // Show modal specifically for verification code issues
    if (questionId === 'verification-code') {
      setShowCannotReceiveVerificationModal(true);
    }
    if (questionId === 'account-seal-process') {
      setShowHowToAppealModal(true);
    }
    if (questionId === 'purchase-membership') {
      setShowUnsuccessfulTransactionsModal(true);
    }
    if (questionId === 'change-password-number') {
      setShowChangePasswordNumberModal(true);
    }
    if (questionId === 'how-to-delete-account') {
      setShowHowToDeleteAccountModal(true);
    }
    if (questionId === 'app-crashes') {
      setShowAppCrushAndFreezeModal(true);
    }
    if (questionId === 'live-streaming') {
      setShowStreamingAndVideoIssuesModal(true);
    }
    if (questionId === 'first-order-no-return') {
      setShowFirstOrderNoReturnPolicyModal(true);
    }
    if (questionId === 'how-to-use-coins') {
      setShowHowToUseCoinsModal(true);
    }
    if (questionId === 'create-interactive-platform') {
      setShowCreateInteractivePlatformModal(true);
    }
    // Other Issues handlers
    if (questionId === 'general-feedback') {
      router.push('/help-center/complaints-and-feedback');
    }
    if (questionId === 'partnership-inquiry') {
      setOtherIssuesModalType('partnership');
      setShowOtherIssuesModal(true);
    }
    if (questionId === 'technical-support') {
      setOtherIssuesModalType('technical-support');
      setShowOtherIssuesModal(true);
    }
    if (questionId === 'content-report') {
      router.push('/help-center/report');
    }
    if (questionId === 'user-reviews') {
      setOtherIssuesModalType('user-reviews');
      setShowOtherIssuesModal(true);
    }
    // Add navigation logic for other questions
  };


  const handleCustomerService = () => {
    router.push('/help-center/customer-service');
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
          style={styles.topIconItem}
          onPress={() => handleIconPress(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
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
      <Text style={[styles.commonQuestionsTitle, { color: theme.colors.text }]}>
        {t('Common Issues')}
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
                backgroundColor: 'transparent',
                borderColor: selectedCategory === tab.id ? theme.colors.primary : '#3A3A3A',
              }
            ]}
            onPress={() => setSelectedCategory(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryTabText,
                {
                  color: selectedCategory === tab.id ? theme.colors.primary : '#9CA3AF',
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
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
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
      <View style={[styles.bottomContainer, { backgroundColor: theme.colors.background }]}>
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

      {renderPartnerModal()}
      <HowToAppealDeleteAccountModal
        visible={showHowToAppealModal}
        onClose={() => setShowHowToAppealModal(false)}
      />
      <UnsuccessfulTransactionsModal
        visible={showUnsuccessfulTransactionsModal}
        onClose={() => setShowUnsuccessfulTransactionsModal(false)}
      />
      <CannotReceiveVerificationModal
        visible={showCannotReceiveVerificationModal}
        onClose={() => setShowCannotReceiveVerificationModal(false)}
      />
      <HowToChangePasswordAndNumberModal
        visible={showChangePasswordNumberModal}
        onClose={() => setShowChangePasswordNumberModal(false)}
      />
      <HowToDeleteAccountModal
        visible={showHowToDeleteAccountModal}
        onClose={() => setShowHowToDeleteAccountModal(false)}
      />
      <AppCrushAndFreezeModal
        visible={showAppCrushAndFreezeModal}
        onClose={() => setShowAppCrushAndFreezeModal(false)}
      />
      <StreamingAndVideoIssuesModal
        visible={showStreamingAndVideoIssuesModal}
        onClose={() => setShowStreamingAndVideoIssuesModal(false)}
      />
      <FirstOrderNoReturnPolicyModal
        visible={showFirstOrderNoReturnPolicyModal}
        onClose={() => setShowFirstOrderNoReturnPolicyModal(false)}
      />
      <HowToUseCoinsModal
        visible={showHowToUseCoinsModal}
        onClose={() => setShowHowToUseCoinsModal(false)}
      />
      <CreateInteractivePlatformModal
        visible={showCreateInteractivePlatformModal}
        onClose={() => setShowCreateInteractivePlatformModal(false)}
      />
      <OtherIssuesModal
        visible={showOtherIssuesModal}
        onClose={() => {
          setShowOtherIssuesModal(false);
          setOtherIssuesModalType(null);
        }}
        modalType={otherIssuesModalType}
      />
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
    justifyContent: 'flex-start',
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

