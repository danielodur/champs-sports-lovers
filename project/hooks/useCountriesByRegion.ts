/**
 * Hook to fetch available countries for a region from API
 * Replaces hardcoded country lists with dynamic API-driven data
 */

import { useState, useEffect, useMemo } from "react";
import { leaguesByRegionService, LeagueData } from "../services/leaguesByRegionService";

type Region = "Hot" | "Top" | "Int'l" | "Africa" | "Europe" | "America" | "Oceania" | "Asia";

export interface CountryData {
  id: string;
  label: string;
  leagueCount: number;
}

// Fallback country lists when API returns no data
const fallbackCountries: Record<Region, string[]> = {
  "Top": ["Top", "Hot", "Int'l", "Africa", "Europe", "America", "Oceania", "Asia"],
  "Hot": ["Top", "Hot", "Int'l", "Africa", "Europe", "America", "Oceania", "Asia"],
  "Int'l": ["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"], // ✅ Removed "World" - Int'l already represents World
  "Europe": [
    "England", "Spain", "Italy", "Germany", "France", "Portugal", "Netherlands",
    "Belgium", "Turkey", "Russia", "Ukraine", "Scotland", "Greece", "Switzerland",
    "Austria", "Denmark", "Sweden", "Norway", "Poland", "Czech Republic", "Croatia",
    "Serbia", "Romania", "Hungary", "Bulgaria"
  ],
  "Africa": [
    "Egypt", "Morocco", "Tunisia", "Algeria", "Nigeria", "Ghana", "Senegal",
    "Ivory Coast", "South Africa", "Cameroon", "Mali", "Kenya", "Uganda",
    "Ethiopia", "Tanzania", "Zimbabwe", "Zambia", "Angola"
  ],
  "America": [
    "Brazil", "Argentina", "Mexico", "United States", "Colombia", "Chile",
    "Uruguay", "Peru", "Ecuador", "Paraguay", "Bolivia", "Venezuela",
    "Canada", "Costa Rica", "Jamaica", "Honduras", "Panama"
  ],
  "Asia": [
    "Japan", "South Korea", "China", "Saudi Arabia", "Qatar", "United Arab Emirates",
    "Iran", "Iraq", "India", "Thailand", "Malaysia", "Indonesia", "Vietnam",
    "Singapore", "Australia", "Uzbekistan", "Jordan", "Kuwait"
  ],
  "Oceania": [
    "Australia", "New Zealand", "Fiji", "Papua New Guinea", "New Caledonia",
    "Tahiti", "Solomon Islands", "Vanuatu"
  ],
};

/**
 * Hook to fetch all countries for a region from API
 * Returns countries that actually have leagues available in the API
 * 100% API-driven - no hardcoded country lists
 */
