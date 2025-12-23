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
import { X, Settings, Smartphone, Lock, Shield, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HowToChangePasswordAndNumberModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function HowToChangePasswordAndNumberModal({
  visible,
  onClose,
}: HowToChangePasswordAndNumberModalProps) {
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

  const handleNavigateToSettings = () => {
    onClose();
    console.log('Navigate to app settings');
    // Future navigation to settings screen
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
              How to Change Password Or Number
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
              Hello! Here are the specific methods to change your login phone number:
            </Text>

            <View style={styles.methodSection}>
              <View style={styles.methodHeader}>
                <Smartphone size={20} color={theme.colors.primary} />
                <Text style={[styles.methodTitle, { color: theme.colors.text }]}>
                  To Change Phone Number:
                </Text>
              </View>
              
              <View style={styles.stepContainer}>
                <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                  Go to the app and tap "Me" → "Settings" → "Personal Info" → "Phone Number". 
                  Follow the prompts to change your login phone number.
                </Text>
              </View>
            </View>

            <View style={styles.methodSection}>
              <View style={styles.methodHeader}>
                <Lock size={20} color={theme.colors.primary} />
                <Text style={[styles.methodTitle, { color: theme.colors.text }]}>
                  To Change Password:
                </Text>
              </View>
              
              <View style={styles.stepContainer}>
                <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                  If you need to change your account password, you can go to "Settings" → "Account & Security" → 
                  "Change Password". Enter your original password or get verification code to change it.
                </Text>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <TouchableOpacity 
                style={[styles.settingsButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={handleNavigateToSettings}
                activeOpacity={0.7}
              >
                <View style={styles.settingsButtonContent}>
                  <Settings size={24} color={theme.colors.primary} />
                  <View style={styles.settingsTextContainer}>
                    <Text style={[styles.settingsButtonTitle, { color: theme.colors.text }]}>
                      Go to Settings
                    </Text>
                    <Text style={[styles.settingsButtonSubtitle, { color: theme.colors.textSecondary }]}>
                      Access your account settings to make changes
                    </Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.securityNote}>
              <Shield size={18} color="#EF5350" />
              <View style={styles.securityNoteContent}>
                <Text style={[styles.securityNoteTitle, { color: theme.colors.text }]}>
                  Security Notice:
                </Text>
                <Text style={[styles.securityNoteText, { color: theme.colors.textSecondary }]}>
                  For your account security, you may need to verify your identity when changing 
                  sensitive information like phone numbers or passwords. Keep your account information 
                  up to date to ensure you can always access your Champs Sports account.
                </Text>
              </View>
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
  methodSection: {
    marginBottom: 24,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    lineHeight: 22,
  },
  stepContainer: {
    paddingLeft: 28,
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsButton: {
    borderRadius: 12,
    padding: 16,
  },
  settingsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingsButtonTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  settingsButtonSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  securityNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#EF5350',
  },
  securityNoteContent: {
    flex: 1,
    marginLeft: 8,
  },
  securityNoteTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
  },
  securityNoteText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
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
