import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Trash2 } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

const { width, height } = Dimensions.get("window");

interface ClearMyLineupProps {
  onClear: () => void;
  disabled?: boolean;
}

export default function ClearMyLineup({
  onClear,
  disabled = false,
}: ClearMyLineupProps) {
  const theme = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  const handleButtonPress = () => {
    if (disabled) {
      return;
    }
    openModal();
  };

  const openModal = () => {
    setShowModal(true);

    // Animate modal appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
    });
  };

  const handleConfirm = () => {
    closeModal();
    setTimeout(() => {
      onClear();
    }, 200);
  };

  const handleCancel = () => {
    closeModal();
  };

  return (
    <>
      {/* Clear Button */}
      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleButtonPress}
        disabled={disabled}
        activeOpacity={0.7}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <Trash2 size={22} color={theme.colors.text} />
      </TouchableOpacity>

      {/* Modal matching Chinese app style */}
      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />

          {/* Modal Content - matching Chinese app exactly */}
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: "#2D2D2D", // Dark modal like in screenshot
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Modal Title */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clear Lineup?</Text>
            </View>

            {/* Modal Actions - side by side buttons */}
            <View style={styles.modalActions}>
              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Clear Button Styles
  clearButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Modal Container - matching Chinese app style
  modalContainer: {
    width: width * 0.7,
    maxWidth: 280,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },

  // Modal Header
  modalHeader: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 22,
  },

  // Modal Actions
  modalActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },

  actionButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButton: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
  },

  confirmButton: {
    // No additional styles needed
  },

  // Button Text Styles
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
  },

  confirmButtonText: {
    color: "#FF6B6B", // Red color like in Chinese app
    fontSize: 16,
    fontWeight: "500",
  },
});
