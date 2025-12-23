import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  LayoutChangeEvent,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../hooks/useTheme";
import { EnhancedCompetition } from "../../data/leagues";
import leagueLogoService from "../../services/leagueLogoService";
import { useLeaguesByCountry } from "../../hooks/useLeaguesByRegion";
import { getLeagueNavigationFromApi } from "../../utils/leagueSlugGenerator";
import { sortLeaguesByCountryRank } from "../../utils/leagueRanking";
import { LeagueData } from "../../services/leaguesByRegionService";

interface StatsAmericaHorizontalProps {
  competitionsList: EnhancedCompetition[];
  handleCompetitionPress: (competition: EnhancedCompetition) => void;
  getCompetitionLogo: (competition: EnhancedCompetition) => string;
  selectedCountry?: string;
  sport?: string;
}

// Complete American countries coverage - North America, Central America, Caribbean, South America
const americanCountries = [
  // NORTH AMERICA
  "United States",
  "Canada",
  "Mexico",

  // CENTRAL AMERICA
  "Guatemala",
  "Belize",
  "El Salvador",
  "Honduras",
  "Nicaragua",
  "Costa Rica",
  "Panama",

  // CARIBBEAN
  "Cuba",
  "Jamaica",
  "Haiti",
  "Dominican Republic",
  "Trinidad and Tobago",
  "Barbados",
  "Saint Lucia",
  "Grenada",
  "Saint Vincent and the Grenadines",
  "Antigua and Barbuda",
  "Dominica",
  "Saint Kitts and Nevis",
  "Puerto Rico",
  "Guadeloupe",
  "Martinique",
  "Curaçao",
  "Aruba",
  "Suriname",
  "French Guiana",
  "Guyana",

  // SOUTH AMERICA
  "Brazil",
  "Argentina",
  "Chile",
  "Peru",
  "Uruguay",
  "Colombia",
  "Venezuela",
  "Ecuador",
  "Bolivia",
  "Paraguay",
];

// ✅ CRITICAL: All data is now 100% API-driven via useLeaguesByCountry hook
// No hardcoded league names, logos, or country names - everything comes from API

