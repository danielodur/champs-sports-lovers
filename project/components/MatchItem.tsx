import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import {
  Star,
  Video,
  Play,
  Tv,
  Flag,
  Monitor,
  Users,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useLiveTimer } from "@/contexts/LiveTimerContext";
import goalDetectionService from "@/services/goalDetectionService";
import { playGoalSound } from "@/utils/SoundManager";
import { useMatchSettings } from "@/contexts/MatchSettingsContext";
import { leagueNormalizationService } from "@/services/leagueNormalizationService";
import { Fixture } from "@/types/football-fixtures-response";
import { formatTeamName } from "@/utils/formatTeamName";
import goalService, {
  GoalData,
} from "@/services/api-sports-football-goal-service";
import footballFavoritesService from "@/services/football-favorites-service";

interface MatchItemProps {
  fixture: Fixture;
  onToggleFavorite: (matchId: number) => void;
  onPress: (match: Fixture) => void;
}

export default function MatchItem({ fixture, onPress }: MatchItemProps) {
  const theme = useTheme();

  // Goal flash animation state
  const [homeTeamFlash, setHomeTeamFlash] = useState(false);
  const [awayTeamFlash, setAwayTeamFlash] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);

  const triggerGoalFlash = (team: "home" | "away") => {
    if (team === "home") {
      setHomeTeamFlash(true);
      setTimeout(() => {
        setHomeTeamFlash(false);
        setAwayTeamFlash(false);
        fixture.goalStatus = undefined;
      }, 30000);
    } else {
      setAwayTeamFlash(true);
      setTimeout(() => {
        setAwayTeamFlash(false);
        setHomeTeamFlash(false);
        fixture.goalStatus = undefined;
      }, 3000);
    }
  };

  const triggerCancelledGoalFlash = (team: "home" | "away") => {
    if (team === "home") {
      setHomeTeamFlash(true);
      setTimeout(() => {
        setHomeTeamFlash(false);
        setAwayTeamFlash(false);
        fixture.goalStatus = undefined;
      }, 3000);
    } else {
      setAwayTeamFlash(true);
      setTimeout(() => {
        setAwayTeamFlash(false);
        setHomeTeamFlash(false);
        fixture.goalStatus = undefined;
      }, 3000);
    }
  };

  useEffect(() => {
    const checkIfFavorite = async () => {
      const isFavorite = await footballFavoritesService.isFavorite(
        fixture.fixture.id
      );
      setIsFavorite(isFavorite);
    };
    checkIfFavorite();
  }, [fixture.fixture.id]);

  const handleToggleFavorite = async () => {
    if (isFavorite) {
      await footballFavoritesService.removeFavoriteMatch(fixture.fixture.id);
      setIsFavorite(false);
    } else {
      await footballFavoritesService.addFavoriteMatch(fixture);
    }
    setIsFavorite(!isFavorite);
  };

  useEffect(() => {
    const team = fixture.events?.[fixture.events.length - 1]?.team.id;
    if (
      fixture.goalStatus === "goal_scored" &&
      team === fixture.teams.home.id
    ) {
      triggerGoalFlash("home");
    } else if (
      fixture.goalStatus === "goal_cancelled" &&
      team === fixture.teams.home.id
    ) {
      triggerCancelledGoalFlash("home");
    } else if (
      fixture.goalStatus === "goal_scored" &&
      team === fixture.teams.away.id
    ) {
      triggerGoalFlash("away");
    } else if (
      fixture.goalStatus === "goal_cancelled" &&
      team === fixture.teams.away.id
    ) {
      triggerCancelledGoalFlash("away");
    }
  }, [fixture.goalStatus]);

  // Format time to am nd pm
  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatFollowers = (viewers: string) => {
    if (!viewers || parseInt(viewers) === 0) return "";
    const count = parseInt(viewers);
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getCardCount = (teamId: number | null, cardType: "yellow" | "red") => {
    if (!teamId) return null;
    const length = fixture.events?.filter(
      (event) =>
        event.detail === (cardType === "yellow" ? "Yellow Card" : "Red Card") &&
        event.team.id === teamId
    ).length;
    if (length === 0) return null;
    return length;
  };

  const getBroadcastButtonProps = () => {
    if (
      fixture.fixture.status?.short === "1H" ||
      fixture.fixture.status?.short === "HT" ||
      fixture.fixture.status?.short === "2H" ||
      fixture.fixture.status?.short === "ET" ||
      fixture.fixture.status?.short === "BT" ||
      fixture.fixture.status?.short === "P" ||
      fixture.fixture.status?.short === "PEN"
    ) {
      return {
        backgroundColor: theme.colors.primary,
        icon: Monitor,
        iconColor: theme.colors.text,
      };
    }
    return {
      backgroundColor: theme.colors.primary,
      icon: Monitor,
      iconColor: theme.colors.text,
    };
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor:
              homeTeamFlash || awayTeamFlash
                ? "#ffa8a8"
                : theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => onPress(fixture)}
        activeOpacity={0.85}
        delayPressIn={0}
        delayPressOut={0}
        delayLongPress={500}
        pressRetentionOffset={{ top: 20, left: 20, bottom: 20, right: 20 }}
      >
        <View style={styles.itemContainer}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <Image
              source={{ uri: fixture.league.logo || "" }}
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
            <Text style={[styles.leagueName, { color: theme.colors.text }]}>
              {`${fixture.league.country} ${fixture.league.name}` || ""}
            </Text>
          </View>
          <View style={styles.topSection}>
            <View style={styles.leftHeaderSection}>
              <Text style={[styles.time, { color: theme.colors.text }]}>
                {formatTime(fixture.fixture.date)}
              </Text>
            </View>
            <View style={styles.centerHeaderSection}>
              {fixture.fixture.status.short !== "NS" &&
                fixture.fixture.status.short !== "FT" &&
                fixture.fixture.status.short !== "HT" &&
                fixture.fixture.status.short !== "PEN" && (
                  <Text style={[styles.time, { color: theme.colors.primary }]}>
                    {`${fixture.fixture.status?.elapsed}${
                      fixture.fixture.status?.extra
                        ? "+" + fixture.fixture.status?.extra
                        : ""
                    }'`}
                  </Text>
                )}
              {fixture.fixture.status.short === "PEN" && (
                <Text style={[{ color: theme.colors.text, fontSize: 11 }]}>
                  {`PEN: [${fixture.score.penalty.home} - ${fixture.score.penalty.away}]`}
                </Text>
              )}
              {fixture.fixture.status.short === "HT" && (
                <Text style={[styles.time, { color: theme.colors.primary }]}>
                  HT
                </Text>
              )}

              {fixture.fixture.status.short === "FT" && (
                <Text style={[styles.time, { color: theme.colors.text }]}>
                  {fixture.fixture.status.short}
                </Text>
              )}
              {fixture.fixture.status.short === "AET" && (
                <Text style={[styles.time, { color: theme.colors.text }]}>
                  AET
                </Text>
              )}
            </View>
            <View style={styles.rightHeaderSection}>
              <Users size={12} color={theme.colors.text} />
              <Text
                style={[styles.followersCount, { color: theme.colors.text }]}
              >
                12
              </Text>
            </View>
          </View>
          <View style={styles.middleSection}>
            <View style={styles.homeTeamContent}>
              <TouchableOpacity onPress={handleToggleFavorite}>
                <Star
                  size={32}
                  color={isFavorite ? "#007BFF" : theme.colors.text}
                />
              </TouchableOpacity>
              <View style={styles.homeDetails}>
                {getCardCount(fixture.teams?.home?.id, "yellow") && (
                  <Text style={styles.yellowCard}>
                    {getCardCount(fixture.teams?.home?.id, "yellow")}
                  </Text>
                )}
                {getCardCount(fixture.teams?.home?.id, "red") && (
                  <Text style={styles.redCard}>
                    {getCardCount(fixture.teams?.home?.id, "red")}
                  </Text>
                )}
                <Text
                  style={[
                    styles.homeTeamName,
                    { color: homeTeamFlash ? "red" : theme.colors.text },
                  ]}
                >
                  {formatTeamName(fixture.teams.home.name || "")}
                </Text>
              </View>
            </View>
            <View style={styles.scoreContent}>
              {fixture.fixture.status.short !== "NS" && (
                <Text
                  style={[
                    // styles.scoreText,
                    {
                      color:
                        fixture.fixture.status.short === "FT" ||
                        fixture.fixture.status.short === "AET" ||
                        fixture.fixture.status.short === "PEN"
                          ? theme.colors.text
                          : theme.colors.primary,
                    },
                  ]}
                >
                  {`${fixture.goals.home} - ${fixture.goals.away}`}
                </Text>
              )}
              {fixture.fixture.status.short === "NS" && (
                <Text style={[styles.time, { color: theme.colors.text }]}>
                  VS
                </Text>
              )}
            </View>
            <View style={styles.awayTeamContent}>
              <View style={styles.awayDetails}>
                <Text
                  style={[
                    styles.awayTeamName,
                    { color: awayTeamFlash ? "red" : theme.colors.text },
                  ]}
                >
                  {formatTeamName(fixture.teams.away.name || "")}
                </Text>
                {getCardCount(fixture.teams?.away?.id, "yellow") && (
                  <Text style={styles.yellowCard}>
                    {getCardCount(fixture.teams?.away?.id, "yellow")}
                  </Text>
                )}
                {getCardCount(fixture.teams?.away?.id, "red") && (
                  <Text style={styles.redCard}>
                    {getCardCount(fixture.teams?.away?.id, "red")}
                  </Text>
                )}
              </View>
              {(fixture.fixture.status.short === "1H" ||
                fixture.fixture.status.short === "HT" ||
                fixture.fixture.status.short === "2H" ||
                fixture.fixture.status.short === "ET" ||
                fixture.fixture.status.short === "P" ||
                fixture.fixture.status.short === "BT") && (
                <TouchableOpacity
                  style={[
                    styles.broadcastButtonNew,
                    {
                      backgroundColor:
                        getBroadcastButtonProps().backgroundColor,
                    },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onPress(fixture);
                  }}
                  activeOpacity={0.8}
                  delayPressIn={0}
                  delayPressOut={0}
                  hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
                >
                  {React.createElement(getBroadcastButtonProps().icon, {
                    size: 14,
                    color: "white",
                  })}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.bottomSectionLeft}></View>
            <View style={styles.bottomSectionCenter}>
              {(fixture.fixture.status.short === "HT" ||
                fixture.fixture.status.short === "2H" ||
                fixture.fixture.status.short === "ET" ||
                fixture.fixture.status.short === "P" ||
                fixture.fixture.status.short === "BT" ||
                fixture.fixture.status.short === "AET" ||
                fixture.fixture.status.short === "PEN" ||
                fixture.fixture.status.short === "FT") && (
                <Text
                  style={[
                    {
                      color: theme.colors.text,
                      fontSize: 11,
                      fontFamily: "Inter-Medium",
                    },
                  ]}
                >
                  {`HT: [${fixture.score.halftime.home} - ${fixture.score.halftime.away}]`}
                </Text>
              )}
            </View>
            <View style={styles.bottomSectionRight}></View>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    elevation: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "gray",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  // leftHeaderSection: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   flex: 1,
  //   justifyContent: "space-between",
  // },
  leagueContainer: {
    width: 140, // ✅ FIXED: Increased width to prevent truncation of league names
    marginRight: -12,
  },
  league: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
  },
  timeContainer: {
    width: 45,
    marginLeft: 8,
    alignItems: "flex-start",
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    marginBottom: 2,
  },
  headerFollowersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 2,
  },
  headerFollowersCount: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    lineHeight: 14,
  },
  matchContentNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  leftSectionNew: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2.4,
    paddingRight: 6,
  },
  favoriteButtonNew: {
    padding: 1,
    marginRight: 2,
    marginLeft: -2,
  },
  homeTeamSectionNew: {
    width: 115,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingLeft: 0,
    paddingRight: 4,
    minHeight: 50,
    position: "relative",
  },
  centerSectionNew: {
    flex: 1.0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginLeft: 0,
    marginRight: 0,
  },
  scoreStackNew: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusTextNew: {
    fontSize: 11,
    fontFamily: "Inter-Bold",
    marginBottom: 2,
    textAlign: "center",
  },
  rightSectionNew: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2.4,
    justifyContent: "flex-end",
    paddingLeft: 6,
    position: "relative",
    minWidth: 45,
  },
  awayTeamSectionNew: {
    position: "absolute",
    right: 30,
    width: 115,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    minHeight: 50,
    paddingRight: 4,
  },
  teamNameNew: {
    fontSize: 13,
    fontFamily: "Inter-SemiBold",
    lineHeight: 18,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: "top",
  },
  cornersContainerNew: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 0,
    height: 16,
  },
  cornersNew: {
    fontSize: 9,
    fontFamily: "Inter-Medium",
    marginLeft: 3,
  },
  scoreTextNew: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginVertical: 1,
    textAlign: "center",
  },
  halfTimeTextNew: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    marginTop: 5,
    textAlign: "center",
  },
  broadcastButtonNew: {
    width: 28,
    height: 28,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  homeTeamNameWithRankingContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
    justifyContent: "flex-end",
  },
  awayTeamNameWithRankingContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
    justifyContent: "flex-start",
  },
  homeTeamRanking: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    marginRight: 2,
    marginLeft: 0,
    includeFontPadding: false,
    lineHeight: 16,
    color: "#888888",
  },
  awayTeamRanking: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    marginLeft: 2,
    marginRight: 0,
    includeFontPadding: false,
    lineHeight: 16,
    color: "#888888",
  },
  extraTimeBanner: {
    marginTop: 8,
    marginHorizontal: -12,
    marginBottom: -14,
    paddingVertical: 8,
    paddingHorizontal: 15,
    paddingBottom: 14,
    backgroundColor: "rgba(139, 69, 19, 0.25)",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(139, 69, 19, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  extraTimeText: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    color: "#8B4513",
    textAlign: "center",
    lineHeight: 14,
  },
  vsText: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  nextText: {
    fontSize: 11,
    fontFamily: "Inter-Bold",
    textAlign: "center",
    flexShrink: 0,
    includeFontPadding: false,
    writingDirection: "ltr",
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 6,
    paddingLeft: 6,
    paddingTop: 6,
    paddingBottom: 6,
  },
  homeTeam: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  awayTeam: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchEvents: {
    alignItems: "flex-start",
    gap: 6,
  },
  homeMatchEvent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  awayMatchEvent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teams: {
    gap: 6,
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "gray",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 6,
  },
  scores: {
    alignItems: "center",
    gap: 6,
  },
  homeScore: {
    fontSize: 18,
  },
  awayScore: {
    fontSize: 18,
  },
  yellowCard: {
    fontSize: 8,
    fontFamily: "Inter-Medium",
    backgroundColor: "gold",
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 2,
    color: "black",
  },
  redCard: {
    fontSize: 8,
    backgroundColor: "red",
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 2,
    color: "white",
  },
  teamLogo: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  itemContainer: {
    marginHorizontal: 0,
    borderRadius: 0,
    padding: 4,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  leftHeaderSection: {
    flex: 1,
  },
  centerHeaderSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightHeaderSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "flex-end",
  },
  leagueName: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
  },
  matchTime: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "red",
  },
  followersCount: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  middleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  homeTeamContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  awayTeamContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  homeDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  awayDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  homeTeamName: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  awayTeamName: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  scoreContent: {
    marginHorizontal: 12,
  },
  bottomSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  bottomSectionLeft: {
    alignItems: "center",
  },
  bottomSectionCenter: {
    justifyContent: "center",
  },
  bottomSectionRight: {
    justifyContent: "flex-end",
  },
});
