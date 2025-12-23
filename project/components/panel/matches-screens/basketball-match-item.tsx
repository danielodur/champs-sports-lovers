import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Star } from "lucide-react-native"; // ✅ Use same star icon as football screens
import { Ionicons } from "@expo/vector-icons"; // For other icons (people, play-circle, chevron)
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useMatchSettings } from "@/contexts/MatchSettingsContext";
import goalDetectionService from "@/services/goalDetectionService";
import { playGoalSound } from "@/utils/SoundManager";

interface BasketballMatchItemProps {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    // Team logos NOT included - only used in Top matches screen
    status: "live" | "finished" | "upcoming";
    statusText: string; // "Q1", "Q2", "Q3", "Q4", "HT", "FT", "NS"
    matchTime?: string; // Time for live matches (e.g., "08:45")
    elapsed?: number | null; // ✅ Raw elapsed time value from API
    startTime?: string; // Display time in device's local timezone (e.g., "15:30")
    fullStartTime?: string; // ✅ CRITICAL: Full ISO timestamp for navigation
    leagueName?: string;
    leagueLogo?: string;
    isFavorite?: boolean;
    hasVideo?: boolean;
    viewers?: string;
    quarters?: {
      // Quarter-by-quarter scores
      home: (number | null)[];
      away: (number | null)[];
    };
    // ✅ Add missing navigation params
    homeLogo?: string;
    awayLogo?: string;
  };
  onToggleFavorite?: () => void;
  sport: string;
}

