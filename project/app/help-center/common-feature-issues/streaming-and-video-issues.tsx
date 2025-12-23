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
import { X, Play, Wifi, Signal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreamingAndVideoIssuesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StreamingAndVideoIssuesModal({
  visible,
  onClose,
}: StreamingAndVideoIssuesModalProps) {
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
              Streaming & Video Issues
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
                <Wifi size={20} color={theme.colors.primary} />
                <Text style={[styles.solutionTitle, { color: theme.colors.text }]}>
                  Check Your Connection:
                </Text>
              </View>
              
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                • Make sure you have strong WiFi or mobile data
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                • Try switching between WiFi and mobile data
              </Text>
              <Text style={[styles.solutionText, { color: theme.colors.textSecondary }]}>
                • Move closer to your WiFi router
              </Text>
            </View>

            <View style={styles.videoSection}>
              <View style={styles.videoHeader}>
                <Play size={20} color={theme.colors.primary} />
                <Text style={[styles.videoTitle, { color: theme.colors.text }]}>
                  Video Fixes:
                </Text>
              </View>
              
              <Text style={[styles.videoText, { color: theme.colors.textSecondary }]}>
                • Close and reopen the video
              </Text>
              <Text style={[styles.videoText, { color: theme.colors.textSecondary }]}>
                • Try a different match or stream
              </Text>
              <Text style={[styles.videoText, { color: theme.colors.textSecondary }]}>
                • Lower video quality in settings
              </Text>
            </View>

            <View style={styles.helpSection}>
              <View style={styles.helpHeader}>
                <Signal size={20} color={theme.colors.primary} />
                <Text style={[styles.helpTitle, { color: theme.colors.text }]}>
                  Still Not Working?
                </Text>
              </View>
              
              <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                If videos still won't load, contact{' '}
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
    maxHeight: SCREEN_HEIGHT * 0.75,
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
  videoSection: {
    marginBottom: 20,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  videoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 28,
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
