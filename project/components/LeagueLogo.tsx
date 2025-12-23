import React, { useState } from "react";
import {
  Image,
  View,
  StyleSheet,
  ImageStyle,
} from "react-native";

interface LeagueLogoProps {
  leagueName: string;
  size?: number;
  style?: ImageStyle;
  apiLogoUrl?: string | null; // API-provided league logo URL (priority)
  leagueId?: number | null; // League ID to construct API logo URL if apiLogoUrl not provided
}

/**
 * 100% API-DRIVEN League Logo Component
 * NO hardcoded fallbacks, NO initials, NO default colors
 * If API doesn't provide a logo, nothing is displayed
 */
const LeagueLogo: React.FC<LeagueLogoProps> = ({
  leagueName,
  size = 32,
  style = {},
  apiLogoUrl,
  leagueId,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ 100% API-DRIVEN: Only use API-provided logos
  // Priority 1: Use API-provided logo URL if available
  // Priority 2: Construct API logo URL from league ID if available
  // Priority 3: No logo displayed (no fallback)
  let logoUrl = "";
  
  if (apiLogoUrl && apiLogoUrl.trim() !== "" && (apiLogoUrl.startsWith("http://") || apiLogoUrl.startsWith("https://"))) {
    logoUrl = apiLogoUrl;
  } else if (leagueId) {
    // Try constructing from league ID - API-Sports.io format
    logoUrl = `https://media.api-sports.io/football/leagues/${leagueId}.png`;
  }

  const handleImageError = () => {
    console.log(`No API logo available for: ${leagueName}`);
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  // ✅ If no API logo or error loading, show nothing (transparent placeholder)
  if (imageError || !logoUrl) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: "transparent",
          },
          style,
        ]}
      />
    );
  }

  return (
    <Image
      source={{ uri: logoUrl }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      resizeMode="contain"
      onError={handleImageError}
      onLoad={handleImageLoad}
      onLoadStart={() => setIsLoading(true)}
    />
  );
};

const styles = StyleSheet.create({
  // No fallback styles needed - 100% API-driven
});

export default LeagueLogo;