// REMOVED: All hardcoded league mappings - now using API data only
const REMOVED_leaguesByCountry: Record<string, string[]> = {
  // NORTH AMERICA
  "United States": [
    "MLS",
    "USL Championship",
    "USL League One",
    "NWSL",
    "US Open Cup",
    "MLS Cup",
    "Supporters' Shield",
  ],
  Canada: ["Canadian Premier League", "Canadian Championship", "Voyageurs Cup"],
  Mexico: [
    "Liga MX",
    "Liga de Expansión MX",
    "Copa MX",
    "Supercopa MX",
    "Liga MX Femenil",
  ],

  // CENTRAL AMERICA
  Guatemala: ["Liga Nacional", "Copa Guatemala"],
  Belize: ["Premier League of Belize", "FFB Cup"],
  "El Salvador": ["Primera División El Salvador", "Copa El Salvador"],
  Honduras: ["Liga Nacional Honduras", "Copa Honduras"],
  Nicaragua: ["Primera División Nicaragua", "Copa Nicaragua"],
  "Costa Rica": ["Primera División Costa Rica", "Copa Costa Rica"],
  Panama: ["Liga Panameña de Fútbol", "Copa Panamá"],

  // CARIBBEAN
  Cuba: ["Campeonato Nacional", "Copa Cuba"],
  Jamaica: ["Jamaica Premier League", "Jamaica Cup"],
  Haiti: ["Championnat National", "Coupe d'Haïti"],
  "Dominican Republic": ["Liga Dominicana de Fútbol", "Copa Dominicana"],
  "Trinidad and Tobago": ["TT Pro League", "FA Trophy", "League Cup"],
  Barbados: ["Barbados Premier Division", "Barbados FA Cup"],
  "Saint Lucia": ["SLFA Premier League"],
  Grenada: ["GFA Premier Division"],
  "Saint Vincent and the Grenadines": ["SVGFF Premier Division"],
  "Antigua and Barbuda": ["ABFA Premier Division"],
  Dominica: ["DFA Premier League"],
  "Saint Kitts and Nevis": ["SKNFA Premier League"],
  "Puerto Rico": ["Liga Puerto Rico"],
  Guadeloupe: ["Division d'Honneur"],
  Martinique: ["Championnat de Martinique"],
  Curaçao: ["Sekshon Pagá"],
  Aruba: ["Division di Honor"],
  Suriname: ["Hoofdklasse", "SVB Cup"],
  "French Guiana": ["Championnat de Guyane"],
  Guyana: ["Elite League", "GFF Cup"],

  // SOUTH AMERICA
  Brazil: [
    "Série A",
    "Série B",
    "Copa do Brasil",
    "Copa Libertadores",
    "Copa Sudamericana",
    "Campeonato Paulista",
    "Campeonato Carioca",
    "Campeonato Mineiro",
    "Campeonato Gaúcho",
    "Copa do Nordeste",
    "Supercopa do Brasil",
  ],
  Argentina: [
    "Liga Profesional Argentina",
    "Primera Nacional",
    "Copa Argentina",
    "Copa de la Liga Profesional",
    "Supercopa Argentina",
    "Copa Libertadores",
    "Copa Sudamericana",
    "Torneo Federal A",
    "Primera B Argentina",
  ],
  Chile: [
    "Primera División Chile",
    "Primera B Chile",
    "Copa Chile",
    "Supercopa de Chile",
  ],
  Peru: ["Liga 1", "Copa Bicentenario", "Liga 2"],
  Uruguay: [
    "Primera División Uruguay",
    "Segunda División Uruguay",
    "Copa Uruguay",
  ],
  Colombia: [
    "Liga BetPlay",
    "Primera B Colombia",
    "Copa Colombia",
    "Superliga Colombiana",
  ],
  Venezuela: ["Primera División Venezuela", "Copa Venezuela"],
  Ecuador: ["Liga Pro", "Serie B Ecuador", "Copa Ecuador"],
  Bolivia: ["División Profesional Bolivia", "Copa Bolivia"],
  Paraguay: ["División Profesional Paraguay", "Copa Paraguay"],
};

