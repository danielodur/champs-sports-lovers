/**
 * Basketball Position Mapper
 * 
 * Maps API position data to basketball-specific positions
 * and provides position validation and formatting utilities
 */

export type BasketballPosition = "PG" | "SG" | "SF" | "PF" | "C" | "G" | "F" | "G/F" | "F/C";

export interface BasketballPositionInfo {
  shortCode: BasketballPosition;
  fullName: string;
  category: "guard" | "forward" | "center" | "hybrid";
  description: string;
}

// Basketball position mappings
const BASKETBALL_POSITIONS: Record<BasketballPosition, BasketballPositionInfo> = {
  "PG": {
    shortCode: "PG",
    fullName: "Point Guard",
    category: "guard",
    description: "Primary ball handler and playmaker"
  },
  "SG": {
    shortCode: "SG",
    fullName: "Shooting Guard",
    category: "guard",
    description: "Perimeter scorer and shooter"
  },
  "SF": {
    shortCode: "SF",
    fullName: "Small Forward",
    category: "forward",
    description: "Versatile wing player"
  },
  "PF": {
    shortCode: "PF",
    fullName: "Power Forward",
    category: "forward",
    description: "Inside scorer and rebounder"
  },
  "C": {
    shortCode: "C",
    fullName: "Center",
    category: "center",
    description: "Primary interior presence"
  },
  "G": {
    shortCode: "G",
    fullName: "Guard",
    category: "guard",
    description: "Generic guard position"
  },
  "F": {
    shortCode: "F",
    fullName: "Forward",
    category: "forward",
    description: "Generic forward position"
  },
  "G/F": {
    shortCode: "G/F",
    fullName: "Guard-Forward",
    category: "hybrid",
    description: "Combo guard/forward"
  },
  "F/C": {
    shortCode: "F/C",
    fullName: "Forward-Center",
    category: "hybrid",
    description: "Combo forward/center"
  }
};

/**
 * Converts various API position formats to standardized basketball positions
 */
export function mapToBasketballPosition(apiPosition?: string): BasketballPosition {
  if (!apiPosition) return "G"; // Default to guard

  const normalized = apiPosition.toUpperCase().trim();

  // Direct matches
  if (normalized === "PG" || normalized === "POINT GUARD" || normalized === "POINT-GUARD") return "PG";
  if (normalized === "SG" || normalized === "SHOOTING GUARD" || normalized === "SHOOTING-GUARD") return "SG";
  if (normalized === "SF" || normalized === "SMALL FORWARD" || normalized === "SMALL-FORWARD") return "SF";
  if (normalized === "PF" || normalized === "POWER FORWARD" || normalized === "POWER-FORWARD") return "PF";
  if (normalized === "C" || normalized === "CENTER") return "C";
  
  // Generic positions
  if (normalized === "G" || normalized === "GUARD") return "G";
  if (normalized === "F" || normalized === "FORWARD") return "F";
  
  // Hybrid positions
  if (normalized === "G/F" || normalized === "GUARD/FORWARD" || normalized === "COMBO GUARD") return "G/F";
  if (normalized === "F/C" || normalized === "FORWARD/CENTER") return "F/C";

  // Keyword-based detection
  if (normalized.includes("POINT")) return "PG";
  if (normalized.includes("SHOOTING")) return "SG";
  if (normalized.includes("SMALL")) return "SF";
  if (normalized.includes("POWER")) return "PF";
  if (normalized.includes("CENTER")) return "C";
  
  if (normalized.includes("GUARD")) return "G";
  if (normalized.includes("FORWARD")) return "F";

  console.warn(`⚠️ [BasketballPosition] Unknown position: "${apiPosition}", defaulting to "G"`);
  return "G"; // Default fallback
}

/**
 * Get full position information
 */
export function getBasketballPositionInfo(position: string | BasketballPosition): BasketballPositionInfo {
  const mappedPosition = mapToBasketballPosition(position);
  return BASKETBALL_POSITIONS[mappedPosition];
}

/**
 * Get display text for position (short code)
 */
export function getBasketballPositionDisplay(position?: string): string {
  if (!position) return "G";
  const mapped = mapToBasketballPosition(position);
  return mapped;
}

/**
 * Get full position name
 */
export function getBasketballPositionFullName(position?: string): string {
  if (!position) return "Guard";
  const info = getBasketballPositionInfo(position);
  return info.fullName;
}

/**
 * Validate if a position is valid for basketball
 */
export function isValidBasketballPosition(position?: string): boolean {
  if (!position) return false;
  
  const normalized = position.toUpperCase().trim();
  const validPositions = ["PG", "SG", "SF", "PF", "C", "G", "F", "G/F", "F/C"];
  
  if (validPositions.includes(normalized)) return true;
  
  // Check if it contains basketball keywords
  const basketballKeywords = ["GUARD", "FORWARD", "CENTER", "POINT", "SHOOTING", "SMALL", "POWER"];
  return basketballKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Get position category color (for UI styling)
 */
export function getBasketballPositionColor(position?: string): string {
  if (!position) return "#4A90E2"; // Default blue for guards
  
  const info = getBasketballPositionInfo(position);
  
  switch (info.category) {
    case "guard":
      return "#4A90E2"; // Blue
    case "forward":
      return "#E67E22"; // Orange
    case "center":
      return "#9B59B6"; // Purple
    case "hybrid":
      return "#1ABC9C"; // Teal
    default:
      return "#4A90E2";
  }
}

console.log("🏀 [BasketballPositionMapper] Initialized - Ready to map basketball positions");
