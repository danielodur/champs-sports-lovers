import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, ScrollView } from "react-native";
import { TeamLeagueRankings, TeamManagersRecords, TeamHonors } from "./info";

interface TeamData {
  stadium: string;
  city: string;
  goalsFor: number;
  goalsAgainst: number;
  name?: string;
  founded?: number;
  country?: string;
  logo?: string; // ✅ Add logo property
}

interface TeamInfo {
  founded?: number;
  country?: string;
  countryCode?: string;
  stadiumCapacity?: number;
  teamManager?: string;
  totalMembers?: number;
  averageAge?: number;
  marketValue?: number;
}

interface FormerManager {
  name: string;
  photo: string;
  startDate: string;
  endDate: string;
  matchesManaged: number;
  wins: number;
  draws: number;
  losses: number;
  winPercentage: number;
}

interface TeamHonor {
  id?: string; // ✅ Make id optional to match child component
  competition: string;
  competitionLogo: string;
  timesWon: number;
  seasons: string[] | Array<{ year: string; team: string; teamLogo?: string; }>; // ✅ Support both formats
}

interface NewsTeamDetailsInfoProps {
  teamData: TeamData;
  teamInfo?: TeamInfo | null;
  formerManagers?: FormerManager[];
  honors?: TeamHonor[];
  theme: any;
  loading?: boolean;
  teamId?: number;
  leagueId?: number;
  teamColors?: {
    primary: string;
    secondary: string;
  };
  sport?: string; // ✅ Add sport parameter
}

