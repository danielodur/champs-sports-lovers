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
import { X, Coins, Gift, CreditCard, Globe, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HowToUseCoinsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function HowToUseCoinsModal({
  visible,
  onClose,
}: HowToUseCoinsModalProps) {
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
              How to Use Champs Coins
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
            <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
              Champs Coins are the main virtual currency in Champs Sports. You can use them to purchase 
              premium services, sports predictions, exclusive content, and interactive features.
            </Text>

            <View style={styles.coinsSection}>
              <View style={styles.coinsHeader}>
                <Coins size={20} color={theme.colors.primary} />
                <Text style={[styles.coinsTitle, { color: theme.colors.text }]}>
                  Champs Coins Types:
                </Text>
              </View>
              
              <Text style={[styles.coinsText, { color: theme.colors.textSecondary }]}>
                1. <Text style={[styles.boldText, { color: theme.colors.text }]}>Top-up Coins:</Text> Purchased with real money - no refunds or withdrawals
              </Text>
              <Text style={[styles.coinsText, { color: theme.colors.textSecondary }]}>
                2. <Text style={[styles.boldText, { color: theme.colors.text }]}>Reward Coins:</Text> Earned from predictions, activities, and promotions - can be withdrawn
              </Text>
            </View>

            <View style={styles.vouchersSection}>
              <View style={styles.vouchersHeader}>
                <Gift size={20} color={theme.colors.primary} />
                <Text style={[styles.vouchersTitle, { color: theme.colors.text }]}>
                  How to Use:
                </Text>
              </View>
              
              <Text style={[styles.vouchersText, { color: theme.colors.textSecondary }]}>
                • Purchase expert predictions and analysis
              </Text>
              <Text style={[styles.vouchersText, { color: theme.colors.textSecondary }]}>
                • Access premium match insights and statistics
              </Text>
              <Text style={[styles.vouchersText, { color: theme.colors.textSecondary }]}>
                • Buy exclusive sports merchandise and vouchers
              </Text>
              <Text style={[styles.vouchersText, { color: theme.colors.textSecondary }]}>
                • Enter VIP prediction contests and tournaments
              </Text>
            </View>

            <View style={styles.topupSection}>
              <View style={styles.topupHeader}>
                <CreditCard size={20} color={theme.colors.primary} />
                <Text style={[styles.topupTitle, { color: theme.colors.text }]}>
                  How to Top Up:
                </Text>
              </View>
              
              <Text style={[styles.topupText, { color: theme.colors.textSecondary }]}>
                You can top up your Champs Coins through mobile money, bank cards, or other payment methods. 
                Visit our website for more payment options.
              </Text>
            </View>

            <View style={styles.websiteSection}>
              <View style={styles.websiteHeader}>
                <Globe size={20} color={theme.colors.primary} />
                <Text style={[styles.websiteTitle, { color: theme.colors.text }]}>
                  For More Information:
                </Text>
              </View>
              
              <Text style={[styles.websiteText, { color: theme.colors.textSecondary }]}>
                Visit our official website at{' '}
                <Text style={styles.websiteLink}>www.champssports.ug</Text>
                {' '}for detailed guides, payment methods, and coin management.
              </Text>
            </View>

            <View style={styles.helpSection}>
              <View style={styles.helpHeader}>
                <Star size={20} color={theme.colors.primary} />
                <Text style={[styles.helpTitle, { color: theme.colors.text }]}>
                  Need Help?
                </Text>
              </View>
              
              <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                If you have questions about coins, vouchers, or withdrawals, contact{' '}
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
    maxHeight: SCREEN_HEIGHT * 0.85,
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
  introText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 20,
  },
  coinsSection: {
    marginBottom: 20,
  },
  coinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coinsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  coinsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 28,
  },
  boldText: {
    fontFamily: 'Inter-SemiBold',
  },
  vouchersSection: {
    marginBottom: 20,
  },
  vouchersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vouchersTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  vouchersText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 28,
  },
  topupSection: {
    marginBottom: 20,
  },
  topupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topupTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  topupText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    paddingLeft: 28,
  },
  websiteSection: {
    marginBottom: 20,
  },
  websiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  websiteTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  websiteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    paddingLeft: 28,
  },
  websiteLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textDecorationLine: 'underline',
  },
  helpSection: {
    marginBottom: 20,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    paddingLeft: 28,
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
