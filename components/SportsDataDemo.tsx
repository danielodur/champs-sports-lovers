import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  fetchFootballMatches,
  fetchFootballLeagues,
  fetchFootballTeams,
  getTodaysLiveMatches,
  getTodaysUpcomingMatches,
  handleSportsApiError,
  formatMatchDate,
  type FootballMatch,
  type FootballLeague,
  type FootballTeam,
} from "../utils/sportsApi";

const SportsDataDemo = () => {
  // State for different data types
  const [liveMatches, setLiveMatches] = useState<FootballMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<FootballMatch[]>([]);
  const [leagues, setLeagues] = useState<FootballLeague[]>([]);
  const [teams, setTeams] = useState<FootballTeam[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState({
    liveMatches: false,
    upcomingMatches: false,
    leagues: false,
    teams: false,
  });
  const [errors, setErrors] = useState({
    liveMatches: "",
    upcomingMatches: "",
    leagues: "",
    teams: "",
  });
  const [refreshing, setRefreshing] = useState(false);

  // Current active tab
  const [activeTab, setActiveTab] = useState<
    "live" | "upcoming" | "leagues" | "teams"
  >("live");

  // Fetch live matches
  const fetchLiveMatches = async () => {
    setLoading((prev) => ({ ...prev, liveMatches: true }));
    setErrors((prev) => ({ ...prev, liveMatches: "" }));

    try {
      const matches = await getTodaysLiveMatches();
      setLiveMatches(matches);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        liveMatches: handleSportsApiError(error),
      }));
    } finally {
      setLoading((prev) => ({ ...prev, liveMatches: false }));
    }
  };

  // Fetch upcoming matches
  const fetchUpcomingMatches = async () => {
    setLoading((prev) => ({ ...prev, upcomingMatches: true }));
    setErrors((prev) => ({ ...prev, upcomingMatches: "" }));

    try {
      const matches = await getTodaysUpcomingMatches();
      setUpcomingMatches(matches);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        upcomingMatches: handleSportsApiError(error),
      }));
    } finally {
      setLoading((prev) => ({ ...prev, upcomingMatches: false }));
    }
  };

  // Fetch popular leagues
  const fetchLeagues = async () => {
    setLoading((prev) => ({ ...prev, leagues: true }));
    setErrors((prev) => ({ ...prev, leagues: "" }));

    try {
      const response = await fetchFootballLeagues({ country: "England" });
      setLeagues(response.leagues || response.data || []);
    } catch (error) {
      setErrors((prev) => ({ ...prev, leagues: handleSportsApiError(error) }));
    } finally {
      setLoading((prev) => ({ ...prev, leagues: false }));
    }
  };

  // Fetch popular teams
  const fetchTeams = async () => {
    setLoading((prev) => ({ ...prev, teams: true }));
    setErrors((prev) => ({ ...prev, teams: "" }));

    try {
      const response = await fetchFootballTeams({ search: "Manchester" });
      setTeams(response.teams || response.data || []);
    } catch (error) {
      setErrors((prev) => ({ ...prev, teams: handleSportsApiError(error) }));
    } finally {
      setLoading((prev) => ({ ...prev, teams: false }));
    }
  };

  // Load initial data
  useEffect(() => {
    fetchLiveMatches();
    fetchUpcomingMatches();
    fetchLeagues();
    fetchTeams();
  }, []);

  // Refresh all data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLiveMatches(),
      fetchUpcomingMatches(),
      fetchLeagues(),
      fetchTeams(),
    ]);
    setRefreshing(false);
  };

  // Render match item
  const renderMatchItem = (match: FootballMatch, index: number) => (
    <View key={match.id || index} style={styles.matchItem}>
      <View style={styles.matchTeams}>
        <Text style={styles.teamName}>{match.home_team}</Text>
        <Text style={styles.vsText}>VS</Text>
        <Text style={styles.teamName}>{match.away_team}</Text>
      </View>
      {match.score && <Text style={styles.score}>{match.score}</Text>}
      <Text style={styles.matchInfo}>
        {formatMatchDate(match.date)} • {match.league}
      </Text>
      {match.status === "live" && match.minute && (
        <Text style={styles.liveIndicator}>LIVE - {match.minute}'</Text>
      )}
    </View>
  );

  // Render league item
  const renderLeagueItem = (league: FootballLeague, index: number) => (
    <View key={league.id || index} style={styles.leagueItem}>
      <Text style={styles.leagueName}>{league.name}</Text>
      <Text style={styles.leagueCountry}>{league.country}</Text>
      {league.season && (
        <Text style={styles.leagueSeason}>Season: {league.season}</Text>
      )}
    </View>
  );

  // Render team item
  const renderTeamItem = (team: FootballTeam, index: number) => (
    <View key={team.id || index} style={styles.teamItem}>
      <Text style={styles.teamName}>{team.name}</Text>
      {team.country && <Text style={styles.teamCountry}>{team.country}</Text>}
      {team.league && (
        <Text style={styles.teamLeague}>League: {team.league}</Text>
      )}
    </View>
  );

  // Render error message
  const renderError = (error: string) =>
    error ? (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null;

  // Render loading indicator
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loadingText}>Loading sports data...</Text>
    </View>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "live":
        if (loading.liveMatches) return renderLoading();
        return (
          <View>
            {renderError(errors.liveMatches)}
            <Text style={styles.sectionTitle}>Live Matches Today</Text>
            {liveMatches.length === 0 ? (
              <Text style={styles.noDataText}>
                No live matches at the moment
              </Text>
            ) : (
              liveMatches.map(renderMatchItem)
            )}
          </View>
        );

      case "upcoming":
        if (loading.upcomingMatches) return renderLoading();
        return (
          <View>
            {renderError(errors.upcomingMatches)}
            <Text style={styles.sectionTitle}>Upcoming Matches Today</Text>
            {upcomingMatches.length === 0 ? (
              <Text style={styles.noDataText}>No upcoming matches today</Text>
            ) : (
              upcomingMatches.map(renderMatchItem)
            )}
          </View>
        );

      case "leagues":
        if (loading.leagues) return renderLoading();
        return (
          <View>
            {renderError(errors.leagues)}
            <Text style={styles.sectionTitle}>English Football Leagues</Text>
            {leagues.length === 0 ? (
              <Text style={styles.noDataText}>No leagues found</Text>
            ) : (
              leagues.map(renderLeagueItem)
            )}
          </View>
        );

      case "teams":
        if (loading.teams) return renderLoading();
        return (
          <View>
            {renderError(errors.teams)}
            <Text style={styles.sectionTitle}>Manchester Teams</Text>
            {teams.length === 0 ? (
              <Text style={styles.noDataText}>No teams found</Text>
            ) : (
              teams.map(renderTeamItem)
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sports Data Demo</Text>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "live" && styles.activeTab]}
          onPress={() => setActiveTab("live")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "live" && styles.activeTabText,
            ]}
          >
            Live
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "leagues" && styles.activeTab]}
          onPress={() => setActiveTab("leagues")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "leagues" && styles.activeTabText,
            ]}
          >
            Leagues
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "teams" && styles.activeTab]}
          onPress={() => setActiveTab("teams")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "teams" && styles.activeTabText,
            ]}
          >
            Teams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold" as const,
    textAlign: "center" as const,
    marginBottom: 20,
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row" as const,
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center" as const,
  },
  activeTab: {
    backgroundColor: "#007bff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 16,
    color: "#333",
  },
  matchItem: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeft: "4px solid #007bff",
  },
  matchTeams: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#333",
    flex: 1,
  },
  vsText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold" as const,
    marginHorizontal: 8,
  },
  score: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#007bff",
    textAlign: "center" as const,
    marginBottom: 4,
  },
  matchInfo: {
    fontSize: 12,
    color: "#666",
    textAlign: "center" as const,
  },
  liveIndicator: {
    fontSize: 12,
    color: "#dc3545",
    fontWeight: "bold" as const,
    textAlign: "center" as const,
    marginTop: 4,
  },
  leagueItem: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeft: "4px solid #28a745",
  },
  leagueName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#333",
    marginBottom: 4,
  },
  leagueCountry: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  leagueSeason: {
    fontSize: 12,
    color: "#666",
  },
  teamItem: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeft: "4px solid #ffc107",
  },
  teamCountry: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  teamLeague: {
    fontSize: 12,
    color: "#666",
  },
  loadingContainer: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#f8d7da",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderLeft: "4px solid #dc3545",
  },
  errorText: {
    color: "#721c24",
    fontSize: 14,
  },
  noDataText: {
    textAlign: "center" as const,
    color: "#666",
    fontSize: 16,
    fontStyle: "italic" as const,
    padding: 20,
  },
};

export default SportsDataDemo;
