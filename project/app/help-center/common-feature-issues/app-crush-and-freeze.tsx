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
import { X, Smartphone, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AppCrushAndFreezeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AppCrushAndFreezeModal({
  visible,
  onClose,
}: AppCrushAndFreezeModalProps) {
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
              App Crashes or Freezes
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
            <View style={styles.solutionSection}>
              <View style={styles.solutionHeader}>
                <Smartphone size={20} color={theme.colors.primary} />
                <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>
                  Quick Fixes:
                </Text>
              </View>
              
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                • Close and restart the Champs Sports app
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                • Restart your phone
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                • Update the app from your app store
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                • Clear app cache in phone settings
              </Text>
            </View>

            <View style={styles.advancedSection}>
              <View style={styles.advancedHeader}>
                <RefreshCw size={20} color={theme.colors.primary} />
                <Text style={[styles.advancedTitle, { color: theme.colors.text }]}>
                  Still Having Issues?
                </Text>
              </View>
              
              <Text style={[styles.advancedText, { color: theme.colors.textSecondary }]}>
                If the app continues to crash, contact{' '}
                <Text 
                  style={styles.customerServiceText}
                  onPress={handleCustomerService}
                >
                  Customer Service
                </Text>
                {' '}for technical support.
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
    maxHeight: SCREEN_HEIGHT * 0.7,
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
  solutionSection: {
    marginBottom: 20,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  solutionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  solutionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 28,
  },
  advancedSection: {
    marginBottom: 20,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  advancedTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  advancedText: {
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
