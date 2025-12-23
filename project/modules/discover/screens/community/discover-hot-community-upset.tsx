import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import ApiSportsService from "@/services/api-sports-service";
import teamRankingsService from "@/services/teamRankingsService";
// ✅ REMOVED: smartLeagueNameService - Using 100% API-driven league names
import { FootballFixturesResponse, Fixture } from "@/types/football-fixtures-response";
import { RefreshCw, ArrowLeft } from "lucide-react-native";
import DateSelector from "@/components/DateSelector";

interface UpsetMatch {
  id: number;
  league: string;
  leagueCountry?: string;
  date: string;
  kickOff: string;
  matchId: string;
  startTime: string;
  status: string;
  home: {
    name: string;
    logo: string;
    score: number;
    rank: number | null;
  };
  away: {
    name: string;
    logo: string;
    score: number;
    rank: number | null;
  };
  upsetIndex: number;
  rankGap: number;
  favoriteTeam: string;
  underdogTeam: string;
  resultType: "favorite" | "underdog" | "draw";
  resultNotice: string;
  resultAlignment: "left" | "center" | "right";
  odds?: {
    homeWin?: string;
    draw?: string;
    awayWin?: string;
  };
  halftimeScore: string;
  homeLogo: string | null;
  awayLogo: string | null;
}

const apiSportsService = new ApiSportsService({
  apiKey: process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "",
  enableCaching: true,
  cacheExpiry: 2 * 60 * 1000,
});

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

const isValidLogoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const invalidPatterns = [
    "null",
    "undefined",
    "placeholder",
    "default.png",
    "logo.png",
    "team.png",
  ];
  const lower = url.toLowerCase();
  return !invalidPatterns.some((pattern) => lower.includes(pattern));
};

const validateAndCorrectDate = (dateString: string): string => {
  const inputDate = new Date(dateString);
  if (isNaN(inputDate.getTime())) {
    console.warn("⚠️ Upset Date Fix: Invalid date detected, reverting to current date");
    const now = new Date();
    return now.toISOString().split("T")[0];
  }
  return dateString;
};

const getSafeCurrentDate = (): string => {
  try {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
    return validateAndCorrectDate(dateString);
  } catch (error) {
    console.error("❌ Upset Date generation failed, using fallback", error);
    const now = new Date();
    return now.toISOString().split("T")[0];
  }
};

