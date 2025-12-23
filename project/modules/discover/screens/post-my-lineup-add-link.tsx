import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  TextInput,
  Animated,
  Easing,
  StyleSheet as RNStyleSheet,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Link, ShieldCheck, Info } from "lucide-react-native";

interface PostMyLineupAddLinkProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (payload: { link: string; option: string }) => void;
  dailyPostCount: number;
  dailyPostLimit: number;
}

interface LinkOption {
  id: string;
  title: string;
  description: string;
}

const linkOptions: LinkOption[] = [
  {
    id: "analysis",
    title: "Share Tactical Analysis",
    description: "Highlight your expert breakdowns, match previews, or video analysis links.",
  },
  {
    id: "community",
    title: "Community Discussion",
    description: "Invite the Champs community to join interactive threads, polls, or chats.",
  },
];

const PostMyLineupAddLink: React.FC<PostMyLineupAddLinkProps> = ({
  visible,
  onClose,
  onConfirm,
  dailyPostCount,
  dailyPostLimit,
}) => {
  const theme = useTheme();
  const [selectedOption, setSelectedOption] = useState<string>(linkOptions[0].id);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isRendered, setIsRendered] = useState(visible);
  const remainingPosts = Math.max(dailyPostLimit - dailyPostCount, 0);
  const canConfirm = linkUrl.trim().length > 0 && remainingPosts > 0;

  const resetForm = useCallback(() => {
    setSelectedOption(linkOptions[0].id);
    setLinkUrl("");
  }, []);

  const stopCurrentAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  };

  const runAnimation = useCallback(
    (toValue: number, callback?: () => void) => {
      stopCurrentAnimation();
      animationRef.current = Animated.parallel([
        Animated.spring(slideAnim, {
          toValue,
          damping: 18,
          mass: 0.8,
          stiffness: 220,
          overshootClamping: false,
          restDisplacementThreshold: 0.1,
          restSpeedThreshold: 0.1,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: toValue === 1 ? 0.5 : 0,
          duration: toValue === 1 ? 200 : 180,
          easing: toValue === 1 ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      animationRef.current.start(() => {
        animationRef.current = null;
        callback?.();
      });
    },
    [slideAnim, overlayAnim]
  );

  useEffect(() => {
    return () => stopCurrentAnimation();
  }, []);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      runAnimation(1);
    } else if (!visible && isRendered) {
      runAnimation(0, () => {
        setIsRendered(false);
        resetForm();
      });
    }
  }, [visible, isRendered, runAnimation, resetForm]);

  const normalizeLink = (input: string) => {
    if (!input) return "";
    const trimmed = input.trim();
    if (trimmed.length === 0) return "";
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleConfirm = () => {
    const normalized = normalizeLink(linkUrl);
    if (!normalized) {
      return;
    }
    runAnimation(0, () => {
      onConfirm({
        link: normalized,
        option: selectedOption,
      });
      setIsRendered(false);
      resetForm();
    });
  };

  const handleClose = () => {
    runAnimation(0, () => {
      onClose();
      setIsRendered(false);
      resetForm();
    });
  };

  if (!isRendered) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  const overlayOpacity = overlayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.absoluteContainer}>
        <TouchableOpacity style={RNStyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose}>
          <Animated.View
            style={[RNStyleSheet.absoluteFillObject, { backgroundColor: "#000000", opacity: overlayAnim }]}
          />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.sheetContainer,
            { backgroundColor: theme.colors.backgroundSecondary, transform: [{ translateY }] },
          ]}
        >
          <TouchableOpacity
            style={styles.dragHandle}
            activeOpacity={0.8}
            onPress={handleClose}
          />
          <View style={styles.headerRow}>
            <ShieldCheck size={28} color="#FF6B6B" />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Link Sharing Center</Text>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>You can share rich community resources up to {dailyPostLimit} times per day.</Text>

            {linkOptions.map((option) => {
              const isActive = option.id === selectedOption;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: isActive ? "#FF3B30" : "rgba(255,255,255,0.1)",
                      backgroundColor: isActive ? "rgba(255, 59, 48, 0.08)" : "rgba(255,255,255,0.04)",
                    },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedOption(option.id)}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: isActive ? "#FF3B30" : "#6B7280" },
                      ]}
                    >
                      {isActive && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{option.title}</Text>
                  </View>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>{option.description}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Link URL</Text>
              <View style={styles.inputRow}>
                <Link size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="https://example.com/your-post"
                  placeholderTextColor="#6B7280"
                  value={linkUrl}
                  onChangeText={setLinkUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.summaryBox}>
              <Info size={16} color="#FF6B6B" />
              <Text style={styles.summaryText}>
                Posts remaining today: <Text style={styles.summaryHighlight}>{remainingPosts}</Text> / {dailyPostLimit}. Each successful post counts once towards your daily limit.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: canConfirm ? "#FF3B30" : "#4B5563" }]}
              onPress={handleConfirm}
              activeOpacity={canConfirm ? 0.85 : 1}
              disabled={!canConfirm}
            >
              <Text style={styles.confirmText}>Add Link</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  absoluteContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "85%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "#000000",
  },
  containerWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "85%",
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 12,
    gap: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionCard: {
    borderWidth: 1.2,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  textArea: {
    fontSize: 14,
  },
  summaryBox: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 59, 48, 0.08)",
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    color: "#E5E7EB",
    lineHeight: 18,
  },
  summaryHighlight: {
    color: "#FF6B6B",
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#6B7280",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default PostMyLineupAddLink;