// REMOVED: All hardcoded league ID mappings - now using API data only
const REMOVED_leagueMapping: Record<string, number> = {
  // NORTH AMERICAN LEAGUES
  MLS: 253,
  "Major League Soccer": 253,
  "USL Championship": 255,
  "USL League One": 256,
  NWSL: 357,
  "National Women's Soccer League": 357,
  "US Open Cup": 257,
  "Lamar Hunt U.S. Open Cup": 257,
  "MLS Cup": 253,
  "Supporters' Shield": 253,

  // CANADIAN LEAGUES
  "Canadian Premier League": 285,
  "Canadian Championship": 287,
  "Voyageurs Cup": 287,

  // MEXICAN LEAGUES
  "Liga MX": 262,
  "Liga de Expansión MX": 263,
  "Copa MX": 264,
  "Supercopa MX": 265,
  "Liga MX Femenil": 266,

  // CENTRAL AMERICAN LEAGUES
  "Liga Nacional": 268, // Guatemala
  "Copa Guatemala": 268,
  "Premier League of Belize": 274,
  "FFB Cup": 274,
  "Primera División El Salvador": 269, // El Salvador
  "Copa El Salvador": 269,
  "Liga Nacional Honduras": 270,
  "Copa Honduras": 270,
  "Primera División Nicaragua": 271,
  "Copa Nicaragua": 271,
  "Primera División Costa Rica": 272,
  "Copa Costa Rica": 272,
  "Liga Panameña de Fútbol": 273,
  "Copa Panamá": 273,

  // CARIBBEAN LEAGUES
  "Campeonato Nacional": 279, // Cuba
  "Copa Cuba": 279,
  "Jamaica Premier League": 275,
  "Jamaica Cup": 275,
  "Championnat National": 277, // Haiti
  "Coupe d'Haïti": 277,
  "Liga Dominicana de Fútbol": 278,
  "Copa Dominicana": 278,
  "TT Pro League": 276,
  "FA Trophy": 276,
  "League Cup": 276,
  "Barbados Premier Division": 280,
  "Barbados FA Cup": 280,

  // SOUTH AMERICAN LEAGUES - BRAZIL
  "Série A": 71,
  "Serie A": 71,
  "Brasileirão Série A": 71,
  "Série B": 72,
  "Serie B": 72,
  "Copa do Brasil": 73,
  "Campeonato Paulista": 74,
  "Campeonato Carioca": 75,
  "Campeonato Mineiro": 76,
  "Campeonato Gaúcho": 77,
  "Copa do Nordeste": 79,
  "Supercopa do Brasil": 81,
  "Copa Libertadores": 13,
  "Copa Sudamericana": 11,

  // SOUTH AMERICAN LEAGUES - ARGENTINA
  "Liga Profesional Argentina": 128,
  "Liga Profesional": 128,
  "Primera División Argentina": 128,
  "Primera Nacional": 129,
  "Copa Argentina": 130,
  "Copa de la Liga Profesional": 132,
  "Supercopa Argentina": 131,
  "Torneo Federal A": 133,
  "Primera B Argentina": 134,

  // SOUTH AMERICAN LEAGUES - CHILE
  "Primera División Chile": 265,
  "Primera B Chile": 266,
  "Copa Chile": 267,
  "Supercopa de Chile": 268,

  // SOUTH AMERICAN LEAGUES - PERU
  "Liga 1": 281,
  "Liga 1 Perú": 281,
  "Copa Bicentenario": 282,
  "Liga 2": 283,

  // SOUTH AMERICAN LEAGUES - URUGUAY
  "Primera División Uruguay": 274,
  "Segunda División Uruguay": 275,
  "Copa Uruguay": 273,

  // SOUTH AMERICAN LEAGUES - COLOMBIA
  "Liga BetPlay": 239,
  "Primera A": 239,
  "Primera B Colombia": 240,
  "Copa Colombia": 241,
  "Superliga Colombiana": 242,

  // SOUTH AMERICAN LEAGUES - VENEZUELA
  "Primera División Venezuela": 277,
  "Copa Venezuela": 278,

  // SOUTH AMERICAN LEAGUES - ECUADOR
  "Liga Pro": 242,
  "Serie A Ecuador": 242,
  "Serie B Ecuador": 243,
  "Copa Ecuador": 244,

  // SOUTH AMERICAN LEAGUES - BOLIVIA
  "División Profesional Bolivia": 250,
  "División Profesional": 250,
  "Copa Bolivia": 251,

  // SOUTH AMERICAN LEAGUES - PARAGUAY
  "División Profesional Paraguay": 251,
  "Primera División Paraguay": 251,
  "Copa Paraguay": 249,

  // CONTINENTAL COMPETITIONS
  "Copa América": 9,
  "CONCACAF Gold Cup": 16,
  "CONCACAF Champions League": 14,
  "CONCACAF Nations League": 961,
  "World Cup Qualifiers CONCACAF": 968,
  "World Cup Qualifiers CONMEBOL": 969,
};

