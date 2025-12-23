import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { X, ShoppingCart, AlertCircle, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FirstOrderNoReturnPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FirstOrderNoReturnPolicyModal({
  visible,
  onClose,
}: FirstOrderNoReturnPolicyModalProps) {
  const router = useRouter();
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleCustomerService = () => {
    onClose();
    router.push('/help-center/customer-service');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.sheetHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
              First Order's No Return Policy
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetBody}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.policySection}>
              <View style={styles.policyHeader}>
                <ShoppingCart size={20} color={theme.colors.primary} />
                <Text style={[styles.policyTitle, { color: theme.colors.text }]}>
                  Applicable Range:
                </Text>
              </View>
              
              <Text style={[styles.policyText, { color: theme.colors.textSecondary }]}>
                This policy applies to users who register and make their first purchase of sports items, 
                coins, or top-up packages within 90 days.
              </Text>
            </View>

            <View style={styles.contentSection}>
              <View style={styles.contentHeader}>
                <AlertCircle size={20} color={theme.colors.primary} />
                <Text style={[styles.contentTitle, { color: theme.colors.text }]}>
                  Policy Details:
                </Text>
              </View>
              
              <Text style={[styles.contentText, { color: theme.colors.textSecondary }]}>
                For qualifying users, purchased items that are unused will receive a full automatic 
                refund to your account balance.
              </Text>
            </View>

            <View style={styles.refundSection}>
              <View style={styles.refundHeader}>
                <Clock size={20} color={theme.colors.primary} />
                <Text style={[styles.refundTitle, { color: theme.colors.text }]}>
                  Refund Process:
                </Text>
              </View>
              
              <Text style={[styles.refundText, { color: theme.colors.textSecondary }]}>
                • Sports items: Refunded as equivalent value coins (7-day validity)
              </Text>
              <Text style={[styles.refundText, { color: theme.colors.textSecondary }]}>
                • Coins/Top-ups: Refunded as account balance (30-day validity)
              </Text>
              <Text style={[styles.refundText, { color: theme.colors.textSecondary }]}>
                • Refunds are processed automatically within 24 hours
              </Text>
            </View>

            <View style={styles.noteSection}>
              <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                <Text style={[styles.noteLabel, { color: theme.colors.text }]}>Important:</Text>
                {' '}This policy only applies to eligible users within the specified timeframe. 
                For questions, contact{' '}
                <Text 
                  style={styles.customerServiceText}
                  onPress={handleCustomerService}
                >
                  Customer Service
                </Text>
                {' '}for assistance.
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.gotItBtn} activeOpacity={0.85}>
              <Text style={[styles.gotItText, { color: theme.colors.text }]}>I Got It</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  policySection: {
    marginBottom: 20,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  policyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  policyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    paddingLeft: 28,
  },
  contentSection: {
    marginBottom: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  contentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    paddingLeft: 28,
  },
  refundSection: {
    marginBottom: 20,
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  refundTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  refundText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 28,
  },
  noteSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  noteLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  customerServiceText: {
    color: '#EF5350',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  gotItBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  gotItText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
});
