/**
 * Player Details - Info Tab
 * Comprehensive player statistics with ability preview,
 * strengths/weaknesses, transfer history, and honors section
 * Matches Chinese app design with full-width blocks
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import PlayerHonor from "./player-honor";
import PlayerAbilityPreview from "./player-ability-preview";
import PlayerDetailsTransfers from "./player-details-transfers";
import { getBasketballPositionDisplay } from "@/utils/basketball-position-mapper";

const { width } = Dimensions.get("window");

// Helper function to get country flag URL
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
  
  // Return flagcdn.com URL
  return `https://flagcdn.com/20x15/${countryCode}.png`;
};

interface PlayerStats {
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  passAccuracy: number;
  shotsOnTarget: number;
  tackles: number;
  interceptions: number;
}

interface TransferHistoryItem {
  id: string;
  date: string;
  fromTeam: string;
  fromTeamLogo: string;
  toTeam: string;
  toTeamLogo: string;
  fee: number; // in millions of euros
  type: "transfer" | "loan" | "free" | "contract";
}

interface PlayerHonor {
  id: string;
  competition: string;
  competitionLogo: string;
  timesWon: number;
  seasons: Array<{
    year: string;
    team: string;
    teamLogo?: string;
  }>;
}

interface PlayerAbilities {
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

interface PlayerDetailsInfoProps {
  stats: PlayerStats;
  abilities: PlayerAbilities;
  playerId?: string | number;
  transferHistory?: TransferHistoryItem[];
  honors?: PlayerHonor[];
  strengths?: string[];
  weaknesses?: string[];
  position?: string;
  currentTeam?: {
    id: string;
    name: string;
    logo?: string;
  };
  contractEndDate?: string;
  theme: any;
  playerColors: {
    primary: string;
    secondary: string;
  };
  loading?: boolean;
  // Player info props for top section
  playerName?: string;
  playerPhoto?: string;
  age?: number;
  height?: number;
  weight?: number;
  nationality?: string;
  nationalityFlag?: string;
  jerseyNumber?: number;
  preferredFoot?: string;
  birthDate?: string;
  // Navigation callback for ability tab
  onNavigateToAbility?: () => void;
  sport?: string; // ✅ Add sport parameter
}

export default function PlayerDetailsInfo({
  stats,
  abilities,
  playerId,
  transferHistory = [],
  honors = [],
  strengths = [],
  weaknesses = [],
  position = "ST",
  currentTeam,
  contractEndDate,
  theme,
  playerColors,
  loading = false,
  // Player info props
  playerName = "",
  playerPhoto = "",
  age = 0,
  height = 0,
  weight = 0,
  nationality = "",
  nationalityFlag = "",
  jerseyNumber = 0,
  preferredFoot = "",
  birthDate = "",
  // Navigation callback
  onNavigateToAbility,
  sport = "football", // ✅ Add sport with default
}: PlayerDetailsInfoProps) {
  const [fetchedTransferHistory, setFetchedTransferHistory] = useState<TransferHistoryItem[]>(transferHistory);
  const [fetchedHonors, setFetchedHonors] = useState<PlayerHonor[]>(honors);

  const isDarkMode = theme.colors.background === "#2A2A2A";
  const greyBackground = isDarkMode ? "#3A3A3A" : "#F5F5F5";
  const borderColor = isDarkMode ? "#4A4A4A" : "#E0E0E0";
  
  const isBasketball = sport === "basketball";
  
  // ✅ BASKETBALL: Map position to basketball format
  const displayPosition = isBasketball 
    ? getBasketballPositionDisplay(position)
    : position;
  
  console.log(`🏀⚽ [PlayerDetailsInfo] Sport: ${sport}, Position: ${position} → Display: ${displayPosition}`);
  
  // Fetch transfer history when playerId is available
  useEffect(() => {
    const fetchPlayerData = async () => {
      // If data is already provided via props, use it
      if (transferHistory && transferHistory.length > 0) {
        setFetchedTransferHistory(transferHistory);
      }
      if (honors && honors.length > 0) {
        setFetchedHonors(honors);
      }

      // If no playerId, can't fetch
      if (!playerId) {
        return;
      }

      const numericPlayerId = typeof playerId === "string" ? parseInt(playerId) : playerId;
      if (isNaN(numericPlayerId) || numericPlayerId <= 0) {
        return;
      }

      // Fetch transfers if not provided (now handled by PlayerDetailsTransfers component)
      // Keep this for backward compatibility if needed
      if ((!transferHistory || transferHistory.length === 0)) {
        try {
          const { getPlayerTransfers } = await import("@/services/sofaScoreTransfersService");
          const transfers = await getPlayerTransfers(numericPlayerId);
          
          if (transfers && transfers.length > 0) {
            const formattedTransfers: TransferHistoryItem[] = transfers.map((t) => ({
              id: t.id,
              date: t.date,
              fromTeam: t.fromTeam.name,
              fromTeamLogo: t.fromTeam.logo,
              toTeam: t.toTeam.name,
              toTeamLogo: t.toTeam.logo,
              fee: t.feeValue || 0,
              type: (t.type?.toLowerCase() as "transfer" | "loan" | "free" | "contract") || "transfer",
            }));
            setFetchedTransferHistory(formattedTransfers);
            console.log(`✅ [PlayerDetailsInfo] Loaded ${formattedTransfers.length} transfers`);
          }
        } catch (error) {
          console.warn(`⚠️ [PlayerDetailsInfo] Error fetching transfers:`, error);
        }
      }
    };

    fetchPlayerData();
  }, [playerId, transferHistory, honors]);

  // Format date as YYYY/MM/DD (matches Chinese app)
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return dateStr;
          }
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch {
      return dateStr;
    }
  };

  // Calculate age from birth date or use provided age
  const calculateAge = (birthDate?: string, providedAge?: number): number => {
    if (providedAge && providedAge > 0) return providedAge;
    if (!birthDate) return 0;
    try {
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) return 0;
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 0;
    }
  };


  // Player Info Section Component (top of stats screen)
  const renderPlayerInfoSection = () => {
    const playerAge = calculateAge(birthDate, age);
    const nationalityFlagUrl = getCountryFlagUrl(nationality);
    const formattedBirthDate = birthDate ? formatDate(birthDate) : "";
    const formattedContractEndDate = contractEndDate ? formatDate(contractEndDate) : "-";

    return (
      <View style={[styles.playerInfoSection, { backgroundColor: greyBackground }]}>
        <View style={styles.playerInfoRow}>
          {/* Left: Country Flag and Name */}
          <View style={styles.playerInfoLeft}>
            <View style={styles.playerInfoTopRow}>
              {nationalityFlagUrl && (
                <Image 
                  source={{ uri: nationalityFlagUrl }} 
                  style={styles.countryFlagSmall} 
                  resizeMode="contain" 
                />
              )}
            </View>
            <View style={styles.playerInfoBottomRow}>
              {nationality && (
                <Text style={[styles.countryName, { color: theme.colors.textSecondary }]}>{nationality}</Text>
              )}
            </View>
          </View>

          {/* Middle: Age and Date of Birth */}
          <View style={styles.playerInfoCenter}>
            <View style={styles.playerInfoTopRow}>
              {playerAge > 0 && (
                <Text style={[styles.playerInfoValue, { color: theme.colors.text }]}>
                  {playerAge}
                </Text>
              )}
            </View>
            <View style={styles.playerInfoBottomRow}>
              {formattedBirthDate && (
                <Text style={[styles.playerInfoLabel, { color: theme.colors.textSecondary }]}>
                  {formattedBirthDate}
                </Text>
              )}
            </View>
          </View>

          {/* Right: Contract Expiration Date */}
          <View style={styles.playerInfoRight}>
            <View style={styles.playerInfoTopRow}>
              <Text style={[styles.playerInfoValue, { color: theme.colors.text }]}>
                {formattedContractEndDate}
              </Text>
            </View>
            <View style={styles.playerInfoBottomRow}>
              <Text style={[styles.playerInfoLabel, { color: theme.colors.textSecondary }]}>
                Contract Expiry
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Market Value Graph Component - moved to player-networth-changes.tsx

  // Overall Ability Radar Chart Component - moved to player-ability-preview.tsx

  // Honors Section Component - moved to player-honor.tsx

  // Strengths and Weaknesses Component
  const renderStrengthsWeaknesses = () => {
    if (strengths.length === 0 && weaknesses.length === 0) return null;

    return (
      <View style={[styles.strengthsWeaknessesSection, { backgroundColor: greyBackground }]}>
        <View style={styles.strengthsWeaknessesContainer}>
          {/* Strengths */}
          {strengths.length > 0 && (
            <View style={styles.strengthsContainer}>
              <Text style={[styles.strengthsTitle, { color: "#FF3B30" }]}>Strengths</Text>
              <View style={styles.strengthsList}>
                {strengths.map((strength, index) => (
                  <View key={index} style={[styles.strengthTag, { backgroundColor: "rgba(255, 59, 48, 0.15)" }]}>
                    <Text style={[styles.strengthText, { color: "#FF3B30" }]}>
                      {strength}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Weaknesses */}
          {weaknesses.length > 0 && (
            <View style={styles.weaknessesContainer}>
              <Text style={[styles.weaknessesTitle, { color: "#4CAF50" }]}>Weaknesses</Text>
              <View style={styles.weaknessesList}>
                {weaknesses.map((weakness, index) => (
                  <View key={index} style={[styles.weaknessTag, { backgroundColor: "rgba(76, 175, 80, 0.15)" }]}>
                    <Text style={[styles.weaknessText, { color: "#4CAF50" }]}>
                      {weakness}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Transfer History Component - Now using PlayerDetailsTransfers component

  // No blocking loading - display stats immediately (starts with mock, updates with API data)
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Player Info Section at Top */}
      {renderPlayerInfoSection()}

      {/* Overall Ability Preview */}
      {/* ❌ BASKETBALL: Hide football-specific ability preview */}
      {!isBasketball && (
        <PlayerAbilityPreview
          abilities={abilities}
          theme={theme}
          playerColors={playerColors}
          onViewAll={onNavigateToAbility}
        />
      )}

      {/* Strengths and Weaknesses */}
      {renderStrengthsWeaknesses()}

      {/* Transfer History - ✅ Always show for football if playerId exists (component handles its own fetching/empty states) */}
      {/* For basketball, hide transfers section */}
      {!isBasketball && playerId && (
        <PlayerDetailsTransfers
          playerId={playerId || ""}
          playerName={playerName}
          playerPhoto={playerPhoto}
          playerAge={age}
          nationality={nationality}
          position={displayPosition} // ✅ Use mapped position
          theme={theme}
          playerColors={playerColors}
          transferHistory={fetchedTransferHistory} // Pass fetched data if available, component will fetch if empty
          sport={sport} // ✅ Pass sport
        />
      )}

      {/* Honors Section - ✅ Show only if honors data exists (for both basketball and football) */}
      {fetchedHonors && fetchedHonors.length > 0 && (
        <PlayerHonor
          honors={fetchedHonors}
          theme={theme}
          playerColors={playerColors}
          playerId={playerId}
          playerName={playerName}
          currentTeam={currentTeam}
          transferHistory={fetchedTransferHistory}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  // Player Info Section Styles
  playerInfoSection: {
    marginTop: 4,
    marginBottom: 4,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 0,
  },
  playerInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  playerInfoLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  playerInfoCenter: {
    flex: 1,
    alignItems: "center",
  },
  playerInfoRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  playerInfoTopRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    minHeight: 20,
  },
  playerInfoBottomRow: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 20,
  },
  countryFlagSmall: {
    width: 20,
    height: 15,
    marginBottom: 4,
  },
  countryName: {
    fontSize: 13,
    fontWeight: "500",
  },
  playerInfoValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  playerInfoLabel: {
    fontSize: 13,
    fontWeight: "400",
  },
  // Strengths and Weaknesses Section
  strengthsWeaknessesSection: {
    marginTop: 4,
    marginBottom: 4,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 0,
  },
  strengthsWeaknessesContainer: {
    paddingHorizontal: 16,
  },
  strengthsContainer: {
    marginBottom: 20,
  },
  strengthsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  weaknessesContainer: {
    marginTop: 20,
  },
  strengthsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  strengthTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: "600",
  },
  weaknessesTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  weaknessesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  weaknessTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  weaknessText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

// Removed functions - now in separate component files:
// - renderAbilityRadarChart() -> PlayerAbilityPreview component  
// - renderHonors() -> PlayerHonor component

