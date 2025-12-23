import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { fetchLeagueStandings, TeamStanding } from "../../../../services/leagueStandingsService";
import { getLeagueApiId } from "../[leagueId]";
import { checkTeamHasData } from "@/utils/basketballTeamDataCheck";

interface LeagueStandingsProps {
  leagueId: string;
  season: string;
  theme: any;
  sport?: string; // Optional sport parameter for basketball/football differentiation
}

export default function LeagueStandings({ leagueId, season, theme, sport = "football" }: LeagueStandingsProps) {
  const router = useRouter();
  const isDarkMode = theme.colors.backgroundSecondary !== "#F5F5F5";
  const [selectedFilter, setSelectedFilter] = useState<"all" | "home" | "away">("all");
  
  // Initialize with empty array for instant display
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandingsData = async () => {
      try {
        setIsLoadingApi(true);
        setError(null);
        setStandings([]); // ✅ Clear previous standings immediately
        
        // ✅ CRITICAL: Pass sport parameter to get correct API ID
        const apiLeagueId = getLeagueApiId(leagueId, undefined, sport);
        
        console.log(`📊 [LeagueStandings] ===== FETCHING STANDINGS =====`);
        console.log(`📊 [LeagueStandings] Tab/Route LeagueId: ${leagueId}`);
        console.log(`📊 [LeagueStandings] Sport: ${sport}`);
        console.log(`📊 [LeagueStandings] Mapped API ID: ${apiLeagueId}`);
        console.log(`📊 [LeagueStandings] Season: ${season}`);
        console.log(`📊 [LeagueStandings] ==============================`);
        
        if (!apiLeagueId) {
          console.warn(`⚠️ [LeagueStandings] No API ID found for leagueId: ${leagueId} - League data not yet available`);
          setError(`Standings data not yet available for this league.\n\nThis league is supported but data will be available when we integrate a better API provider.`);
          setIsLoadingApi(false);
          return;
        }

        const seasonYear = parseInt(season.split("-")[0]);
        const standingsResponse = await fetchLeagueStandings(apiLeagueId, seasonYear, false, sport);
        
        console.log(`✅ [LeagueStandings] Received ${sport} standings for ${leagueId} (API ID: ${apiLeagueId}):`, {
          hasResponse: !!standingsResponse,
          groupsCount: standingsResponse?.groups?.length || 0,
          firstGroupStandings: standingsResponse?.groups?.[0]?.standings?.length || 0,
          leagueName: standingsResponse?.league?.name
        });
        
        if (standingsResponse && standingsResponse.groups && standingsResponse.groups.length > 0) {
          // Get standings from first group (most leagues have single table)
          const groupStandings = standingsResponse.groups[0].standings;
          console.log(`🏀 [LeagueStandings] Setting ${groupStandings.length} teams for ${sport} - ${standingsResponse.league.name}`);
          setStandings(groupStandings);
        } else {
          console.warn(`⚠️ [LeagueStandings] No standings data available for ${sport} - ${leagueId} (API ID: ${apiLeagueId})`);
          setError("No standings data available");
        }
      } catch (err) {
        console.error(`❌ [LeagueStandings] Error fetching ${sport} standings for ${leagueId}:`, err);
        setError("Failed to load standings");
      } finally {
        setIsLoadingApi(false);
      }
    };

    // Fetch in background - don't block UI
    fetchStandingsData();
  }, [leagueId, season, sport]);

  // Show error only if we have an error AND no data AND not loading
  if (error && standings.length === 0 && !isLoadingApi) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          {error}
        </Text>
      </View>
    );
  }
  
  // Show empty state if no standings but no error and not loading
  if (standings.length === 0 && !isLoadingApi && !error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          No standings available
        </Text>
      </View>
    );
  }

  // Handle team press - navigate to team details (with basketball data check)
  const handleTeamPress = async (team: TeamStanding) => {
    if (team.team.id && team.team.name) {
      // ✅ BASKETBALL: Check if team has data before navigation
      const hasData = await checkTeamHasData(
        team.team.id.toString(),
        team.team.name,
        sport
      );
      
      if (!hasData) {
        console.warn(`⚠️ [LeagueStandings] ${team.team.name} has no API data - navigation blocked`);
        return;
      }
      
      // ✅ CRITICAL: Pass sport parameter to get correct API ID
      const apiLeagueId = getLeagueApiId(leagueId, undefined, sport);
      router.push({
        pathname: "/team-details",
        params: {
          teamId: team.team.id.toString(),
          teamName: team.team.name,
          leagueId: apiLeagueId ? apiLeagueId.toString() : undefined, // Pass league ID for accurate team detection
          sport: sport, // ✅ Pass sport parameter
        },
      });
    }
  };

  // Filter standings based on selected filter
  const getStandingsData = () => {
    const isBasketball = sport === 'basketball';
    
    return standings.map((team) => {
      const standingData = selectedFilter === "home" 
        ? team.home 
        : selectedFilter === "away" 
        ? team.away 
        : team.all;
      
      // 🏀 Basketball: No draws, use different point calculation
      // ⚽ Football: Standard W/D/L with 3 points per win
      const points = isBasketball
        ? (standingData.win * 2) // Basketball: 2 points per win
        : (selectedFilter === "all" ? team.points : (standingData.win * 3 + standingData.draw));
      
      return {
        position: team.rank,
        team: { 
          id: team.team.id,
          name: team.team.name, 
          logo: team.team.logo 
        },
        played: standingData.played,
        wins: standingData.win,
        draws: standingData.draw, // Will be 0 for basketball
        losses: standingData.lose,
        goalsFor: standingData.goals.for, // Points for in basketball
        goalsAgainst: standingData.goals.against, // Points against in basketball
        goalDifference: selectedFilter === "all" ? team.goalsDiff : standingData.goals.for - standingData.goals.against,
        points: points,
        form: team.form ? team.form.split("").slice(-5) : [],
        zone: team.description || "",
        teamStanding: team, // Store full team standing for navigation
        isBasketball, // Flag for rendering logic
      };
    });
  };

  const displayStandings = getStandingsData();

  // Dynamic zone color based on description keywords (API-driven)
  const getZoneColor = (zone: string) => {
    const zoneLower = zone.toLowerCase();
    
    // Champions League variants (UCL, CAF Champions League, etc.)
    if (zoneLower.includes("champions league") || zoneLower.includes("champions")) {
      return "#0066FF"; // Blue
    }
    
    // Europa League variants (UEL, CAF Confederation, etc.)
    if (zoneLower.includes("europa league") || zoneLower.includes("confederation")) {
      return "#FF6B35"; // Orange
    }
    
    // Conference League variants (UECL)
    if (zoneLower.includes("conference")) {
      return "#00AA55"; // Green
    }
    
    // Promotion
    if (zoneLower.includes("promotion")) {
      return "#4CAF50"; // Green
    }
    
    // Relegation
    if (zoneLower.includes("relegation")) {
      return "#FF3030"; // Red
    }
    
    // Playoff
    if (zoneLower.includes("playoff")) {
      return "#2196F3"; // Light Blue
    }
    
    return "transparent";
  };

  const getFormColor = (result: string) => {
    if (result === "W") return "#4CAF50";
    if (result === "D") return "#FF9800";
    if (result === "L") return "#F44336";
    return "#888888";
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {["all", "home", "away"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  selectedFilter === filter
                    ? isDarkMode
                      ? "#2A2A2A"
                      : "#E8E8E8"
                    : "transparent",
              },
            ]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text
              style={[
                styles.filterTabText,
                {
                  color:
                    selectedFilter === filter
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                },
                selectedFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Horizontal & Vertical Scrollable Table Wrapper */}
      <ScrollView
        style={styles.verticalScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollContainer}
        >
          <View style={styles.tableWrapper}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.posCell, { color: theme.colors.textSecondary }]}>
            #
          </Text>
          <Text style={[styles.headerCell, styles.teamCell, { color: theme.colors.textSecondary }]}>
            Team
          </Text>
          <Text style={[styles.headerCell, styles.statCell, { color: theme.colors.textSecondary }]}>
            P
          </Text>
          <Text style={[styles.headerCell, styles.statCell, { color: theme.colors.textSecondary }]}>
            {sport === 'basketball' ? 'W/L' : 'W/D/L'}
          </Text>
          <Text style={[styles.headerCell, styles.statCell, { color: theme.colors.textSecondary }]}>
            {sport === 'basketball' ? 'PF/PA' : 'GF/GA'}
          </Text>
          <Text style={[styles.headerCell, styles.ptsCell, { color: theme.colors.textSecondary }]}>
            Pts
          </Text>
          <Text style={[styles.headerCell, styles.formColHeader, { color: theme.colors.textSecondary }]}>
            Form
          </Text>
        </View>

      {/* Table Rows */}
      {displayStandings.map((team, index) => (
        <View key={team.position}>
          {/* Zone Label */}
          {(index === 0 || team.zone !== displayStandings[index - 1].zone) && (
            <View
              style={[
                styles.zoneLabel,
                { backgroundColor: getZoneColor(team.zone) + "20" },
              ]}
            >
              <View
                style={[
                  styles.zoneLine,
                  { backgroundColor: getZoneColor(team.zone) },
                ]}
              />
              <Text
                style={[
                  styles.zoneLabelText,
                  { color: getZoneColor(team.zone) },
                ]}
              >
                {team.zone}
              </Text>
            </View>
          )}

          {/* Team Row */}
          <TouchableOpacity
            style={[
              styles.teamRow,
              {
                backgroundColor: isDarkMode
                  ? index % 2 === 0
                    ? "#1A1A1A"
                    : "#121212"
                  : index % 2 === 0
                  ? "#FAFAFA"
                  : "#FFFFFF",
              },
            ]}
            onPress={() => handleTeamPress(team.teamStanding)}
            activeOpacity={0.7}
          >
            <Text style={[styles.posCell, { color: theme.colors.text, fontWeight: "700" }]}>
              {team.position}
            </Text>
            <View style={styles.teamCell}>
              {team.team.logo ? (
                <Image source={{ uri: team.team.logo }} style={styles.teamLogoImage} />
              ) : null}
              <Text
                style={[styles.teamName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {team.team.name}
              </Text>
            </View>
            <Text style={[styles.statCell, { color: theme.colors.text }]}>
              {team.played}
            </Text>
            <Text style={[styles.statCell, { color: theme.colors.text }]}>
              {team.isBasketball ? `${team.wins}/${team.losses}` : `${team.wins}/${team.draws}/${team.losses}`}
            </Text>
            <Text style={[styles.statCell, { color: theme.colors.text }]}>
              {team.goalsFor}/{team.goalsAgainst}
            </Text>
            <Text style={[styles.ptsCell, { color: theme.colors.text, fontWeight: "700" }]}>
              {team.points}
            </Text>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.formRow}>
            {team.form?.map((result, idx) => (
              <View
                key={idx}
                style={[
                  styles.formBadge,
                  { backgroundColor: getFormColor(result) },
                ]}
              >
                <Text style={styles.formText}>{result}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
        </View>
      </ScrollView>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  verticalScrollContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tableWrapper: {
    minWidth: 700, // Minimum width for proper spacing
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  filterTabs: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterTabTextActive: {
    fontWeight: "700",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  posCell: {
    width: 30,
  },
  teamCell: {
    width: 200, // Fixed width instead of flex for scrolling
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statCell: {
    width: 70, // Increased from 60 for better spacing
    textAlign: "center",
  },
  ptsCell: {
    width: 50, // Increased from 40 for better spacing
    textAlign: "center",
  },
  formColHeader: {
    width: 110, // Same as formRow width
    textAlign: "right", // Align "Form" text to the right
    paddingRight: 8, // Match formRow paddingRight for perfect alignment
  },
  zoneLabel: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    borderRadius: 8,
  },
  zoneLine: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  zoneLabelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  teamRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  teamLogoImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  formRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
    justifyContent: "flex-end", // Keep form badges on the right
  },
  formBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  formText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
