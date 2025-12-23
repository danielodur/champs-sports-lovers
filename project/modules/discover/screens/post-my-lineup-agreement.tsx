import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Shield, Users, MessageCircle } from "lucide-react-native";

interface PostMyLineupAgreementProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  link?: {
    text: string;
    url: string;
  };
}

const checklistItems: ChecklistItem[] = [
  {
    id: "links",
    label:
      "I will not share personal contact details, social media handles, or external links in community posts.",
  },
  {
    id: "harassment",
    label:
      "I will not harass other members or attack the Champs platform; respectful communication is required.",
  },
  {
    id: "spam",
    label:
      "I will not spam or flood the community feed; repeated violations will result in restrictions.",
  },
  {
    id: "rules",
    label: "I have read and agree to the Champs Sports Community Guidelines.",
    link: {
      text: "Community Guidelines",
      url: "https://example.com/community-guidelines",
    },
  },
];

const PostMyLineupAgreement: React.FC<PostMyLineupAgreementProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const theme = useTheme();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!visible) {
      setCheckedItems({});
    }
  }, [visible]);

  const handleToggle = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allChecked = checklistItems.every((item) => checkedItems[item.id]);

  const handleConfirm = () => {
    if (!allChecked) {
      return;
    }
    onConfirm();
  };

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn("Failed to open link", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Shield size={28} color="#FF6B6B" />
            </View>
            <Text style={[styles.titleText, { color: theme.colors.text }]}>Community Acknowledgement</Text>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <Text style={[styles.subtitleText, { color: theme.colors.textSecondary }]}>Please review and accept each point before sharing your lineup with the community.</Text>

            {checklistItems.map((item) => {
              const isChecked = checkedItems[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checkRow}
                  activeOpacity={0.8}
                  onPress={() => handleToggle(item.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isChecked ? "#FF3B30" : "#666666",
                        backgroundColor: isChecked ? "#FF3B30" : "transparent",
                      },
                    ]}
                  >
                    {isChecked && <View style={styles.checkboxInner} />}
                  </View>
                  <View style={styles.checkContent}>
                    <Text style={[styles.checkText, { color: theme.colors.text }]}>
                      {item.label}{" "}
                      {item.link && (
                        <Text
                          style={styles.linkText}
                          onPress={() => handleLinkPress(item.link!.url)}
                        >
                          {item.link!.text}
                        </Text>
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.highlightBox}>
              <Users size={18} color="#FFB347" />
              <Text style={styles.highlightText}>
                Community posts are public. Please keep content respectful, focused on football discussions, and safe for all fans.
              </Text>
            </View>

            <View style={styles.highlightBox}>
              <MessageCircle size={18} color="#4DA3FF" />
              <Text style={styles.highlightText}>
                Violations may result in temporary or permanent posting restrictions. Thank you for keeping Champs Sports welcoming!
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                {
                  backgroundColor: allChecked ? "#FF3B30" : "#4B5563",
                },
              ]}
              activeOpacity={allChecked ? 0.85 : 1}
              onPress={handleConfirm}
              disabled={!allChecked}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    maxHeight: 360,
    marginBottom: 20,
  },
  contentContainer: {
    paddingBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginTop: 2,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  checkContent: {
    flex: 1,
  },
  checkText: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: "#4DA3FF",
    textDecorationLine: "underline",
  },
  highlightBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    color: "#E5E7EB",
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default PostMyLineupAgreement;
