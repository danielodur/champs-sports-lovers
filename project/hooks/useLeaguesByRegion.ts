/**
 * Hook to fetch leagues by region from API
 * Replaces hardcoded league lists with dynamic API data
 */

import { useState, useEffect } from "react";
import { leaguesByRegionService, LeagueData } from "../services/leaguesByRegionService";

type Region = "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia";

export function useLeaguesByRegion(region: Region, sport: string = "football") {
  const [leagues, setLeagues] = useState<LeagueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeagues = async () => {
      try {
        // Start with loading state
        setLoading(true);
        setError(null);
        
        // Fetch leagues (will return cached data instantly if available)
        const data = await leaguesByRegionService.getLeaguesByRegion(region, sport);
        
        if (isMounted) {
          setLeagues(data);
          // Loading should be instant with cache, but set to false anyway
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch leagues");
          setLoading(false);
        }
      }
    };

    fetchLeagues();

    return () => {
      isMounted = false;
    };
  }, [region, sport]);

  return { leagues, loading, error };
}

export function useLeaguesByCountry(region: Region, sport: string = "football") {
  const [leaguesByCountry, setLeaguesByCountry] = useState<Record<string, LeagueData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeagues = async () => {
      try {
        // Start with loading state
        setLoading(true);
        setError(null);
        
        // Fetch leagues (will return cached data instantly if available)
        const data = await leaguesByRegionService.getLeaguesByCountry(region, sport);
        
        if (isMounted) {
          setLeaguesByCountry(data);
          // Loading should be instant with cache, but set to false anyway
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch leagues");
          setLoading(false);
        }
      }
    };

    fetchLeagues();

    return () => {
      isMounted = false;
    };
  }, [region, sport]);

  return { leaguesByCountry, loading, error };
}
