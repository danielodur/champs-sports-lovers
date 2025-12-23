/**
 * useTeamData Hook
 * Fetches real team data from API-Football and SportsDB APIs
 * Provides live team statistics, standings, matches, and info
 */

import { useState, useEffect } from "react";
import Constants from "expo-constants";

interface TeamDataResult {
  id: string;
  name: string;
  englishName: string;
  logo: string;
  stadium: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  position: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  recentForm: ("W" | "D" | "L")[];
  upcomingMatches: Array<{
    opponent: string;
    date: string;
    homeAway: "H" | "A";
  }>;
  news: Array<{
    id: string;
    title: string;
    summary: string;
    time: string;
    image: string;
  }>;
  loading: boolean;
  error: string | null;
}

interface ApiFootballTeam {
  id: number;
  name: string;
  code?: string;
  country: string;
  founded?: number;
  national: boolean;
  logo: string;
}

interface ApiFootballVenue {
  id: number;
  name: string;
  address?: string;
  city: string;
  capacity?: number;
  surface?: string;
  image?: string;
}

interface ApiFootballStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description?: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const CACHE = new Map<string, { data: any; expiry: number }>();
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

function getApiKey(): string {
  return (
    Constants.expoConfig?.extra?.apiFootballKey ||
    process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
    ""
  );
}

async function apiFootballFetch<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ API-Football key not available");
    return null;
  }

  const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    const url = new URL(`${API_FOOTBALL_BASE}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "v3.football.api-sports.io",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    CACHE.set(cacheKey, { data, expiry: Date.now() + CACHE_DURATION });
    return data;
  } catch (error) {
    console.warn(`⚠️ API-Football ${endpoint} failed:`, error);
    return null;
  }
}

function parseFormString(form: string): ("W" | "D" | "L")[] {
  if (!form) return [];
  return form
    .split("")
    .filter((char) => ["W", "D", "L"].includes(char))
    .slice(-3) as ("W" | "D" | "L")[];
}

export function useTeamData(
  teamName: string,
  teamId?: string,
  leagueId?: number,
): TeamDataResult {
  const [data, setData] = useState<TeamDataResult>({
    id: teamId || "",
    name: teamName,
    englishName: teamName,
    logo: "",
    stadium: "Stadium",
    city: "City",
    primaryColor: "#666666",
    secondaryColor: "#FFFFFF",
    position: 0,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    recentForm: [],
    upcomingMatches: [],
    news: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchTeamData() {
      try {
        const currentSeason = new Date().getFullYear();
        
        // Fetch team info and standings in parallel
        const [teamResponse, standingsResponse] = await Promise.all([
          apiFootballFetch<any>("teams", { name: teamName }),
          leagueId
            ? apiFootballFetch<any>("standings", {
                league: leagueId,
                season: currentSeason,
              })
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        let teamInfo: ApiFootballTeam | null = null;
        let venue: ApiFootballVenue | null = null;
        let standing: ApiFootballStanding | null = null;

        // Extract team info
        if (teamResponse?.response?.[0]) {
          teamInfo = teamResponse.response[0].team;
          venue = teamResponse.response[0].venue;
        }

        // Extract standings
        if (standingsResponse?.response?.[0]?.league?.standings?.[0]) {
          const standings = standingsResponse.response[0].league.standings[0];
          standing = standings.find(
            (s: ApiFootballStanding) =>
              s.team.name.toLowerCase() === teamName.toLowerCase()
          );
        }

        // Fetch recent and upcoming fixtures
        const fixturesResponse = await apiFootballFetch<any>("fixtures", {
          team: teamInfo?.id,
          last: 10,
        });

        const upcomingResponse = await apiFootballFetch<any>("fixtures", {
          team: teamInfo?.id,
          next: 5,
        });

        if (cancelled) return;

        // Process upcoming matches
        const upcoming =
          upcomingResponse?.response?.slice(0, 3).map((fixture: any) => {
            const isHome = fixture.teams.home.name === teamName;
            const opponent = isHome
              ? fixture.teams.away.name
              : fixture.teams.home.name;
            const matchDate = new Date(fixture.fixture.date);
            const formattedDate = `${matchDate.getMonth() + 1}/${matchDate.getDate()} ${matchDate.getHours()}:${matchDate.getMinutes().toString().padStart(2, "0")}`;

            return {
              opponent,
              date: formattedDate,
              homeAway: isHome ? ("H" as const) : ("A" as const),
            };
          }) || [];

        setData({
          id: teamId || teamInfo?.id?.toString() || "",
          name: teamInfo?.name || teamName,
          englishName: teamInfo?.name || teamName,
          logo: teamInfo?.logo || "",
          stadium: venue?.name || "Stadium",
          city: venue?.city || "City",
          primaryColor: "#666666", // Will use team config colors
          secondaryColor: "#FFFFFF",
          position: standing?.rank || 0,
          points: standing?.points || 0,
          wins: standing?.all?.win || 0,
          draws: standing?.all?.draw || 0,
          losses: standing?.all?.lose || 0,
          goalsFor: standing?.all?.goals?.for || 0,
          goalsAgainst: standing?.all?.goals?.against || 0,
          recentForm: standing?.form ? parseFormString(standing.form) : [],
          upcomingMatches: upcoming,
          news: [],
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;
        console.error("useTeamData error:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load team data",
        }));
      }
    }

    fetchTeamData();

    return () => {
      cancelled = true;
    };
  }, [teamName, teamId, leagueId]);

  return data;
}

