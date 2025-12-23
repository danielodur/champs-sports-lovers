import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { MapPin, Users, Clock, Star, Calendar } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface LineupPlayer {
  id: string;
  name: string;
  position: string;
  number: number;
  photo: string;
  rating?: number;
}

interface Formation {
  formation: string;
  players: LineupPlayer[];
}

interface MatchDetailsPlanProps {
  homeTeamName?: string;
  awayTeamName?: string;
  homeFormation?: Formation;
  awayFormation?: Formation;
  matchId?: string;
}

export default function MatchDetailsPlan({
  homeTeamName = "Home",
  awayTeamName = "Away",
  homeFormation,
  awayFormation,
  matchId,
}: MatchDetailsPlanProps) {
  const theme = useTheme();

  // Generate default formation data
  const generateFormation = (teamName: string): Formation => ({
    formation: "4-3-3",
    players: [
      {
        id: "1",
        name: "Goalkeeper",
        position: "GK",
        number: 1,
        photo:
          "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
        rating: 7.2,
      },
      {
        id: "2",
        name: "Right Back",
        position: "RB",
        number: 2,
        photo:
          "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
        rating: 6.8,
      },
      {
        id: "3",
        name: "Center Back",
        position: "CB",
        number: 5,
        photo:
          "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        rating: 7.5,
      },
      {
        id: "4",
        name: "Center Back",
        position: "CB",
        number: 4,
        photo:
          "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
        rating: 7.1,
      },
      {
        id: "5",
        name: "Left Back",
        position: "LB",
        number: 3,
        photo:
          "https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg",
        rating: 6.9,
      },
      {
        id: "6",
        name: "Midfielder",
        position: "CM",
        number: 6,
        photo:
          "https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg",
        rating: 7.3,
      },
      {
        id: "7",
        name: "Midfielder",
        position: "CM",
        number: 8,
        photo:
          "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg",
        rating: 7.7,
      },
      {
        id: "8",
        name: "Midfielder",
        position: "CM",
        number: 10,
        photo:
          "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg",
        rating: 8.1,
      },
      {
        id: "9",
        name: "Right Winger",
        position: "RW",
        number: 7,
        photo:
          "https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg",
        rating: 7.4,
      },
      {
        id: "10",
        name: "Striker",
        position: "ST",
        number: 9,
        photo:
          "https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg",
        rating: 7.9,
      },
      {
        id: "11",
        name: "Left Winger",
        position: "LW",
        number: 11,
        photo:
          "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg",
        rating: 7.6,
      },
    ],
  });

  const homeLineup = homeFormation || generateFormation(homeTeamName);
  const awayLineup = awayFormation || generateFormation(awayTeamName);

  const renderPlayer = (player: LineupPlayer, isHome: boolean) => (
    <View
      key={player.id}
      style={[
        styles.playerContainer,
        {
          backgroundColor: isHome
            ? `${theme.colors.primary}20`
            : `${"#2196F3"}20`,
        },
      ]}
    >
      <Image source={{ uri: player.photo }} style={styles.playerPhoto} />
      <View style={styles.playerInfo}>
        <Text
          style={[styles.playerName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {player.name}
        </Text>
        <View style={styles.playerDetails}>
          <Text
            style={[styles.playerNumber, { color: theme.colors.textSecondary }]}
          >
            #{player.number}
          </Text>
          <Text
            style={[
              styles.playerPosition,
              { color: theme.colors.textSecondary },
            ]}
          >
            {player.position}
          </Text>
        </View>
        {player.rating && (
          <View
            style={[
              styles.ratingBadge,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Star size={12} color="#FFFFFF" />
            <Text style={styles.ratingText}>{player.rating}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderFormation = (
    formation: Formation,
    teamName: string,
    isHome: boolean,
  ) => (
    <View style={styles.formationContainer}>
      <View style={styles.formationHeader}>
        <Text style={[styles.teamName, { color: "#FFFFFF" }]}>{teamName}</Text>
        <View style={styles.formationBadge}>
          <Users size={16} color={theme.colors.primary} />
          <Text style={[styles.formationText, { color: theme.colors.primary }]}>
            {formation.formation}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {formation.players.map((player) => renderPlayer(player, isHome))}
      </ScrollView>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Team Lineups & Formations
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Starting XI and tactical setup
        </Text>
      </View>

      {/* Match Info */}
      <View style={styles.matchInfo}>
        <View style={styles.infoItem}>
          <MapPin size={16} color={theme.colors.primary} />
          <Text
            style={[styles.infoText, { color: theme.colors.textSecondary }]}
          >
            Stadium Name
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Clock size={16} color={theme.colors.primary} />
          <Text
            style={[styles.infoText, { color: theme.colors.textSecondary }]}
          >
            20:00 Kickoff
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Calendar size={16} color={theme.colors.primary} />
          <Text
            style={[styles.infoText, { color: theme.colors.textSecondary }]}
          >
            Today
          </Text>
        </View>
      </View>

      {/* Formations */}
      <View style={styles.formationsContainer}>
        {renderFormation(homeLineup, homeTeamName, true)}
        <View style={styles.divider} />
        {renderFormation(awayLineup, awayTeamName, false)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  matchInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  formationsContainer: {
    flex: 1,
    flexDirection: "row",
  },
  formationContainer: {
    flex: 1,
    padding: 16,
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  formationHeader: {
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  teamName: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  formationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  formationText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  playerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  playerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  playerDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playerNumber: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  playerPosition: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Inter-Bold",
  },
});
