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
import { X, Users, Star, MessageCircle, Phone, Mail, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CreateInteractivePlatformModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreateInteractivePlatformModal({
  visible,
  onClose,
}: CreateInteractivePlatformModalProps) {
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
              Activate Interactive Platform
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
              Join our interactive platform as a content creator, local commentator, or partner. 
              Share your sports expertise and earn rewards with over 3000+ followers required.
            </Text>

            <View style={styles.requirementsSection}>
              <View style={styles.requirementsHeader}>
                <CheckCircle size={20} color={theme.colors.primary} />
                <Text style={[styles.requirementsTitle, { color: theme.colors.text }]}>
                  Requirements:
                </Text>
              </View>
              
              <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                • Over 3000 followers on social media
              </Text>
              <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                • Active sports content creation experience
              </Text>
              <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                • Verified identity and age 18+
              </Text>
            </View>

            <View style={styles.rolesSection}>
              <View style={styles.rolesHeader}>
                <Users size={20} color={theme.colors.primary} />
                <Text style={[styles.rolesTitle, { color: theme.colors.text }]}>
                  Available Roles:
                </Text>
              </View>
              
              <Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>
                • <Text style={[styles.boldText, { color: theme.colors.text }]}>Sports Influencer:</Text> Create content and engage with fans
              </Text>
              <Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>
                • <Text style={[styles.boldText, { color: theme.colors.text }]}>Local Commentator:</Text> Provide match analysis and predictions
              </Text>
              <Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>
                • <Text style={[styles.boldText, { color: theme.colors.text }]}>Content Partner:</Text> Collaborate on exclusive sports content
              </Text>
            </View>

            <View style={styles.benefitsSection}>
              <View style={styles.benefitsHeader}>
                <Star size={20} color={theme.colors.primary} />
                <Text style={[styles.benefitsTitle, { color: theme.colors.text }]}>
                  Benefits:
                </Text>
              </View>
              
              <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>
                • Earn Champs Coins for quality content
              </Text>
              <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>
                • Access to exclusive sports data and insights
              </Text>
              <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>
                • Featured placement on the platform
              </Text>
            </View>

            <View style={styles.contactSection}>
              <View style={styles.contactHeader}>
                <MessageCircle size={20} color={theme.colors.primary} />
                <Text style={[styles.contactTitle, { color: theme.colors.text }]}>
                  Ready to Join?
                </Text>
              </View>
              
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                Contact our partnership team to get started:
              </Text>
              
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Mail size={16} color={theme.colors.primary} />
                  <Text style={[styles.contactDetail, { color: theme.colors.text }]}>
                    partners@champssports.ug
                  </Text>
                </View>
                
                <View style={styles.contactItem}>
                  <Phone size={16} color={theme.colors.primary} />
                  <Text style={[styles.contactDetail, { color: theme.colors.text }]}>
                    +256 700 123 456
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.noteSection}>
              <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                <Text style={[styles.noteLabel, { color: theme.colors.text }]}>Note:</Text>
                {' '}Applications will be reviewed based on follower count, engagement rate, and content quality. 
                Only verified accounts with genuine followers will be approved.
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
  requirementsSection: {
    marginBottom: 20,
  },
  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 28,
  },
  rolesSection: {
    marginBottom: 20,
  },
  rolesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rolesTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  roleText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 28,
  },
  boldText: {
    fontFamily: 'Inter-SemiBold',
  },
  benefitsSection: {
    marginBottom: 20,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 28,
  },
  contactSection: {
    marginBottom: 20,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    paddingLeft: 28,
    marginBottom: 12,
  },
  contactInfo: {
    paddingLeft: 28,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactDetail: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    color: '#3B82F6',
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
  gotItBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  gotItText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
});