// REMOVED: All hardcoded logo mappings - now using API data only
const REMOVED_getOfficialLogoUrl = (
  leagueName: string,
  countryName: string,
): string => {
  // Manual mappings for major American leagues
  const logoMappings: Record<string, string> = {
    // Major North American leagues
    MLS: "https://media.api-sports.io/football/leagues/253.png",
    "USL Championship": "https://media.api-sports.io/football/leagues/255.png",
    "USL League One": "https://media.api-sports.io/football/leagues/256.png",
    NWSL: "https://media.api-sports.io/football/leagues/357.png",
    "US Open Cup": "https://media.api-sports.io/football/leagues/257.png",
    "Canadian Premier League":
      "https://media.api-sports.io/football/leagues/285.png",
    "Canadian Championship":
      "https://media.api-sports.io/football/leagues/287.png",
    "Liga MX": "https://media.api-sports.io/football/leagues/262.png",
    "Liga de Expansión MX":
      "https://media.api-sports.io/football/leagues/263.png",
    "Copa MX": "https://media.api-sports.io/football/leagues/264.png",
    "Liga MX Femenil": "https://media.api-sports.io/football/leagues/266.png",
    // South American leagues
    "Série A": "https://media.api-sports.io/football/leagues/71.png",
    "Serie A": "https://media.api-sports.io/football/leagues/71.png",
    "Série B": "https://media.api-sports.io/football/leagues/72.png",
    "Copa do Brasil": "https://media.api-sports.io/football/leagues/73.png",
    "Campeonato Paulista":
      "https://media.api-sports.io/football/leagues/74.png",
    "Campeonato Carioca": "https://media.api-sports.io/football/leagues/75.png",
    "Liga Profesional Argentina":
      "https://media.api-sports.io/football/leagues/128.png",
    "Primera Nacional": "https://media.api-sports.io/football/leagues/129.png",
    "Copa Argentina": "https://media.api-sports.io/football/leagues/130.png",
    "Primera División Chile":
      "https://media.api-sports.io/football/leagues/265.png",
    "Liga 1": "https://media.api-sports.io/football/leagues/281.png",
    "Liga BetPlay": "https://media.api-sports.io/football/leagues/239.png",
    "Liga Pro": "https://media.api-sports.io/football/leagues/242.png",
    "Copa Libertadores": "https://media.api-sports.io/football/leagues/13.png",
    "Copa Sudamericana": "https://media.api-sports.io/football/leagues/11.png",
    // Caribbean leagues - using existing service mappings
    "Jamaica Premier League":
      "https://media.api-sports.io/football/leagues/275.png",
    "Jamaica Cup": "https://media.api-sports.io/football/leagues/368.png",
    "TT Pro League": "https://media.api-sports.io/football/leagues/276.png",
    "Championnat National":
      "https://media.api-sports.io/football/leagues/277.png",
    "Coupe d'Haïti": "https://media.api-sports.io/football/leagues/369.png",
    "Liga Dominicana de Fútbol":
      "https://media.api-sports.io/football/leagues/278.png",
    "Copa Dominicana": "https://media.api-sports.io/football/leagues/370.png",
    "Campeonato Nacional":
      "https://media.api-sports.io/football/leagues/279.png",
    "Copa Cuba": "https://media.api-sports.io/football/leagues/371.png",
    "Barbados Premier Division":
      "https://media.api-sports.io/football/leagues/280.png",
    // Central American leagues - using existing service mappings
    "Liga Nacional": "https://media.api-sports.io/football/leagues/268.png",
    "Copa Guatemala": "https://media.api-sports.io/football/leagues/377.png",
    "Premier League of Belize":
      "https://media.api-sports.io/football/leagues/274.png",
    "FFB Cup": "https://media.api-sports.io/football/leagues/378.png",
    "Primera División El Salvador":
      "https://media.api-sports.io/football/leagues/269.png",
    "Copa El Salvador": "https://media.api-sports.io/football/leagues/379.png",
    "Liga Nacional Honduras":
      "https://media.api-sports.io/football/leagues/270.png",
    "Copa Honduras": "https://media.api-sports.io/football/leagues/380.png",
    "Primera División Nicaragua":
      "https://media.api-sports.io/football/leagues/271.png",
    "Copa Nicaragua": "https://media.api-sports.io/football/leagues/381.png",
    "Primera División Costa Rica":
      "https://media.api-sports.io/football/leagues/272.png",
    "Copa Costa Rica": "https://media.api-sports.io/football/leagues/382.png",
    "Liga Panameña de Fútbol":
      "https://media.api-sports.io/football/leagues/273.png",
    "Copa Panamá": "https://media.api-sports.io/football/leagues/383.png",
    // Nigerian leagues - prevent Korean logo mixup
    "Nigeria Premier Football League":
      "https://media.api-sports.io/football/leagues/389.png",
    "Nigerian Professional League":
      "https://media.api-sports.io/football/leagues/389.png",
    NPFL: "https://media.api-sports.io/football/leagues/389.png",
    "Nigerian FA Cup": "https://media.api-sports.io/football/leagues/390.png",
    "Federation Cup": "https://media.api-sports.io/football/leagues/390.png",
    "Nigerian Super Cup":
      "https://media.api-sports.io/football/leagues/391.png",
  };

  // Try manual mapping first
  if (logoMappings[leagueName]) {
    return logoMappings[leagueName];
  }

  // Try the official league logo service
  const officialLogo = leagueLogoService.getOfficialLeagueLogoSync(leagueName);
  if (officialLogo) {
    return officialLogo;
  }

  // REMOVED: No longer using hardcoded league mappings - API provides logos directly
  // const leagueId = REMOVED_leagueMapping[leagueName];
  // if (leagueId) {
  //   return `https://media.api-sports.io/football/leagues/${leagueId}.png`;
  // }

  // Country-based fallback logos for smaller leagues
  const countryLogos: Record<string, string> = {
    "United States": "https://flagcdn.com/24x18/us.png",
    Canada: "https://flagcdn.com/24x18/ca.png",
    Mexico: "https://flagcdn.com/24x18/mx.png",
    Brazil: "https://flagcdn.com/24x18/br.png",
    Argentina: "https://flagcdn.com/24x18/ar.png",
    Chile: "https://flagcdn.com/24x18/cl.png",
    Peru: "https://flagcdn.com/24x18/pe.png",
    Uruguay: "https://flagcdn.com/24x18/uy.png",
    Colombia: "https://flagcdn.com/24x18/co.png",
    Venezuela: "https://flagcdn.com/24x18/ve.png",
    Ecuador: "https://flagcdn.com/24x18/ec.png",
    Bolivia: "https://flagcdn.com/24x18/bo.png",
    Paraguay: "https://flagcdn.com/24x18/py.png",
    // Caribbean countries
    Jamaica: "https://flagcdn.com/24x18/jm.png",
    Haiti: "https://flagcdn.com/24x18/ht.png",
    "Dominican Republic": "https://flagcdn.com/24x18/do.png",
    Cuba: "https://flagcdn.com/24x18/cu.png",
    "Trinidad and Tobago": "https://flagcdn.com/24x18/tt.png",
    Barbados: "https://flagcdn.com/24x18/bb.png",
    "Saint Lucia": "https://flagcdn.com/24x18/lc.png",
    Grenada: "https://flagcdn.com/24x18/gd.png",
    // Central American countries
    Guatemala: "https://flagcdn.com/24x18/gt.png",
    Belize: "https://flagcdn.com/24x18/bz.png",
    "El Salvador": "https://flagcdn.com/24x18/sv.png",
    Honduras: "https://flagcdn.com/24x18/hn.png",
    Nicaragua: "https://flagcdn.com/24x18/ni.png",
    "Costa Rica": "https://flagcdn.com/24x18/cr.png",
    Panama: "https://flagcdn.com/24x18/pa.png",
  };

  return (
    countryLogos[countryName] ||
    "https://media.api-sports.io/football/leagues/1.png"
  );
};

