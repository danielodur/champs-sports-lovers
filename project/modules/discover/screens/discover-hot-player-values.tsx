import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  MarketValueScope,
  PlayerMarketValueItem,
  TeamMarketValueItem,
  getPlayerMarketValues,
  getTeamMarketValues,
  formatValueForScope,
} from "@/utils/player-market-values";

const filterTabs: Array<{ id: MarketValueScope; label: string }> = [
  { id: "global", label: "Global" },
  { id: "topFive", label: "Top Leagues" },
  { id: "asia", label: "Africa" },
  { id: "domestic", label: "Domestic" },
];

const valueTabs: Array<{ id: ValueTab; label: string }> = [
  { id: "players", label: "Players" },
  { id: "teams", label: "Teams" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type ValueTab = "players" | "teams";

export default function DiscoverHotPlayerValuesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [scope, setScope] = useState<MarketValueScope>("global");
  const [activeTab, setActiveTab] = useState<ValueTab>("players");
  const [players, setPlayers] = useState<PlayerMarketValueItem[]>([]);
  const [teams, setTeams] = useState<TeamMarketValueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadValues() {
      setLoading(true);
      setError(null);
      try {
        const [playerValues, teamValues] = await Promise.all([
          getPlayerMarketValues(scope),
          getTeamMarketValues(scope),
        ]);
        if (cancelled) return;
        setPlayers(playerValues);
        setTeams(teamValues);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load market values", err);
        setError("Unable to fetch market value data right now.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadValues();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        headerTitle: {
          fontSize: 20,
          fontWeight: "600",
          color: theme.colors.text,
        },
        backButton: {
          paddingVertical: 8,
          paddingRight: 16,
        },
        filtersContainer: {
          paddingHorizontal: 16,
          paddingBottom: 12,
        },
        filterPills: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        },
        filterButton: {
          alignItems: "center",
          flex: 1,
        },
        filterLabel: {
          fontSize: 15,
          fontWeight: "600",
          color: theme.colors.textSecondary,
        },
        filterLabelActive: {
          color: theme.colors.text,
        },
        underline: {
          height: 2,
          marginTop: 6,
          width: "40%",
          alignSelf: "center",
          backgroundColor: "transparent",
          borderRadius: 1,
        },
        underlineActive: {
          backgroundColor: theme.colors.primary,
        },
        toggleRow: {
          flexDirection: "row",
          paddingHorizontal: 16,
          marginBottom: 12,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 18,
          alignItems: "center",
        },
        toggleButton: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
          borderRadius: 20,
          marginHorizontal: 4,
        },
        toggleLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: theme.colors.textSecondary,
        },
        toggleLabelActive: {
          color: theme.colors.primary,
        },
        toggleActiveBackground: {
          backgroundColor: `${theme.colors.text}33`,
        },
        listContainer: {
          flex: 1,
        },
        tableHeaderRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        tableHeaderText: {
          color: theme.colors.text,
          fontSize: 12,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        rowContainer: {
          paddingHorizontal: 16,
        },
        rowCard: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
        },
        entityColumn: {
          flex: 1.6,
          flexDirection: "row",
          alignItems: "center",
        },
        entityDetails: {
          flex: 1,
          justifyContent: "center",
          marginLeft: 4,
          marginRight: 8,
        },
        countryColumn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          marginLeft: 12,
        },
        rankBadge: {
          width: 32,
          alignItems: "flex-start",
        },
        rankText: {
          fontSize: 14,
          fontWeight: "600",
          color: theme.colors.textSecondary,
        },
        avatar: {
          width: 42,
          height: 42,
          borderRadius: 21,
          marginRight: 6,
          backgroundColor: theme.colors.backgroundSecondary || `${theme.colors.text}08`,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${theme.colors.text}12`,
        },
        avatarFallback: {
          width: 42,
          height: 42,
          borderRadius: 21,
          marginRight: 6,
          backgroundColor: `${theme.colors.text}05`,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${theme.colors.text}12`,
        },
        avatarFallbackText: {
          color: "#F1F5F9",
          fontWeight: "600",
        },
        rowContent: {
          flex: 1,
        },
        rowTitle: {
          fontSize: 15,
          fontWeight: "600",
          color: theme.colors.text,
        },
        rowSubtitle: {
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
        valueContainer: {
          width: 110,
          alignItems: "flex-end",
          justifyContent: "center",
          marginLeft: 8,
        },
        valueText: {
          color: theme.colors.text,
          fontWeight: "600",
          fontSize: 15,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
        errorText: {
          marginTop: 16,
          color: theme.colors.textSecondary,
        },
        flagText: {
          fontSize: 16,
        },
        entityMeta: {
          gap: 2,
          flex: 1,
        },
        tableSubtitle: {
          marginTop: 2,
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
        countryLabel: {
          marginLeft: 6,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border,
          alignSelf: "stretch",
        },
        rankHeader: {
          width: 32,
        },
        headerSpacer: {
          width: 42,
          marginRight: 12,
        },
        headerEntity: {
          marginLeft: 0,
        },
        teamsHeaderSpacer: {
          flex: 1,
        },
      }),
    [theme.colors],
  );

  const renderPlayerRow = ({ item, index }: { item: PlayerMarketValueItem; index: number }) => (
    <View style={themedStyles.rowCard}>
      <View style={themedStyles.rankBadge}>
        <Text style={themedStyles.rankText}>{index + 1}</Text>
      </View>
      {item.headshot ? (
        <Image 
          source={{ uri: item.headshot }} 
          style={themedStyles.avatar}
        />
      ) : (
        <View style={themedStyles.avatarFallback}>
          <Text style={themedStyles.avatarFallbackText}>{getInitials(item.name)}</Text>
        </View>
      )}
      <View style={themedStyles.entityDetails}>
        <Text style={themedStyles.rowTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={themedStyles.tableSubtitle} numberOfLines={1}>
          {item.teamName}
        </Text>
      </View>
      <View style={themedStyles.countryColumn}>
        <Text style={themedStyles.flagText}>{item.flagEmoji}</Text>
        <Text style={[themedStyles.rowSubtitle, themedStyles.countryLabel]} numberOfLines={1}>
          {item.nationality}
        </Text>
      </View>
      <View style={themedStyles.valueContainer}>
        <Text style={themedStyles.valueText}>
          {formatValueForScope(item.valueEUR, scope)}
        </Text>
      </View>
    </View>
  );

  const renderTeamRow = ({ item, index }: { item: TeamMarketValueItem; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: "/team-details",
          params: {
            teamName: item.name,
            teamId: item.id,
            sport: "football", // ✅ Market values are football-specific
          },
        });
      }}
    >
      <View style={themedStyles.rowCard}>
        <View style={themedStyles.rankBadge}>
          <Text style={themedStyles.rankText}>{index + 1}</Text>
        </View>
        {item.logo ? (
          <Image 
            source={{ uri: item.logo }} 
            style={themedStyles.avatar}
          />
        ) : (
          <View style={themedStyles.avatarFallback}>
            <Text style={themedStyles.avatarFallbackText}>{getInitials(item.name)}</Text>
          </View>
        )}
        <View style={themedStyles.entityDetails}>
          <Text style={themedStyles.rowTitle} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={themedStyles.valueContainer}>
          <Text style={themedStyles.valueText}>
            {formatValueForScope(item.totalValueEUR, scope)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={themedStyles.container}>
      <StatusBarSpacer />
      <View style={themedStyles.header}>
        <TouchableOpacity
          style={themedStyles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={themedStyles.headerTitle}>
          {t("playerValues.headerTitle", { defaultValue: "Market Values" })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={themedStyles.filtersContainer}>
        <View style={themedStyles.filterPills}>
          {filterTabs.map((tab) => {
            const active = scope === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={themedStyles.filterButton}
                onPress={() => setScope(tab.id)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    themedStyles.filterLabel,
                    active && themedStyles.filterLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    themedStyles.underline,
                    active && themedStyles.underlineActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={themedStyles.toggleRow}>
        {valueTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                themedStyles.toggleButton,
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  themedStyles.toggleLabel,
                  active && themedStyles.toggleLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={themedStyles.listContainer}>
        {loading ? (
          <View style={themedStyles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={themedStyles.errorText}>
              Fetching market values…
            </Text>
          </View>
        ) : error ? (
          <View style={themedStyles.loadingContainer}>
            <Text style={themedStyles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={themedStyles.tableHeaderRow}>
              <View style={themedStyles.rankHeader} />
              <View style={themedStyles.headerSpacer} />
              <View
                style={[
                  themedStyles.entityDetails,
                  themedStyles.headerEntity,
                ]}
              >
                <Text style={themedStyles.tableHeaderText}>
                  {activeTab === "players" ? "Player" : "Team"}
                </Text>
              </View>
              {activeTab === "players" ? (
                <View style={themedStyles.countryColumn}>
                  <Text style={themedStyles.tableHeaderText}>Country</Text>
                </View>
              ) : (
                <View style={themedStyles.teamsHeaderSpacer} />
              )}
              <View style={themedStyles.valueContainer}>
                <Text style={themedStyles.tableHeaderText}>
                  Market Value
                </Text>
              </View>
            </View>
            {activeTab === "players" ? (
              <FlatList<PlayerMarketValueItem>
                data={players}
                keyExtractor={(item, index) => `${item.id}-${index}-${scope}`}
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item, index }) => (
                  <View style={themedStyles.rowContainer}>
                    {renderPlayerRow({ item, index })}
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={themedStyles.divider} />}
                ListEmptyComponent={
                  <View style={themedStyles.loadingContainer}>
                    <Text style={themedStyles.errorText}>
                      No market values available for this filter yet.
                    </Text>
                  </View>
                }
              />
            ) : (
              <FlatList<TeamMarketValueItem>
                data={teams}
                keyExtractor={(item, index) => `${item.id}-${index}-${scope}`}
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item, index }) => (
                  <View style={themedStyles.rowContainer}>
                    {renderTeamRow({ item, index })}
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={themedStyles.divider} />}
                ListEmptyComponent={
                  <View style={themedStyles.loadingContainer}>
                    <Text style={themedStyles.errorText}>
                      No market values available for this filter yet.
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function StatusBarSpacer() {
  return <View style={{ height: 8 }} />;
}

