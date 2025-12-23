/**
 * Team Squad Component
 * 
 * Comprehensive squad view showing:
 * - Team Manager with photo, name, age/country
 * - Players grouped by position (Forwards, Midfielders, Defenders, Goalkeepers)
 * - Player statistics: Shirt number, appearances, goals, assists, market value
 * - Injuries section showing injured players with comeback dates
 * 
 * Features:
 * - Circular headshots with theme-aware backgrounds
 * - Real API data (no mock data)
 * - Injury indicators (red circle with white +)
 * - Market values in Euros (€) or "-" if unavailable
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Clock } from "lucide-react-native";
import { useRouter } from "expo-router";

// ============================================================================
// INTERFACES
// ============================================================================

interface TeamManager {
  id: number;
  name: string;
  photo?: string;
  age?: number;
  nationality?: string;
  country?: string;
}

interface PlayerStats {
  appearances: number;
  goals: number;
  assists: number;
  marketValue?: number; // in EUR
}

interface TeamPlayer {
  id: number;
  name: string;
  photo?: string;
  number: number;
  age?: number;
  nationality?: string;
  position: string;
  statistics?: PlayerStats;
  injured?: boolean;
}

interface PlayerInjury {
  playerId: number;
  playerName: string;
  playerPhoto?: string;
  reason: string;
  expectedReturn?: string; // Date string or "Unknown"
}

interface TeamSquadProps {
  manager?: TeamManager;
  squad: TeamPlayer[];
  injuries?: PlayerInjury[];
  theme: any;
  loading?: boolean;
  isDarkMode: boolean;
  sourceTeamName?: string; // Team name user navigated from (for watermark in player-details)
  sourceTeamLogo?: string; // Team logo user navigated from (for watermark in player-details)
  sport?: string; // ✅ Sport parameter (football/basketball)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getPlayerInitials = (name: string): string => {
  const names = name.split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatMarketValue = (value?: number): string => {
  if (!value || value === 0) return "-";
  
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value}`;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Unknown";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown";
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  } catch {
    return "Unknown";
  }
};

const getCountryFlagUrl = (nationality?: string): string | null => {
  if (!nationality) return null;
  
  // Country name to code mapping
  const countryCodeMap: Record<string, string> = {
    "England": "gb-eng",
    "Scotland": "gb-sct",
    "Wales": "gb-wls",
    "Northern Ireland": "gb-nir",
    "United States": "us",
    "South Korea": "kr",
    "Czech Republic": "cz",
    "Bosnia and Herzegovina": "ba",
    "Ivory Coast": "ci",
    "Côte d'Ivoire": "ci",
    "UAE": "ae",
    "Saudi Arabia": "sa",
    "South Africa": "za",
    "Costa Rica": "cr",
    "El Salvador": "sv",
    "Trinidad and Tobago": "tt",
    "Dominican Republic": "do",
  };
  
  // Get country code
  let countryCode = countryCodeMap[nationality];
  
  // If not in map, try to convert to lowercase 2-letter code
  if (!countryCode) {
    // Common countries with simple conversions
    const simpleMap: Record<string, string> = {
      "Spain": "es", "France": "fr", "Germany": "de", "Italy": "it",
      "Portugal": "pt", "Brazil": "br", "Argentina": "ar", "Belgium": "be",
      "Netherlands": "nl", "Croatia": "hr", "Uruguay": "uy", "Colombia": "co",
      "Mexico": "mx", "Switzerland": "ch", "Denmark": "dk", "Sweden": "se",
      "Norway": "no", "Austria": "at", "Poland": "pl", "Turkey": "tr",
      "Morocco": "ma", "Senegal": "sn", "Nigeria": "ng", "Ghana": "gh",
      "Egypt": "eg", "Tunisia": "tn", "Algeria": "dz", "Cameroon": "cm",
      "Japan": "jp", "Australia": "au", "Iran": "ir", "Ukraine": "ua",
      "Serbia": "rs", "Greece": "gr", "Romania": "ro", "Chile": "cl",
      "Peru": "pe", "Ecuador": "ec", "Paraguay": "py", "Venezuela": "ve",
      "Canada": "ca", "Jamaica": "jm", "Panama": "pa", "Honduras": "hn",
      "Finland": "fi", "Ireland": "ie", "Russia": "ru", "Iceland": "is",
    };
    countryCode = simpleMap[nationality];
  }
  
  if (!countryCode) return null;
  
  // Return flagcdn.com URL (20x15 size for compact display)
  return `https://flagcdn.com/20x15/${countryCode}.png`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TeamSquad({
  manager,
  squad = [],
  injuries = [],
  theme,
  loading = false,
  isDarkMode,
  sourceTeamName,
  sourceTeamLogo,
  sport = "football", // ✅ Default to football
}: TeamSquadProps) {
  const router = useRouter();
  const isBasketball = sport === "basketball"; // ✅ Detect basketball
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading squad...
          </Text>
        </View>
      </View>
    );
  }

  if (squad.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No squad data available
          </Text>
        </View>
      </View>
    );
  }

  // Group players by position
  const forwards = squad.filter(p => 
    p.position === "Attacker" || p.position === "Forward" || p.position?.toLowerCase().includes("forward")
  );
  const midfielders = squad.filter(p => 
    p.position === "Midfielder" || p.position?.toLowerCase().includes("mid")
  );
  const defenders = squad.filter(p => 
    p.position === "Defender" || p.position?.toLowerCase().includes("def")
  );
  const goalkeepers = squad.filter(p => 
    p.position === "Goalkeeper" || p.position?.toLowerCase().includes("goal")
  );

  const renderPlayerHeadshot = (player: TeamPlayer) => {
    const hasPhoto = player.photo && player.photo !== "";
    
    return (
      <View style={styles.headshotWrapper}>
        <View
          style={[
            styles.playerHeadshot,
            {
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          ]}
        >
          {hasPhoto ? (
            <Image
              source={{ uri: player.photo }}
              style={styles.headshotImage}
              resizeMode="cover"
            />
          ) : (
            // Professional fallback silhouette
            <View style={styles.headshotFallback}>
              <View
                style={[
                  styles.silhouetteCircle,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(0, 0, 0, 0.15)",
                  },
                ]}
              />
              <View
                style={[
                  styles.silhouetteBody,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(0, 0, 0, 0.15)",
                  },
                ]}
              />
            </View>
          )}
        </View>
        
        {/* Injury Indicator */}
        {player.injured && (
          <View style={styles.injuryBadge}>
            <Text style={styles.injuryIcon}>+</Text>
          </View>
        )}
      </View>
    );
  };

  const renderManagerHeadshot = () => {
    if (!manager) return null;
    
    // Get manager photo URL - prioritize photo from manager object
    let managerPhotoUrl = manager.photo;
    
    // Validate photo URL - must be a non-empty string and a valid URL
    const hasPhoto = managerPhotoUrl && 
                     managerPhotoUrl !== "" && 
                     managerPhotoUrl !== "null" &&
                     (managerPhotoUrl.startsWith("http://") || managerPhotoUrl.startsWith("https://"));
    
    return (
      <View
        style={[
          styles.managerHeadshot,
          {
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
        ]}
      >
        {hasPhoto ? (
          <Image
            source={{ uri: managerPhotoUrl }}
            style={styles.headshotImage}
            resizeMode="cover"
            onError={(error) => {
              // If image fails to load, log for debugging
              console.warn(`⚠️ Manager photo failed to load: ${managerPhotoUrl}`, error);
            }}
            onLoad={() => {
              console.log(`✅ Manager photo loaded successfully: ${managerPhotoUrl}`);
            }}
          />
        ) : (
          // Professional fallback silhouette for manager
          <View style={styles.headshotFallback}>
            <View
              style={[
                styles.silhouetteCircle,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.15)",
                },
              ]}
            />
            <View
              style={[
                styles.silhouetteBody,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.15)",
                },
              ]}
            />
          </View>
        )}
      </View>
    );
  };

  const renderPlayer = (player: TeamPlayer) => {
    const stats = player.statistics || { appearances: 0, goals: 0, assists: 0 };
    
    return (
      <TouchableOpacity
        style={[
          styles.playerRow,
          { borderBottomColor: isDarkMode ? "#333333" : "#E5E5E5" },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          if (player.id && player.id > 0) {
            console.log(`👤 [TeamSquad] Navigating to player: ${player.name} (ID: ${player.id})`);
            router.push({
              pathname: "/player-details/[playerId]",
              params: {
                playerId: player.id.toString(),
                playerName: player.name,
                playerPhoto: player.photo || "",
                sourceTeamName: sourceTeamName || "", // Pass source team name for watermark
                sourceTeamLogo: sourceTeamLogo || "", // Pass source team logo for watermark
              },
            });
          } else {
            console.warn(`⚠️ [TeamSquad] Invalid player ID for ${player.name}: ${player.id}`);
          }
        }}
      >
        {/* Jersey Icon with Number (Left Edge) */}
        <View style={styles.jerseyContainer}>
          <View
            style={[
              styles.jerseyIcon,
              {
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.08)"  // More visible in dark mode
                  : "rgba(0, 0, 0, 0.10)",       // More visible in light mode
              },
            ]}
          >
            {/* Jersey Sleeves */}
            <View style={styles.jerseySleeves}>
              <View
                style={[
                  styles.jerseySleeve,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.10)",
                  },
                ]}
              />
              <View
                style={[
                  styles.jerseySleeve,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.10)",
                  },
                ]}
              />
            </View>
            
            {/* Jersey Number */}
            <Text
              style={[
                styles.jerseyNumber,
                {
                  color: isDarkMode
                    ? "#FFFFFF"           // Bright white in dark mode
                    : theme.colors.text,  // Theme text color in light mode
                },
              ]}
            >
              {player.number > 0 ? player.number : "-"}
            </Text>
          </View>
        </View>

        {/* Player Headshot */}
        <View style={styles.headshotContainer}>
          {renderPlayerHeadshot(player)}
        </View>

        {/* Player Name, Age & Country */}
        <View style={styles.playerInfoColumn}>
          <Text style={[styles.playerName, { color: theme.colors.text }]} numberOfLines={1}>
            {player.name}
          </Text>
          <View style={styles.playerMetaRow}>
            <Text style={[styles.playerMeta, { color: theme.colors.textSecondary }]}>
              {player.age ? `${player.age}` : "-"}
            </Text>
            {player.nationality && (
              <>
                <Text style={[styles.playerMeta, { color: theme.colors.textSecondary }]}> / </Text>
                {getCountryFlagUrl(player.nationality) && (
                  <Image
                    source={{ uri: getCountryFlagUrl(player.nationality)! }}
                    style={styles.countryFlag}
                    resizeMode="contain"
                  />
                )}
                <Text style={[styles.playerMeta, { color: theme.colors.textSecondary, marginLeft: 4 }]} numberOfLines={1}>
                  {player.nationality}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Compact Statistics */}
        <View style={styles.statsColumn}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {stats.appearances || 0}
          </Text>
        </View>

        <View style={styles.statsColumn}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {stats.goals || 0}
          </Text>
        </View>

        <View style={styles.statsColumn}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {stats.assists || 0}
          </Text>
        </View>

        {/* Market Value */}
        <View style={styles.valueColumn}>
          <Text style={[styles.statValue, { color: theme.colors.text }]} numberOfLines={1}>
            {formatMarketValue(stats.marketValue)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPositionSection = (
    title: string,
    players: TeamPlayer[]
  ) => {
    if (players.length === 0) return null;

    return (
      <View style={styles.section}>
        {/* Section Header */}
        <View style={[styles.sectionHeader, { backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA" }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          <View style={styles.headerRow}>
            <View style={styles.headerColumn}>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
                App
              </Text>
            </View>
            <View style={styles.headerColumn}>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
                Goals
              </Text>
            </View>
            <View style={styles.headerColumn}>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
                Asst
              </Text>
            </View>
            <View style={styles.headerValueColumn}>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
                Value (€)
              </Text>
            </View>
          </View>
        </View>

        {/* Players List */}
        <View style={styles.playersContainer}>
          {players.map((player, index) => {
            // Create unique key - use player.id if valid and unique, otherwise use index + name
            const uniqueKey = player.id && player.id !== 0 
              ? `player-${player.id}-${index}` 
              : `player-${index}-${player.name || 'unknown'}`;
            return (
              <React.Fragment key={uniqueKey}>
                {renderPlayer(player)}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  };

  const renderInjuriesSection = () => {
    if (!injuries || injuries.length === 0) return null;

    return (
      <View style={styles.section}>
        {/* Injuries Header */}
        <View style={[styles.sectionHeader, { backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA" }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Injuries
          </Text>
          <View style={styles.injuryHeaderRow}>
            <View style={styles.injuryReasonColumn}>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
                Reason
              </Text>
            </View>
            <View style={styles.injuryComebackColumn}>
              <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
                Comeback
              </Text>
            </View>
          </View>
        </View>

        {/* Injuries List */}
        <View style={styles.playersContainer}>
          {injuries.map((injury) => (
            <View
              key={injury.playerId}
              style={[
                styles.injuryRow,
                { borderBottomColor: isDarkMode ? "#333333" : "#E5E5E5" },
              ]}
            >
              {/* Player Info */}
              <View style={styles.injuryPlayerColumn}>
                <View
                  style={[
                    styles.playerHeadshot,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(0, 0, 0, 0.01)"
                        : "rgba(128, 128, 128, 0.05)",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.02)"
                        : "rgba(128, 128, 128, 0.08)",
                    },
                  ]}
                >
                  {injury.playerPhoto ? (
                    <Image
                      source={{ uri: injury.playerPhoto }}
                      style={styles.headshotImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.headshotFallback, { backgroundColor: "#FF6B35" }]}>
                      <Text style={styles.headshotInitials}>
                        {getPlayerInitials(injury.playerName)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.injuryPlayerName, { color: theme.colors.text }]} numberOfLines={1}>
                  {injury.playerName}
                </Text>
              </View>

              {/* Injury Reason */}
              <View style={styles.injuryReasonColumn}>
                <Text style={[styles.injuryText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                  {injury.reason || "Unknown"}
                </Text>
              </View>

              {/* Comeback Date */}
              <View style={styles.injuryComebackColumn}>
                <Text style={[styles.injuryText, { color: theme.colors.textSecondary }]}>
                  {formatDate(injury.expectedReturn)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Manager Section */}
      {manager && (
        <View style={[styles.managerSection, { borderBottomColor: isDarkMode ? "#333333" : "#E5E5E5" }]}>
          <View style={styles.managerIcon}>
            <Clock size={20} color={theme.colors.textSecondary} />
          </View>
          
          {renderManagerHeadshot()}
          
          <View style={styles.managerInfo}>
            <Text style={[styles.managerName, { color: theme.colors.text }]}>
              {manager.name}
            </Text>
            <Text style={[styles.managerMeta, { color: theme.colors.textSecondary }]}>
              {manager.age ? `${manager.age} years` : ""}
              {manager.age && (manager.nationality || manager.country) ? " / " : ""}
              {manager.nationality || manager.country || ""}
            </Text>
          </View>
        </View>
      )}

      {/* Position Sections */}
      {renderPositionSection("Forwards", forwards)}
      {renderPositionSection("Midfielders", midfielders)}
      {renderPositionSection("Defenders", defenders)}
      {renderPositionSection("Goalkeepers", goalkeepers)}

      {/* Injuries Section */}
      {renderInjuriesSection()}

      {/* Bottom Padding */}
      <View style={{ height: 20 }} />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  
  // Manager Section
  managerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  managerIcon: {
    marginRight: 12,
  },
  managerHeadshot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    overflow: "hidden",
    marginRight: 12,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  managerMeta: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
  },
  
  // Position Sections
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingLeft: 120, // Reduced space - more room for player info
  },
  headerColumn: {
    width: 45, // Compacted from 65
    alignItems: "center",
  },
  headerValueColumn: {
    width: 55, // Compacted from 70
    alignItems: "center",
  },
  headerText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  
  // Players Container
  playersContainer: {
    paddingHorizontal: 8, // Reduced padding for more space
  },
  
  // Player Row
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  
  // Jersey Container (at left edge)
  jerseyContainer: {
    marginLeft: 8,
    marginRight: 8,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  jerseyIcon: {
    position: "relative",
    width: 26,
    height: 26,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  jerseySleeves: {
    flexDirection: "row",
    position: "absolute",
    top: 1,
    left: -5,
    right: -5,
    justifyContent: "space-between",
  },
  jerseySleeve: {
    width: 9,
    height: 10,
    borderRadius: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  jerseyNumber: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
    zIndex: 1,
    // Color is set dynamically based on theme
  },
  
  // Headshot Container (next to jersey)
  headshotContainer: {
    marginRight: 10,
  },
  headshotWrapper: {
    position: "relative",
  },
  playerHeadshot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  
  // Player Info Column (more space for name, age, country & position)
  playerInfoColumn: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8,
  },
  headshotImage: {
    width: "100%",
    height: "100%",
  },
  headshotFallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  headshotInitials: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  // Professional silhouette fallback (person icon)
  silhouetteCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 2,
  },
  silhouetteBody: {
    width: 22,
    height: 12,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  injuryBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E53935",  // Bright red
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",  // White border for contrast
    zIndex: 10,
  },
  injuryIcon: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 14,
    textAlign: "center",
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
    marginBottom: 3,
  },
  playerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerMeta: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  countryFlag: {
    width: 20,
    height: 15,
    marginLeft: 2,
    borderRadius: 2,
  },
  
  // Stats Columns (Compacted)
  statsColumn: {
    width: 45, // Compacted from 65
    alignItems: "center",
  },
  valueColumn: {
    width: 55, // Compacted from 70
    alignItems: "center",
  },
  statValue: {
    fontSize: 13, // Slightly smaller
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  
  // Injuries Section
  injuryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingLeft: 160, // Space for player name
  },
  injuryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  injuryPlayerColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  injuryPlayerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  injuryReasonColumn: {
    width: 120,
    paddingHorizontal: 8,
  },
  injuryComebackColumn: {
    width: 85,
    alignItems: "center",
  },
  injuryText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
});