export default function NewsTeamDetailsInfo({
  teamData,
  teamInfo,
  formerManagers = [],
  honors = [],
  theme,
  teamId,
  leagueId,
  teamColors = { primary: "#FF1744", secondary: "#FF6B35" },
  sport = "football", // ✅ Default to football
}: NewsTeamDetailsInfoProps) {
  
  // Debug logging
  React.useEffect(() => {
    console.log(`📊 [NewsTeamDetailsInfo] Data received:`, {
      teamManager: teamInfo?.teamManager,
      formerManagersCount: formerManagers?.length || 0,
      honorsCount: honors?.length || 0,
      formerManagers: formerManagers?.slice(0, 3).map(m => m.name),
      honors: honors?.slice(0, 3).map(h => h.competition),
    });
  }, [teamInfo, formerManagers, honors]);
  
  // Check if we're in dark mode
  const isDarkMode = theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";
  const greyBackground = isDarkMode ? "#3A3A3A" : "#F5F5F5";
  const borderColor = isDarkMode ? "#4A4A4A" : "#E0E0E0";

  // Helper function to format stadium capacity
  const formatCapacity = (capacity?: number): string => {
    if (!capacity) return "";
    if (capacity >= 1000) {
      return `${(capacity / 1000).toFixed(0)}000`;
    }
    return capacity.toString();
  };

  // Get country flag URL from country code or country name
  const getCountryFlag = (countryCode?: string, countryName?: string): string => {
    if (countryCode) {
      return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
    }
    // If no country code, try to derive from country name
    if (countryName) {
      // Common country name to code mappings
      const countryMap: { [key: string]: string } = {
        "England": "GB",
        "Spain": "ES",
        "Italy": "IT",
        "Germany": "DE",
        "France": "FR",
        "Netherlands": "NL",
        "Portugal": "PT",
        "Belgium": "BE",
        "Brazil": "BR",
        "Argentina": "AR",
        "Mexico": "MX",
        "USA": "US",
        "United States": "US",
        "Japan": "JP",
        "South Korea": "KR",
        "China": "CN",
        "Russia": "RU",
        "Turkey": "TR",
        "Greece": "GR",
        "Scotland": "GB",
        "Wales": "GB",
        "Ireland": "IE",
        "Norway": "NO",
        "Sweden": "SE",
        "Denmark": "DK",
        "Poland": "PL",
        "Czech Republic": "CZ",
        "Austria": "AT",
        "Switzerland": "CH",
        "Croatia": "HR",
        "Serbia": "RS",
        "Ukraine": "UA",
        "Romania": "RO",
        "Bulgaria": "BG",
        "Hungary": "HU",
        "Finland": "FI",
        "Iceland": "IS",
        "Egypt": "EG",
        "Morocco": "MA",
        "Algeria": "DZ",
        "Tunisia": "TN",
        "South Africa": "ZA",
        "Nigeria": "NG",
        "Ghana": "GH",
        "Senegal": "SN",
        "Ivory Coast": "CI",
        "Cameroon": "CM",
        "Uganda": "UG",
        "Kenya": "KE",
        "Tanzania": "TZ",
        "Australia": "AU",
        "New Zealand": "NZ",
        "Canada": "CA",
        "Chile": "CL",
        "Colombia": "CO",
        "Peru": "PE",
        "Ecuador": "EC",
        "Uruguay": "UY",
        "Paraguay": "PY",
        "Venezuela": "VE",
        "Bolivia": "BO",
        "Saudi Arabia": "SA",
        "United Arab Emirates": "AE",
        "Qatar": "QA",
        "Kuwait": "KW",
        "Iran": "IR",
        "Iraq": "IQ",
        "Israel": "IL",
        "India": "IN",
        "Thailand": "TH",
        "Vietnam": "VN",
        "Indonesia": "ID",
        "Malaysia": "MY",
        "Singapore": "SG",
        "Philippines": "PH",
      };
      
      const normalizedName = countryName.trim();
      const code = countryMap[normalizedName] || countryMap[normalizedName.toLowerCase()];
      if (code) {
        return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
      }
    }
    return "";
  };
  
  // Get country code from country name (fallback)
  const getCountryCodeFromName = (countryName?: string): string | undefined => {
    if (!countryName) return undefined;
    
    // Try to match common country names to ISO codes
    const countryMap: { [key: string]: string } = {
      "England": "GB",
      "Spain": "ES",
      "Italy": "IT",
      "Germany": "DE",
      "France": "FR",
      "Netherlands": "NL",
      "Portugal": "PT",
      "Belgium": "BE",
      "Brazil": "BR",
      "Argentina": "AR",
      "Mexico": "MX",
      "USA": "US",
      "United States": "US",
      "Japan": "JP",
      "South Korea": "KR",
      "China": "CN",
      "Russia": "RU",
      "Turkey": "TR",
      "Greece": "GR",
      "Scotland": "GB",
      "Wales": "GB",
      "Ireland": "IE",
      "Norway": "NO",
      "Sweden": "SE",
      "Denmark": "DK",
      "Poland": "PL",
      "Czech Republic": "CZ",
      "Austria": "AT",
      "Switzerland": "CH",
      "Croatia": "HR",
      "Serbia": "RS",
      "Ukraine": "UA",
      "Romania": "RO",
      "Bulgaria": "BG",
      "Hungary": "HU",
      "Finland": "FI",
      "Iceland": "IS",
      "Egypt": "EG",
      "Morocco": "MA",
      "Algeria": "DZ",
      "Tunisia": "TN",
      "South Africa": "ZA",
      "Nigeria": "NG",
      "Ghana": "GH",
      "Senegal": "SN",
      "Ivory Coast": "CI",
      "Cameroon": "CM",
      "Uganda": "UG",
      "Kenya": "KE",
      "Tanzania": "TZ",
      "Australia": "AU",
      "New Zealand": "NZ",
      "Canada": "CA",
      "Chile": "CL",
      "Colombia": "CO",
      "Peru": "PE",
      "Ecuador": "EC",
      "Uruguay": "UY",
      "Paraguay": "PY",
      "Venezuela": "VE",
      "Bolivia": "BO",
      "Saudi Arabia": "SA",
      "United Arab Emirates": "AE",
      "Qatar": "QA",
      "Kuwait": "KW",
      "Iran": "IR",
      "Iraq": "IQ",
      "Israel": "IL",
      "India": "IN",
      "Thailand": "TH",
      "Vietnam": "VN",
      "Indonesia": "ID",
      "Malaysia": "MY",
      "Singapore": "SG",
      "Philippines": "PH",
    };
    
    const normalizedName = countryName.trim();
    return countryMap[normalizedName] || countryMap[normalizedName.toLowerCase()] || undefined;
  };

  // Format market value with proper number formatting
  const formatMarketValue = (value?: number): string => {
    if (!value || value === 0) return "";
    
    // Convert to appropriate unit
    if (value >= 1000) {
      // Billions
      return `${(value / 1000).toFixed(2)}B`;
    } else if (value >= 1) {
      // Millions
      return `${value.toFixed(1)}M`;
    } else {
      // Less than 1M (thousands)
      return `${(value * 1000).toFixed(0)}K`;
    }
  };

  // Build info rows dynamically based on available data
  // Order: Manager → Country → Stadium → Capacity → Founded in → Members → Age → Market Value
  const buildInfoRows = () => {
    const rows = [];

    // 1. Team Manager (ALWAYS FIRST if available)
    if (teamInfo?.teamManager) {
      rows.push({
        label: "Team Manager:",
        value: teamInfo.teamManager,
        type: "text",
      });
    }

    // 2. Country/Region with flag
    if (teamInfo?.country || teamData.country) {
      const countryName = teamInfo?.country || teamData.country;
      const countryCode = teamInfo?.countryCode || getCountryCodeFromName(countryName);
      rows.push({
        label: "Country/Region:",
        value: countryName,
        type: "country",
        countryCode: countryCode,
      });
    }

    // 3. Stadium
    if (teamData.stadium && teamData.stadium !== "Stadium") {
      rows.push({
        label: "Stadium:",
        value: teamData.stadium,
        type: "text",
      });
    }

    // 4. Stadium Capacity
    if (teamInfo?.stadiumCapacity) {
      rows.push({
        label: "Stadium Capacity:",
        value: formatCapacity(teamInfo.stadiumCapacity),
        type: "text",
      });
    }

    // 5. Founded in (moved after Stadium Capacity)
    if (teamInfo?.founded || teamData.founded) {
      rows.push({
        label: "Founded in:",
        value: (teamInfo?.founded || teamData.founded)?.toString() || "",
        type: "text",
      });
    }

    // 6. Total Team Members (squad size)
    if (teamInfo?.totalMembers) {
      rows.push({
        label: "Total Team Members:",
        value: `${teamInfo.totalMembers}`,
        type: "text",
      });
    }

    // 7. Average Team Age
    if (teamInfo?.averageAge) {
      rows.push({
        label: "Average Team Age:",
        value: `${teamInfo.averageAge}`,
        type: "text",
      });
    }

    // 8. Total Market Value (after Average Team Age)
    if (teamInfo?.marketValue) {
      rows.push({
        label: "Total Market Value:",
        value: `€${formatMarketValue(teamInfo.marketValue)}`,
        type: "text",
      });
    }

    return rows;
  };

  const infoRows = buildInfoRows();

  // Don't show section if no data available
  if (infoRows.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.tabContent,
        { backgroundColor: greyBackground },
      ]}
    >
      <View
        style={[
          styles.infoCard,
          { backgroundColor: greyBackground },
        ]}
      >
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          Basic Info
        </Text>
        {infoRows.map((row, index) => (
          <View
            key={index}
            style={[
              styles.infoRow,
              { 
                borderBottomColor: borderColor,
                borderBottomWidth: index < infoRows.length - 1 ? 1 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.infoLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              {row.label}
            </Text>
            
            {row.type === "country" ? (
              <View style={styles.countryContainer}>
                {(() => {
                  const flagUrl = getCountryFlag(row.countryCode, row.value);
                  return flagUrl ? (
                    <Image
                      source={{ uri: flagUrl }}
                      style={styles.countryFlag}
                      resizeMode="contain"
                      onError={(e) => {
                        console.warn(`Failed to load flag for ${row.value}:`, e);
                      }}
                    />
                  ) : null;
                })()}
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {row.value}
                </Text>
              </View>
            ) : (
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {row.value}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* League Rankings Section - ✅ Show only if data exists (for both basketball and football) */}
      {teamId && leagueId && (
        <TeamLeagueRankings
          teamId={teamId}
          leagueId={leagueId}
          theme={theme}
          teamColors={teamColors}
        />
      )}

      {/* Managers Records Section - ✅ Show only if data exists (for both basketball and football) */}
      {teamId && (
        <TeamManagersRecords
          teamId={teamId}
          theme={theme}
          teamColors={teamColors}
        />
      )}

      {/* Honors Section - ✅ Show only if honors data exists (for both basketball and football) */}
      {teamId && honors && honors.length > 0 && (
        <>
          <View style={[styles.separator, { backgroundColor: borderColor }]} />
          <TeamHonors
            // @ts-ignore - Type conversion handled by child component
            honors={honors}
            theme={theme}
            teamColors={teamColors}
            teamId={teamId}
            teamName={teamData.name}
            teamLogo={teamData.logo}
          />
        </>
      )}
    </View>
  );
}

// Helper function to calculate duration
function calculateDuration(startDate: string, endDate: string): string {
  // Parse dates and calculate duration
  // Format: "YYYY/MM/DD~YYYY/MM/DD"
  try {
    const start = new Date(startDate.replace(/\//g, "-"));
    const end = new Date(endDate.replace(/\//g, "-"));
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    if (years > 0) {
      return `${years} Year${years > 1 ? 's' : ''} ${months} Month${months !== 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} Month${months > 1 ? 's' : ''} ${days} Day${days !== 1 ? 's' : ''}`;
    } else {
      return `${days} Day${days !== 1 ? 's' : ''}`;
    }
  } catch {
    return "";
  }
}

const styles = StyleSheet.create({
  tabContent: {
    padding: 0,
  },
  infoCard: {
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "400",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  countryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countryFlag: {
    width: 24,
    height: 16,
    borderRadius: 2,
  },
  separator: {
    height: 1,
    width: "100%",
    marginVertical: 0,
  },
  // Former Managers Section
  managersSection: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  managersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  managersTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },
  viewAllButton: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "500",
  },
  managerRow: {
    paddingVertical: 16,
  },
  managerPeriod: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  periodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF1744",
  },
  periodText: {
    fontSize: 13,
    fontWeight: "400",
  },
  managerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  managerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  managerPhotoPlaceholder: {
    backgroundColor: "#666",
    justifyContent: "center",
    alignItems: "center",
  },
  managerInitials: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  managerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  managerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  managerMatches: {
    fontSize: 14,
    fontWeight: "500",
  },
  managerWinRate: {
    fontSize: 14,
    fontWeight: "600",
  },
  managerRecord: {
    fontSize: 13,
    fontWeight: "400",
  },
  // Honors Section Wrapper
  honorsSectionWrapper: {
    marginTop: 12,
    paddingHorizontal: 0,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalScroll: {
    padding: 16,
  },
  modalManagerRow: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalManagerPeriod: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  modalPeriodText: {
    fontSize: 13,
    fontWeight: "400",
  },
  modalDuration: {
    fontSize: 12,
    fontStyle: "italic",
  },
  modalManagerDetails: {
    flexDirection: "row",
    gap: 12,
  },
  modalManagerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalManagerInitials: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalManagerTextInfo: {
    flex: 1,
    justifyContent: "center",
  },
  modalManagerName: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalStatsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
  },
  modalMatchCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalWinRate: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalRecord: {
    fontSize: 13,
    fontWeight: "400",
  },
});