export default function BasketballMatchItem({
  match,
  onToggleFavorite,
  sport,
}: BasketballMatchItemProps) {
  const router = useRouter();
  const theme = useTheme(); // ✅ Use app theme instead of hardcoded colors
  
  // ✅ GOAL FLASH STATE: Add state for team background flash animation
  const [homeTeamFlash, setHomeTeamFlash] = useState(false);
  const [awayTeamFlash, setAwayTeamFlash] = useState(false);
  const { settings } = useMatchSettings();

  // ✅ GOAL FLASH ANIMATION: Trigger flash when team scores points
  // ✅ SYNCHRONIZED: Flash duration matches banner display (6 seconds)
  const GOAL_FLASH_DURATION = 6000; // Match banner auto-dismiss duration
  
  const triggerGoalFlash = useCallback(
    (team: "home" | "away") => {
      console.log(`🏀 BASKETBALL: Triggering point flash for ${team} team`);
      if (team === "home") {
        setHomeTeamFlash(true);
        setTimeout(() => setHomeTeamFlash(false), GOAL_FLASH_DURATION);
      } else {
        setAwayTeamFlash(true);
        setTimeout(() => setAwayTeamFlash(false), GOAL_FLASH_DURATION);
      }

      // Play sound if enabled
      if (settings?.soundNotification) {
        try {
          playGoalSound(team, settings);
        } catch (error) {
          console.error("Error playing goal sound:", error);
        }
      }
    },
    [settings],
  );

  // ✅ GOAL DETECTION EFFECT: Subscribe to goal notifications
  useEffect(() => {
    if (!match.id) return;

    const handleGoalDetected = (data: any) => {
      console.log('🏀 BASKETBALL: Point scored callback triggered:', {
        notificationMatchId: data.matchId,
        currentMatchId: match.id,
        scoringTeam: data.scoringTeam,
        eventType: data.eventType,
        sport: data.sport,
      });
      
      // ✅ CRITICAL FIX: Match by matchId string comparison
      if (data.matchId === match.id.toString()) {
        console.log('✅ BASKETBALL: Match ID matches! Triggering flash for:', data.scoringTeam);
        
        // ✅ ENHANCED: Only flash for regular points, not cancelled or other events
        if (data.eventType === 'goal') {
          triggerGoalFlash(data.scoringTeam);
        }
      } else {
        console.log('❌ BASKETBALL: Match ID does not match');
      }
    };

    const unsubscribe = goalDetectionService.subscribe(handleGoalDetected);
    return unsubscribe;
  }, [
    match.id,
    triggerGoalFlash,
  ]);

  // ✅ FIXED: Navigate to match-details with proper basketball params
  const handlePress = () => {
    router.push({
      pathname: "/match-details",
      params: {
        matchId: match.id,
        sport: sport || "basketball", // ✅ Pass sport parameter
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore?.toString() || "0",
        awayScore: match.awayScore?.toString() || "0",
        status: match.statusText || "NS",
        elapsed: match.elapsed?.toString() || "0", // ✅ CRITICAL: Pass RAW elapsed value, NOT matchTime!
        startTime: match.fullStartTime || new Date().toISOString(), // ✅ CRITICAL: Use full ISO timestamp
        league: match.leagueName || "Basketball League",
        homeLogo: match.homeLogo || "",
        awayLogo: match.awayLogo || "",
        homeCorners: "0", // Basketball doesn't have corners
        awayCorners: "0",
        halftimeScore: "0-0",
        from: "basketball-matches",
      },
    });
  };

  // Calculate point difference
  const pointDifference =
    match.homeScore !== null && match.awayScore !== null
      ? Math.abs(match.homeScore - match.awayScore)
      : null;

  // Calculate total combined score
  const totalScore =
    match.homeScore !== null && match.awayScore !== null
      ? match.homeScore + match.awayScore
      : null;

  // Get quarter display text for live matches
  const getQuarterText = (statusText: string): string => {
    const quarterMap: { [key: string]: string } = {
      Q1: "1st Quarter",
      Q2: "2nd Quarter",
      Q3: "3rd Quarter",
      Q4: "4th Quarter",
      OT: "Overtime",
      HT: "Halftime",
    };
    return quarterMap[statusText] || statusText;
  };

  // Render inline quarter scores next to team name
  const renderInlineQuarterScores = (scores: (number | null)[]) => {
    if (!scores || scores.every((q) => q === null)) return null;

    return (
      <View style={styles.inlineQuarterScores}>
        {scores.map((score, index) => (
          <Text key={`q${index}`} style={styles.inlineQuarterScore}>
            {score ?? "-"}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[
        styles.matchCard, 
        {
          backgroundColor:
            homeTeamFlash || awayTeamFlash
              ? "#ffa8a8"
              : theme.colors.background,
        },
      ]} 
      onPress={handlePress}
    >
      {/* Header: Time, Status, Viewers */}
      <View style={styles.matchHeader}>
        {/* ✅ ALWAYS show actual match start time in device's local timezone (24-hour format like "15:30", "18:45") */}
        <Text style={[styles.matchTimeText, { color: theme.colors.textSecondary }]}>
          {match.startTime || ""}
        </Text>

        {/* Live Quarter Display */}
        {match.status === "live" && (
          <View style={styles.liveStatusContainer}>
            <View style={styles.liveDot} />
            <Text style={styles.liveQuarterText}>
              {getQuarterText(match.statusText)}
            </Text>
          </View>
        )}

        {/* Finished Status */}
        {match.status === "finished" && (
          <Text style={[styles.finishedText, { color: theme.colors.textSecondary }]}>
            {match.statusText}
          </Text>
        )}

        {/* Upcoming Status */}
        {match.status === "upcoming" && (
          <Text style={[styles.upcomingText, { color: theme.colors.textSecondary }]}>
            {match.statusText}
          </Text>
        )}

        {/* Viewers */}
        {match.viewers && (
          <View style={styles.viewersContainer}>
            <Ionicons name="people" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.viewersText, { color: theme.colors.textSecondary }]}>
              {match.viewers}
            </Text>
          </View>
        )}
      </View>

      {/* Main Match Content */}
      <View style={styles.matchContent}>
        {/* Favorite Button */}
        <TouchableOpacity
          onPress={onToggleFavorite}
          style={styles.favoriteButton}
        >
          <Star
            size={24}
            color={match.isFavorite ? "#FF4444" : theme.colors.textSecondary}
            fill={match.isFavorite ? "#FF4444" : "none"}
          />
        </TouchableOpacity>

        {/* Teams - Vertical Layout */}
        <View style={styles.teamsContainerVertical}>
          {/* Home Team Row */}
          <View style={styles.teamRowVertical}>
            {/* No team logos in regular match screens */}
            {homeTeamFlash && settings?.goalAnimation ? (
              <View style={styles.teamNameWrapper}>
                <Text style={[styles.teamName, styles.teamNameScored]} numberOfLines={1}>
                  {match.homeTeam}
                </Text>
              </View>
            ) : (
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {match.homeTeam}
              </Text>
            )}
            {/* Home Quarter Scores */}
            {match.status !== "upcoming" &&
              match.quarters &&
              renderInlineQuarterScores(match.quarters.home)}
            {/* Home Score */}
            {match.status !== "upcoming" ? (
              <Text
                style={[
                  styles.scoreTextVertical,
                  { color: theme.colors.text },
                  match.homeScore !== null &&
                    match.awayScore !== null &&
                    match.homeScore > match.awayScore &&
                    styles.winningScore,
                ]}
              >
                {match.homeScore ?? 0}
              </Text>
            ) : null}
          </View>

          {/* Away Team Row */}
          <View style={styles.teamRowVertical}>
            {/* No team logos in regular match screens */}
            {awayTeamFlash && settings?.goalAnimation ? (
              <View style={styles.teamNameWrapper}>
                <Text style={[styles.teamName, styles.teamNameScored]} numberOfLines={1}>
                  {match.awayTeam}
                </Text>
              </View>
            ) : (
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {match.awayTeam}
              </Text>
            )}
            {/* Away Quarter Scores */}
            {match.status !== "upcoming" &&
              match.quarters &&
              renderInlineQuarterScores(match.quarters.away)}
            {/* Away Score */}
            {match.status !== "upcoming" ? (
              <Text
                style={[
                  styles.scoreTextVertical,
                  { color: theme.colors.text },
                  match.homeScore !== null &&
                    match.awayScore !== null &&
                    match.awayScore > match.homeScore &&
                    styles.winningScore,
                ]}
              >
                {match.awayScore ?? 0}
              </Text>
            ) : null}
          </View>

          {/* VS for upcoming matches */}
          {match.status === "upcoming" && (
            <View style={styles.vsContainer}>
              <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>
                VS
              </Text>
            </View>
          )}
        </View>

        {/* Video/Arrow Icon */}
        <View style={styles.arrowContainer}>
          {match.hasVideo && match.status === "live" ? (
            <View style={styles.videoIconContainer}>
              <Ionicons name="play-circle" size={24} color="#FF4444" />
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          )}
        </View>
      </View>

      {/* Bottom Stats: Point Difference & Total Score */}
      {match.status !== "upcoming" && pointDifference !== null && (
        <View style={[
          styles.statsContainer,
          { borderTopColor: theme.colors.border }
        ]}>
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            Diff: {pointDifference}
          </Text>
          {totalScore !== null && (
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              Total: {totalScore}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  matchCard: {
    // backgroundColor removed - now set dynamically via theme
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  matchTimeText: {
    // color removed - now set dynamically via theme
    fontSize: 12,
  },
  liveStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    // ✅ REMOVED: Red background - show live indicator without background
    paddingHorizontal: 0, // ✅ No padding needed without background
    paddingVertical: 0,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4444", // ✅ CHANGED: Red dot instead of white
  },
  liveQuarterText: {
    color: "#FF4444", // ✅ CHANGED: Red text instead of white
    fontSize: 11,
    fontWeight: "600",
  },
  finishedText: {
    // color removed - now set dynamically via theme
    fontSize: 12,
    fontWeight: "600",
  },
  upcomingText: {
    // color removed - now set dynamically via theme
    fontSize: 12,
  },
  viewersContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 4,
  },
  viewersText: {
    // color removed - now set dynamically via theme
    fontSize: 12,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  favoriteButton: {
    padding: 4,
    alignSelf: "center", // ✅ Center vertically between the two teams
    marginRight: 8,
  },
  teamsContainerVertical: {
    flex: 1,
    gap: 8,
  },
  teamRowVertical: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 32,
  },
  teamName: {
    // color removed - now set dynamically via theme
    fontSize: 14,
    flex: 1,
  },
  teamNameWrapper: {
    // Wrapper to contain the red background - maintains flex layout for basketball
    flex: 1,
    alignSelf: 'flex-start',
  },
  teamNameScored: {
    backgroundColor: '#EF5350',
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 0, // No horizontal padding - background fits text exactly
    paddingVertical: 2, // Keep vertical padding for readability
    borderRadius: 2,
    overflow: 'hidden',
    // Ensure text doesn't add extra font padding
    includeFontPadding: false,
    textAlignVertical: 'center',
    flex: 1,
    // Text should align naturally within wrapper
    alignSelf: 'flex-start',
  },
  inlineQuarterScores: {
    flexDirection: "row",
    gap: 6,
    marginRight: 12,
  },
  inlineQuarterScore: {
    color: "#999", // Keep this slightly muted for quarter scores
    fontSize: 13,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
  },
  scoreTextVertical: {
    // color removed - now set dynamically via theme
    fontSize: 20,
    fontWeight: "bold",
    minWidth: 40,
    textAlign: "right",
  },
  winningScore: {
    color: "#FF4444",
  },
  vsContainer: {
    position: "absolute",
    right: 40,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  vsText: {
    // color removed - now set dynamically via theme
    fontSize: 16,
    fontWeight: "600",
  },
  arrowContainer: {
    padding: 4,
    alignSelf: "center",
  },
  videoIconContainer: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    // borderTopColor removed - now set dynamically via theme
  },
  statText: {
    // color removed - now set dynamically via theme
    fontSize: 12,
  },
});

