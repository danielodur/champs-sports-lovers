import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { WeatherAnimation } from "./WeatherAnimations";
import { WeatherAnimationFallback } from "./WeatherAnimationsFallback";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface WeatherTestProps {
  onClose?: () => void;
}

export const WeatherAnimationTest: React.FC<WeatherTestProps> = ({
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<"rain" | "snow" | "clouds">(
    "rain",
  );
  const [selectedIntensity, setSelectedIntensity] = useState<
    "light" | "medium" | "heavy"
  >("medium");
  const [showLottie, setShowLottie] = useState(true);

  const weatherTypes = ["rain", "snow", "clouds"] as const;
  const intensityLevels = ["light", "medium", "heavy"] as const;

  return (
    <View style={styles.container}>
      {/* Weather Animation Display */}
      <View style={styles.animationContainer}>
        {showLottie ? (
          <WeatherAnimation
            type={selectedType}
            intensity={selectedIntensity}
            style={styles.animation}
          />
        ) : (
          <WeatherAnimationFallback
            type={selectedType}
            intensity={selectedIntensity}
            style={styles.animation}
          />
        )}

        {/* Overlay content to test layering */}
        <View style={styles.overlayContent}>
          <Text style={styles.overlayTitle}>Weather Animation Test</Text>
          <Text style={styles.overlaySubtitle}>
            {selectedType.toUpperCase()} - {selectedIntensity.toUpperCase()}
          </Text>
          <Text style={styles.overlayInfo}>
            {showLottie ? "Lottie Animation" : "Fallback Animation"}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <ScrollView style={styles.controlsContainer} bounces={false}>
        {/* Animation Type Toggle */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Animation Source</Text>
          <TouchableOpacity
            style={[styles.toggleButton, showLottie && styles.activeButton]}
            onPress={() => setShowLottie(!showLottie)}
          >
            <Text
              style={[styles.toggleText, showLottie && styles.activeText]}
            >
              {showLottie ? "Using Lottie" : "Using Fallback"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weather Type Selection */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Weather Type</Text>
          <View style={styles.buttonRow}>
            {weatherTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  selectedType === type && styles.selectedButton,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedType === type && styles.selectedText,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intensity Selection */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Intensity</Text>
          <View style={styles.buttonRow}>
            {intensityLevels.map((intensity) => (
              <TouchableOpacity
                key={intensity}
                style={[
                  styles.optionButton,
                  selectedIntensity === intensity && styles.selectedButton,
                ]}
                onPress={() => setSelectedIntensity(intensity)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedIntensity === intensity && styles.selectedText,
                  ]}
                >
                  {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Test Information</Text>
          <Text style={styles.infoText}>
            • This tests both Lottie and fallback animations
          </Text>
          <Text style={styles.infoText}>
            • Animations should blend smoothly with content
          </Text>
          <Text style={styles.infoText}>
            • Check particle count and performance
          </Text>
          <Text style={styles.infoText}>
            • Verify fade effects at bottom
          </Text>
        </View>

        {/* Close Button */}
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close Test</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  animationContainer: {
    height: screenHeight * 0.5,
    position: "relative",
    backgroundColor: "#2A2A2A",
    overflow: "hidden",
  },
  animation: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContent: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  overlaySubtitle: {
    fontSize: 16,
    color: "#64B5F6",
    marginBottom: 4,
    textAlign: "center",
  },
  overlayInfo: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  controlSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: "#333333",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#64B5F6",
  },
  toggleText: {
    color: "#CCCCCC",
    fontSize: 16,
    fontWeight: "500",
  },
  activeText: {
    color: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: "#333333",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedButton: {
    backgroundColor: "#64B5F6",
    borderColor: "#1976D2",
  },
  optionText: {
    color: "#CCCCCC",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#2A2A2A",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64B5F6",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 4,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default WeatherAnimationTest;