const UpsetCard: React.FC<{ match: UpsetMatch; onPress: (match: UpsetMatch) => void }> = ({
  match,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPress(match)}
      style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.leagueText, { color: theme.colors.text }]}>{match.league}</Text>
          <Text style={[styles.leagueMetaText, { color: theme.colors.textSecondary }]}>
            {match.date} • {match.kickOff}
          </Text>
        </View>
      </View>

      <View style={styles.teamsRow}>
        <View style={[styles.teamBlock, styles.homeTeamBlock]}>
          <View style={styles.homeTeamContent}>
            {match.homeLogo ? (
              <Image
                source={{ uri: match.homeLogo }}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            ) : null}
            <Text
              style={[styles.teamName, styles.homeTeamName, { color: theme.colors.text }]}
            >
              <Text style={styles.rankBracket}>[{match.home.rank ?? "?"}]</Text>
              {match.home.name}
            </Text>
          </View>
        </View>
        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreText, { color: theme.colors.primary }]}
            >
            {match.home.score} - {match.away.score}
          </Text>
        </View>
        <View style={[styles.teamBlock, styles.awayTeamBlock]}>
          <View style={styles.awayTeamContent}>
            <Text
              style={[styles.teamName, styles.awayTeamName, { color: theme.colors.text }]}
            >
              {match.away.name}
              <Text style={styles.rankBracket}>[{match.away.rank ?? "?"}]</Text>
            </Text>
            {match.awayLogo ? (
              <Image
                source={{ uri: match.awayLogo }}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </View>

      <Text style={[styles.htScoreText, { color: theme.colors.textSecondary }]}
        >
        HT: {match.halftimeScore}
      </Text>

      <View
        style={[
          styles.noticeContainer,
          match.resultAlignment === "left" && styles.noticeLeft,
          match.resultAlignment === "center" && styles.noticeCenter,
          match.resultAlignment === "right" && styles.noticeRight,
        ]}
      >
        <Text style={styles.noticeText}>{match.resultNotice}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function DiscoverHotCommunityUpsetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(getSafeCurrentDate());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<UpsetMatch[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchUpsetMatches = useCallback(
    async (targetDate: string, isRefresh: boolean = false) => {
      try {
        const shouldShowBlockingLoader = !isRefresh && isInitialLoad;
        if (shouldShowBlockingLoader) {
          setLoading(true);
        }
        if (isRefresh) {
          setRefreshing(true);
        } else {
          if (!shouldShowBlockingLoader) {
            setLoading(false);
          }
        }
        setError(null);

        const normalizedDate = validateAndCorrectDate(targetDate);
        apiSportsService.clearCache();

        const response: FootballFixturesResponse = await apiSportsService.getFixtures(
          undefined,
          undefined,
          undefined,
          normalizedDate,
          undefined,
          undefined,
        );

        const finished = response.response.filter((fixture) =>
          FINISHED_STATUSES.has(fixture.fixture.status?.short || ""),
        );

        if (finished.length === 0) {
          setMatches([]);
          if (isInitialLoad) {
            setIsInitialLoad(false);
          }
          return;
        }

        const rankingsMap = await teamRankingsService.getBatchTeamRankings(
          finished.flatMap((fixture) => [
            {
              id: fixture.teams.home?.id ?? null,
              name: fixture.teams.home?.name || "",
              leagueId: fixture.league?.id ?? null,
              leagueName: fixture.league?.name || "",
            },
            {
              id: fixture.teams.away?.id ?? null,
              name: fixture.teams.away?.name || "",
              leagueId: fixture.league?.id ?? null,
              leagueName: fixture.league?.name || "",
            },
          ]),
        );

        type UpsetCandidate = {
          fixture: Fixture;
          enhancedLeague: string;
          leagueCountry?: string;
          matchDate: Date;
          homeRank: number | null;
          awayRank: number | null;
          homeScore: number;
          awayScore: number;
          upsetIndex: number;
          rankGap: number;
          resultType: UpsetMatch["resultType"];
          resultAlignment: UpsetMatch["resultAlignment"];
          resultLabel: string;
          favoriteTeam: string;
          underdogTeam: string;
          homeIsFavorite: boolean;
        };

        const candidates: UpsetCandidate[] = [];

        finished.forEach((fixture) => {
          if (!fixture.fixture?.date) {
            return;
          }

          const homeScore = fixture.goals.home ?? 0;
          const awayScore = fixture.goals.away ?? 0;
          
          // ✅ API-DRIVEN: Use raw league name from API
          let leagueName = fixture.league?.name || "Unknown League";
          const leagueCountry = fixture.league?.country;
          
          // ✅ API-DRIVEN: Only add country prefix for generic league names from non-native countries
          if (leagueCountry && 
              leagueName.toLowerCase() === "premier league" &&
              leagueCountry.toLowerCase() !== "england" &&
              leagueCountry.toLowerCase() !== "world") {
            leagueName = `${leagueCountry} - ${leagueName}`;
          }
          if (leagueCountry && 
              leagueName.toLowerCase() === "ligue 1" &&
              leagueCountry.toLowerCase() !== "france" &&
              leagueCountry.toLowerCase() !== "world") {
            leagueName = `${leagueCountry} - ${leagueName}`;
          }

          const homeRank = rankingsMap.get(fixture.teams.home?.name || "") ?? null;
          const awayRank = rankingsMap.get(fixture.teams.away?.name || "") ?? null;

          if (!homeRank || !awayRank) {
            return;
          }

          const rankGap = Math.abs(homeRank - awayRank);
          if (rankGap < 3) {
            return;
          }

          const homeIsFavorite = homeRank < awayRank;
          let resultType: UpsetMatch["resultType"] = "favorite";
          if (homeScore === awayScore) {
            resultType = "draw";
          } else {
            const homeWon = homeScore > awayScore;
            resultType = homeWon === homeIsFavorite ? "favorite" : "underdog";
          }

          if (resultType === "favorite") {
            return;
          }

          const goalDiff = Math.abs(homeScore - awayScore);
          const upsetIndex = Math.min(
            95,
            48 + rankGap * 4.2 + (resultType === "underdog" ? 8 : 4) + goalDiff * 5,
          );

          let resultAlignment: UpsetMatch["resultAlignment"] = "center";
          let resultLabel = "Draw";
          if (resultType !== "draw") {
            const homeWon = homeScore > awayScore;
            resultLabel = homeWon ? "Home Team Win" : "Away Team Win";
            resultAlignment = homeWon ? "left" : "right";
          }

          candidates.push({
            fixture,
            enhancedLeague: leagueName, // ✅ API-driven league name
            leagueCountry: fixture.league?.country || undefined,
            matchDate: new Date(fixture.fixture.date),
            homeRank,
            awayRank,
            homeScore,
            awayScore,
            upsetIndex,
            rankGap,
            resultType,
            resultAlignment,
            resultLabel,
            favoriteTeam: homeIsFavorite
              ? fixture.teams.home?.name || "Home"
              : fixture.teams.away?.name || "Away",
            underdogTeam: homeIsFavorite
              ? fixture.teams.away?.name || "Away"
              : fixture.teams.home?.name || "Home",
            homeIsFavorite,
          });
        });

        const prioritizedMatches = candidates
          .sort((a, b) => b.upsetIndex - a.upsetIndex)
          .slice(0, 40);

        const oddsMap = new Map<number, { homeWin?: string; draw?: string; awayWin?: string }>();

        const parseOddsResponse = (data: any) => {
          const oddsEntry = data?.response?.[0];
          if (!oddsEntry?.bookmakers) return null;
          const bookmakers = oddsEntry.bookmakers as any[];
          for (const bookmaker of bookmakers) {
            const bets = bookmaker?.bets as any[];
            if (!Array.isArray(bets)) continue;
            const matchWinnerBet = bets.find((bet) => {
              const name = String(bet?.name || "").toLowerCase();
              return name.includes("match winner") || name.includes("1x2");
            });
            if (matchWinnerBet?.values) {
              const values = matchWinnerBet.values as any[];
              const homeValue = values.find((v) =>
                String(v?.value || "").toLowerCase().includes("home"),
              );
              const drawValue = values.find((v) =>
                String(v?.value || "").toLowerCase().includes("draw"),
              );
              const awayValue = values.find((v) =>
                String(v?.value || "").toLowerCase().includes("away"),
              );
              return {
                homeWin: homeValue?.odd,
                draw: drawValue?.odd,
                awayWin: awayValue?.odd,
              };
            }
          }
          return null;
        };

        const batchSize = 5;
        for (let i = 0; i < prioritizedMatches.length; i += batchSize) {
          const batch = prioritizedMatches.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            batch.map((item) =>
              apiSportsService
                .getFixtureOdds(item.fixture.fixture.id)
                .catch((err) => {
                  console.warn(
                    `Odds fetch failed for fixture ${item.fixture.fixture.id}:`,
                    err,
                  );
                  return null;
                }),
            ),
          );

          results.forEach((res, index) => {
            if (res.status === "fulfilled" && res.value) {
              const parsed = parseOddsResponse(res.value);
              if (parsed) {
                oddsMap.set(batch[index].fixture.fixture.id, parsed);
              }
            }
          });

          if (prioritizedMatches.length > batchSize) {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        }

        const upsetMatches: UpsetMatch[] = prioritizedMatches.map((item) => {
          const odds = oddsMap.get(item.fixture.fixture.id);
          const dateText = item.matchDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          const timeText = item.matchDate.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });

          let noticeText = item.resultLabel;
          if (item.resultType === "draw") {
            if (odds?.draw) {
              noticeText = `Draw (${odds.draw})`;
            }
          } else {
            const homeWon = item.homeScore > item.awayScore;
            if (homeWon && odds?.homeWin) {
              noticeText = `Home Team Win (${odds.homeWin})`;
            } else if (!homeWon && odds?.awayWin) {
              noticeText = `Away Team Win (${odds.awayWin})`;
            }
          }

          const halftimeHome =
            item.fixture.score?.halftime?.home ?? item.homeScore;
          const halftimeAway =
            item.fixture.score?.halftime?.away ?? item.awayScore;

          const apiHomeLogo = item.fixture.teams.home?.logo || null;
          const apiAwayLogo = item.fixture.teams.away?.logo || null;
          const homeLogo = isValidLogoUrl(apiHomeLogo) ? apiHomeLogo : null;
          const awayLogo = isValidLogoUrl(apiAwayLogo) ? apiAwayLogo : null;

          return {
            id: item.fixture.fixture.id,
            league: item.enhancedLeague,
            leagueCountry: item.leagueCountry,
            date: dateText,
            kickOff: timeText,
            matchId: item.fixture.fixture.id.toString(),
            startTime: item.fixture.fixture.date,
            status: item.fixture.fixture.status?.short || "FT",
            home: {
              name: item.fixture.teams.home?.name || "Home",
              logo: item.fixture.teams.home?.logo || "",
              score: item.homeScore,
              rank: item.homeRank,
            },
            away: {
              name: item.fixture.teams.away?.name || "Away",
              logo: item.fixture.teams.away?.logo || "",
              score: item.awayScore,
              rank: item.awayRank,
            },
            upsetIndex: item.upsetIndex,
            rankGap: item.rankGap,
            favoriteTeam: item.favoriteTeam,
            underdogTeam: item.underdogTeam,
            resultType: item.resultType,
            resultNotice: noticeText,
            resultAlignment: item.resultAlignment,
            odds,
            halftimeScore: `${halftimeHome ?? 0}-${halftimeAway ?? 0}`,
            homeLogo,
            awayLogo,
          };
        });

        setMatches(upsetMatches);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      } catch (err) {
        console.error("Failed to load upset matches", err);
        setError("Unable to load upset index right now. Please try again shortly.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isInitialLoad],
  );

  useEffect(() => {
    fetchUpsetMatches(selectedDate);
  }, [selectedDate, fetchUpsetMatches]);

  const handleMatchPress = useCallback(
    (match: UpsetMatch) => {
      router.push({
        pathname: "/match-details",
        params: {
          matchId: match.matchId,
          homeTeam: match.home.name,
          awayTeam: match.away.name,
          homeScore: match.home.score.toString(),
          awayScore: match.away.score.toString(),
          status: match.status,
          league: match.league,
          startTime: match.startTime,
          homeLogo: match.homeLogo || "",
          awayLogo: match.awayLogo || "",
          homeCorners: "0",
          awayCorners: "0",
          homeRank: match.home.rank != null ? match.home.rank.toString() : undefined,
          awayRank: match.away.rank != null ? match.away.rank.toString() : undefined,
          halftimeScore: match.halftimeScore,
          from: "discover-hot-upset",
        },
      });
    },
    [router],
  );

  const handleRefresh = useCallback(() => {
    fetchUpsetMatches(selectedDate, true);
  }, [fetchUpsetMatches, selectedDate]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Upset</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <RefreshCw size={18} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelectorContainer}>
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          activeFilter="finished"
        />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Analyzing recent upsets…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { borderColor: theme.colors.primary }]}
              onPress={handleRefresh}
              activeOpacity={0.8}
            >
              <Text style={[styles.retryText, { color: theme.colors.primary }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No major upsets recorded for this date.</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {matches.map((match) => (
              <UpsetCard key={match.id} match={match} onPress={handleMatchPress} />
            ))}
          </View>
        )}
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
  },
  backButton: {
    padding: 6,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  refreshButton: {
    padding: 6,
    borderRadius: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  dateSelectorContainer: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  errorContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
  },
  cardsContainer: {
    paddingHorizontal: 0,
    gap: 12,
  },
  card: {
    borderRadius: 0,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leagueText: {
    fontSize: 14,
    fontWeight: "600",
  },
  leagueMetaText: {
    fontSize: 12,
    marginTop: 4,
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  teamBlock: {
    flex: 1,
  },
  homeTeamBlock: {
    alignItems: "flex-end",
  },
  awayTeamBlock: {
    alignItems: "flex-start",
  },
  homeTeamContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  awayTeamContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    flexWrap: "wrap",
    lineHeight: 18,
  },
  homeTeamName: {
    textAlign: "right",
  },
  awayTeamName: {
    textAlign: "left",
  },
  scoreBlock: {
    minWidth: 90,
    alignItems: "center",
    gap: 4,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "700",
  },
  htScoreText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  rankBracket: {
    color: "#9CA3AF",
  },
  noticeContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    minWidth: "45%",
  },
  noticeLeft: {
    alignSelf: "flex-start",
  },
  noticeCenter: {
    alignSelf: "center",
  },
  noticeRight: {
    alignSelf: "flex-end",
  },
  noticeText: {
    color: "#FF3B30",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  teamLogo: {
    width: 28,
    height: 28,
  },
});
