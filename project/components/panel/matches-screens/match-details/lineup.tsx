import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Sun, 
  Wind, 
  Droplets,
  MapPin,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import type {
  LineupData,
  LineupPlayer,
  WeatherData,
  MatchWithRating,
} from "@/types/match-details/match-details";
import MatchDayScreenshot from "./match-day-screenshot";
import PlayerPerformanceModal, { PlayerWithStats } from "./lineup/player-performance";
import { TouchableOpacity } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface MatchDetailsLineupProps {
  lineupData: LineupData | null;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  weatherData?: WeatherData | null;
  sport?: string;
  matchData?: MatchWithRating;
  currentMinute?: number;
  matchStatus?: string;
  league?: string;
  startTime?: string;
}

// ✅ Helper to dull colors (reduce brightness and saturation) for professional look
// ensures colors are unique per team but not too bright/distracting
const processTeamColor = (hex: string | undefined | null, fallback: string): string => {
  // Use fallback if no hex provided or invalid
  const colorToProcess = (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) ? fallback : hex;

  // Parse Hex
  let r = parseInt(colorToProcess.substring(1, 3), 16);
  let g = parseInt(colorToProcess.substring(3, 5), 16);
  let b = parseInt(colorToProcess.substring(5, 7), 16);

  // Reduce brightness (85% of original - slightly duller)
  const brightnessFactor = 0.85;
  
  // Reduce saturation (mix with grayscale)
  // Standard luma weights for grayscale
  const gray = r * 0.299 + g * 0.587 + b * 0.114;
  const saturationFactor = 0.75; // 75% color, 25% gray (reduced saturation)

  r = r * saturationFactor + gray * (1 - saturationFactor);
  g = g * saturationFactor + gray * (1 - saturationFactor);
  b = b * saturationFactor + gray * (1 - saturationFactor);

  // Apply brightness dimming
  r *= brightnessFactor;
  g *= brightnessFactor;
  b *= brightnessFactor;

  // Clamp and convert back to hex
  const toHex = (n: number) => {
    const val = Math.min(255, Math.max(0, Math.round(n)));
    return val.toString(16).padStart(2, '0').toUpperCase();
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// ✅ Helper to generate a unique color from a string (team name)
// Used as fallback when API doesn't provide team colors
const generateUniqueColor = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate Hue from 0-360
  const h = Math.abs(hash % 360);
  // Fixed Saturation (65%) and Lightness (45%) for professional, solid look
  const s = 65; 
  const l = 45;

  // Convert HSL to Hex logic
  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;

  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
};

export default function MatchDetailsLineup({
  lineupData,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  weatherData,
  sport = "football",
  matchData,
  currentMinute = 0,
  matchStatus = "NS",
  league = "",
  startTime,
}: MatchDetailsLineupProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchedLineupData, setFetchedLineupData] = useState<LineupData | null>(lineupData);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithStats | null>(null);
  const isDarkMode = theme.colors.background === "#2A2A2A"; // ✅ Add isDarkMode check

  // Helper function to get player photo URL with multiple fallback sources
  const getPlayerPhotoUrl = (playerId: string | number | undefined, apiPhoto: string | undefined): string | undefined => {
    if (!playerId || playerId === "unknown") return undefined;

    const playerIdNum = typeof playerId === "string" ? parseInt(playerId) : playerId;
    if (isNaN(playerIdNum)) return undefined;

    // Priority order: Try multiple official photo sources
    const photoSources = [
      // 1. API-Sports primary photo (if provided and valid)
      apiPhoto && apiPhoto.trim() !== "" && !apiPhoto.includes("placeholder") ? apiPhoto : null,
      
      // 2. API-Sports official player photo endpoint
      `https://media.api-sports.io/football/players/${playerIdNum}.png`,
      
      // 3. Transfermarkt high-quality portraits
      `https://img.a.transfermarkt.technology/portrait/header/${playerIdNum}.jpg`,
      
      // 4. Alternative Transfermarkt format
      `https://tmssl.akamaized.net/images/portrait/header/${playerIdNum}.jpg`,
      
      // 5. ESPN player photos
      `https://a.espncdn.com/i/headshots/soccer/players/full/${playerIdNum}.png`,
      
      // 6. FotMob player images
      `https://images.fotmob.com/image_resources/playerimages/${playerIdNum}.png`,
    ];

    // Return the first available source
    return photoSources.find(source => source !== null) || undefined;
  };

  // Helper function to enrich lineup data with photos and remove duplicates
  const enrichLineupData = (data: LineupData | null): LineupData | null => {
    if (!data) return null;

    // ✅ CRITICAL: Track all player IDs across both teams to prevent cross-team duplicates
    const allSeenIds = new Set<string>();
    const allSeenNameNumber = new Set<string>();

    // ✅ CRITICAL: Store original team assignments to validate separation
    const originalHomePlayerIds = new Set((data.homeTeam.players || []).map(p => p.id));
    const originalAwayPlayerIds = new Set((data.awayTeam.players || []).map(p => p.id));

    // Remove duplicates and enrich photos - ensure each player appears only once per team
    const enrichTeamPlayers = (players: LineupPlayer[], teamName: string, isHomeTeam: boolean): LineupPlayer[] => {
      const seenIds = new Set<string>();
      const seenNameNumber = new Set<string>(); // Track by name+number as backup
      const uniquePlayers: LineupPlayer[] = [];
      const otherTeamIds = isHomeTeam ? originalAwayPlayerIds : originalHomePlayerIds;

      for (const player of players) {
        // Skip invalid players
        if (!player.id || player.id === "unknown") {
          console.warn(`⚠️ Skipping invalid player in ${teamName}: ${player.name || "Unknown"}`);
          continue;
        }

        // ✅ CRITICAL: Check if player belongs to the OTHER team (data contamination check)
        if (otherTeamIds.has(player.id)) {
          console.error(`❌ CRITICAL DATA CONTAMINATION: Player ${player.name} (ID: ${player.id}) is in ${teamName} but belongs to the OTHER team! Skipping.`);
          continue;
        }

        // ✅ CRITICAL: Check for duplicate by ID within this team
        if (seenIds.has(player.id)) {
          console.warn(`⚠️ Duplicate player ID in ${teamName}: ${player.name} (ID: ${player.id}) - skipping duplicate`);
          continue;
        }

        // ✅ CRITICAL: Check for cross-team duplicate (player appearing in both teams)
        if (allSeenIds.has(player.id)) {
          console.error(`❌ CROSS-TEAM DUPLICATE: Player ${player.name} (ID: ${player.id}) appears in both teams! Skipping from ${teamName}`);
          continue;
        }

        // Check for duplicate by name+number (backup check)
        const nameNumberKey = `${player.name?.toLowerCase()}-${player.number}`;
        if (seenNameNumber.has(nameNumberKey)) {
          console.warn(`⚠️ Duplicate player name+number in ${teamName}: ${player.name} (#${player.number}) - skipping duplicate`);
          continue;
        }

        // Check for cross-team duplicate by name+number
        if (allSeenNameNumber.has(nameNumberKey)) {
          console.error(`❌ CROSS-TEAM DUPLICATE: Player ${player.name} (#${player.number}) appears in both teams! Skipping from ${teamName}`);
          continue;
        }

        // Add to seen sets (both team-specific and global)
        seenIds.add(player.id);
        seenNameNumber.add(nameNumberKey);
        allSeenIds.add(player.id);
        allSeenNameNumber.add(nameNumberKey);

        // Enrich photo with fallback sources
        uniquePlayers.push({
          ...player,
          photo: getPlayerPhotoUrl(player.id, player.photo),
        });
      }

      // ✅ Validate: Count starting vs non-starting players
      const starters = uniquePlayers.filter(p => p.isStarting).length;
      const substitutes = uniquePlayers.filter(p => !p.isStarting).length;
      console.log(`✅ ${teamName}: ${uniquePlayers.length} total players (${starters} starters, ${substitutes} substitutes) after deduplication`);
      
      if (starters !== 11 && starters > 0) {
        console.warn(`⚠️ ${teamName}: Expected 11 starters, found ${starters}`);
      }

      return uniquePlayers;
    };

    // ✅ CRITICAL: Process teams separately and ensure complete separation
    // Process home team first
    const homePlayers = enrichTeamPlayers(data.homeTeam.players, "Home Team", true);
    // Process away team second (with home team IDs already tracked)
    const awayPlayers = enrichTeamPlayers(data.awayTeam.players, "Away Team", false);

    // ✅ FINAL VALIDATION: Ensure no cross-team contamination
    const finalHomeIds = new Set(homePlayers.map(p => p.id));
    const finalAwayIds = new Set(awayPlayers.map(p => p.id));
    const crossContamination = Array.from(finalHomeIds).filter(id => finalAwayIds.has(id));
    
    if (crossContamination.length > 0) {
      console.error(`❌ CRITICAL: After enrichment, found ${crossContamination.length} players in BOTH teams:`, crossContamination);
    }

    // Ensure each team uses its own official formation from API
    const enrichedData = {
      homeTeam: {
        ...data.homeTeam,
        formation: data.homeTeam.formation || "4-4-2", // Use official formation from API
        players: homePlayers,
        colors: data.homeTeam.colors, // Preserve team colors
      },
      awayTeam: {
        ...data.awayTeam,
        formation: data.awayTeam.formation || "4-4-2", // Use official formation from API
        players: awayPlayers,
        colors: data.awayTeam.colors, // Preserve team colors
      },
    };

    console.log(`📊 Formations - Home: ${enrichedData.homeTeam.formation} (${homePlayers.filter(p => p.isStarting).length} starters), Away: ${enrichedData.awayTeam.formation} (${awayPlayers.filter(p => p.isStarting).length} starters)`);
    console.log(`🎨 Team Colors - Home: ${enrichedData.homeTeam.colors?.primary || "default"}, Away: ${enrichedData.awayTeam.colors?.primary || "default"}`);

    return enrichedData;
  };

  // Fetch lineup data if not provided through props
  useEffect(() => {
    // If lineup data is already provided via props, use it (API-driven)
    if (lineupData) {
      console.log("✅ LINEUP COMPONENT: Received lineup data from API");
      
      // Enrich lineup data with photos and remove duplicates
      const enrichedData = enrichLineupData(lineupData);
      
      // Log photo availability ONCE when data is received
      const homePhotosCount = enrichedData?.homeTeam?.players?.filter(p => p.photo).length || 0;
      const awayPhotosCount = enrichedData?.awayTeam?.players?.filter(p => p.photo).length || 0;
      const homeTotal = enrichedData?.homeTeam?.players?.length || 0;
      const awayTotal = enrichedData?.awayTeam?.players?.length || 0;
      
      console.log("📸 LINEUP PHOTOS SUMMARY:");
      console.log(`   Home team: ${homePhotosCount}/${homeTotal} players have photos`);
      console.log(`   Away team: ${awayPhotosCount}/${awayTotal} players have photos`);
      
      if (homePhotosCount === 0 && awayPhotosCount === 0) {
        console.warn("⚠️ WARNING: Could not fetch player photos from any source!");
      }
      
      setFetchedLineupData(enrichedData);
      setLoading(false);
    } else {
      // No lineup data available from API
      console.log("⚠️ LINEUP COMPONENT: No lineup data provided - waiting for API data");
      setLoading(false);
    }
  }, [lineupData]);

  // ✅ FORMATION POSITION MAPPINGS - Redesigned for half-pitch positioning
  // Based on discover/my-lineup formation patterns, adapted for match-details screen
  // ✅ CRITICAL: Home team occupies TOP half (Y: 5-45%), Away team occupies BOTTOM half (Y: 55-95%)
  // ✅ CRITICAL: X positions constrained to 8%-92% to prevent edge touching
  const getFormationPositions = (formation: string, isHome: boolean): Array<{ x: number; y: number }> => {
    // Normalize formation string
    const normalizedFormation = formation.trim().toUpperCase();
    
    // ✅ CONSTRAIN X positions: Minimum 8% margin from edges (range: 8% to 92%)
    const constrainX = (x: number): number => {
      return Math.max(8, Math.min(92, x));
    };
    
    // ✅ HALF-PITCH FORMATION TEMPLATES
    // Designed for ONE HALF of the pitch (like discover screens)
    // Y positions: GK at ~78%, defenders at ~62-70%, midfielders at ~40-50%, forwards at ~20-25%
    // These will be mapped to:
    //   - Home team: Y stays as-is (appears in top half: 5-45%)
    //   - Away team: Y mapped to bottom half (55-95%)
    const halfPitchTemplates: { [key: string]: Array<{ x: number; y: number }> } = {
      "4-4-2": [
        { x: constrainX(50), y: 78 }, // GK
        { x: constrainX(15), y: 62 }, // LB
        { x: constrainX(35), y: 67 }, // CB1
        { x: constrainX(65), y: 67 }, // CB2
        { x: constrainX(85), y: 62 }, // RB
        { x: constrainX(12), y: 50 }, // LM
        { x: constrainX(35), y: 45 }, // CM1
        { x: constrainX(65), y: 45 }, // CM2
        { x: constrainX(88), y: 50 }, // RM
        { x: constrainX(30), y: 25 }, // ST1
        { x: constrainX(70), y: 25 }, // ST2
      ],
      "4-2-3-1": [
        { x: constrainX(50), y: 78 }, // GK
        { x: constrainX(15), y: 62 }, // LB
        { x: constrainX(35), y: 67 }, // CB1
        { x: constrainX(65), y: 67 }, // CB2
        { x: constrainX(85), y: 62 }, // RB
        { x: constrainX(35), y: 55 }, // CDM1
        { x: constrainX(65), y: 55 }, // CDM2
        { x: constrainX(20), y: 32 }, // LAM
        { x: constrainX(50), y: 35 }, // CAM
        { x: constrainX(80), y: 32 }, // RAM
        { x: constrainX(50), y: 20 }, // CF
      ],
      "4-3-3": [
        { x: constrainX(50), y: 78 }, // GK
        { x: constrainX(15), y: 70 }, // LB
        { x: constrainX(35), y: 70 }, // CB1
        { x: constrainX(65), y: 70 }, // CB2
        { x: constrainX(85), y: 70 }, // RB
        { x: constrainX(25), y: 50 }, // CM1
        { x: constrainX(50), y: 48 }, // CM2
        { x: constrainX(75), y: 50 }, // CM3
        { x: constrainX(18), y: 25 }, // LW
        { x: constrainX(50), y: 20 }, // CF
        { x: constrainX(82), y: 25 }, // RW
      ],
      "3-4-3": [
        { x: constrainX(50), y: 78 }, // GK
        { x: constrainX(25), y: 67 }, // CB1
        { x: constrainX(50), y: 70 }, // CB2
        { x: constrainX(75), y: 67 }, // CB3
        { x: constrainX(10), y: 55 }, // LWB
        { x: constrainX(35), y: 50 }, // CM1
        { x: constrainX(65), y: 50 }, // CM2
        { x: constrainX(90), y: 55 }, // RWB
        { x: constrainX(18), y: 25 }, // LW
        { x: constrainX(50), y: 20 }, // CF
        { x: constrainX(82), y: 25 }, // RW
      ],
      "3-5-2": [
        { x: constrainX(50), y: 78 }, // GK
        { x: constrainX(25), y: 67 }, // CB1
        { x: constrainX(50), y: 70 }, // CB2
        { x: constrainX(75), y: 67 }, // CB3
        { x: constrainX(10), y: 55 }, // LWB
        { x: constrainX(30), y: 45 }, // LM
        { x: constrainX(50), y: 50 }, // CM
        { x: constrainX(70), y: 45 }, // RM
        { x: constrainX(90), y: 55 }, // RWB
        { x: constrainX(35), y: 25 }, // ST1
        { x: constrainX(65), y: 25 }, // ST2
      ],
      "5-3-2": [
        { x: constrainX(50), y: 78 }, // GK
        { x: constrainX(10), y: 62 }, // LWB
        { x: constrainX(27), y: 67 }, // CB1
        { x: constrainX(50), y: 70 }, // CB2
        { x: constrainX(73), y: 67 }, // CB3
        { x: constrainX(90), y: 62 }, // RWB
        { x: constrainX(30), y: 50 }, // CM1
        { x: constrainX(50), y: 45 }, // CM2
        { x: constrainX(70), y: 50 }, // CM3
        { x: constrainX(35), y: 25 }, // ST1
        { x: constrainX(65), y: 25 }, // ST2
      ],
      "4-1-4-1": [
        { x: constrainX(50), y: 78 }, // GK
        { x: constrainX(15), y: 62 }, // LB
        { x: constrainX(35), y: 67 }, // CB1
        { x: constrainX(65), y: 67 }, // CB2
        { x: constrainX(85), y: 62 }, // RB
        { x: constrainX(50), y: 58 }, // CDM
        { x: constrainX(15), y: 40 }, // LM
        { x: constrainX(35), y: 35 }, // CM1
        { x: constrainX(65), y: 35 }, // CM2
        { x: constrainX(85), y: 40 }, // RM
        { x: constrainX(50), y: 20 }, // CF
      ],
      "4-4-1-1": [
        { x: constrainX(50), y: 78 }, // GK
        { x: constrainX(15), y: 62 }, // LB
        { x: constrainX(35), y: 67 }, // CB1
        { x: constrainX(65), y: 67 }, // CB2
        { x: constrainX(85), y: 62 }, // RB
        { x: constrainX(12), y: 50 }, // LM
        { x: constrainX(35), y: 45 }, // CM1
        { x: constrainX(65), y: 45 }, // CM2
        { x: constrainX(88), y: 50 }, // RM
        { x: constrainX(50), y: 30 }, // CAM
        { x: constrainX(50), y: 20 }, // CF
      ],
      "3-4-1-2": [
        { x: constrainX(50), y: 78 }, // GK
        { x: constrainX(25), y: 67 }, // CB1
        { x: constrainX(50), y: 70 }, // CB2
        { x: constrainX(75), y: 67 }, // CB3
        { x: constrainX(10), y: 55 }, // LWB
        { x: constrainX(35), y: 50 }, // CM1
        { x: constrainX(65), y: 50 }, // CM2
        { x: constrainX(90), y: 55 }, // RWB
        { x: constrainX(50), y: 30 }, // CAM
        { x: constrainX(35), y: 20 }, // ST1
        { x: constrainX(65), y: 20 }, // ST2
      ],
    };

    // Get template for this formation or use default 4-4-2
    const template = halfPitchTemplates[normalizedFormation] || halfPitchTemplates["4-4-2"];
    
    // ✅ VALIDATION: Ensure template has exactly 11 positions
    if (template.length !== 11) {
      console.error(`❌ CRITICAL: Formation ${formation} template has ${template.length} positions, expected 11!`);
      return halfPitchTemplates["4-4-2"]; // Fallback to default
    }
    
    // ✅ MAP HALF-PITCH TEMPLATES TO FULL PITCH POSITIONS
    // Half-pitch template Y range: ~20-78% (forwards to GK)
    // Home team: Map to TOP half (Y: 5-45%)
    //   - Map 20% -> 5%, 78% -> 45% (scale: 0.625x, offset: -7.5)
    // Away team: Map to BOTTOM half (Y: 55-95%)
    //   - Map 20% -> 95%, 78% -> 55% (scale: -0.625x, offset: 107.5)
    return template.map(pos => {
      const halfPitchY = pos.y; // Y from half-pitch template (20-78%)
      
      let fullPitchY: number;
      if (isHome) {
        // Home team: Map to top half (5-45%)
        // Formula: (halfPitchY - 20) * (40/58) + 5
        // Simplified: (halfPitchY - 20) * 0.6897 + 5
        fullPitchY = (halfPitchY - 20) * (40 / 58) + 5;
      } else {
        // Away team: Map to bottom half (55-95%)
        // Formula: 95 - (halfPitchY - 20) * (40/58)
        // Simplified: 95 - (halfPitchY - 20) * 0.6897
        fullPitchY = 95 - (halfPitchY - 20) * (40 / 58);
      }
      
      // Ensure Y stays within bounds
      fullPitchY = Math.max(5, Math.min(95, fullPitchY));
      
      return {
        x: pos.x,
        y: fullPitchY,
      };
    });
  };

  // ✅ CRITICAL FIX: All hooks must be called BEFORE any early returns
  // Calculate player positions on pitch based on formation - FORMATION-SPECIFIC POSITIONING
  const calculatePlayerPositions = useMemo(() => {
    return (
      players: LineupPlayer[],
      formation: string,
      isHome: boolean
    ) => {
      // ✅ CRITICAL: Filter to ONLY starting players and remove any duplicates
      // Use both ID and name+number to catch all duplicates
      const startingPlayersMap = new Map<string, LineupPlayer>();
      const seenIds = new Set<string>();
      const seenNameNumber = new Set<string>(); // Track by name+number as backup
      
      for (const player of players) {
        // Only process starting players
        if (!player.isStarting) continue;
        
        // Skip invalid players
        if (!player.id || player.id === "unknown") {
          console.warn(`⚠️ Skipping invalid player: ${player.name || "Unknown"} (ID: ${player.id})`);
          continue;
        }
        
        // ✅ CRITICAL: Check for duplicate by ID
        if (seenIds.has(player.id)) {
          console.warn(`⚠️ Duplicate starting player skipped by ID: ${player.name} (ID: ${player.id})`);
          continue;
        }
        
        // ✅ CRITICAL: Check for duplicate by name+number (catches cases where ID might be wrong)
        const nameNumberKey = `${player.name?.toLowerCase().trim()}-${player.number}`;
        if (seenNameNumber.has(nameNumberKey)) {
          console.warn(`⚠️ Duplicate starting player skipped by name+number: ${player.name} (#${player.number}, ID: ${player.id})`);
          continue;
        }
        
        // Add to tracking sets
        seenIds.add(player.id);
        seenNameNumber.add(nameNumberKey);
        startingPlayersMap.set(player.id, player);
      }
      
      // Convert to array - should have exactly 11 players
      const startingPlayers = Array.from(startingPlayersMap.values());
      
      // ✅ VALIDATION: Log if we still have duplicates
      const playerNames = startingPlayers.map(p => `${p.name} (#${p.number})`);
      const uniqueNames = new Set(playerNames);
      if (playerNames.length !== uniqueNames.size) {
        console.error(`❌ CRITICAL: Still have duplicate players after filtering! Total: ${playerNames.length}, Unique: ${uniqueNames.size}`);
        console.error(`   Players:`, playerNames.join(", "));
      }
      
      if (startingPlayers.length === 0) {
        console.warn(`⚠️ No starting players found for formation ${formation}`);
        return [];
      }
      
      // ✅ CRITICAL: Parse and validate formation format
      const formationParts = formation.split("-").map(Number).filter(n => !isNaN(n) && n > 0);
      const expectedTotalPlayers = 1 + (formationParts.length > 0 ? formationParts.reduce((sum, n) => sum + n, 0) : 10);
      
      // ✅ CRITICAL: Use all available starting players (up to 11), don't limit to formation count
      // This ensures we always show all 11 players even if formation count doesn't match
      const playersToUse = startingPlayers.slice(0, 11); // Always use up to 11 players
      
      if (startingPlayers.length !== expectedTotalPlayers) {
        console.warn(`⚠️ Player count mismatch: Formation ${formation} expects ${expectedTotalPlayers} players, but found ${startingPlayers.length} starting players`);
      }
      
      if (startingPlayers.length < 11) {
        console.warn(`⚠️ Only ${startingPlayers.length} starting players available, expected 11`);
      }
      
      // ✅ Get formation-specific positions (always returns 11 positions)
      const formationPositions = getFormationPositions(formation, isHome);
      
      // ✅ VALIDATION: Ensure we have exactly 11 positions
      if (formationPositions.length !== 11) {
        console.error(`❌ CRITICAL: Formation ${formation} returned ${formationPositions.length} positions, expected 11!`);
        return [];
      }
      
      const positions: { player: LineupPlayer; x: number; y: number }[] = [];
      const usedPlayerIds = new Set<string>();
      const usedNameNumbers = new Set<string>();

      // ✅ CRITICAL: Map ALL available players to formation positions (up to 11)
      // This ensures we always position all 11 players if available
      for (let i = 0; i < Math.min(playersToUse.length, 11); i++) {
        const player = playersToUse[i];
        const position = formationPositions[i];
        const nameNumberKey = `${player.name?.toLowerCase().trim()}-${player.number}`;
        
        // ✅ CRITICAL: Check both ID and name+number to prevent duplicates
        if (usedPlayerIds.has(player.id) || usedNameNumbers.has(nameNumberKey)) {
          console.warn(`⚠️ Skipping duplicate player: ${player.name} (ID: ${player.id}, #${player.number})`);
          continue;
        }
        
        positions.push({
          player: player,
          x: position.x,
          y: position.y,
        });
        usedPlayerIds.add(player.id);
        usedNameNumbers.add(nameNumberKey);
      }
      
      // ✅ VALIDATION: Ensure we positioned all available players
      if (positions.length < playersToUse.length) {
        console.warn(`⚠️ Positioned ${positions.length} players out of ${playersToUse.length} available (some may have been filtered as duplicates)`);
      }

      // ✅ FINAL VALIDATION
      const actualPlayers = positions.length;
      if (actualPlayers !== expectedTotalPlayers) {
        console.error(`❌ CRITICAL: Formation ${formation} expects ${expectedTotalPlayers} players, but positioned ${actualPlayers} players`);
      } else {
        console.log(`✅ Formation ${formation}: Positioned ${actualPlayers} players correctly`);
      }

      return positions;
    };
  }, []); // Empty deps - function never changes

  // Memoize player positions to prevent recalculation on every render
  const homePlayerPositions = useMemo(() => {
    if (!fetchedLineupData) return [];
    
    // ✅ CRITICAL: Use ONLY home team's official formation
    const homeFormation = fetchedLineupData.homeTeam.formation || "4-4-2";
    
    // ✅ CRITICAL: Get home team players ONLY - ensure complete separation
    const allHomePlayers = fetchedLineupData.homeTeam.players || [];
    
    // ✅ CRITICAL: Filter to ONLY starting players, remove duplicates, and validate team assignment
    const homeStartingPlayers = allHomePlayers
      .filter((p) => {
        // Must be starting player
        if (!p.isStarting) return false;
        // Must have valid ID
        if (!p.id || p.id === "unknown") return false;
        return true;
      })
      .filter((player, index, self) => {
        // Remove duplicates by ID - keep first occurrence
        const firstIndex = self.findIndex((p) => p.id === player.id);
        if (index !== firstIndex) {
          console.warn(`⚠️ HOME TEAM: Duplicate player removed: ${player.name} (ID: ${player.id})`);
          return false;
        }
        return true;
      });
    
    // ✅ MATHEMATICAL: Calculate expected players from formation
    const formationParts = homeFormation.split("-").map(Number).filter(n => !isNaN(n) && n > 0);
    const expectedPlayers = 1 + (formationParts.length > 0 ? formationParts.reduce((sum, n) => sum + n, 0) : 10);
    
    // ✅ CRITICAL: Limit to exactly expected number to prevent overflow
    const limitedPlayers = homeStartingPlayers.slice(0, expectedPlayers);
    
    console.log(`⚽ HOME TEAM: Formation=${homeFormation}, Expected=${expectedPlayers}, Found=${homeStartingPlayers.length} starting players`);
    console.log(`   Home team starting players (${limitedPlayers.length}):`, limitedPlayers.map(p => `${p.name} (#${p.number}, ID:${p.id})`).join(", "));
    
    const positions = calculatePlayerPositions(
      limitedPlayers, // Only pass expected number of starting players
      homeFormation, // Use home team's own formation
      true // isHome = true
    );
    
    // ✅ VALIDATION: Ensure all positioned players belong to home team
    const invalidPlayers = positions.filter(pos => {
      // Verify player is actually in home team's player list
      const isInHomeTeam = allHomePlayers.some(p => p.id === pos.player.id);
      if (!isInHomeTeam) {
        console.error(`❌ CRITICAL: Player ${pos.player.name} (ID: ${pos.player.id}) in home positions but not in home team players!`);
      }
      return !isInHomeTeam;
    });
    
    if (invalidPlayers.length > 0) {
      console.error(`❌ CRITICAL: Found ${invalidPlayers.length} invalid players in home team positions!`);
    }
    
    console.log(`   ✅ Calculated ${positions.length} positions for HOME team (expected ${expectedPlayers})`);
    return positions;
  }, [fetchedLineupData, calculatePlayerPositions]);

  const awayPlayerPositions = useMemo(() => {
    if (!fetchedLineupData) return [];
    
    // ✅ CRITICAL: Use ONLY away team's official formation
    const awayFormation = fetchedLineupData.awayTeam.formation || "4-4-2";
    
    // ✅ CRITICAL: Get away team players ONLY - ensure complete separation
    const allAwayPlayers = fetchedLineupData.awayTeam.players || [];
    
    // ✅ CRITICAL: Get home team player IDs to prevent cross-team contamination
    const homePlayerIds = new Set((fetchedLineupData.homeTeam.players || []).map(p => p.id));
    
    // ✅ CRITICAL: Filter to ONLY starting players, remove duplicates, and ensure NOT in home team
    const awayStartingPlayers = allAwayPlayers
      .filter((p) => {
        // Must be starting player
        if (!p.isStarting) return false;
        // Must have valid ID
        if (!p.id || p.id === "unknown") return false;
        // ✅ CRITICAL: Must NOT be in home team
        if (homePlayerIds.has(p.id)) {
          console.error(`❌ CRITICAL: Player ${p.name} (ID: ${p.id}) is in AWAY team but also exists in HOME team! Skipping from away team.`);
          return false;
        }
        return true;
      })
      .filter((player, index, self) => {
        // Remove duplicates by ID - keep first occurrence
        const firstIndex = self.findIndex((p) => p.id === player.id);
        if (index !== firstIndex) {
          console.warn(`⚠️ AWAY TEAM: Duplicate player removed: ${player.name} (ID: ${player.id})`);
          return false;
        }
        return true;
      });
    
    // ✅ MATHEMATICAL: Calculate expected players from formation
    const formationParts = awayFormation.split("-").map(Number).filter(n => !isNaN(n) && n > 0);
    const expectedPlayers = 1 + (formationParts.length > 0 ? formationParts.reduce((sum, n) => sum + n, 0) : 10);
    
    // ✅ CRITICAL: Limit to exactly expected number to prevent overflow
    const limitedPlayers = awayStartingPlayers.slice(0, expectedPlayers);
    
    console.log(`⚽ AWAY TEAM: Formation=${awayFormation}, Expected=${expectedPlayers}, Found=${awayStartingPlayers.length} starting players`);
    console.log(`   Away team starting players (${limitedPlayers.length}):`, limitedPlayers.map(p => `${p.name} (#${p.number}, ID:${p.id})`).join(", "));
    
    const positions = calculatePlayerPositions(
      limitedPlayers, // Only pass expected number of starting players
      awayFormation, // Use away team's own formation
      false // isHome = false
    );
    
    // ✅ VALIDATION: Ensure all positioned players belong to away team
    const invalidPlayers = positions.filter(pos => {
      // Verify player is actually in away team's player list
      const isInAwayTeam = allAwayPlayers.some(p => p.id === pos.player.id);
      // Verify player is NOT in home team
      const isInHomeTeam = homePlayerIds.has(pos.player.id);
      if (!isInAwayTeam || isInHomeTeam) {
        console.error(`❌ CRITICAL: Player ${pos.player.name} (ID: ${pos.player.id}) in away positions but invalid! InAwayTeam: ${isInAwayTeam}, InHomeTeam: ${isInHomeTeam}`);
      }
      return !isInAwayTeam || isInHomeTeam;
    });
    
    if (invalidPlayers.length > 0) {
      console.error(`❌ CRITICAL: Found ${invalidPlayers.length} invalid players in away team positions!`);
    }
    
    console.log(`   ✅ Calculated ${positions.length} positions for AWAY team (expected ${expectedPlayers})`);
    return positions;
  }, [fetchedLineupData, calculatePlayerPositions]);

  // Render player on pitch - API-driven player photos ONLY - MEMOIZED
  // ✅ CRITICAL: Colors are validated and passed correctly from rendering code
  const renderPlayerOnPitch = useMemo(() => {
    return (
      position: { player: LineupPlayer; x: number; y: number },
      teamColor: string,
      teamKey: string
    ) => {
      const { player, x, y } = position;
      
      // ✅ CRITICAL: Use the passed teamColor directly (already validated in rendering code)
      // This ensures no color mixing - home team always gets homeColor, away team always gets awayColor
      
      // Handle player press - open performance modal
      const handlePlayerPress = () => {
        // Enriched player object matches expected PlayerWithStats interface
        // Note: Actual stats would come from the API payload (which might have more fields than typed)
        // We cast to any to allow passing extra API data that might exist on the player object
        setSelectedPlayer({
          id: player.id,
          name: player.name,
          photo: player.photo,
          position: player.position,
          number: player.number,
          teamName: teamKey === 'home' ? homeTeamName : awayTeamName,
          teamLogo: teamKey === 'home' ? homeTeamLogo : awayTeamLogo,
          age: player.age,
          statistics: (player as any).statistics // Pass stats if available in data
        });
      };

      return (
        <View
          style={[
            styles.playerOnPitch,
            {
              left: `${x}%`,
              top: `${y}%`,
            },
          ]}
        >
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handlePlayerPress}
            style={{ alignItems: 'center' }}
          >
          {/* Player Photo - Real headshot from API ONLY */}
          <View style={styles.playerPhotoContainer}>
            {player.photo ? (
              // ✅ Player has photo from API - Display real headshot
              <>
                {/* Colored border ring using team color (validated before passing) */}
                <View style={[styles.playerPhotoBorder, { borderColor: teamColor }]}>
                  <Image
                    source={{ uri: player.photo }}
                    style={styles.playerPhoto}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log(`⚠️ Failed to load player photo for ${player.name} (ID: ${player.id}): ${player.photo}`);
                    }}
                  />
                </View>
                {/* Captain Badge - Red square with white C */}
                {player.captain && (
                  <View style={styles.captainBadge}>
                    <Text style={styles.captainText}>C</Text>
                  </View>
                )}
                {/* Jersey Number Badge - Use team color (validated before passing) */}
                <View style={[styles.jerseyBadge, { backgroundColor: teamColor }]}>
                  <Text style={styles.jerseyNumber}>{player.number}</Text>
                </View>
              </>
            ) : (
              // ✅ FALLBACK: Show colored circle with jersey number when no photo available from API
              <View style={[styles.playerCircleNoPhoto, { backgroundColor: teamColor, borderColor: teamColor }]}>
                <Text style={styles.playerNumberNoPhoto}>{player.number}</Text>
                {/* Captain Badge for no-photo players */}
                {player.captain && (
                  <View style={styles.captainBadgeNoPhoto}>
                    <Text style={styles.captainText}>C</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Player Name */}
          <Text style={styles.playerNameOnPitch} numberOfLines={1}>
            {player.name.split(" ").pop()}
          </Text>
          </TouchableOpacity>
        </View>
      );
    };
  }, []); // Empty deps - rendering logic never changes

  // ✅ Now safe to do early returns AFTER all hooks are called
  // Only show for football matches
  if (sport !== "football") {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            Lineup view is only available for football matches
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading lineup data...
          </Text>
        </View>
      </View>
    );
  }

  if (!fetchedLineupData) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            No lineup data available
          </Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8, fontSize: 12, textAlign: 'center' }}>
            This could mean:
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
            • The match lineup hasn't been announced yet
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 11, textAlign: 'center' }}>
            • The API doesn't have lineup data for this match
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 11, textAlign: 'center' }}>
            • Check console logs for more details
          </Text>
        </View>
      </View>
    );
  }

  // ✅ UPDATED: Use team-specific colors from API, but dull them for professional look
  // Fallback to UNIQUE generated colors based on team name if API data is missing
  
  const apiHomeColor = fetchedLineupData.homeTeam.colors?.primary;
  const apiAwayColor = fetchedLineupData.awayTeam.colors?.primary;
  
  // Generate unique fallback colors based on team names
  // This ensures every match has unique colors even without API data
  const fallbackHome = generateUniqueColor(homeTeamName || "Home Team");
  const fallbackAway = generateUniqueColor(awayTeamName || "Away Team");
  
  // Process colors: Use API color if available, otherwise fallback to unique generated color
  const homeColor = processTeamColor(apiHomeColor, fallbackHome);
  const awayColor = processTeamColor(apiAwayColor, fallbackAway);
  
  console.log(`🎨 Team Colors Logic:`);
  console.log(`   - Home: API=${apiHomeColor || "N/A"} -> Final=${homeColor}`);
  console.log(`   - Away: API=${apiAwayColor || "N/A"} -> Final=${awayColor}`);
  
  // Check if colors are too similar (edge case where both teams are same color)
  // For now we assume API provides correct distinct colors or we use distinct fallbacks
  // Ideally, if homeColor === awayColor, we would swap awayColor to a contrast
  
  // ✅ CRITICAL: Filter players with strict validation to ensure complete team separation
  const homePlayerIds = new Set(fetchedLineupData.homeTeam.players.map(p => p.id));
  const awayPlayerIds = new Set(fetchedLineupData.awayTeam.players.map(p => p.id));
  
  // ✅ VALIDATION: Check for cross-team contamination
  const crossTeamPlayers = fetchedLineupData.homeTeam.players.filter(p => awayPlayerIds.has(p.id));
  if (crossTeamPlayers.length > 0) {
    console.error(`❌ CRITICAL: Found ${crossTeamPlayers.length} players in HOME team that also exist in AWAY team:`, crossTeamPlayers.map(p => `${p.name} (ID: ${p.id})`).join(", "));
  }
  
  const crossTeamPlayersAway = fetchedLineupData.awayTeam.players.filter(p => homePlayerIds.has(p.id));
  if (crossTeamPlayersAway.length > 0) {
    console.error(`❌ CRITICAL: Found ${crossTeamPlayersAway.length} players in AWAY team that also exist in HOME team:`, crossTeamPlayersAway.map(p => `${p.name} (ID: ${p.id})`).join(", "));
  }
  
  // Safe to access fetchedLineupData here since we've checked it above
  // ✅ CRITICAL: Filter with validation to ensure team separation
  const homeStarters = fetchedLineupData.homeTeam.players
    .filter((p) => p.isStarting && p.id && p.id !== "unknown")
    .filter((p) => !awayPlayerIds.has(p.id)); // Ensure not in away team
    
  const homeSubstitutes = fetchedLineupData.homeTeam.players
    .filter((p) => !p.isStarting && p.id && p.id !== "unknown")
    .filter((p) => !awayPlayerIds.has(p.id)); // Ensure not in away team
    
  const awayStarters = fetchedLineupData.awayTeam.players
    .filter((p) => p.isStarting && p.id && p.id !== "unknown")
    .filter((p) => !homePlayerIds.has(p.id)); // Ensure not in home team
    
  const awaySubstitutes = fetchedLineupData.awayTeam.players
    .filter((p) => !p.isStarting && p.id && p.id !== "unknown")
    .filter((p) => !homePlayerIds.has(p.id)); // Ensure not in home team
  
  console.log(`📊 Player Counts - Home: ${homeStarters.length} starters, ${homeSubstitutes.length} subs | Away: ${awayStarters.length} starters, ${awaySubstitutes.length} subs`);

  // Calculate team statistics
  const calculateTeamStats = (players: LineupPlayer[]) => {
    // Calculate average age from API data
    const playersWithAge = players.filter(p => p.age && p.age > 0);
    let avgAge: number;
    
    if (playersWithAge.length > 0) {
      const totalAge = playersWithAge.reduce((sum, p) => sum + (p.age || 0), 0);
      avgAge = totalAge / playersWithAge.length;
    } else {
      // If no age data from API, calculate from all players or use fallback
      console.warn('⚠️ No player age data available from API for team');
      avgAge = 25; // Fallback only when API doesn't provide age data
    }
    
    // Squad value calculation (would come from API in real scenario)
    const totalValue = players.length * 2.5; // millions
    
    return {
      squadValue: `${totalValue.toFixed(0)}M`,
      avgAge: avgAge.toFixed(1),
    };
  };

  const homeStats = calculateTeamStats(fetchedLineupData.homeTeam.players);
  const awayStats = calculateTeamStats(fetchedLineupData.awayTeam.players);

  // Colors are already defined above - use those to ensure consistency

  // Get weather icon based on condition
  const getWeatherIcon = () => {
    if (!weatherData) return null;
    const condition = weatherData.condition.toLowerCase();
    const iconSize = 22;
    const iconColor = theme.colors.textSecondary;

    if (condition.includes("rain")) {
      return <CloudRain size={iconSize} color={iconColor} />;
    } else if (condition.includes("snow")) {
      return <CloudSnow size={iconSize} color={iconColor} />;
    } else if (condition.includes("cloud")) {
      return <Cloud size={iconSize} color={iconColor} />;
    } else if (condition.includes("sun") || condition.includes("clear")) {
      return <Sun size={iconSize} color={iconColor} />;
    }
    return <Cloud size={iconSize} color={iconColor} />;
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Weather & Stadium Info - Football Only */}
        {weatherData && sport === "football" && (
          <View style={[styles.weatherSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            {/* Left Side: Temperature & Weather Condition */}
            <View style={styles.weatherLeft}>
              <View style={styles.weatherIconContainer}>
                {getWeatherIcon()}
              </View>
              <View style={styles.weatherLeftInfo}>
                <Text style={[styles.weatherTemp, { color: theme.colors.text }]}>
                  {weatherData.temperature}
                </Text>
                <Text style={[styles.weatherCondition, { color: theme.colors.textSecondary }]}>
                  {weatherData.condition}
                </Text>
              </View>
            </View>

            {/* Right Side: Stadium, Wind Speed & Humidity */}
            <View style={styles.weatherRight}>
              {/* Stadium/City Name */}
              <View style={styles.weatherRightItem}>
                <MapPin size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.weatherRightText, { color: theme.colors.text }]}>
                  {weatherData.stadium || weatherData.city || "Stadium"}
                </Text>
              </View>

              {/* Wind Speed */}
              {weatherData.windSpeed && (
                <View style={styles.weatherRightItem}>
                  <Wind size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.weatherRightText, { color: theme.colors.textSecondary }]}>
                    {weatherData.windSpeed}
                  </Text>
                </View>
              )}

              {/* Humidity */}
              <View style={styles.weatherRightItem}>
                <Droplets size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.weatherRightText, { color: theme.colors.textSecondary }]}>
                  {weatherData.humidity}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Team Managers Section */}
        <View style={[styles.managersSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.managersSectionTitle, { color: theme.colors.text }]}>
            Team Managers
          </Text>
          <View style={styles.managersContainer}>
            {/* Home Team Manager */}
            <View style={styles.managerCard}>
              <View style={styles.managerInfo}>
                <Text style={[styles.managerTeamName, { color: theme.colors.textSecondary }]}>
                  {homeTeamName}
                </Text>
                {fetchedLineupData.homeTeam.coach ? (
                  <>
                    {fetchedLineupData.homeTeam.coach.photo ? (
                      <Image
                        source={{ uri: fetchedLineupData.homeTeam.coach.photo }}
                        style={styles.managerPhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.managerPhotoPlaceholder, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.managerPhotoText, { color: theme.colors.textSecondary }]}>?</Text>
                      </View>
                    )}
                    <Text style={[styles.managerName, { color: theme.colors.text }]} numberOfLines={2}>
                      {fetchedLineupData.homeTeam.coach.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.managerPhotoPlaceholder, { backgroundColor: theme.colors.background }]}>
                      <Text style={[styles.managerPhotoText, { color: theme.colors.textSecondary }]}>?</Text>
                    </View>
                    <Text style={[styles.managerName, { color: theme.colors.textSecondary }]}>
                      No Coach Data
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* VS Divider */}
            <View style={styles.managerDivider}>
              <Text style={[styles.managerVsText, { color: theme.colors.textSecondary }]}>
                VS
              </Text>
            </View>

            {/* Away Team Manager */}
            <View style={styles.managerCard}>
              <View style={styles.managerInfo}>
                <Text style={[styles.managerTeamName, { color: theme.colors.textSecondary }]}>
                  {awayTeamName}
                </Text>
                {fetchedLineupData.awayTeam.coach ? (
                  <>
                    {fetchedLineupData.awayTeam.coach.photo ? (
                      <Image
                        source={{ uri: fetchedLineupData.awayTeam.coach.photo }}
                        style={styles.managerPhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.managerPhotoPlaceholder, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.managerPhotoText, { color: theme.colors.textSecondary }]}>?</Text>
                      </View>
                    )}
                    <Text style={[styles.managerName, { color: theme.colors.text }]} numberOfLines={2}>
                      {fetchedLineupData.awayTeam.coach.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.managerPhotoPlaceholder, { backgroundColor: theme.colors.background }]}>
                      <Text style={[styles.managerPhotoText, { color: theme.colors.textSecondary }]}>?</Text>
                    </View>
                    <Text style={[styles.managerName, { color: theme.colors.textSecondary }]}>
                      No Coach Data
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Weather Info Section - Above Football Pitch */}
        {weatherData && sport === "football" && (
          <View style={[styles.pitchWeatherSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.pitchWeatherLeft}>
              {getWeatherIcon() && (
                <View style={styles.pitchWeatherIconContainer}>
                  {getWeatherIcon()}
                </View>
              )}
              <View style={styles.pitchWeatherInfo}>
                <Text style={[styles.pitchWeatherTemp, { color: theme.colors.text }]}>
                  {weatherData.temperature}
                </Text>
                <Text style={[styles.pitchWeatherCondition, { color: theme.colors.textSecondary }]}>
                  {weatherData.condition}
                </Text>
              </View>
            </View>

            <View style={styles.pitchWeatherRight}>
              <View style={styles.pitchWeatherItem}>
                <MapPin size={12} color={theme.colors.textSecondary} />
                <Text style={[styles.pitchWeatherLabel, { color: theme.colors.text }]}>
                  {weatherData.stadium || weatherData.city || "Stadium"}
                </Text>
              </View>
              <View style={styles.pitchWeatherItem}>
                <Droplets size={12} color={theme.colors.textSecondary} />
                <Text style={[styles.pitchWeatherLabel, { color: theme.colors.textSecondary }]}>
                  {weatherData.humidity}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Match Day Screenshot Capture Button - Only show for live matches */}
        {matchData && (matchStatus === "live" || matchStatus === "LIVE" || matchStatus === "1H" || matchStatus === "2H") && sport === "football" && (
          <View style={styles.screenshotButtonContainer}>
            <MatchDayScreenshot
              match={matchData}
              lineupData={fetchedLineupData}
              weatherData={weatherData}
              homeTeamLogo={homeTeamLogo}
              awayTeamLogo={awayTeamLogo}
              currentMinute={currentMinute}
              sport={sport}
            />
          </View>
        )}

        {/* Football Pitch with Players */}
        <View style={[styles.pitchSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <ImageBackground
            source={require("@/assets/matchIcons/football_pitch2.png")}
            style={styles.pitchBackground}
            resizeMode="cover"
          >
            <View style={styles.pitchFormationHome}>
              <View style={styles.formationBadge}>
                {homeTeamLogo && (
                  <Image
                    source={{ uri: homeTeamLogo }}
                    style={styles.formationTeamLogo}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.formationBadgeText}>
                  {fetchedLineupData.homeTeam.formation || "4-4-2"}
                </Text>
              </View>
            </View>

            {/* Bottom Right Corner - Away Team Formation with Logo */}
            <View style={styles.pitchFormationAway}>
              <View style={styles.formationBadge}>
                {awayTeamLogo && (
                  <Image
                    source={{ uri: awayTeamLogo }}
                    style={styles.formationTeamLogo}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.formationBadgeText}>
                  {fetchedLineupData.awayTeam.formation || "4-4-2"}
                </Text>
              </View>
            </View>

            {/* Home Team Players - Only starting players with home team's formation */}
            {(() => {
              // ✅ FINAL SAFEGUARD: Remove any duplicates and validate team assignment
              const seenHomeIds = new Set<string>();
              const homePlayerIdsFromData = new Set((fetchedLineupData.homeTeam.players || []).map(p => p.id));
              const awayPlayerIdsFromData = new Set((fetchedLineupData.awayTeam.players || []).map(p => p.id));
              
              const uniqueHomePositions = homePlayerPositions.filter((pos) => {
                // Check for duplicates
                if (seenHomeIds.has(pos.player.id)) {
                  console.error(`❌ RENDERING: Duplicate home player detected: ${pos.player.name} (ID: ${pos.player.id}) - skipping`);
                  return false;
                }
                
                // ✅ CRITICAL: Validate player belongs to home team
                if (!homePlayerIdsFromData.has(pos.player.id)) {
                  console.error(`❌ RENDERING: Player ${pos.player.name} (ID: ${pos.player.id}) in home positions but NOT in home team data! - skipping`);
                  return false;
                }
                
                // ✅ CRITICAL: Ensure player is NOT in away team
                if (awayPlayerIdsFromData.has(pos.player.id)) {
                  console.error(`❌ RENDERING: Player ${pos.player.name} (ID: ${pos.player.id}) in home positions but ALSO in away team! - skipping`);
                  return false;
                }
                
                seenHomeIds.add(pos.player.id);
                return true;
              });
              
              // ✅ CRITICAL: Always use homeColor (processed API color) for home team players
              // This ensures all home team players have consistent borders/badges
              console.log(`🎨 RENDERING HOME: ${uniqueHomePositions.length} players with color ${homeColor}`);
              
              return uniqueHomePositions.map((pos, index) => {
                const uniqueKey = `home-${pos.player.id}-${pos.player.number}-${index}-${pos.x}-${pos.y}`;
                // ✅ CRITICAL: Always use homeColor for home team - ensures consistent color
                return (
                  <React.Fragment key={uniqueKey}>
                    {renderPlayerOnPitch(pos, homeColor, "home")}
                  </React.Fragment>
                );
              });
            })()}

            {/* Away Team Players - Only starting players with away team's formation */}
            {(() => {
              // ✅ FINAL SAFEGUARD: Remove any duplicates and validate team assignment
              const seenAwayIds = new Set<string>();
              const homePlayerIdsFromData = new Set((fetchedLineupData.homeTeam.players || []).map(p => p.id));
              const awayPlayerIdsFromData = new Set((fetchedLineupData.awayTeam.players || []).map(p => p.id));
              
              const uniqueAwayPositions = awayPlayerPositions.filter((pos) => {
                // Check for duplicates
                if (seenAwayIds.has(pos.player.id)) {
                  console.error(`❌ RENDERING: Duplicate away player detected: ${pos.player.name} (ID: ${pos.player.id}) - skipping`);
                  return false;
                }
                
                // ✅ CRITICAL: Validate player belongs to away team
                if (!awayPlayerIdsFromData.has(pos.player.id)) {
                  console.error(`❌ RENDERING: Player ${pos.player.name} (ID: ${pos.player.id}) in away positions but NOT in away team data! - skipping`);
                  return false;
                }
                
                // ✅ CRITICAL: Ensure player is NOT in home team
                if (homePlayerIdsFromData.has(pos.player.id)) {
                  console.error(`❌ RENDERING: Player ${pos.player.name} (ID: ${pos.player.id}) in away positions but ALSO in home team! - skipping`);
                  return false;
                }
                
                seenAwayIds.add(pos.player.id);
                return true;
              });
              
              // ✅ CRITICAL: Always use awayColor (processed API color) for away team players
              // This ensures all away team players have consistent borders/badges
              console.log(`🎨 RENDERING AWAY: ${uniqueAwayPositions.length} players with color ${awayColor}`);
              
              return uniqueAwayPositions.map((pos, index) => {
                const uniqueKey = `away-${pos.player.id}-${pos.player.number}-${index}-${pos.x}-${pos.y}`;
                // ✅ CRITICAL: Always use awayColor for away team - ensures consistent color
                return (
                  <React.Fragment key={uniqueKey}>
                    {renderPlayerOnPitch(pos, awayColor, "away")}
                  </React.Fragment>
                );
              });
            })()}
          </ImageBackground>
        </View>

        {/* Substitutes Section */}
        <View style={[styles.substitutesSection, { backgroundColor: theme.colors.backgroundSecondary }]}>

          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Substitutes
            </Text>
          </View>

          <View style={styles.substitutesContainer}>
            {/* Home Team Substitutes */}
            <View style={styles.substitutesColumn}>
              <View style={styles.substitutesHeader}>
                {homeTeamLogo && (
                  <Image
                    source={{ uri: homeTeamLogo }}
                    style={styles.substitutesHeaderLogo}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.teamHeaderTextContainer}>
                  <Text
                    style={[styles.substitutesHeaderText, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {homeTeamName}
                  </Text>
                  <Text style={[styles.teamAgeText, { color: theme.colors.textSecondary }]}>
                    Avg Age: {homeStats.avgAge}
                  </Text>
                </View>
              </View>
              {homeSubstitutes.map((player) => (
                <View key={player.id} style={styles.substituteItem}>
                  {/* ✅ Real Jersey icon with sleeves (API team colors) */}
                  <View style={styles.substituteJerseyContainer}>
                    <View
                      style={[
                        styles.substituteJerseyIcon,
                        {
                          backgroundColor: homeColor, // API-driven team color
                        },
                      ]}
                    >
                      {/* Jersey Sleeves */}
                      <View style={styles.jerseySleeves}>
                        <View
                          style={[
                            styles.jerseySleeve,
                            {
                              backgroundColor: homeColor, // API-driven team color
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.jerseySleeve,
                            {
                              backgroundColor: homeColor, // API-driven team color
                            },
                          ]}
                        />
                      </View>
                      
                      {/* Jersey Number */}
                      <Text
                        style={[
                          styles.substituteJerseyNumber,
                          {
                            color: "#FFFFFF", // White number for visibility
                          },
                        ]}
                      >
                        {player.number > 0 ? player.number : "-"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.substituteInfo}>
                    <Text style={[styles.substituteName, { color: theme.colors.text }]}>
                      {player.name}
                    </Text>
                    <Text style={[styles.substitutePosition, { color: theme.colors.textSecondary }]}>
                      {player.position}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Away Team Substitutes */}
            <View style={styles.substitutesColumn}>
              <View style={styles.substitutesHeader}>
                {awayTeamLogo && (
                  <Image
                    source={{ uri: awayTeamLogo }}
                    style={styles.substitutesHeaderLogo}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.teamHeaderTextContainer}>
                  <Text
                    style={[styles.substitutesHeaderText, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {awayTeamName}
                  </Text>
                  <Text style={[styles.teamAgeText, { color: theme.colors.textSecondary }]}>
                    Avg Age: {awayStats.avgAge}
                  </Text>
                </View>
              </View>
              {awaySubstitutes.map((player) => (
                <View key={player.id} style={styles.substituteItem}>
                  {/* ✅ Real Jersey icon with sleeves (API team colors) */}
                  <View style={styles.substituteJerseyContainer}>
                    <View
                      style={[
                        styles.substituteJerseyIcon,
                        {
                          backgroundColor: awayColor, // API-driven team color
                        },
                      ]}
                    >
                      {/* Jersey Sleeves */}
                      <View style={styles.jerseySleeves}>
                        <View
                          style={[
                            styles.jerseySleeve,
                            {
                              backgroundColor: awayColor, // API-driven team color
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.jerseySleeve,
                            {
                              backgroundColor: awayColor, // API-driven team color
                            },
                          ]}
                        />
                      </View>
                      
                      {/* Jersey Number */}
                      <Text
                        style={[
                          styles.substituteJerseyNumber,
                          {
                            color: "#FFFFFF", // White number for visibility
                          },
                        ]}
                      >
                        {player.number > 0 ? player.number : "-"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.substituteInfo}>
                    <Text style={[styles.substituteName, { color: theme.colors.text }]}>
                      {player.name}
                    </Text>
                    <Text style={[styles.substitutePosition, { color: theme.colors.textSecondary }]}>
                      {player.position}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Full Squad Section */}
        <View style={[styles.fullSquadSection, { backgroundColor: theme.colors.backgroundSecondary }]}>

          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Full Squad
            </Text>
          </View>

          <View style={styles.fullSquadContainer}>
            {/* Home Team */}
            <View style={styles.fullSquadColumn}>
              <View style={styles.fullSquadHeader}>
                {homeTeamLogo && (
                  <Image
                    source={{ uri: homeTeamLogo }}
                    style={styles.fullSquadHeaderLogo}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.teamHeaderTextContainer}>
                  <Text
                    style={[styles.fullSquadHeaderText, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {homeTeamName}
                  </Text>
                  <Text style={[styles.teamAgeText, { color: theme.colors.textSecondary }]}>
                    Avg Age: {homeStats.avgAge}
                  </Text>
                </View>
              </View>
              {fetchedLineupData.homeTeam.players.map((player) => (
                <View key={player.id} style={styles.fullSquadItem}>
                  {/* ✅ Real Jersey icon with sleeves (API team colors) */}
                  <View style={styles.fullSquadJerseyContainer}>
                    <View
                      style={[
                        styles.fullSquadJerseyIcon,
                        {
                          backgroundColor: homeColor, // API-driven team color
                        },
                      ]}
                    >
                      {/* Jersey Sleeves */}
                      <View style={styles.fullSquadJerseySleeves}>
                        <View
                          style={[
                            styles.fullSquadJerseySleeve,
                            {
                              backgroundColor: homeColor, // API-driven team color
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.fullSquadJerseySleeve,
                            {
                              backgroundColor: homeColor, // API-driven team color
                            },
                          ]}
                        />
                      </View>
                      
                      {/* Jersey Number */}
                      <Text
                        style={[
                          styles.fullSquadJerseyNumber,
                          {
                            color: "#FFFFFF", // White number for visibility
                          },
                        ]}
                      >
                        {player.number > 0 ? player.number : "-"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fullSquadInfo}>
                    <Text style={[styles.fullSquadName, { color: theme.colors.text }]}>
                      {player.name}
                    </Text>
                    <Text style={[styles.fullSquadPosition, { color: theme.colors.textSecondary }]}>
                      {player.position}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Away Team */}
            <View style={styles.fullSquadColumn}>
              <View style={styles.fullSquadHeader}>
                {awayTeamLogo && (
                  <Image
                    source={{ uri: awayTeamLogo }}
                    style={styles.fullSquadHeaderLogo}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.teamHeaderTextContainer}>
                  <Text
                    style={[styles.fullSquadHeaderText, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {awayTeamName}
                  </Text>
                  <Text style={[styles.teamAgeText, { color: theme.colors.textSecondary }]}>
                    Avg Age: {awayStats.avgAge}
                  </Text>
                </View>
              </View>
              {fetchedLineupData.awayTeam.players.map((player) => (
                <View key={player.id} style={styles.fullSquadItem}>
                  {/* ✅ Real Jersey icon with sleeves (API team colors) */}
                  <View style={styles.fullSquadJerseyContainer}>
                    <View
                      style={[
                        styles.fullSquadJerseyIcon,
                        {
                          backgroundColor: awayColor, // API-driven team color
                        },
                      ]}
                    >
                      {/* Jersey Sleeves */}
                      <View style={styles.fullSquadJerseySleeves}>
                        <View
                          style={[
                            styles.fullSquadJerseySleeve,
                            {
                              backgroundColor: awayColor, // API-driven team color
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.fullSquadJerseySleeve,
                            {
                              backgroundColor: awayColor, // API-driven team color
                            },
                          ]}
                        />
                      </View>
                      
                      {/* Jersey Number */}
                      <Text
                        style={[
                          styles.fullSquadJerseyNumber,
                          {
                            color: "#FFFFFF", // White number for visibility
                          },
                        ]}
                      >
                        {player.number > 0 ? player.number : "-"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fullSquadInfo}>
                    <Text style={[styles.fullSquadName, { color: theme.colors.text }]}>
                      {player.name}
                    </Text>
                    <Text style={[styles.fullSquadPosition, { color: theme.colors.textSecondary }]}>
                      {player.position}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom Icons */}
        <View style={[styles.bottomIcons, { backgroundColor: theme.colors.backgroundSecondary }]}>
          {/* First Row - 5 icons */}
          <View style={styles.iconRow}>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/goal.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Goal
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/shot_on.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Shot On
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/shot_off.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Shot Off
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/pen_in.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Pen In
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/pen_missed.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Pen Out
              </Text>
            </View>
          </View>

          {/* Second Row - 5 icons */}
          <View style={styles.iconRow}>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/penalties.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Penalties
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/og.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Own Goal
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/assist.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Assist
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/corner.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Corner
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/yellow.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Yellow
              </Text>
            </View>
          </View>

          {/* Third Row - 6 icons */}
          <View style={styles.iconRow}>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/red.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Red
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/injury.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Injury
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/player_in.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Sub In
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/player_out.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                Sub Out
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/yell_red.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                2 Yellows
              </Text>
            </View>
            <View style={styles.iconItem}>
              <Image
                source={require("@/assets/matchIcons/var.png")}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
                VAR
              </Text>
            </View>
          </View>
        </View>

        {/* Player Performance Modal */}
        <PlayerPerformanceModal
          visible={!!selectedPlayer}
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          teamColor={selectedPlayer?.teamName === homeTeamName ? homeColor : awayColor}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },

  // Enhanced Weather Section
  weatherSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  weatherLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  weatherIconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  weatherLeftInfo: {
    gap: 2,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: "700",
  },
  weatherCondition: {
    fontSize: 12,
  },
  weatherRight: {
    gap: 8,
    alignItems: "flex-end",
  },
  weatherRightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weatherRightText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Managers Section
  managersSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  managersSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  managersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  managerCard: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  managerTeamLogo: {
    width: 32,
    height: 32,
  },
  managerInfo: {
    alignItems: "center",
    gap: 6,
  },
  managerTeamName: {
    fontSize: 12,
    fontWeight: "600",
  },
  managerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  managerPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  managerPhotoText: {
    fontSize: 24,
    fontWeight: "600",
  },
  managerName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  managerDivider: {
    justifyContent: "center",
    alignItems: "center",
  },
  managerVsText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Official Lineups Section
  officialLineupsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ageInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ageInfoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  teamHeaderTextContainer: {
    flexDirection: "column",
    gap: 2,
  },
  teamAgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  formationsDisplay: {
    flexDirection: "row",
    gap: 12,
  },
  formationItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  formationLogo: {
    width: 40,
    height: 40,
  },
  formationTeamName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  formationText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  formationPlayerCount: {
    fontSize: 12,
  },

  // Pitch Section
  pitchSection: {
    marginBottom: 12,
  },
  pitchBackground: {
    width: screenWidth,
    height: screenWidth * 1.4, // ✅ RESTORED: Original pitch height
    position: "relative",
  },
  // Weather section above pitch
  pitchWeatherSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  pitchWeatherLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pitchWeatherIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
  },
  pitchWeatherInfo: {
    gap: 2,
  },
  pitchWeatherTemp: {
    fontSize: 16,
    fontWeight: "600",
  },
  pitchWeatherCondition: {
    fontSize: 11,
    opacity: 0.7,
  },
  pitchWeatherRight: {
    gap: 6,
    alignItems: "flex-end",
  },
  pitchWeatherItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pitchWeatherLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  // Formation badges in corners
  pitchFormationHome: {
    position: "absolute",
    top: 15,
    left: 12,
  },
  pitchFormationAway: {
    position: "absolute",
    bottom: 15,
    left: 12,
  },
  formationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 195, 74, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  formationTeamLogo: {
    width: 32,
    height: 32,
  },
  formationBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  playerOnPitch: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  playerPhotoContainer: {
    position: "relative",
    marginBottom: 4,
  },
  playerPhotoBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
  },
  playerPhoto: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  playerPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  playerPhotoText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  jerseyBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  // Captain Badge - Red square with white C
  captainBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 16,
    height: 16,
    backgroundColor: "#FF4444",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  captainText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: "Inter-Black",
  },
  jerseyNumber: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  playerNameOnPitch: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    maxWidth: 80,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Substitutes Section
  substitutesSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  substitutesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  substitutesColumn: {
    flex: 1,
  },
  substitutesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  substitutesHeaderLogo: {
    width: 28,
    height: 28,
  },
  substitutesHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  substituteItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  // ✅ Jersey-style container (like shirt with number)
  substituteJerseyContainer: {
    marginLeft: 0,
    marginRight: 8,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  substituteJerseyIcon: {
    position: "relative",
    width: 26,
    height: 26,
    // backgroundColor set inline dynamically based on theme
    borderRadius: 4,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    justifyContent: "center",
    alignItems: "center",
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
    // backgroundColor set inline dynamically based on theme
    borderRadius: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  substituteJerseyNumber: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
    zIndex: 1,
    // color set inline dynamically based on theme
  },
  substituteInfo: {
    flex: 1,
    gap: 2,
  },
  substituteNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  substituteNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  substituteName: {
    fontSize: 13,
    fontWeight: "500",
  },
  substitutePosition: {
    fontSize: 11,
  },
  ratingBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Full Squad Section
  fullSquadSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  fullSquadContainer: {
    flexDirection: "row",
    gap: 12,
  },
  fullSquadColumn: {
    flex: 1,
  },
  fullSquadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  fullSquadHeaderLogo: {
    width: 28,
    height: 28,
  },
  fullSquadHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  fullSquadItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  // ✅ Jersey-style container for full squad (like shirt with number)
  fullSquadJerseyContainer: {
    marginLeft: 0,
    marginRight: 8,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fullSquadJerseyIcon: {
    position: "relative",
    width: 26,
    height: 26,
    // backgroundColor set inline dynamically based on theme
    borderRadius: 4,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  fullSquadJerseySleeves: {
    flexDirection: "row",
    position: "absolute",
    top: 1,
    left: -5,
    right: -5,
    justifyContent: "space-between",
  },
  fullSquadJerseySleeve: {
    width: 9,
    height: 10,
    // backgroundColor set inline dynamically based on theme
    borderRadius: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  fullSquadJerseyNumber: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
    zIndex: 1,
    // color set inline dynamically based on theme
  },
  fullSquadNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  fullSquadNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  fullSquadInfo: {
    flex: 1,
  },
  fullSquadName: {
    fontSize: 13,
    fontWeight: "500",
  },
  fullSquadPosition: {
    fontSize: 11,
  },

  // Bottom Icons
  bottomIcons: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconItem: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  iconLabel: {
    fontSize: 10,
    textAlign: "center",
  },

  // Screenshot Button Container
  screenshotButtonContainer: {
    marginTop: 8,
    marginBottom: 12,
  },

  // ✅ Fallback styles for players without photos
  playerCircleNoPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  playerNumberNoPhoto: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  captainBadgeNoPhoto: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    backgroundColor: "#FF0000",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
  },
});
