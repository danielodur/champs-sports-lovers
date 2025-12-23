import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { TrendingUp, TrendingDown } from "lucide-react-native";

interface BettingOdds {
  handicap: Array<{
    bookmaker: string;
    handicap: string;
    homeOdd: string;
    awayOdd: string;
    trend: "up" | "down";
    isBlocked: boolean;
  }>;
  winDrawLoss: Array<{
    bookmaker: string;
    homeWin: string;
    draw: string;
    awayWin: string;
    trend: "up" | "down";
    isBlocked: boolean;
  }>;
  totalGoals: Array<{
    bookmaker: string;
    line: string;
    overOdd: string;
    underOdd: string;
    trend: "up" | "down";
    isBlocked: boolean;
  }>;
  corners: Array<{
    bookmaker: string;
    line: string;
    overOdd: string;
    underOdd: string;
    trend: "up" | "down";
    isBlocked: boolean;
  }>;
}

interface BettingLogicProps {
  bettingOdds: BettingOdds | null;
  activeBettingCategory: string;
  onCategoryChange: (category: string) => void;
}

export const BettingLogic: React.FC<BettingLogicProps> = ({
  bettingOdds,
  activeBettingCategory,
  onCategoryChange,
}) => {
  const theme = useTheme();

  const renderBettingCategories = () => {
    const categories = [
      { id: "handicap", label: "Handicap" },
      { id: "winDrawLoss", label: "1X2" },
      { id: "totalGoals", label: "Total Goals" },
      { id: "corners", label: "Corners" },
    ];

    return (
      <View style={styles.bettingCategoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bettingCategoriesScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.bettingCategoryButton,
                {
                  backgroundColor:
                    activeBettingCategory === category.id
                      ? theme.colors.primary
                      : "transparent",
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => onCategoryChange(category.id)}
            >
              <Text
                style={[
                  styles.bettingCategoryText,
                  {
                    color:
                      activeBettingCategory === category.id
                        ? "#FFF"
                        : theme.colors.text,
                  },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTrendIcon = (trend: "up" | "down") => {
    return trend === "up" ? (
      <TrendingUp color="#4CAF50" size={12} />
    ) : (
      <TrendingDown color="#F44336" size={12} />
    );
  };

  const renderHandicapTable = () => {
    if (!bettingOdds?.handicap) return null;

    return (
      <View style={styles.bettingTableContainer}>
        <View style={styles.bettingTableHeader}>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Bookmaker
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Handicap
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Home
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Away
          </Text>
        </View>

        {bettingOdds.handicap.slice(0, 8).map((odd, index) => (
          <View
            key={index}
            style={[
              styles.bettingTableRow,
              {
                backgroundColor:
                  index % 2 === 0
                    ? theme.colors.backgroundSecondary + "20"
                    : "transparent",
              },
            ]}
          >
            <View style={styles.bookmakerCell}>
              <Text
                style={[styles.bookmakerText, { color: theme.colors.text }]}
              >
                {odd.bookmaker}
              </Text>
              {renderTrendIcon(odd.trend)}
            </View>

            <Text
              style={[
                styles.handicapText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {odd.handicap}
            </Text>

            <TouchableOpacity
              style={[
                styles.oddButton,
                {
                  backgroundColor: odd.isBlocked
                    ? "#666"
                    : theme.colors.primary,
                },
              ]}
              disabled={odd.isBlocked}
            >
              <Text style={styles.oddButtonText}>
                {odd.isBlocked ? "—" : odd.homeOdd}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.oddButton,
                {
                  backgroundColor: odd.isBlocked
                    ? "#666"
                    : theme.colors.primary,
                },
              ]}
              disabled={odd.isBlocked}
            >
              <Text style={styles.oddButtonText}>
                {odd.isBlocked ? "—" : odd.awayOdd}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderWinDrawLossTable = () => {
    if (!bettingOdds?.winDrawLoss) return null;

    return (
      <View style={styles.bettingTableContainer}>
        <View style={styles.bettingTableHeader}>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Bookmaker
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            1
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            X
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            2
          </Text>
        </View>

        {bettingOdds.winDrawLoss.slice(0, 8).map((odd, index) => (
          <View
            key={index}
            style={[
              styles.bettingTableRow,
              {
                backgroundColor:
                  index % 2 === 0
                    ? theme.colors.backgroundSecondary + "20"
                    : "transparent",
              },
            ]}
          >
            <View style={styles.bookmakerCell}>
              <Text
                style={[styles.bookmakerText, { color: theme.colors.text }]}
              >
                {odd.bookmaker}
              </Text>
              {renderTrendIcon(odd.trend)}
            </View>

            <TouchableOpacity
              style={[
                styles.oddButton,
                {
                  backgroundColor: odd.isBlocked
                    ? "#666"
                    : theme.colors.primary,
                },
              ]}
              disabled={odd.isBlocked}
            >
              <Text style={styles.oddButtonText}>
                {odd.isBlocked ? "—" : odd.homeWin}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.oddButton,
                { backgroundColor: odd.isBlocked ? "#666" : "#FFA726" },
              ]}
              disabled={odd.isBlocked}
            >
              <Text style={styles.oddButtonText}>
                {odd.isBlocked ? "—" : odd.draw}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.oddButton,
                { backgroundColor: odd.isBlocked ? "#666" : "#4A9EFF" },
              ]}
              disabled={odd.isBlocked}
            >
              <Text style={styles.oddButtonText}>
                {odd.isBlocked ? "—" : odd.awayWin}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderTotalGoalsTable = () => {
    if (!bettingOdds?.totalGoals) return null;

    return (
      <View style={styles.bettingTableContainer}>
        <View style={styles.bettingTableHeader}>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Bookmaker
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Line
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Over
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Under
          </Text>
        </View>

        {bettingOdds.totalGoals.slice(0, 8).map((odd, index) => (
          <View
            key={index}
            style={[
              styles.bettingTableRow,
              {
                backgroundColor:
                  index % 2 === 0
                    ? theme.colors.backgroundSecondary + "20"
                    : "transparent",
              },
            ]}
          >
            <View style={styles.bookmakerCell}>
              <Text
                style={[styles.bookmakerText, { color: theme.colors.text }]}
              >
                {odd.bookmaker}
              </Text>
              {renderTrendIcon(odd.trend)}
            </View>

            <Text
              style={[
                styles.handicapText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {odd.line}
            </Text>

            <TouchableOpacity
              style={[
                styles.oddButton,
                { backgroundColor: odd.isBlocked ? "#666" : "#4CAF50" },
              ]}
              disabled={odd.isBlocked}
            >
              <Text style={styles.oddButtonText}>
                {odd.isBlocked ? "—" : odd.overOdd}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.oddButton,
                { backgroundColor: odd.isBlocked ? "#666" : "#F44336" },
              ]}
              disabled={odd.isBlocked}
            >
              <Text style={styles.oddButtonText}>
                {odd.isBlocked ? "—" : odd.underOdd}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderCornersTable = () => {
    if (!bettingOdds?.corners) return null;

    return (
      <View style={styles.bettingTableContainer}>
        <View style={styles.bettingTableHeader}>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Bookmaker
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Line
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Over
          </Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.text }]}>
            Under
          </Text>
        </View>

        {bettingOdds.corners.slice(0, 8).map((odd, index) => (
          <View
            key={index}
            style={[
              styles.bettingTableRow,
              {
                backgroundColor:
                  index % 2 === 0
                    ? theme.colors.backgroundSecondary + "20"
                    : "transparent",
              },
            ]}
          >
            <View style={styles.bookmakerCell}>
              <Text
                style={[styles.bookmakerText, { color: theme.colors.text }]}
              >
                {odd.bookmaker}
              </Text>
              {renderTrendIcon(odd.trend)}
            </View>

            <Text
              style={[
                styles.handicapText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {odd.line}
            </Text>

            <TouchableOpacity
              style={[
                styles.oddButton,
                { backgroundColor: odd.isBlocked ? "#666" : "#9C27B0" },
              ]}
              disabled={odd.isBlocked}
            >
              <Text style={styles.oddButtonText}>
                {odd.isBlocked ? "—" : odd.overOdd}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.oddButton,
                { backgroundColor: odd.isBlocked ? "#666" : "#FF5722" },
              ]}
              disabled={odd.isBlocked}
            >
              <Text style={styles.oddButtonText}>
                {odd.isBlocked ? "—" : odd.underOdd}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderBettingTable = () => {
    switch (activeBettingCategory) {
      case "handicap":
        return renderHandicapTable();
      case "winDrawLoss":
        return renderWinDrawLossTable();
      case "totalGoals":
        return renderTotalGoalsTable();
      case "corners":
        return renderCornersTable();
      default:
        return renderHandicapTable();
    }
  };

  if (!bettingOdds) {
    return (
      <View style={styles.loadingContainer}>
        <Text
          style={[styles.loadingText, { color: theme.colors.textSecondary }]}
        >
          Loading betting odds...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderBettingCategories()}
      <ScrollView
        style={styles.tableScrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderBettingTable()}

        <View style={styles.disclaimerContainer}>
          <Text
            style={[
              styles.disclaimerText,
              { color: theme.colors.textSecondary },
            ]}
          >
            * Odds are indicative and may vary. Please check with bookmaker for
            current rates.
          </Text>
          <Text
            style={[
              styles.disclaimerText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Bet responsibly. 18+ only.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontStyle: "italic",
  },
  bettingCategoriesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  bettingCategoriesScroll: {
    paddingHorizontal: 16,
  },
  bettingCategoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 80,
    alignItems: "center",
  },
  bettingCategoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tableScrollView: {
    flex: 1,
  },
  bettingTableContainer: {
    margin: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  bettingTableHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  bettingTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  bookmakerCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 8,
  },
  bookmakerText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  handicapText: {
    flex: 1,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  oddButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: "center",
  },
  oddButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  disclaimerContainer: {
    padding: 16,
    marginTop: 20,
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 4,
    fontStyle: "italic",
  },
});
