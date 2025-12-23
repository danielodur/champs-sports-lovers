import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import {
  Heart,
  Share,
  Clock,
  ChevronLeft,
  Star,
  Play,
  Video,
  Tv,
  Flag,
  Monitor,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useFavorites } from "@/hooks/useFavorites";
import teamLogoService from "@/services/teamLogoService";
import leagueLogoService from "@/services/leagueLogoService";
import LeagueLogo from "../../../LeagueLogo";
import MatchViewers from "../../../match-viewers";
import type { Match } from "@/types/match";

const { width } = Dimensions.get("window");

interface MatchHeaderProps {
  match: Match | null;
  currentMinute: number;
  isBlinking: boolean;
  isFavorite: boolean;
  onBack: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  onVideoPress?: () => void;
  onAnimationPress?: () => void;
  possession?: { home: number; away: number };
  matchId?: string;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  match,
  currentMinute,
  isBlinking,
  isFavorite,
  onBack,
  onShare,
  onToggleFavorite,
  onVideoPress,
  onAnimationPress,
  possession = { home: 50, away: 50 },
  matchId,
}) => {
  const theme = useTheme();

  if (!match) return null;

  const formatMatchTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return timeString;
    }
  };

  const getMatchStatus = () => {
    if (match.status === "live") {
      return (
        <Text
          style={[
            styles.liveMinute,
            {
              color: "#FF6B6B",
              opacity: isBlinking ? 0.5 : 1,
            },
          ]}
        >
          {currentMinute}'
        </Text>
      );
    }
    return null;
  };

  const getScoreDisplay = () => {
    if (match.status === "upcoming") {
      return (
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: theme.colors.text }]}>vs</Text>
        </View>
      );
    }

    const scoreParts = match.score?.split("-") || ["0", "0"];
    const homeScore = scoreParts[0]?.trim() || "0";
    const awayScore = scoreParts[1]?.trim() || "0";

    return (
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, { color: theme.colors.text }]}>
          {homeScore}-{awayScore}
        </Text>
        {match.status === "finished" && match.halfTimeScore && (
          <Text
            style={[
              styles.halftimeScore,
              { color: theme.colors.textSecondary },
            ]}
          >
            HT: {match.halfTimeScore}
          </Text>
        )}
        {match.status === "live" && (
          <Text
            style={[
              styles.halftimeScore,
              { color: theme.colors.textSecondary },
            ]}
          >
            HT: 0-0
          </Text>
        )}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header with back button and match info */}
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>

        <View style={styles.matchInfo}>
          <View style={styles.leagueContainer}>
            <LeagueLogo
              leagueName={match.league || "League"}
              size={28}
              style={styles.leagueLogo}
            />
            <Text
              style={[styles.leagueName, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {match.league}
            </Text>
          </View>
          <Text
            style={[styles.matchTime, { color: theme.colors.textSecondary }]}
          >
            {formatMatchTime(match.time || "")} •{" "}
            {(match.time || "").split(" ")[1] || "20:00"}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {matchId && (
            <MatchViewers
              matchId={parseInt(matchId)}
              size="medium"
              style={styles.viewersInHeader}
            />
          )}
          <TouchableOpacity onPress={onShare} style={styles.actionButton}>
            <Share color={theme.colors.text} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleFavorite}
            style={styles.actionButton}
          >
            <Star
              color={isFavorite ? "#FF0000" : theme.colors.text}
              fill={isFavorite ? "#FF0000" : "none"}
              size={20}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Match Status */}
      <View style={styles.statusContainer}>{getMatchStatus()}</View>

      {/* Teams and Score */}
      <View style={styles.teamsContainer}>
        {/* Home Team */}
        <View style={styles.teamSection}>
          <View style={styles.teamLogoContainer}>
            {match.home.logo ? (
              <Image
                source={{ uri: match.home.logo }}
                style={styles.teamLogo}
              />
            ) : (
              <View style={[styles.teamLogo, styles.placeholderLogo]} />
            )}
          </View>
          <Text
            style={[styles.teamName, { color: "#FFFFFF" }]}
            numberOfLines={2}
          >
            {match.home.name}
          </Text>
          <View style={styles.cornerContainer}>
            <Flag color="#B0B0B0" size={12} />
            <Text style={[styles.cornerText, { color: "#B0B0B0" }]}>
              {match.home.corners || 0}
            </Text>
          </View>
        </View>

        {/* Score Section */}
        <View style={styles.centerSection}>{getScoreDisplay()}</View>

        {/* Away Team */}
        <View style={styles.teamSection}>
          <View style={styles.teamLogoContainer}>
            {match.away.logo ? (
              <Image
                source={{ uri: match.away.logo }}
                style={styles.teamLogo}
              />
            ) : (
              <View style={[styles.teamLogo, styles.placeholderLogo]} />
            )}
          </View>
          <Text
            style={[styles.teamName, { color: "#FFFFFF" }]}
            numberOfLines={2}
          >
            {match.away.name}
          </Text>
          <View style={styles.cornerContainer}>
            <Flag color="#B0B0B0" size={12} />
            <Text style={[styles.cornerText, { color: "#B0B0B0" }]}>
              {match.away.corners || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Video and Animation Buttons */}
      {match.status === "live" && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.videoButton,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
            onPress={onVideoPress}
          >
            <Video color={theme.colors.text} size={16} />
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              Video
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.videoButton,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
            onPress={onAnimationPress}
          >
            <Monitor color={theme.colors.text} size={16} />
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              Animation
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Possession Bar */}
      <View style={styles.possessionContainer}>
        <View style={styles.possessionBar}>
          <Text style={[styles.possessionText, { color: theme.colors.text }]}>
            👍 {possession.home}%
          </Text>
          <Text style={[styles.possessionText, { color: theme.colors.text }]}>
            {possession.away}% 👍
          </Text>
        </View>
        <View style={styles.possessionProgressContainer}>
          <View
            style={[
              styles.possessionProgress,
              {
                width: `${possession.home}%`,
                backgroundColor: "#FF6B6B",
              },
            ]}
          />
          <View
            style={[
              styles.possessionProgress,
              {
                width: `${possession.away}%`,
                backgroundColor: "#4A9EFF",
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 320,
    position: "relative",
    marginBottom: 0,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  matchInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  leagueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  leagueLogo: {
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leagueName: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: "90%",
  },
  matchTime: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  viewersInHeader: {
    marginRight: 4,
    alignSelf: "center",
  },
  actionButton: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  statusContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  liveMinute: {
    fontSize: 24,
    fontWeight: "bold",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
  },
  teamLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  teamLogo: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  placeholderLogo: {
    backgroundColor: "rgba(200, 200, 200, 0.3)",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  cornerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cornerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 20,
  },
  scoreContainer: {
    alignItems: "center",
  },
  score: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  halftimeScore: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  possessionContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  possessionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  possessionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  possessionProgressContainer: {
    flexDirection: "row",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  possessionProgress: {
    height: "100%",
  },
});
