import React from "react";
import { View, StyleSheet } from "react-native";
import MatchKeyEvents from "../../../../../app/match-key-events";

// Key events wrapper component

interface KeyEvent {
  id: string;
  minute: number;
  team: "home" | "away";
  type:
    | "commentary"
    | "action"
    | "info"
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "corner"
    | "penalty";
  player?: string;
  description: string;
  icon?: string;
  detail?: string;
  timestamp: Date;
  isImportant?: boolean;
}

interface KeyEventsProps {
  events: KeyEvent[];
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  currentMinute?: number;
  matchId?: string;
  isLive?: boolean;
  homeScore?: number;
  awayScore?: number;
  halfTimeHomeScore?: number;
  halfTimeAwayScore?: number;
  matchStats?: {
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    shotsOnTarget: { home: number; away: number };
    corners: { home: number; away: number };
  };
}

export default function KeyEvents({
  events,
  homeTeamName = "Home",
  awayTeamName = "Away",
  homeTeamLogo,
  awayTeamLogo,
  currentMinute = 0,
  matchId,
  isLive = false,
  homeScore = 0,
  awayScore = 0,
  halfTimeHomeScore,
  halfTimeAwayScore,
  matchStats,
}: KeyEventsProps) {
  return (
    <View style={styles.container}>
      <MatchKeyEvents
        events={events}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        currentMinute={currentMinute}
        matchId={matchId}
        isLive={isLive}
        homeScore={homeScore}
        awayScore={awayScore}
        halfTimeHomeScore={halfTimeHomeScore}
        halfTimeAwayScore={halfTimeAwayScore}
        matchStats={matchStats}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
