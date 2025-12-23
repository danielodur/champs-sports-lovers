import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";

interface FontColorModalProps {
  visible: boolean;
  onClose: () => void;
  titleFontType: string;
  contentFontType: string;
  onTitleFontChange: (type: string) => void;
  onContentFontChange: (type: string) => void;
  onVipRequest: (type: 'title' | 'content') => void;
}

export default function FontColorModal({
  visible,
  onClose,
  titleFontType,
  contentFontType,
  onTitleFontChange,
  onContentFontChange,
  onVipRequest,
}: FontColorModalProps) {


  // Reset fonts to default when modal opens (for non-VIP users)
  useEffect(() => {
    if (visible) {
      // Reset to default if user is not VIP
      if (titleFontType === 'vip') {
        onTitleFontChange('default');
      }
      if (contentFontType === 'vip') {
        onContentFontChange('default');
      }
    }
  }, [visible]);

  const handleVipSelection = (type: 'title' | 'content') => {
    onVipRequest(type);
  };



  if (!visible) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.fontColorModalContainer}>
          <TouchableOpacity
            style={styles.fontColorModalOverlay}
            onPress={onClose}
            activeOpacity={1}
          />
          <View style={styles.fontColorModal}>
            {/* Modal Header */}
            <View style={styles.fontColorModalHeader}>
              <Text style={styles.fontColorModalTitle}>Font Color</Text>
            </View>

            {/* Title Section */}
            <View style={styles.fontColorModalSection}>
              <Text style={styles.fontColorModalSectionTitle}>Title</Text>
              <View style={styles.fontColorOptions}>
                <TouchableOpacity
                  style={[
                    styles.fontColorOption,
                    titleFontType === "default" && styles.fontColorOptionSelected
                  ]}
                  onPress={() => {
                    onTitleFontChange("default");
                    // Close modal and return to parent screen
                    setTimeout(() => {
                      onClose();
                    }, 100);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.fontColorOptionContent}>
                    <View style={styles.fontColorOptionDot} />
                    <Text style={styles.fontColorOptionText}>Default</Text>
                  </View>
                  {titleFontType === "default" && (
                    <View style={styles.fontColorOptionCheck}>
                      <Text style={styles.fontColorOptionCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.fontColorOption,
                    styles.fontColorOptionVip,
                    titleFontType === "vip" && styles.fontColorOptionSelected
                  ]}
                  onPress={() => {
                    if (titleFontType === 'vip') {
                      // User is already VIP, just deselect
                      onTitleFontChange('default');
                    } else {
                      // User is not VIP, show confirmation modal
                      handleVipSelection('title');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.fontColorOptionContent}>
                    <View style={styles.fontColorVipCrown}>
                      <Text style={styles.fontColorVipCrownText}>👑</Text>
                    </View>
                    <View style={styles.fontColorOptionDot} />
                    <Text style={[styles.fontColorOptionText, styles.fontColorOptionTextVip]}>VIP User</Text>
                  </View>
                  {titleFontType === "vip" && (
                    <View style={styles.fontColorOptionCheck}>
                      <Text style={styles.fontColorOptionCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.fontColorModalSection}>
              <Text style={styles.fontColorModalSectionTitle}>Content</Text>
              <View style={styles.fontColorOptions}>
                <TouchableOpacity
                  style={[
                    styles.fontColorOption,
                    contentFontType === "default" && styles.fontColorOptionSelected
                  ]}
                  onPress={() => {
                    onContentFontChange("default");
                    // Close modal and return to parent screen
                    setTimeout(() => {
                      onClose();
                    }, 100);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.fontColorOptionContent}>
                    <View style={styles.fontColorOptionDot} />
                    <Text style={styles.fontColorOptionText}>Default</Text>
                  </View>
                  {contentFontType === "default" && (
                    <View style={styles.fontColorOptionCheck}>
                      <Text style={styles.fontColorOptionCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.fontColorOption,
                    styles.fontColorOptionVip,
                    contentFontType === "vip" && styles.fontColorOptionSelected
                  ]}
                  onPress={() => {
                    if (contentFontType === 'vip') {
                      // User is already VIP, just deselect
                      onContentFontChange('default');
                    } else {
                      // User is not VIP, show confirmation modal
                      handleVipSelection('content');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.fontColorOptionContent}>
                    <View style={styles.fontColorVipCrown}>
                      <Text style={styles.fontColorVipCrownText}>👑</Text>
                    </View>
                    <View style={styles.fontColorOptionDot} />
                    <Text style={[styles.fontColorOptionText, styles.fontColorOptionTextVip]}>VIP User</Text>
                  </View>
                  {contentFontType === "vip" && (
                    <View style={styles.fontColorOptionCheck}>
                      <Text style={styles.fontColorOptionCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>


    </>
  );
}

const styles = StyleSheet.create({
  fontColorModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  fontColorModalOverlay: {
    flex: 1,
  },
  fontColorModal: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: "50%",
  },
  fontColorModalHeader: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  fontColorModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  fontColorModalSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fontColorModalSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  fontColorOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fontColorOption: {
    flex: 1,
    backgroundColor: "#333333",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    borderWidth: 2,
    borderColor: "transparent",
  },
  fontColorOptionSelected: {
    borderColor: "#FFFFFF",
  },
  fontColorOptionVip: {
    backgroundColor: "#2a2a2a",
    borderColor: "#FF3B30",
  },
  fontColorOptionContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  fontColorOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  fontColorOptionText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
  fontColorOptionTextVip: {
    color: "#FF3B30",
    fontWeight: "600",
  },
  fontColorVipCrown: {
    marginBottom: 4,
  },
  fontColorVipCrownText: {
    fontSize: 16,
  },
  fontColorOptionCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  fontColorOptionCheckText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },


});