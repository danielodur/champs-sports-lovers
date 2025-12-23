import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Bottom-sheet modal that guides the user through appealing account deletion.
 * This mirrors the Chinese reference: dark sheet, concise steps, red circles
 * highlighting UI areas, and a short CTA footer. Numbers are visually masked.
 */
export default function HowToAppealDeleteAccountModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
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

  type FocusArea = 'header-back' | 'appeal-icon' | 'reason-input' | 'submit-button';

  const StepCard = ({
    title,
    subtitle,
    focus,
  }: {
    title: string;
    subtitle?: string;
    focus: FocusArea;
  }) => {
    // Map focus area to absolute positioning inside the phone mock
    const circleStyle =
      focus === 'header-back'
        ? { top: 6, left: 12 }
        : focus === 'appeal-icon'
          ? { top: 52, left: 22 }
          : focus === 'reason-input'
            ? { top: 134, left: 18 }
            : { bottom: 16, left: 110 }; // submit-button (center approx)

    return (
      <View style={[styles.stepCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
        <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.stepSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
        ) : null}

        {/* Phone mock with masked numbers and a single red circle guidance */}
        <View style={[styles.phoneMock, { backgroundColor: theme.colors.background }]}>
          <View style={styles.phoneNotch} />

          {/* Header mock */}
          <View style={styles.headerRow}>
            <View style={[styles.headerBtn, { backgroundColor: '#E0E0E0' }]} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Account Appeal</Text>
            <View style={[styles.headerBtn, { backgroundColor: '#E0E0E0' }]} />
          </View>

          {/* Top icons row (like Help Center grid) */}
          <View style={styles.iconsRow}>
            <View style={styles.iconCol}>
              <View style={[styles.gridIcon, { backgroundColor: '#ECECEC' }]} />
              <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>Account Appeal</Text>
            </View>
            <View style={styles.iconCol}>
              <View style={[styles.gridIcon, { backgroundColor: '#ECECEC' }]} />
              <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>Feedback</Text>
            </View>
            <View style={styles.iconCol}>
              <View style={[styles.gridIcon, { backgroundColor: '#ECECEC' }]} />
              <Text style={[styles.gridLabel, { color: theme.colors.textSecondary }]}>Delete</Text>
            </View>
          </View>

          {/* Masked number block (appears like blurred digits) */}
          <View style={styles.maskedNumberRow}>
            <Text style={[styles.muted, { color: theme.colors.textSecondary }]}>Account nickname</Text>
            <View style={styles.maskBlockRow}>
              <View style={styles.maskBlock} />
              <View style={styles.maskBlock} />
              <View style={styles.maskBlock} />
              <View style={styles.maskBlock} />
            </View>
          </View>

          {/* Reason input mock */}
          <View style={styles.textArea} />

          {/* Submit button mock */}
          <View style={styles.submitBtnMock} />

          {/* Red circle guidance */}
          <View style={[styles.redCircle, circleStyle]}>
          </View>
        </View>
      </View>
    );
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
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Appeal for Account Deletion</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetBody}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Guide</Text>

            <StepCard
              title="Step 1 — Tap the back icon to reach Help Center"
              subtitle="Use the top-left back icon."
              focus="header-back"
            />

            <StepCard
              title="Step 2 — Choose Account Appeal"
              subtitle="This opens the appeals section."
              focus="appeal-icon"
            />

            <StepCard
              title="Step 3 — Enter your reason"
              subtitle="Keep it short and clear."
              focus="reason-input"
            />

            <StepCard
              title="Step 4 — Submit your request"
              subtitle="You’ll receive an in‑app notification once reviewed."
              focus="submit-button"
            />

            <View style={styles.tipBox}>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                Tip: Only the currently signed-in account can request deletion.
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.ctaBtn} activeOpacity={0.85}>
              <Text style={styles.ctaText}>Got it</Text>
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
    maxHeight: SCREEN_HEIGHT * 0.86,
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  stepCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginBottom: 10,
  },
  phoneMock: {
    borderRadius: 12,
    padding: 12,
    position: 'relative',
  },
  phoneNotch: {
    alignSelf: 'center',
    width: 54,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#444',
    marginBottom: 10,
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBtn: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconCol: {
    alignItems: 'center',
    width: '30%',
  },
  gridIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  iconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    marginRight: 8,
  },
  rowText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  maskedNumberRow: {
    marginTop: 8,
  },
  muted: {
    fontSize: 12,
    marginBottom: 6,
    opacity: 0.8,
    fontFamily: 'Inter-Regular',
  },
  maskBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  maskBlock: {
    width: 20,
    height: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  redCircle: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    marginTop: 4,
  },
  textArea: {
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    marginTop: 10,
  },
  submitBtnMock: {
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF5350',
    marginTop: 10,
  },
  tipText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  ctaBtn: {
    marginTop: 14,
    backgroundColor: '#EF5350',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});


