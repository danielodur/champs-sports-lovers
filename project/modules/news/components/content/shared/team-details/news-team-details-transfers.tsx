import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";

interface TeamTransfer {
  player: string;
  playerPhoto?: string;
  fromTeam: string;
  fromTeamLogo?: string;
  toTeam: string;
  toTeamLogo?: string;
  date: string;
  type: string;
  fee?: string;
}

interface NewsTeamDetailsTransfersProps {
  transfers?: TeamTransfer[];
  theme: any;
  loading?: boolean;
  sport?: string; // ✅ Add sport parameter for consistency
}

export default function NewsTeamDetailsTransfers({
  transfers = [],
  theme,
  loading = false,
  sport = "football", // ✅ Default to football
}: NewsTeamDetailsTransfersProps) {
  if (loading) {
    return (
      <View style={[styles.tabContent, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary || "#FF6B35"} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading transfers...
        </Text>
      </View>
    );
  }

  if (transfers.length === 0) {
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
          No transfer data available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.tabContent, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={transfers}
        keyExtractor={(item, index) => `${item.player}-${index}`}
        renderItem={({ item }) => (
          <View
            style={[
              styles.transferCard,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
          >
            <View style={styles.transferHeader}>
              <Text style={[styles.playerName, { color: theme.colors.text }]}>
                {item.player}
              </Text>
              <Text style={[styles.transferType, { color: "#FF6B35" }]}>
                {item.type}
              </Text>
            </View>

            <View style={styles.transferRoute}>
              <View style={styles.teamSection}>
                <Text style={[styles.teamLabel, { color: theme.colors.textSecondary }]}>
                  From:
                </Text>
                <Text style={[styles.teamName, { color: theme.colors.text }]}>
                  {item.fromTeam || "Free Agent"}
                </Text>
              </View>

              <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>→</Text>

              <View style={styles.teamSection}>
                <Text style={[styles.teamLabel, { color: theme.colors.textSecondary }]}>
                  To:
                </Text>
                <Text style={[styles.teamName, { color: theme.colors.text }]}>
                  {item.toTeam || "Unknown"}
                </Text>
              </View>
            </View>

            <View style={styles.transferFooter}>
              <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                {item.date}
              </Text>
              {item.fee && (
                <Text style={[styles.fee, { color: "#4CAF50" }]}>
                  {item.fee}
                </Text>
              )}
            </View>
          </View>
        )}
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
  transferCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transferHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  transferType: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  transferRoute: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  teamSection: {
    flex: 1,
  },
  teamLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
  },
  arrow: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  transferFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
  },
  fee: {
    fontSize: 14,
    fontWeight: "600",
  },
});

