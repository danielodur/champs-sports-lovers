import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MatchDetailsGoalAlertProps {
  visible: boolean;
  scoringTeam: "home" | "away";
  scorer?: string;
  minute?: string;
  sport?: string; // Add sport prop to differentiate football/basketball
  eventType?: "goal" | "cancelled"; // Add eventType to handle cancelled goals
  onDismiss?: () => void;
}

export default function MatchDetailsGoalAlert({
  visible,
  scoringTeam,
  scorer,
  minute,
  sport = "football", // Default to football
  eventType = "goal", // Default to goal
  onDismiss,
}: MatchDetailsGoalAlertProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ballRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Rolling ball animation
      Animated.loop(
        Animated.timing(ballRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => {
        clearTimeout(timer);
        ballRotation.stopAnimation();
      };
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  const ballRotationInterpolate = ballRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Position and direction based on scoring team
  const isHomeTeam = scoringTeam === "home";
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isHomeTeam ? [-120, 0] : [120, 0],
  });

  const alertStyle = isHomeTeam
    ? {
        left: 8,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
      }
    : {
        right: 8,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
      };

  const contentDirection = isHomeTeam ? "row" : "row-reverse";
  const isBasketball = sport === "basketball";
  const isCancelled = eventType === "cancelled";
  
  // Different icons and text for cancelled goals
  const alertIcon = isCancelled ? "🚫" : (isBasketball ? "🏀" : "⚽");
  const alertText = isCancelled 
    ? "Cancelled" 
    : (isBasketball ? "Points" : "Goal");
  
  // Different background color for cancelled goals
  const backgroundColor = isCancelled ? "#FF9800" : "#EF5350"; // Orange for cancelled, red for goal

  return (
    <Animated.View
      style={[
        styles.container,
        alertStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateX }],
          backgroundColor: backgroundColor,
        },
      ]}
    >
      <View style={[styles.content, { flexDirection: contentDirection }]}>
        {/* Ball/Basketball Icon with rotation */}
        <View style={styles.ballContainer}>
          <Animated.Text
            style={[
              styles.ballIcon,
              {
                transform: [{ rotate: ballRotationInterpolate }],
              },
            ]}
          >
            {alertIcon}
          </Animated.Text>
        </View>

        {/* Goal/Points Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.goalText}>{alertText}</Text>
          {minute && <Text style={styles.minuteText}>{minute}'</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    backgroundColor: "#EF5350", // Salmon red color matching animation preview
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 99999,
    minWidth: 110,
  },
  content: {
    alignItems: "center",
    gap: 10,
  },
  ballContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  ballIcon: {
    fontSize: 28,
  },
  infoContainer: {
    alignItems: "center",
    gap: 2,
  },
  goalText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  minuteText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFD700",
  },
});


