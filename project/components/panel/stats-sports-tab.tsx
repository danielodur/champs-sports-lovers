import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Search } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";

interface Sport {
  id: string;
  label: string;
  iconName: string;
}

interface StatsSportsTabProps {
  activeSport: string;
  setActiveSport: (sportId: string) => void;
  sports: Sport[];
}

export default function StatsSportsTab({
  activeSport,
  setActiveSport,
  sports,
}: StatsSportsTabProps) {
  const theme = useTheme();
  const router = useRouter();

  // Map sport IDs to emojis (matching home screen)
  const getSportEmoji = (sportId: string) => {
    const emojiMap: { [key: string]: string } = {
      football: "⚽",
      basketball: "🏀",
    };
    return emojiMap[sportId] || "⚽";
  };

  return (
    <View style={styles.sportsBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        style={styles.sportsBarScroll}
        directionalLockEnabled={true}
        scrollEnabled={false}
        removeClippedSubviews={false}
        contentContainerStyle={styles.centeredScrollContent}
      >
        <View style={styles.sportsBar}>
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport.id}
              style={[styles.sportButton]}
              onPress={() => setActiveSport(sport.id)}
              activeOpacity={0.7}
            >
              <View style={styles.textContainer}>
                {activeSport === sport.id && (
                  <View style={styles.activeIndicator} />
                )}
                <Text
                  style={[
                    styles.sportText,
                    {
                      color:
                        activeSport === sport.id
                          ? theme.colors.background === "#FFFFFF"
                            ? "#000000"
                            : "#FFFFFF"
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {sport.label}
                </Text>
              </View>
              <Text style={styles.sportEmoji}>
                {getSportEmoji(sport.id)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => router.push("/stats/views/search")}
      >
        <Search size={20} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sportsBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  sportsBarScroll: {
    flex: 1,
  },
  centeredScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sportsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 20,
    position: "relative",
    minWidth: 100,
    justifyContent: "center",
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    left: -8,
    top: "50%",
    transform: [{ translateY: -8 }],
    width: 3,
    height: 16,
    backgroundColor: "#D32F2F",
    borderRadius: 1.5,
  },
  sportText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  sportEmoji: {
    fontSize: 16,
    marginLeft: 2,
  },
  searchButton: {
    padding: 10,
    marginLeft: 8,
  },
});