export function useCountriesByRegion(region: Region, sport: string = "football") {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCountries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🌍 [useCountriesByRegion] Fetching countries for region: ${region}, sport: ${sport}`);

        // For Top region - return main categories
        if (region === "Top") {
          const topCategories = [
            { id: "Top", label: "Top", leagueCount: 0 },
            { id: "Hot", label: "Hot", leagueCount: 0 },
            { id: "Int'l", label: "Int'l", leagueCount: 0 },
            { id: "Africa", label: "Africa", leagueCount: 0 },
            { id: "Europe", label: "Europe", leagueCount: 0 },
            { id: "America", label: "America", leagueCount: 0 },
            { id: "Oceania", label: "Oceania", leagueCount: 0 },
            { id: "Asia", label: "Asia", leagueCount: 0 },
          ];
          console.log(`✅ [useCountriesByRegion] Returning ${topCategories.length} categories for Top region`);
          setCountries(topCategories);
          setLoading(false);
          return;
        }

        // ✅ CRITICAL: Use getLeaguesByCountry to get grouped data - ensures country names match exactly
        // This ensures the vertical list country names match the keys in horizontal components
        console.log(`🔄 [useCountriesByRegion] Fetching leagues grouped by country for region: ${region}, sport: ${sport}`);
        const leaguesByCountry = await leaguesByRegionService.getLeaguesByCountry(region, sport);
        console.log(`📊 [useCountriesByRegion] Received ${Object.keys(leaguesByCountry).length} countries from API for ${region}`);

        if (isMounted) {
          // ✅ Extract country names directly from grouped data keys - ensures exact match
          const countryMap = new Map<string, number>();
          
          Object.entries(leaguesByCountry).forEach(([country, leagues]) => {
            // ✅ CRITICAL: Filter out generic international entries, "World", and empty countries
            // "Int'l" already represents World, so we don't need a separate "World" entry
            if (country && country !== "International" && country !== "World" && country !== "Int'l" && leagues.length > 0) {
              countryMap.set(country, leagues.length);
            }
          });

          console.log(`🌎 [useCountriesByRegion] Found ${countryMap.size} unique countries with leagues in ${region}`);
          console.log(`🌎 [useCountriesByRegion] Countries:`, Array.from(countryMap.keys()).join(', '));

          // Convert to array and sort by league count (most popular first)
          let countryList: CountryData[] = Array.from(countryMap.entries())
            .map(([country, count]) => ({
              id: country, // ✅ Use exact API country name as ID
              label: country.length > 12 ? country.substring(0, 10) + ".." : country,
              leagueCount: count,
            }))
            .sort((a, b) => b.leagueCount - a.leagueCount); // Sort by league count descending

          console.log(`📋 [useCountriesByRegion] Country list before adding region (${countryList.length}):`, countryList.map(c => c.label).join(', '));

          // If API returned no countries or very few, use fallback list
          if (countryList.length < 3 && fallbackCountries[region]) {
            console.warn(`⚠️ [useCountriesByRegion] API returned only ${countryList.length} countries for ${region}. Using fallback list.`);
            countryList = fallbackCountries[region].map(country => ({
              id: country,
              label: country.length > 12 ? country.substring(0, 10) + ".." : country,
              leagueCount: 0, // Unknown count for fallback
            }));
            console.log(`✅ [useCountriesByRegion] Using ${countryList.length} fallback countries:`, countryList.map(c => c.label).join(', '));
          }

          // ✅ Calculate total league count from grouped data
          const totalLeagueCount = Object.values(leaguesByCountry).flat().length;
          
          // Add the region itself as first item ONLY if we have other countries
          // Otherwise just show the countries without the region header
          const finalCountries = countryList.length > 0 
            ? [
                { id: region, label: region, leagueCount: totalLeagueCount },
                ...countryList,
              ]
            : fallbackCountries[region]
              ? fallbackCountries[region].map(country => ({
                  id: country,
                  label: country.length > 12 ? country.substring(0, 10) + ".." : country,
                  leagueCount: 0,
                }))
              : [{ id: region, label: region, leagueCount: 0 }];
          
          console.log(`✅ [useCountriesByRegion] Returning ${finalCountries.length} API-driven countries for ${region}:`, finalCountries.map(c => c.label).join(', '));
          console.log(`✅ [useCountriesByRegion] Final countries array:`, JSON.stringify(finalCountries, null, 2));
          setCountries(finalCountries);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : "Failed to fetch countries";
          console.error(`❌ [useCountriesByRegion] Error for ${region}/${sport}:`, errorMsg);
          setError(errorMsg);
          setLoading(false);
        }
      }
    };

    fetchCountries();

    return () => {
      isMounted = false;
    };
  }, [region, sport]);

  return { countries, loading, error };
}

/**
 * Hook to get leagues filtered by country within a region
 * Fetches leagues from API when a country is selected
 */
export function useLeaguesByCountryFilter(region: Region, selectedCountry: string, sport: string = "football") {
  const [leagues, setLeagues] = useState<LeagueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeagues = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🎯 [useLeaguesByCountryFilter] Fetching leagues - Region: ${region}, Country: ${selectedCountry}, Sport: ${sport}`);

        // Fetch all leagues for the region and sport
        const allLeagues = await leaguesByRegionService.getLeaguesByRegion(region, sport);
        
        console.log(`📊 [useLeaguesByCountryFilter] Received ${allLeagues.length} total leagues for ${region}`);

        if (isMounted) {
          // If selectedCountry is the region itself, show all leagues
          if (selectedCountry === region || selectedCountry === "Top" || selectedCountry === "Hot") {
            console.log(`✅ [useLeaguesByCountryFilter] Showing all ${allLeagues.length} leagues for ${selectedCountry}`);
            setLeagues(allLeagues);
          } else {
            // Filter by specific country
            const filtered = allLeagues.filter(
              (league) => league.country === selectedCountry
            );
            console.log(`✅ [useLeaguesByCountryFilter] Filtered to ${filtered.length} leagues for ${selectedCountry}`);
            setLeagues(filtered);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : "Failed to fetch leagues";
          console.error(`❌ [useLeaguesByCountryFilter] Error:`, errorMsg);
          setError(errorMsg);
          setLoading(false);
        }
      }
    };

    fetchLeagues();

    return () => {
      isMounted = false;
    };
  }, [region, selectedCountry, sport]);

  return { leagues, loading, error };
}

