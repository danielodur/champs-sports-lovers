import React from "react";
import { Svg, Path, Rect, Circle } from "react-native-svg";

interface FootballPitchIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const FootballPitchIcon: React.FC<FootballPitchIconProps> = ({
  size = 16,
  color = "#888888",
  strokeWidth = 1.5,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer pitch boundary */}
      <Rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="1"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />

      {/* Center circle */}
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />

      {/* Center line */}
      <Path
        d="M12 6L12 18"
        stroke={color}
        strokeWidth={strokeWidth}
      />

      {/* Left goal area */}
      <Rect
        x="2"
        y="9"
        width="3"
        height="6"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />

      {/* Right goal area */}
      <Rect
        x="19"
        y="9"
        width="3"
        height="6"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />

      {/* Left goal posts */}
      <Path
        d="M2 10L2 14"
        stroke={color}
        strokeWidth={strokeWidth + 0.5}
        strokeLinecap="round"
      />

      {/* Right goal posts */}
      <Path
        d="M22 10L22 14"
        stroke={color}
        strokeWidth={strokeWidth + 0.5}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default FootballPitchIcon;
