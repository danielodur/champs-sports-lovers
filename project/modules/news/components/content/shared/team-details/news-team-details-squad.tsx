import React from "react";
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from "react-native";

interface TeamPlayer {
  id: number;
  name: string;
  photo: string;
  position: string;
  number: number;
  age: number;
  nationality: string;
}

interface NewsTeamDetailsSquadProps {
  squad?: TeamPlayer[];
  theme: any;
  loading?: boolean;
  sport?: string; // ✅ Add sport parameter
}

export default function NewsTeamDetailsSquad({
  squad = [],
  theme,
  loading = false,
  sport = "football", // ✅ Default to football
}: NewsTeamDetailsSquadProps) {
  const isBasketball = sport === "basketball";
  if (loading) {
    return (
      <View style={[styles.tabContent, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary || "#FF6B35"} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading squad...
        </Text>
      </View>
    );
  }

  if (squad.length === 0) {
    return (
      <View
        style={[
          styles.tabContent,
          {
            backgroundColor: theme.colors.background,
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text
          style={[
            styles.comingSoonText,
            {
              color: theme.colors.textSecondary,
            },
          ]}
        >
          No squad data available
        </Text>
      </View>
    );
  }

  // Group players by position
  const groupedPlayers = squad.reduce((acc, player) => {
    const pos = player.position || "Other";
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(player);
    return acc;
  }, {} as Record<string, TeamPlayer[]>);

  // ✅ Position categories based on sport
  const positions = isBasketball 
    ? ["Guard", "Forward", "Center"] // Basketball positions
    : ["Goalkeeper", "Defender", "Midfielder", "Attacker"]; // Football positions
  
  return (
    <View style={[styles.tabContent, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={positions}
        keyExtractor={(item) => item}
        renderItem={({ item: position }) => {
          const players = groupedPlayers[position] || [];
          if (players.length === 0) return null;

          return (
            <View style={styles.positionGroup}>
              <Text style={[styles.positionTitle, { color: theme.colors.text }]}>
                {position}s ({players.length})
              </Text>
              {players.map((player) => (
                <View
                  key={player.id}
                  style={[
                    styles.playerCard,
                    { backgroundColor: theme.colors.backgroundSecondary },
                  ]}
                >
                  {player.photo ? (
                    <Image
                      source={{ uri: player.photo }}
                      style={styles.playerPhoto}
                    />
                  ) : (
                    <View style={[styles.playerPhoto, styles.placeholder]}>
                      <Text style={styles.placeholderText}>
                        {player.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.playerInfo}>
                    <View style={styles.playerHeader}>
                      <Text style={[styles.playerName, { color: theme.colors.text }]}>
                        {player.name}
                      </Text>
                      {player.number > 0 && (
                        <Text style={[styles.playerNumber, { color: theme.colors.primary }]}>
                          #{player.number}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.playerDetails, { color: theme.colors.textSecondary }]}>
                      {player.position} • {player.age} years
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
    flex: 1,
    minHeight: 400,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
    fontStyle: "italic",
  },
  positionGroup: {
    marginBottom: 24,
  },
  positionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  playerCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  playerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  placeholder: {
    backgroundColor: "#666",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  playerNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  playerDetails: {
    fontSize: 13,
  },
});