export default function StatsAmericaHorizontal({
  competitionsList,
  handleCompetitionPress,
  getCompetitionLogo,
  selectedCountry,
  sport = "football",
}: StatsAmericaHorizontalProps) {
  const theme = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { leaguesByCountry, loading, error } = useLeaguesByCountry("America", sport);
  const [sectionPositions, setSectionPositions] = useState<
    Record<string, number>
  >({});
  const [layoutReady, setLayoutReady] = useState(false);

  // ✅ CRITICAL: Debug logging when data changes (same as Asia)
  useEffect(() => {
    console.log(`📊 [StatsAmerica] Data update - loading: ${loading}, error: ${error || 'none'}`);
    console.log(`📊 [StatsAmerica] leaguesByCountry keys:`, Object.keys(leaguesByCountry));
    console.log(`📊 [StatsAmerica] Total countries: ${Object.keys(leaguesByCountry).length}`);
    console.log(`📊 [StatsAmerica] Selected country: "${selectedCountry}"`);
    
    if (selectedCountry && selectedCountry !== "America") {
      const countryData = leaguesByCountry[selectedCountry];
      console.log(`📊 [StatsAmerica] Direct lookup for "${selectedCountry}":`, countryData ? `${countryData.length} leagues` : 'NOT FOUND');
      
      // Check for similar names
      const similarNames = Object.keys(leaguesByCountry).filter(key => 
        key.toLowerCase().includes(selectedCountry.toLowerCase()) || 
        selectedCountry.toLowerCase().includes(key.toLowerCase())
      );
      if (similarNames.length > 0) {
        console.log(`📊 [StatsAmerica] Similar country names found:`, similarNames.join(', '));
      }
    }
  }, [leaguesByCountry, loading, error, selectedCountry]);

  const getDisplayName = (name: string): string => {
    if (name.length > 20) {
      const words = name.split(" ");
      if (words.length > 2) {
        const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(" ");
        const secondLine = words.slice(Math.ceil(words.length / 2)).join(" ");
        if (secondLine.length > 15) {
          return firstLine + "\n" + secondLine.substring(0, 12) + "...";
        }
        return firstLine + "\n" + secondLine;
      }
      return name.length > 25 ? name.substring(0, 22) + "..." : name;
    }
    return name;
  };

  // ✅ Filter leagues by selected country with improved matching (same logic as Asia)
  const filteredLeaguesByCountry = React.useMemo(() => {
    // ✅ CRITICAL: Log initial state for debugging
    console.log(`🔍 [StatsAmerica] Filtering leagues - selectedCountry: "${selectedCountry}", loading: ${loading}, error: ${error}`);
    console.log(`🔍 [StatsAmerica] leaguesByCountry keys:`, Object.keys(leaguesByCountry).join(', '));
    console.log(`🔍 [StatsAmerica] Total countries in data: ${Object.keys(leaguesByCountry).length}`);
    
    // ✅ CRITICAL: If still loading or error, return empty to show loading/error state
    if (loading) {
      console.log(`⏳ [StatsAmerica] Still loading leagues...`);
      return {};
    }
    
    if (error) {
      console.error(`❌ [StatsAmerica] Error loading leagues:`, error);
      return {};
    }
    
    // ✅ CRITICAL: If no data yet, return empty
    if (!leaguesByCountry || Object.keys(leaguesByCountry).length === 0) {
      console.warn(`⚠️ [StatsAmerica] No leagues data available yet`);
      return {};
    }
    
    let filtered: Record<string, LeagueData[]> = {};
    
    if (!selectedCountry || selectedCountry === "America") {
      // Show all countries when region is selected
      filtered = leaguesByCountry;
      console.log(`✅ [StatsAmerica] Showing all countries: ${Object.keys(filtered).length} countries`);
    } else {
      // ✅ CRITICAL: Try exact match first
      if (leaguesByCountry[selectedCountry]) {
        console.log(`✅ [StatsAmerica] Found exact match for "${selectedCountry}": ${leaguesByCountry[selectedCountry].length} leagues`);
        filtered = { [selectedCountry]: leaguesByCountry[selectedCountry] };
      } else {
        // ✅ CRITICAL: Try case-insensitive match
        const matchingKey = Object.keys(leaguesByCountry).find(
          key => key.toLowerCase() === selectedCountry.toLowerCase()
        );
        if (matchingKey) {
          console.log(`✅ [StatsAmerica] Found case-insensitive match: "${selectedCountry}" -> "${matchingKey}": ${leaguesByCountry[matchingKey].length} leagues`);
          filtered = { [matchingKey]: leaguesByCountry[matchingKey] };
        } else {
          // ✅ CRITICAL: Try partial match (handles "United Sta.." -> "United States")
          const partialMatch = Object.keys(leaguesByCountry).find(
            key => key.toLowerCase().startsWith(selectedCountry.toLowerCase()) || 
                   selectedCountry.toLowerCase().startsWith(key.toLowerCase())
          );
          if (partialMatch) {
            console.log(`✅ [StatsAmerica] Found partial match: "${selectedCountry}" -> "${partialMatch}": ${leaguesByCountry[partialMatch].length} leagues`);
            filtered = { [partialMatch]: leaguesByCountry[partialMatch] };
          } else {
            // ✅ Log all available country keys for debugging
            console.warn(`⚠️ [StatsAmerica] No match found for "${selectedCountry}"`);
            console.warn(`   Available countries:`, Object.keys(leaguesByCountry).slice(0, 5).join(', '));
            console.warn(`   Total countries with leagues: ${Object.keys(leaguesByCountry).length}`);
            filtered = {};
          }
        }
      }
    }
    
    // ✅ CRITICAL: Ensure leagues are sorted by official rank within each country
    const sorted = sortLeaguesByCountryRank(filtered);
    console.log(`✅ [StatsAmerica] Filtered and sorted: ${Object.keys(sorted).length} countries, ${Object.values(sorted).flat().length} total leagues`);
    return sorted;
  }, [leaguesByCountry, selectedCountry, loading, error]);

  // Auto-scroll effect when country is selected
  useEffect(() => {
    if (!layoutReady || !selectedCountry || !scrollViewRef.current) return;

    if (
      selectedCountry !== "America" &&
      Object.keys(leaguesByCountry).includes(selectedCountry)
    ) {
      const position = sectionPositions[selectedCountry];
      if (position !== undefined) {
        const finalPosition = Math.max(0, position - 20);
        scrollViewRef.current.scrollTo({
          y: finalPosition,
          animated: true,
        });
      }
    } else {
      // Scroll to top for region selection or other cases
      scrollViewRef.current.scrollTo({
        y: 0,
        animated: true,
      });
    }
  }, [selectedCountry, sectionPositions, layoutReady, leaguesByCountry]);

  const handleSectionLayout = (
    countryName: string,
    event: LayoutChangeEvent,
  ) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions((prev) => {
      // Only update if position actually changed
      if (prev[countryName] === y) return prev;

      const newPositions = {
        ...prev,
        [countryName]: y,
      };

      // Mark layout as ready when we have positions for most countries
      if (
        !layoutReady &&
        Object.keys(newPositions).length >= Object.keys(leaguesByCountry).length * 0.8
      ) {
        setLayoutReady(true);
      }

      return newPositions;
    });
  };

  // Loading state (same as Asia)
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading leagues...
          </Text>
          {__DEV__ && (
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 8, fontSize: 12 }]}>
              Region: America, Sport: {sport}, Selected: {selectedCountry || 'None'}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Error state (same as Asia)
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          {__DEV__ && (
            <Text style={[styles.errorText, { color: theme.colors.textSecondary, marginTop: 8, fontSize: 12 }]}>
              Region: America, Sport: {sport}, Selected: {selectedCountry || 'None'}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.colors.backgroundSecondary === "#F5F5F5"
              ? theme.colors.background // White in light mode
              : "#2A2A2A", // Dull grey in dark mode
        },
      ]}
    >
      {/* American Leagues Section */}
      <View style={styles.sectionContainer}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContainer,
            Object.keys(leaguesByCountry).length === 0 && { flex: 1, justifyContent: "center" }
          ]}
        >
          {Object.keys(filteredLeaguesByCountry).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {selectedCountry && selectedCountry !== "America" 
                  ? `No leagues available for ${selectedCountry}`
                  : "No leagues available"}
              </Text>
              {/* ✅ Enhanced debug info (same as Asia) */}
              {__DEV__ && (
                <>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 8, fontSize: 12 }]}>
                    Selected: "{selectedCountry}"
                  </Text>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 }]}>
                    Available countries ({Object.keys(leaguesByCountry).length}): {Object.keys(leaguesByCountry).slice(0, 10).join(', ')}
                  </Text>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 }]}>
                    Loading: {loading ? 'Yes' : 'No'}, Error: {error || 'None'}
                  </Text>
                </>
              )}
            </View>
          ) : (
            Object.entries(filteredLeaguesByCountry).map(([countryName, leagues]) => {
              return (
                <View
                  key={countryName}
                  style={styles.countrySection}
                  onLayout={(event) => handleSectionLayout(countryName, event)}
                >
                  <Text
                    style={[
                      styles.countryHeader,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {countryName}
                  </Text>
                  <View style={styles.leaguesGrid}>
                    {leagues.length === 0 ? (
                      <View style={styles.emptyLeaguesContainer}>
                        <Text style={[styles.emptyLeaguesText, { color: theme.colors.textSecondary }]}>
                          No leagues available for {countryName}
                        </Text>
                      </View>
                    ) : (
                      leagues.map((league) => {
                        // ✅ CRITICAL: Use ONLY API logo - no hardcoded mappings
                        const logoUrl = league.logo || "https://media.api-sports.io/football/leagues/1.png";

                      return (
                        <TouchableOpacity
                          key={`${countryName}-${league.id}`}
                          style={styles.leagueItem}
                          onPress={() => {
                            // Haptic feedback for smooth UX
                            if (Platform.OS === "ios") {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            // ✅ Navigate using raw API data only
                            try {
                              const navParams = getLeagueNavigationFromApi(league, sport);
                              router.push(navParams);
                            } catch (error) {
                              console.error("Navigation error:", error);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: logoUrl }}
                            style={styles.leagueLogo}
                            resizeMode="contain"
                            // ✅ CRITICAL: Remove any tint that might cause white wash
                            tintColor={undefined}
                            onError={() => {
                              console.log("Logo failed to load for:", league.name);
                            }}
                          />
                          {/* ✅ CRITICAL: Display raw API league name - no hardcoded names */}
                          <Text
                            style={[
                              styles.leagueName,
                              { color: theme.colors.text },
                            ]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {getDisplayName(league.name)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
    paddingLeft: 4,
  },
  scrollContainer: {
    paddingTop: 0, // No padding for perfect alignment
    paddingBottom: 24,
    flexGrow: 1,
  },
  countrySection: {
    marginBottom: 32,
  },
  countryHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 0, // No top margin for perfect alignment
    paddingTop: 8, // Use padding instead of margin for better control
    paddingLeft: 12, // Aligned padding for visual consistency
    lineHeight: 20, // Optimized for alignment with vertical section
    minHeight: 44, // Match vertical section item height exactly
  },
  leaguesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  leagueItem: {
    width: "48%",
    marginBottom: 16,
    padding: 16,
    alignItems: "center",
    minHeight: 100,
  },
  leagueLogo: {
    width: 36,
    height: 36,
    marginBottom: 10,
    // ✅ CRITICAL: Ensure logo maintains original colors - no white wash
    tintColor: undefined, // Remove any tint
  },
  leagueName: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "600",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyLeaguesContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  emptyLeaguesText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
});
