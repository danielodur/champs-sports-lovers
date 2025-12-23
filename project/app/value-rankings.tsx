import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Euro,
  PoundSterling,
  Star,
  Calendar,
  Users,
  Settings,
  Filter,
  BarChart3,
  Target,
  Award,
} from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "react-i18next";

interface PlayerValue {
  id: string;
  position: number;
  previousPosition: number;
  name: string;
  photo: string;
  team: string;
  league: string;
  age: number;
  nationality: string;
  position_field: string;
  currentValue: number;
  previousValue: number;
  valueChange: number;
  valueChangePercent: number;
  trend: "up" | "down" | "same";
  contractExpiry: string;
  appearances: number;
  goals: number;
  assists: number;
}

interface TeamValue {
  id: string;
  position: number;
  team: string;
  logo: string;
  league: string;
  totalValue: number;
  averageAge: number;
  mostValuablePlayer: string;
  valueChange: number;
  trend: "up" | "down" | "same";
}

export default function ValueRankingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("players");
  const [selectedLeague, setSelectedLeague] = useState("premier-league");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const { t } = useTranslation();

  const tabs = [
    { id: "players", label: "Players", icon: Users },
    { id: "teams", label: "Teams", icon: Star },
    { id: "transfers", label: "Transfers", icon: TrendingUp },
  ];

  const leagues = [
    { id: "premier-league", name: "Premier League" },
    { id: "la-liga", name: "La Liga" },
    { id: "bundesliga", name: "Bundesliga" },
    { id: "serie-a", name: "Serie A" },
    { id: "ligue-1", name: "Ligue 1" },
  ];

  const positions = [
    { id: "all", name: "All Positions" },
    { id: "gk", name: "Goalkeeper" },
    { id: "def", name: "Defender" },
    { id: "mid", name: "Midfielder" },
    { id: "att", name: "Attacker" },
  ];

  const currencies = [
    { id: "EUR", symbol: "€", icon: Euro },
    { id: "GBP", symbol: "£", icon: PoundSterling },
    { id: "USD", symbol: "$", icon: DollarSign },
  ];

  const playerValues: PlayerValue[] = [
    {
      id: "1",
      position: 1,
      previousPosition: 1,
      name: "Kylian Mbappé",
      photo: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
      team: "PSG",
      league: "Ligue 1",
      age: 24,
      nationality: "France",
      position_field: "LW",
      currentValue: 180000000,
      previousValue: 175000000,
      valueChange: 5000000,
      valueChangePercent: 2.9,
      trend: "up",
      contractExpiry: "2024",
      appearances: 28,
      goals: 25,
      assists: 8,
    },
    {
      id: "2",
      position: 2,
      previousPosition: 3,
      name: "Erling Haaland",
      photo: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
      team: "Manchester City",
      league: "Premier League",
      age: 23,
      nationality: "Norway",
      position_field: "ST",
      currentValue: 170000000,
      previousValue: 160000000,
      valueChange: 10000000,
      valueChangePercent: 6.3,
      trend: "up",
      contractExpiry: "2027",
      appearances: 30,
      goals: 32,
      assists: 5,
    },
    {
      id: "3",
      position: 3,
      previousPosition: 2,
      name: "Vinicius Jr.",
      photo:
        "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
      team: "Real Madrid",
      league: "La Liga",
      age: 23,
      nationality: "Brazil",
      position_field: "LW",
      currentValue: 150000000,
      previousValue: 155000000,
      valueChange: -5000000,
      valueChangePercent: -3.2,
      trend: "down",
      contractExpiry: "2027",
      appearances: 29,
      goals: 18,
      assists: 12,
    },
  ];

  const teamValues: TeamValue[] = [
    {
      id: "1",
      position: 1,
      team: "Manchester City",
      logo: "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg",
      league: "Premier League",
      totalValue: 1200000000,
      averageAge: 26.8,
      mostValuablePlayer: "Erling Haaland",
      valueChange: 50000000,
      trend: "up",
    },
    {
      id: "2",
      position: 2,
      team: "PSG",
      logo: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg",
      league: "Ligue 1",
      totalValue: 1150000000,
      averageAge: 25.2,
      mostValuablePlayer: "Kylian Mbappé",
      valueChange: 25000000,
      trend: "up",
    },
    {
      id: "3",
      position: 3,
      team: "Real Madrid",
      logo: "https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg",
      league: "La Liga",
      totalValue: 1100000000,
      averageAge: 27.1,
      mostValuablePlayer: "Vinicius Jr.",
      valueChange: -15000000,
      trend: "down",
    },
  ];

  const formatValue = (value: number) => {
    const currencyData = currencies.find((c) => c.id === currency);
    const symbol = currencyData?.symbol || "€";

    if (value >= 1000000) {
      return `${symbol}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${symbol}${(value / 1000).toFixed(0)}K`;
    }
    return `${symbol}${value}`;
  };

  const getTrendIcon = (trend: "up" | "down" | "same") => {
    switch (trend) {
      case "up":
        return <TrendingUp size={16} color="#4CAF50" />;
      case "down":
        return <TrendingDown size={16} color="#F44336" />;
      default:
        return <Minus size={16} color="#9E9E9E" />;
    }
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        {t("valueRankings.headerTitle")}
      </Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab(tab.id)}
          activeOpacity={0.7}
        >
          <tab.icon
            size={18}
            color={
              activeTab === tab.id
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.textSecondary },
              activeTab === tab.id && { color: theme.colors.primary },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
            },
            Platform.select({
              web: { outlineStyle: "none" as any },
            }),
          ]}
          placeholder={t("valueRankings.searchPlaceholder")}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {leagues.map((league) => (
            <TouchableOpacity
              key={league.id}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    selectedLeague === league.id
                      ? theme.colors.primary
                      : theme.colors.backgroundSecondary,
                },
              ]}
              onPress={() => setSelectedLeague(league.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color:
                      selectedLeague === league.id
                        ? "#FFFFFF"
                        : theme.colors.text,
                  },
                ]}
              >
                {league.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.currencyButton,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
          onPress={() => {
            const currentIndex = currencies.findIndex((c) => c.id === currency);
            const nextIndex = (currentIndex + 1) % currencies.length;
            setCurrency(currencies[nextIndex].id);
          }}
          activeOpacity={0.7}
        >
          {currencies.find((c) => c.id === currency)?.icon &&
            React.createElement(
              currencies.find((c) => c.id === currency)!.icon,
              {
                size: 16,
                color: theme.colors.text,
              },
            )}
          <Text style={[styles.currencyText, { color: theme.colors.text }]}>
            {currency}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "players" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.positionScroll}
          contentContainerStyle={styles.positionContainer}
        >
          {positions.map((position) => (
            <TouchableOpacity
              key={position.id}
              style={[
                styles.positionButton,
                {
                  backgroundColor:
                    selectedPosition === position.id
                      ? theme.colors.primary
                      : theme.colors.backgroundSecondary,
                },
              ]}
              onPress={() => setSelectedPosition(position.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.positionButtonText,
                  {
                    color:
                      selectedPosition === position.id
                        ? "#FFFFFF"
                        : theme.colors.text,
                  },
                ]}
              >
                {position.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderPlayerValues = () => (
    <View style={styles.rankingsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t("valueRankings.mostValuablePlayers")}
      </Text>

      {playerValues.map((player) => (
        <View
          key={player.id}
          style={[
            styles.playerCard,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View style={styles.playerHeader}>
            <View style={styles.playerPosition}>
              <Text
                style={[styles.positionNumber, { color: theme.colors.primary }]}
              >
                #{player.position}
              </Text>
              {getTrendIcon(player.trend)}
            </View>

            <Image source={{ uri: player.photo }} style={styles.playerPhoto} />

            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: theme.colors.text }]}>
                {player.name}
              </Text>
              <Text
                style={[
                  styles.playerTeam,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {player.team} • {player.position_field}
              </Text>
              <Text
                style={[
                  styles.playerAge,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Age: {player.age} • {player.nationality}
              </Text>
            </View>

            <View style={styles.playerValue}>
              <Text
                style={[styles.currentValue, { color: theme.colors.primary }]}
              >
                {formatValue(player.currentValue)}
              </Text>
              <View style={styles.valueChange}>
                <Text
                  style={[
                    styles.valueChangeText,
                    { color: player.valueChange >= 0 ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  {player.valueChange >= 0 ? "+" : ""}
                  {formatValue(Math.abs(player.valueChange))}
                </Text>
                <Text
                  style={[
                    styles.valueChangePercent,
                    { color: player.valueChange >= 0 ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  ({player.valueChangePercent >= 0 ? "+" : ""}
                  {player.valueChangePercent.toFixed(1)}%)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.playerStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.appearances}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Apps
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.goals}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Goals
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.assists}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Assists
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {player.contractExpiry}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Contract
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTeamValues = () => (
    <View style={styles.rankingsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t("valueRankings.mostValuableTeams")}
      </Text>

      {teamValues.map((team) => (
        <View
          key={team.id}
          style={[
            styles.teamCard,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View style={styles.teamHeader}>
            <View style={styles.teamPosition}>
              <Text
                style={[styles.positionNumber, { color: theme.colors.primary }]}
              >
                #{team.position}
              </Text>
              {getTrendIcon(team.trend)}
            </View>

            <Image source={{ uri: team.logo }} style={styles.teamLogo} />

            <View style={styles.teamInfo}>
              <Text style={[styles.teamName, { color: theme.colors.text }]}>
                {team.team}
              </Text>
              <Text
                style={[
                  styles.teamLeague,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {team.league}
              </Text>
            </View>

            <View style={styles.teamValue}>
              <Text
                style={[styles.totalValue, { color: theme.colors.primary }]}
              >
                {formatValue(team.totalValue)}
              </Text>
              <Text
                style={[
                  styles.teamValueChange,
                  { color: team.valueChange >= 0 ? "#4CAF50" : "#F44336" },
                ]}
              >
                {team.valueChange >= 0 ? "+" : ""}
                {formatValue(Math.abs(team.valueChange))}
              </Text>
            </View>
          </View>

          <View style={styles.teamDetails}>
            <View style={styles.teamDetailItem}>
              <Text
                style={[
                  styles.teamDetailLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("valueRankings.averageAge")}
              </Text>
              <Text
                style={[styles.teamDetailValue, { color: theme.colors.text }]}
              >
                {team.averageAge} years
              </Text>
            </View>
            <View style={styles.teamDetailItem}>
              <Text
                style={[
                  styles.teamDetailLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("valueRankings.mostValuable")}
              </Text>
              <Text
                style={[styles.teamDetailValue, { color: theme.colors.text }]}
              >
                {team.mostValuablePlayer}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTransfers = () => (
    <View style={styles.rankingsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t("valueRankings.recentTransferRecords")}
      </Text>

      <View
        style={[
          styles.transferCard,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Text style={[styles.transferTitle, { color: theme.colors.text }]}>
          {t("valueRankings.comingSoon")}
        </Text>
        <Text
          style={[
            styles.transferDescription,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t("valueRankings.transferDescription")}
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "players":
        return renderPlayerValues();
      case "teams":
        return renderTeamValues();
      case "transfers":
        return renderTransfers();
      default:
        return renderPlayerValues();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderHeader()}
      {renderTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderFilters()}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
  },
  settingsButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  filterScroll: {
    flex: 1,
    marginRight: 12,
  },
  filterContainer: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  currencyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  currencyText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  positionScroll: {
    marginBottom: 8,
  },
  positionContainer: {
    gap: 8,
  },
  positionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  positionButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  rankingsContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
  playerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  playerPosition: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    gap: 4,
  },
  positionNumber: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
  playerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  playerTeam: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginBottom: 2,
  },
  playerAge: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  playerValue: {
    alignItems: "flex-end",
  },
  currentValue: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  valueChange: {
    alignItems: "flex-end",
  },
  valueChangeText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  valueChangePercent: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  playerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
  },
  teamCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teamPosition: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    gap: 4,
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  teamLeague: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  teamValue: {
    alignItems: "flex-end",
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  teamValueChange: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  teamDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  teamDetailItem: {
    alignItems: "center",
  },
  teamDetailLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginBottom: 4,
  },
  teamDetailValue: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  transferCard: {
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transferTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 8,
  },
  transferDescription: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
