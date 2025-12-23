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
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CannotReceiveVerificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CannotReceiveVerificationModal({
  visible,
  onClose,
}: CannotReceiveVerificationModalProps) {
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
              Cannot Receive Verification Code
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
            <Text style={[styles.conditionsTitle, { color: theme.colors.text }]}>
              To receive verification codes, the following conditions must be met:
            </Text>

            <View style={styles.conditionsList}>
              <Text style={[styles.conditionItem, { color: theme.colors.textSecondary }]}>
                Condition 1: Phone number entered correctly
              </Text>
              <Text style={[styles.conditionItem, { color: theme.colors.textSecondary }]}>
                Condition 2: Phone has active carrier signal, phone is not suspended
              </Text>
              <Text style={[styles.conditionItem, { color: theme.colors.textSecondary }]}>
                Condition 3: Phone SMS blocking function is turned off
              </Text>
              <Text style={[styles.conditionItem, { color: theme.colors.textSecondary }]}>
                Condition 4: Phone has no carrier SMS blocking
              </Text>
              <Text style={[styles.conditionItem, { color: theme.colors.textSecondary }]}>
                Condition 5: Daily request attempts have not reached the limit
              </Text>
            </View>

            <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
              Currently some users may experience issues not receiving verification codes. You can try the following solutions:
            </Text>

            <View style={styles.solutionSection}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>
                1. Phone Number Input Error
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                Solution:
              </Text>
              <Text style={[styles.solutionDetail, { color: theme.colors.textSecondary }]}>
                Re-enter phone number and confirm the number is correct
              </Text>
            </View>

            <View style={styles.solutionSection}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>
                2. Phone Suspended/No Signal
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                Solution:
              </Text>
              <Text style={[styles.solutionDetail, { color: theme.colors.textSecondary }]}>
                Contact carrier to restore service, then try again
              </Text>
              <Text style={[styles.solutionDetail, { color: theme.colors.textSecondary }]}>
                Move to area with better signal or go outdoors, then try again
              </Text>
            </View>

            <View style={styles.solutionSection}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>
                3. Phone Blocking Function Not Turned Off
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                Solution:
              </Text>
              <Text style={[styles.solutionDetail, { color: theme.colors.textSecondary }]}>
                Android phones have built-in blocking function. Go to "SMS Settings - Block Settings" and check, turn off "Block" function, then try again after closing
              </Text>
              <Text style={[styles.solutionDetail, { color: theme.colors.textSecondary }]}>
                Apple phones with apps like "Tencent Mobile Manager" can go to "Phone Settings - Messages - Unknown and Filtered Messages" to check blocking settings, turn off and try again
              </Text>
            </View>

            <View style={styles.solutionSection}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>
                4. Received Carrier Blocking Message Alert
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                Solution:
              </Text>
              <Text style={[styles.solutionDetail, { color: theme.colors.textSecondary }]}>
                Contact carrier to turn off blocking, then try again
              </Text>
            </View>

            <View style={styles.solutionSection}>
              <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>
                5. Daily Request Limit Reached/Too Many Operations
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                Solution:
              </Text>
              <Text style={[styles.solutionDetail, { color: theme.colors.textSecondary }]}>
                Due to verification code carrier limits on daily requests for the same number, please wait until the next day to try again
              </Text>
            </View>

            <View style={styles.noteSection}>
              <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                PS: If the above solutions are ineffective, you can try the following: If other situations occur, you can contact{' '}
                <TouchableOpacity 
                  onPress={() => {
                    onClose();
                    router.push('/help-center/customer-service');
                  }}
                  style={styles.customerServiceLink}
                >
                  <Text style={styles.customerServiceText}>Customer Service</Text>
                </TouchableOpacity>
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
    maxHeight: SCREEN_HEIGHT * 0.9,
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
  },
  closeBtn: {
    padding: 4,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  conditionsTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    lineHeight: 22,
  },
  conditionsList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  conditionItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  solutionSection: {
    marginBottom: 20,
  },
  solutionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    lineHeight: 22,
  },
  solutionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
  },
  solutionDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 8,
  },
  noteSection: {
    marginBottom: 20,
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  customerServiceLink: {
    display: 'inline',
  },
  customerServiceText: {
    color: '#EF5350',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textDecorationLine: 'underline',
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
