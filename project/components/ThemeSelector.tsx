import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useThemeMode } from "@/hooks/useTheme";

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function ThemeSelector({
  visible,
  onClose,
}: ThemeSelectorProps) {
  const { theme, setTheme } = useThemeMode();
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const themes = [
    { id: "dark", label: "Dark", icon: "🌙" },
    { id: "light", label: "Light", icon: "☀️" },
    { id: "system", label: "Automatic", icon: "⚙️" },
  ];

  const handleThemeSelect = (selectedTheme: "dark" | "light" | "system") => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setTheme(selectedTheme);
      onClose();
    });
  };

  const renderPreview = (themeOption: {
    id: string;
    label: string;
    icon: string;
  }) => {
    if (themeOption.id === "system") {
      return (
        <View style={styles.systemPreviewContainer}>
          <View style={styles.darkPreviewHalf}>
            <Text style={styles.themeIcon}>🌙</Text>
            <View style={styles.previewContent}>
              <View style={[styles.previewLine, styles.darkPreviewLine]} />
              <View style={[styles.previewLine, styles.darkPreviewLine]} />
            </View>
          </View>
          <View style={styles.lightPreviewHalf}>
            <Text style={styles.themeIcon}>☀️</Text>
            <View style={styles.previewContent}>
              <View style={[styles.previewLine, styles.lightPreviewLine]} />
              <View style={[styles.previewLine, styles.lightPreviewLine]} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.previewCard,
          themeOption.id === "dark" && styles.darkPreview,
          themeOption.id === "light" && styles.lightPreview,
        ]}
      >
        <Text style={styles.themeIcon}>{themeOption.icon}</Text>
        <View style={styles.previewContent}>
          <View
            style={[
              styles.previewLine,
              themeOption.id === "light" && styles.lightPreviewLine,
            ]}
          />
          <View
            style={[
              styles.previewLine,
              themeOption.id === "light" && styles.lightPreviewLine,
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Screen Theme</Text>
          <View style={styles.divider} />
          <View style={styles.themeGrid}>
            {themes.map((themeOption) => (
              <TouchableOpacity
                key={themeOption.id}
                style={[
                  styles.themeOption,
                  theme === themeOption.id && styles.selectedTheme,
                ]}
                onPress={() =>
                  handleThemeSelect(
                    themeOption.id as "dark" | "light" | "system"
                  )
                }
              >
                <View style={styles.themePreview}>
                  {renderPreview(themeOption)}
                </View>
                <Text
                  style={[
                    styles.themeLabel,
                    theme === themeOption.id && styles.selectedThemeLabel,
                  ]}
                >
                  {themeOption.label}
                </Text>
                <View
                  style={[
                    styles.radioButton,
                    theme === themeOption.id && styles.selectedRadioButton,
                  ]}
                >
                  {theme === themeOption.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#333333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#333333",
    marginBottom: 24,
  },
  themeGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  themeOption: {
    alignItems: "center",
    width: "30%",
  },
  selectedTheme: {
    opacity: 1,
  },
  themePreview: {
    width: 80,
    height: 120,
    marginBottom: 12,
  },
  previewCard: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  darkPreview: {
    backgroundColor: "#121212",
    borderColor: "#333333",
  },
  lightPreview: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EEEEEE",
  },
  systemPreviewContainer: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
    overflow: "hidden",
  },
  darkPreviewHalf: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  lightPreviewHalf: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 8,
    alignItems: "center",
  },
  themeIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  previewContent: {
    width: "100%",
    gap: 6,
  },
  previewLine: {
    height: 6,
    borderRadius: 3,
  },
  darkPreviewLine: {
    backgroundColor: "#333333",
  },
  lightPreviewLine: {
    backgroundColor: "#E0E0E0",
  },
  themeLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginBottom: 8,
  },
  selectedThemeLabel: {
    color: "#EF5350",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#808080",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedRadioButton: {
    borderColor: "#EF5350",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF5350",
  },
});
