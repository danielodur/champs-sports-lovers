// Professional Football Field Positioning System
export const getPlayerFieldPosition = (
  position: string,
  team: "home" | "away",
  index: number,
  fieldDimensions: { width: number; height: number }
) => {
  const { width, height } = fieldDimensions;

  const positions = {
    // Goalkeeper positions
    GK: {
      top: team === "home" ? height * 0.9 : height * 0.05,
      left: width * 0.5,
    },

    // Defender positions - 4-2-3-1 formation
    CB: {
      top: team === "home" ? height * 0.75 : height * 0.2,
      left: index === 0 ? width * 0.35 : width * 0.65,
    },
    LB: {
      top: team === "home" ? height * 0.75 : height * 0.2,
      left: width * 0.15,
    },
    RB: {
      top: team === "home" ? height * 0.75 : height * 0.2,
      left: width * 0.85,
    },

    // Midfielder positions
    CDM: {
      top: team === "home" ? height * 0.6 : height * 0.35,
      left: index === 0 ? width * 0.4 : width * 0.6,
    },
    CM: {
      top: team === "home" ? height * 0.45 : height * 0.5,
      left: index === 0 ? width * 0.25 : width * 0.75,
    },
    CAM: {
      top: team === "home" ? height * 0.35 : height * 0.6,
      left: width * 0.5,
    },

    // Forward positions
    LW: {
      top: team === "home" ? height * 0.25 : height * 0.7,
      left: width * 0.2,
    },
    RW: {
      top: team === "home" ? height * 0.25 : height * 0.7,
      left: width * 0.8,
    },
    ST: {
      top: team === "home" ? height * 0.15 : height * 0.8,
      left: width * 0.5,
    },
  };

  const position_data = positions[position as keyof typeof positions] || {
    top: height * 0.5,
    left: width * 0.5,
  };

  return {
    position: "absolute" as const,
    top: position_data.top,
    left: position_data.left - 25, // Center the 50px wide player circle
  };
};
