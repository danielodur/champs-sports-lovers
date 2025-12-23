import React from "react";
import {
  AllMatches,
  LiveMatches,
  FixturesMatches,
  FollowedMatches,
  FinishedMatches,
} from "./panel";
import { Match } from "@/types/match";

// ===== INTERFACES =====
interface MatchListProps {
  sport: string;
  filter: string;
  sortMode?: string;
  displayMode?: string;
  selectedDate?: string;
  onFavoritesChange?: () => void;
  onMatchCountChange?: (count: number) => void;
  hideSortIndicator?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: () => React.ReactElement;
  onMatchesLoaded?: (matches: Match[]) => void;
}

// ===== MAIN MATCH LIST COMPONENT =====
export default function MatchList({
  sport,
  filter,
  sortMode = "time",
  displayMode = "score",
  selectedDate,
  onFavoritesChange,
  onMatchCountChange,
  hideSortIndicator = false,
  refreshing = false,
  onRefresh,
  headerComponent,
  onMatchesLoaded,
}: MatchListProps) {
  // ===== RENDER LOGIC BASED ON FILTER (SPORT-AGNOSTIC) =====
  // All match panels now accept sport prop and adapt accordingly
  switch (filter) {
    case "live":
      return (
        <LiveMatches
          sport={sport}
          onFavoritesChange={onFavoritesChange}
          onMatchCountChange={onMatchCountChange}
          refreshing={refreshing}
          onRefresh={onRefresh}
          headerComponent={headerComponent}
          onMatchesLoaded={onMatchesLoaded}
        />
      );

    case "follows":
      return (
        <FollowedMatches
          sport={sport}
          onFavoritesChange={onFavoritesChange}
          onMatchCountChange={onMatchCountChange}
          refreshing={refreshing}
          onRefresh={onRefresh}
          headerComponent={headerComponent}
          onMatchesLoaded={onMatchesLoaded}
        />
      );

    case "fixture":
      return (
        <FixturesMatches
          sport={sport}
          selectedDate={selectedDate}
          onFavoritesChange={onFavoritesChange}
          onMatchCountChange={onMatchCountChange}
          refreshing={refreshing}
          onRefresh={onRefresh}
          headerComponent={headerComponent}
          onMatchesLoaded={onMatchesLoaded}
        />
      );

    case "finished":
      return (
        <FinishedMatches
          sport={sport}
          selectedDate={selectedDate}
          onFavoritesChange={onFavoritesChange}
          onMatchCountChange={onMatchCountChange}
          refreshing={refreshing}
          onRefresh={onRefresh}
          headerComponent={headerComponent}
          onMatchesLoaded={onMatchesLoaded}
        />
      );

    default:
      // Default to all matches
      return (
        <AllMatches
          sport={sport}
          selectedDate={selectedDate}
          onFavoritesChange={onFavoritesChange}
          onMatchCountChange={onMatchCountChange}
          refreshing={refreshing}
          onRefresh={onRefresh}
          headerComponent={headerComponent}
          onMatchesLoaded={onMatchesLoaded}
        />
      );
  }
}
