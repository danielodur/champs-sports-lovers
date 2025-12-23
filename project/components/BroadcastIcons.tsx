import React from "react";
import { View, StyleSheet } from "react-native";
import { Monitor } from "lucide-react-native";
import { Svg, Path, Rect, Circle } from "react-native-svg";

// Custom Soccer Field Icon Component
const SoccerFieldIcon = ({ size = 24, color = "#FFB800" }) => (
  <Svg width={size} height={size * 0.75} viewBox="0 0 24 18" fill="none">
    {/* Field background */}
    <Rect
      x="2"
      y="2"
      width="20"
      height="14"
      rx="1"
      fill={color}
      stroke="white"
      strokeWidth="0.8"
    />
    {/* Center line */}
    <Path d="M12 2V16" stroke="white" strokeWidth="0.8" />
    {/* Center circle */}
    <Circle cx="12" cy="9" r="3" fill="none" stroke="white" strokeWidth="0.8" />
    {/* Left penalty area */}
    <Rect
      x="2"
      y="6"
      width="4"
      height="6"
      fill="none"
      stroke="white"
      strokeWidth="0.8"
    />
    {/* Right penalty area */}
    <Rect
      x="18"
      y="6"
      width="4"
      height="6"
      fill="none"
      stroke="white"
      strokeWidth="0.8"
    />
    {/* Left goal area */}
    <Rect
      x="2"
      y="7.5"
      width="2"
      height="3"
      fill="none"
      stroke="white"
      strokeWidth="0.8"
    />
    {/* Right goal area */}
    <Rect
      x="20"
      y="7.5"
      width="2"
      height="3"
      fill="none"
      stroke="white"
      strokeWidth="0.8"
    />
  </Svg>
);

interface BroadcastIconsProps {
  hasVideoBroadcast: boolean;
  size?: number;
  style?: any;
}

const BroadcastIcons: React.FC<BroadcastIconsProps> = ({
  hasVideoBroadcast,
  size = 24,
  style,
}) => {
  return (
    <View style={[styles.broadcastSection, style]}>
      {hasVideoBroadcast ? (
        <View style={[styles.tvIconContainer, { backgroundColor: "#FF4444" }]}>
          <Monitor
            size={18}
            color="white"
            fill="white"
            style={styles.broadcastIcon}
          />
        </View>
      ) : (
        <SoccerFieldIcon size={size} color="#FFB800" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  broadcastSection: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 8,
  },
  broadcastIcon: {
    opacity: 0.9,
  },
  tvIconContainer: {
    width: 26,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default BroadcastIcons;
