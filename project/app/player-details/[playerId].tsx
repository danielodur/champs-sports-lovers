/**
 * Player Details Dynamic Route
 * Displays comprehensive player information
 */

import React from "react";
import { useLocalSearchParams } from "expo-router";
import { NewsPlayerDetails } from "@/modules/news/components/content/shared/player-details";

export default function PlayerDetailsScreen() {
  const params = useLocalSearchParams();
  const playerId = params.playerId as string;
  const sport = (params.sport as string) || "football"; // ✅ Get sport from params

  // TODO: When API is ready, fetch full player data using playerId
  // For now, the component will use mock data
  
  return <NewsPlayerDetails playerId={playerId} sport={sport} />; // ✅ Pass sport prop
}


