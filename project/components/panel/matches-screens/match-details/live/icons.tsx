import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useTheme } from "../../../../../hooks/useTheme";

// Match event icons for football matches

// Import all match event icons
const MATCH_ICONS = {
  goal: require("@/assets/matchIcons/goal.png"),
  shotOn: require("@/assets/matchIcons/shot_on.png"),
  shotOff: require("@/assets/matchIcons/shot_off.png"),
  penIn: require("@/assets/matchIcons/pen_in.png"),
  penOut: require("@/assets/matchIcons/pen_missed.png"),
  penalties: require("@/assets/matchIcons/penalties.png"),
  ownGoal: require("@/assets/matchIcons/og.png"),
  assist: require("@/assets/matchIcons/assist.png"),
  corner: require("@/assets/matchIcons/corner.png"),
  yellow: require("@/assets/matchIcons/yellow.png"),
  red: require("@/assets/matchIcons/red.png"),
  injury: require("@/assets/matchIcons/injury.png"),
  playerIn: require("@/assets/matchIcons/player_in.png"),
  playerOut: require("@/assets/matchIcons/player_out.png"),
  yellowRed: require("@/assets/matchIcons/yell_red.png"),
  var: require("@/assets/matchIcons/var.png"),
};

interface MatchIcon {
  id: string;
  icon: any;
  label: string;
  description: string;
}

interface MatchDetailsIconsProps {
  onIconPress?: (iconId: string) => void;
  selectedIcon?: string;
  sport?: string;
}

export default function MatchDetailsIcons({
  onIconPress,
  selectedIcon,
  sport = "football",
}: MatchDetailsIconsProps) {
  const theme = useTheme();

  // Only show football icons for football matches
  if (sport !== "football") {
    return null;
  }

  // Match icons in the exact order as in the Chinese app screenshots
  const matchIcons: MatchIcon[] = [
    // First Row
    {
      id: "goal",
      icon: MATCH_ICONS.goal,
      label: "Goal",
      description: "Goal scored",
    },
    {
      id: "shotOn",
      icon: MATCH_ICONS.shotOn,
      label: "Shot On",
      description: "Shot on target",
    },
    {
      id: "shotOff",
      icon: MATCH_ICONS.shotOff,
      label: "Shot Off",
      description: "Shot off target",
    },
    {
      id: "penIn",
      icon: MATCH_ICONS.penIn,
      label: "Pen In",
      description: "Penalty scored",
    },
    {
      id: "penOut",
      icon: MATCH_ICONS.penOut,
      label: "Pen Out",
      description: "Penalty missed",
    },

    // Second Row
    {
      id: "penalties",
      icon: MATCH_ICONS.penalties,
      label: "Penalties",
      description: "Penalty shootout",
    },
    {
      id: "ownGoal",
      icon: MATCH_ICONS.ownGoal,
      label: "Own Goal",
      description: "Own goal",
    },
    {
      id: "assist",
      icon: MATCH_ICONS.assist,
      label: "Assist",
      description: "Goal assist",
    },
    {
      id: "corner",
      icon: MATCH_ICONS.corner,
      label: "Corner",
      description: "Corner kick",
    },
    {
      id: "yellow",
      icon: MATCH_ICONS.yellow,
      label: "Yellow",
      description: "Yellow card",
    },

    // Third Row
    {
      id: "red",
      icon: MATCH_ICONS.red,
      label: "Red",
      description: "Red card",
    },
    {
      id: "injury",
      icon: MATCH_ICONS.injury,
      label: "Injury",
      description: "Player injured",
    },
    {
      id: "playerIn",
      icon: MATCH_ICONS.playerIn,
      label: "Sub In",
      description: "Player substituted in",
    },
    {
      id: "playerOut",
      icon: MATCH_ICONS.playerOut,
      label: "Sub Out",
      description: "Player substituted out",
    },
    {
      id: "yellowRed",
      icon: MATCH_ICONS.yellowRed,
      label: "2 Yellows",
      description: "Second yellow and red card",
    },
    {
      id: "var",
      icon: MATCH_ICONS.var,
      label: "VAR",
      description: "VAR decision",
    },
  ];

  const handleIconPress = (iconId: string) => {
    onIconPress?.(iconId);
  };

  const renderIcon = (matchIcon: MatchIcon) => {
    // Only reduce size for the 4 large icons: goal, penIn, penOut, ownGoal
    const isLargeIcon = ['goal', 'penIn', 'penOut', 'ownGoal'].includes(matchIcon.id);
    const iconSize = isLargeIcon ? 20 : 28; // Smaller size for large icons, normal size for others
    
    return (
      <TouchableOpacity
        key={matchIcon.id}
        style={[
          styles.iconContainer,
          {
            backgroundColor:
              selectedIcon === matchIcon.id
                ? "rgba(255, 68, 68, 0.1)"
                : "transparent",
          },
        ]}
        onPress={() => handleIconPress(matchIcon.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconImageContainer}>
          <Image 
            source={matchIcon.icon} 
            style={[
              styles.iconImage,
              { width: iconSize, height: iconSize }
            ]} 
          />
        </View>
        <Text
          style={[
            styles.iconLabel,
            {
              color:
                selectedIcon === matchIcon.id
                  ? "#FF4444"
                  : theme.colors?.text || "#FFFFFF",
            },
          ]}
        >
          {matchIcon.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors?.backgroundSecondary || "#2A2A2A" },
      ]}
    >
      <View style={styles.iconsGrid}>
        {/* First Row - 5 icons */}
        <View style={styles.iconRow}>
          {matchIcons.slice(0, 5).map(renderIcon)}
        </View>

        {/* Second Row - 5 icons */}
        <View style={styles.iconRow}>
          {matchIcons.slice(5, 10).map(renderIcon)}
        </View>

        {/* Third Row - 6 icons (includes both Sub In and Sub Out) */}
        <View style={styles.iconRow}>
          {matchIcons.slice(10, 16).map(renderIcon)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconsGrid: {
    gap: 16,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    flex: 1,
  },
  iconImageContainer: {
    width: 40,
    height: 40,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 12,
  },
});

