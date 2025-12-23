import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import {
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastRefreshTime?: number;
  successCount?: number;
  errorCount?: number;
  style?: any;
  size?: "small" | "medium" | "large";
  showStats?: boolean;
  showLastRefresh?: boolean;
  theme?: "light" | "dark" | "auto";
}

const { width: screenWidth } = Dimensions.get("window");

export default function RefreshIndicator({
  isRefreshing,
  lastRefreshTime,
  successCount = 0,
  errorCount = 0,
  style,
  size = "medium",
  showStats = false,
  showLastRefresh = true,
  theme: customTheme,
}: RefreshIndicatorProps) {
  const theme = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation effects
  useEffect(() => {
    if (isRefreshing) {
      // Very subtle rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000, // Slower rotation
          useNativeDriver: true,
        }),
      );

      // Very subtle pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05, // Much smaller pulse
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      );

      // Quick fade in
      Animated.timing(fadeAnim, {
        toValue: 0.7, // More transparent
        duration: 200, // Faster fade
        useNativeDriver: true,
      }).start();

      rotateAnimation.start();
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      // Quick fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300, // Faster fade out
        useNativeDriver: true,
      }).start();

      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isRefreshing, rotateAnim, pulseAnim, fadeAnim]);

  // Get size configurations
  const sizeConfig = {
    small: {
      iconSize: 14, // Smaller
      fontSize: 9,
      containerPadding: 6,
      containerHeight: 20,
    },
    medium: {
      iconSize: 16,
      fontSize: 10,
      containerPadding: 8,
      containerHeight: 26,
    },
    large: {
      iconSize: 20,
      fontSize: 12,
      containerPadding: 10,
      containerHeight: 32,
    },
  };

  const config = sizeConfig[size];

  // Format time ago
  const getTimeAgo = (timestamp: number): string => {
    if (!timestamp) return "Never";

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  // Get status color and icon
  const getStatusInfo = () => {
    if (isRefreshing) {
      return {
        color: "#FF4444",
        icon: RotateCcw,
        text: "Refreshing...",
      };
    }

    if (errorCount > successCount && errorCount > 0) {
      return {
        color: "#FF6B6B",
        icon: AlertCircle,
        text: "Connection issues",
      };
    }

    if (successCount > 0) {
      return {
        color: "#4CAF50",
        icon: CheckCircle,
        text: "Up to date",
      };
    }

    return {
      color: theme.colors.textSecondary,
      icon: Wifi,
      text: "Ready",
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!isRefreshing && !showStats && !lastRefreshTime) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: "rgba(0,0,0,0.1)", // Very subtle background
          height: config.containerHeight,
          paddingHorizontal: config.containerPadding,
        },
        style,
      ]}
    >
      <View style={styles.mainContent}>
        {/* Status Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: isRefreshing ? pulseAnim : 1 },
                { rotate: isRefreshing ? rotate : "0deg" },
              ],
            },
          ]}
        >
          <StatusIcon
            size={config.iconSize}
            color={statusInfo.color}
            strokeWidth={2.5}
          />
        </Animated.View>

        {/* Status Text */}
        <View style={styles.textContent}>
          <Text
            style={[
              styles.statusText,
              {
                color: statusInfo.color,
                fontSize: config.fontSize,
                fontWeight: isRefreshing ? "600" : "500",
              },
            ]}
          >
            {statusInfo.text}
          </Text>

          {/* Last Refresh Time */}
          {showLastRefresh && lastRefreshTime && !isRefreshing && (
            <Text
              style={[
                styles.timeText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: config.fontSize - 2,
                },
              ]}
            >
              {getTimeAgo(lastRefreshTime)}
            </Text>
          )}
        </View>

        {/* Statistics */}
        {showStats && (successCount > 0 || errorCount > 0) && (
          <View style={styles.statsContainer}>
            <View style={[styles.statItem, styles.successStat]}>
              <CheckCircle size={config.iconSize - 4} color="#4CAF50" />
              <Text
                style={[styles.statText, { fontSize: config.fontSize - 2 }]}
              >
                {successCount}
              </Text>
            </View>

            {errorCount > 0 && (
              <View style={[styles.statItem, styles.errorStat]}>
                <AlertCircle size={config.iconSize - 4} color="#FF6B6B" />
                <Text
                  style={[styles.statText, { fontSize: config.fontSize - 2 }]}
                >
                  {errorCount}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Progress Bar */}
      {isRefreshing && (
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: statusInfo.color,
              transform: [{ scaleX: pulseAnim }],
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginVertical: 2,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, // Very subtle shadow
    shadowRadius: 2,
    elevation: 1, // Minimal elevation
    overflow: "hidden",
  },

  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  iconContainer: {
    marginRight: 8,
  },

  textContent: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
  },

  statusText: {
    fontFamily: "Inter-Medium",
    letterSpacing: 0.2,
  },

  timeText: {
    fontFamily: "Inter-Regular",
    opacity: 0.8,
    marginTop: 1,
  },

  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  successStat: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },

  errorStat: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },

  statText: {
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },

  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1, // Thinner progress bar
    opacity: 0.4, // More subtle
  },
});
