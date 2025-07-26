import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Star, Video, Play, Tv, Flag, Monitor, Users } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLiveTimer } from '@/contexts/LiveTimerContext';
import { Match } from '@/types/match';
import goalDetectionService from '@/services/goalDetectionService';
import { playGoalSound } from '@/utils/SoundManager';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';
import { leagueNormalizationService } from '@/services/leagueNormalizationService';

interface MatchItemProps {
  match: Match;
  onToggleFavorite: (matchId: string) => void;
  onPress: (match: Match) => void;
}

export default function MatchItem({ match, onToggleFavorite, onPress }: MatchItemProps) {
  const theme = useTheme();
  const { isBlinking, getCurrentMatchMinute } = useLiveTimer();
  const { settings } = useMatchSettings();
  
  // Goal flash animation state
  const [homeTeamFlash, setHomeTeamFlash] = useState(false);
  const [awayTeamFlash, setAwayTeamFlash] = useState(false);
  const homeFlashAnim = useRef(new Animated.Value(0)).current;
  const awayFlashAnim = useRef(new Animated.Value(0)).current;

  // Subscribe to goal notifications for this match
  useEffect(() => {
    if (!match || match.status !== 'live' || !settings.goalNotification) {
      return;
    }

    console.log('🔔 MatchItem subscribing to goal notifications for match:', match.id);

    const unsubscribe = goalDetectionService.subscribe((goalData) => {
      // Only flash if this is the match that scored/had goal cancelled
      if (goalData.matchId === match.id) {
        console.log('🚨 MatchItem received goal notification for:', match.id, goalData);
        
        if (goalData.eventType === 'goal') {
          // Regular goal - show red flash
          triggerGoalFlash(goalData.scoringTeam);
        } else if (goalData.eventType === 'cancelled') {
          // Cancelled goal - show brief red flash then fade
          triggerCancelledGoalFlash(goalData.scoringTeam);
        }
      }
    });

    return unsubscribe;
  }, [match?.id, match?.status, settings.goalNotification]);

  // Trigger 3-second red background flash for scoring team
  const triggerGoalFlash = (scoringTeam: 'home' | 'away') => {
    console.log(`🔴 GOAL FLASH: ${scoringTeam} team scored! Starting 3-second red background flash`);
    
    if (scoringTeam === 'home') {
      setHomeTeamFlash(true);
      
      // Animate red background flash
      Animated.sequence([
        Animated.timing(homeFlashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(homeFlashAnim, {
          toValue: 0.7,
          duration: 2800,
          useNativeDriver: false,
        }),
        Animated.timing(homeFlashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setHomeTeamFlash(false);
        console.log('🔴 GOAL FLASH: Home team flash completed');
      });
    } else {
      setAwayTeamFlash(true);
      
      // Animate red background flash
      Animated.sequence([
        Animated.timing(awayFlashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(awayFlashAnim, {
          toValue: 0.7,
          duration: 2800,
          useNativeDriver: false,
        }),
        Animated.timing(awayFlashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setAwayTeamFlash(false);
        console.log('🔴 GOAL FLASH: Away team flash completed');
      });
    }
  };

  // Trigger brief flash for cancelled goals
  const triggerCancelledGoalFlash = (scoringTeam: 'home' | 'away') => {
    console.log(`🚫 CANCELLED GOAL FLASH: ${scoringTeam} team goal cancelled! Brief red flash`);
    
    if (scoringTeam === 'home') {
      setHomeTeamFlash(true);
      
      // Brief flash for cancelled goal
      Animated.sequence([
        Animated.timing(homeFlashAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(homeFlashAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setHomeTeamFlash(false);
        console.log('🚫 CANCELLED GOAL FLASH: Home team flash completed');
      });
    } else {
      setAwayTeamFlash(true);
      
      // Brief flash for cancelled goal
      Animated.sequence([
        Animated.timing(awayFlashAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(awayFlashAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setAwayTeamFlash(false);
        console.log('🚫 CANCELLED GOAL FLASH: Away team flash completed');
      });
    }
  };

  // ✅ CRITICAL FIX: Enhanced time formatting for proper 24-hour display
  const formatTime = (dateTimeString: string) => {
    try {
      if (!dateTimeString) {
        console.warn('⚠️ Empty dateTimeString passed to formatTime');
        return 'TBD';
      }
      
      // ✅ FIX: Handle different datetime formats more robustly
      let date: Date;
      
      // Handle ISO format with timezone (e.g., "2024-01-15T15:30:00+00:00")
      if (dateTimeString.includes('T') && (dateTimeString.includes('+') || dateTimeString.includes('Z'))) {
        date = new Date(dateTimeString);
      }
      // Handle simple date format (e.g., "2024-01-15 15:30:00")
      else if (dateTimeString.includes(' ')) {
        // Try parsing as is first
        date = new Date(dateTimeString);
        // If invalid, try adding 'T' to make it ISO
        if (isNaN(date.getTime())) {
          const isoFormat = dateTimeString.replace(' ', 'T');
          date = new Date(isoFormat);
        }
      }
      // Handle date-only format (e.g., "2024-01-15")
      else if (dateTimeString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // For date-only, assume 12:00 local time
        date = new Date(dateTimeString + 'T12:00:00');
      }
      // Fallback: try direct parsing
      else {
        date = new Date(dateTimeString);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date string after all attempts:', dateTimeString);
        return 'TBD';
      }
      
      // ✅ ENHANCED: Use getHours() and getMinutes() for reliable 24-hour format with full day logging
      // This automatically converts UTC to local time
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      // ✅ FULL DAY COVERAGE: Log fixture times across all hours for validation
      if (hours < '06' || hours > '22') {
        console.log(`🌅🌙 FIXTURE TIME: Early/late match at ${timeString} (hour ${hours}) for ${match.home.name} vs ${match.away.name}`);
      }
      
      return timeString;
    } catch (error) {
      console.error('❌ Error formatting time:', error, 'for input:', dateTimeString);
      return 'TBD';
    }
  };

  // Simplified and accurate league naming with enhanced tournament support
  const formatLeagueName = (league: string) => {
    if (!league) return 'League';
    
    const cleanLeague = league.toLowerCase().trim();
    
    // ✅ ENHANCED: Tournament/Cup Round Detection and Formatting
    const detectTournamentRound = (leagueName: string): string => {
      const lower = leagueName.toLowerCase();
      
      // Cup/Tournament identifiers
      const isCupTournament = lower.includes('cup') || lower.includes('trophy') || 
                             lower.includes('champions') || lower.includes('europa') ||
                             lower.includes('tournament') || lower.includes('qualifying');
      
      if (isCupTournament) {
        // Round of 16 variations
        if (lower.includes('1/8') || lower.includes('round of 16') || lower.includes('r16') || 
            lower.includes('eighth') || lower.includes('octavos')) {
          return lower.includes('cup') ? `${extractCupName(leagueName)} R16` : 
                 lower.includes('champions') ? 'Champions League R16' :
                 lower.includes('europa') ? 'Europa League R16' : 
                 `${leagueName.split(' ')[0]} R16`;
        }
        
        // Quarter Finals variations
        if (lower.includes('1/4') || lower.includes('quarter') || lower.includes('qf') || 
            lower.includes('quartos') || lower.includes('cuartos')) {
          return lower.includes('cup') ? `${extractCupName(leagueName)} QF` : 
                 lower.includes('champions') ? 'Champions League QF' :
                 lower.includes('europa') ? 'Europa League QF' : 
                 `${leagueName.split(' ')[0]} QF`;
        }
        
        // Semi Finals variations
        if (lower.includes('1/2') || lower.includes('semi') || lower.includes('sf') || 
            lower.includes('semifinal') || lower.includes('semi-final')) {
          return lower.includes('cup') ? `${extractCupName(leagueName)} SF` : 
                 lower.includes('champions') ? 'Champions League SF' :
                 lower.includes('europa') ? 'Europa League SF' : 
                 `${leagueName.split(' ')[0]} SF`;
        }
        
        // Finals variations
        if (lower.includes('final') && !lower.includes('semi') && !lower.includes('quarter')) {
          return lower.includes('cup') ? `${extractCupName(leagueName)} Final` : 
                 lower.includes('champions') ? 'Champions Final' :
                 lower.includes('europa') ? 'Europa Final' : 
                 `${leagueName.split(' ')[0]} Final`;
        }
        
        // Group Stage variations
        if (lower.includes('group') || lower.includes('grupos') || lower.includes('fase')) {
          return lower.includes('champions') ? 'Champions Group' :
                 lower.includes('europa') ? 'Europa Group' : 
                 `${leagueName.split(' ')[0]} Group`;
        }
        
        // Qualifying rounds
        if (lower.includes('qualify') || lower.includes('qualification') || lower.includes('playoff')) {
          return lower.includes('champions') ? 'Champions Qual' :
                 lower.includes('europa') ? 'Europa Qual' : 
                 `${leagueName.split(' ')[0]} Qual`;
        }
      }
      
      return ''; // No tournament round detected
    };
    
    // Helper function to extract cup name
    const extractCupName = (leagueName: string): string => {
      const lower = leagueName.toLowerCase();
      if (lower.includes('fa cup')) return 'FA Cup';
      if (lower.includes('copa del rey')) return 'Copa del Rey';
      if (lower.includes('coupe de france')) return 'Coupe France';
      if (lower.includes('dfb pokal')) return 'DFB Pokal';
      if (lower.includes('coppa italia')) return 'Coppa Italia';
      if (lower.includes('carabao')) return 'Carabao Cup';
      if (lower.includes('league cup')) return 'League Cup';
      return leagueName.split(' ')[0] + ' Cup';
    };
    
    // ✅ ENHANCED: Check for tournament round first
    const tournamentRound = detectTournamentRound(league);
    if (tournamentRound) {
      console.log(`🏆 TOURNAMENT DETECTED: "${league}" → "${tournamentRound}"`);
      return tournamentRound;
    }
    
    // Keep famous league names exactly as they are
    if (cleanLeague.includes('la liga')) return 'La Liga';
    if (cleanLeague.includes('serie a')) return 'Serie A';
    if (cleanLeague.includes('bundesliga')) return 'Bundesliga';
    if (cleanLeague.includes('ligue 1')) return 'Ligue 1';
    if (cleanLeague.includes('eredivisie')) return 'Eredivisie';
    if (cleanLeague.includes('primeira liga')) return 'Primeira Liga';
    if (cleanLeague.includes('champions league')) return 'Champions League';
    if (cleanLeague.includes('europa league')) return 'Europa League';
    if (cleanLeague.includes('premier league') && cleanLeague.includes('english')) return 'English Premier League';
    
    // Get team names for country detection
    const homeTeam = match.home.name || '';
    const awayTeam = match.away.name || '';
    const teamNames = (homeTeam + ' ' + awayTeam).toLowerCase();
    
    // Detect specific countries and apply nationality
    const detectCountryPrefix = (): string => {
      // Bhutanese teams (NEW - fix for Samtse vs Paro issue)
      if (teamNames.includes('samtse') || teamNames.includes('paro') || teamNames.includes('thimphu') ||
          teamNames.includes('phuntsholing') || teamNames.includes('punakha') || teamNames.includes('wangdue') ||
          teamNames.includes('bumthang') || teamNames.includes('trashigang') || teamNames.includes('bhutan') ||
          cleanLeague.includes('bhutan') || cleanLeague.includes('bhutanese')) {
        return 'Bhutanese';
      }
      
      // Lebanese teams (comprehensive list)
      if (teamNames.includes('lebanon') || teamNames.includes('lebanese') || teamNames.includes('beirut') ||
          teamNames.includes('bekaa') || teamNames.includes('bourj') || teamNames.includes('tripoli') ||
          teamNames.includes('sidon') || teamNames.includes('baalbek') || teamNames.includes('racing') ||
          teamNames.includes('reyady') || teamNames.includes('abaseya') || teamNames.includes('ansar') ||
          teamNames.includes('ahed') || teamNames.includes('nejmeh') || teamNames.includes('salam') ||
          cleanLeague.includes('lebanon') || cleanLeague.includes('lebanese')) {
        return 'Lebanese';
      }
      
      // Chinese teams
      if (teamNames.includes('shanghai') || teamNames.includes('guangzhou') || teamNames.includes('beijing') ||
          teamNames.includes('guangxi') || teamNames.includes('nantong') || teamNames.includes('shenzhen') ||
          teamNames.includes('chengdu') || teamNames.includes('wuhan') || teamNames.includes('hubei') ||
          cleanLeague.includes('china') || cleanLeague.includes('chinese')) {
        return 'Chinese';
      }
      
      // Mongolian teams
      if (teamNames.includes('khovd') || teamNames.includes('bayanzürkh') || teamNames.includes('ulaanbaatar') || 
          teamNames.includes('erdenet') || teamNames.includes('darkhan') ||
          cleanLeague.includes('mongolia') || cleanLeague.includes('mongolian')) {
        return 'Mongolian';
      }
      
      // Guinean teams
      if (teamNames.includes('flamme olympique') || teamNames.includes('asm sangarédi') || 
          teamNames.includes('guinée foot') || teamNames.includes('loubha télimélé') || 
          teamNames.includes('wakirya') || teamNames.includes('horoya') ||
          cleanLeague.includes('guinea') || cleanLeague.includes('guinean')) {
        return 'Guinean';
      }
      
      // American teams
      if (teamNames.includes('chicago') || teamNames.includes('virginia') || teamNames.includes('crown legacy') ||
          teamNames.includes('evergreen') || teamNames.includes('utah united') || teamNames.includes('southern city') ||
          teamNames.includes('newmarket') || cleanLeague.includes('america') || cleanLeague.includes('mls') ||
          cleanLeague.includes('usa') || cleanLeague.includes('united states')) {
        return 'American';
      }
      
      // Eastern European teams
      if (teamNames.includes('belarus') || teamNames.includes('azerbaijan') || teamNames.includes('minsk') ||
          teamNames.includes('baku') || teamNames.includes('yerevan') || teamNames.includes('armenia') ||
          cleanLeague.includes('belarus') || cleanLeague.includes('azerbaijan') || cleanLeague.includes('armenia')) {
        return '';
      }
      
      // English teams (very specific - only for actual English clubs)
      const englishClubs = ['manchester', 'liverpool', 'arsenal', 'chelsea', 'tottenham', 'leicester', 'newcastle', 
                           'brighton', 'aston villa', 'west ham', 'crystal palace', 'bournemouth', 'fulham', 
                           'wolves', 'everton', 'brentford', 'nottingham forest', 'luton', 'burnley', 'sheffield united'];
      const hasEnglishClub = englishClubs.some(club => homeTeam.toLowerCase().includes(club) || awayTeam.toLowerCase().includes(club));
      
      // Only return 'English' if we have actual English club names AND it's a premier league
      if (hasEnglishClub && cleanLeague.includes('premier')) {
        return 'English';
      }
      
      // For other cases, don't add a prefix
      return '';
    };
    
    const countryPrefix = detectCountryPrefix();
    
    // Special handling for friendlies
    if (cleanLeague.includes('friendly') || cleanLeague.includes('international')) {
      // For women's matches, try to get the country
      if (homeTeam.toLowerCase().includes(' w') || awayTeam.toLowerCase().includes(' w')) {
        if (countryPrefix) {
          return `${countryPrefix} Women`;
        }
        return 'Women Friendlies';
      }
      return 'Friendlies';
    }
    
    // Build the final league name with PL abbreviation
    if (countryPrefix) {
      // Add country prefix for identified leagues
      if (cleanLeague.includes('premier')) {
        const prefixedName = `${countryPrefix} PL`;
        return prefixedName; // ✅ FIXED: No truncation - let full name display
      } else if (cleanLeague.includes('ligue')) {
        const prefixedName = `${countryPrefix} Ligue 1`;
        return prefixedName; // ✅ FIXED: No truncation - let full name display
      } else if (cleanLeague.includes('league')) {
        const prefixedName = `${countryPrefix} League`;
        return prefixedName; // ✅ FIXED: No truncation - let full name display
      } else {
        const prefixedName = `${countryPrefix} ${league}`;
        return prefixedName; // ✅ FIXED: No truncation - let full name display
      }
    }
    
    // ✅ FIXED: Only apply PL abbreviation to CONFIRMED English Premier League matches
    // Don't automatically convert random "premier" leagues to "PL" format
    let finalName = league;
    
    // ✅ CRITICAL: Only apply English PL logic if we DIDN'T detect any other country
    if (!countryPrefix && ((cleanLeague.includes('english premier league') || cleanLeague.includes('epl')) || 
        (cleanLeague.includes('premier league') && !cleanLeague.includes('bhutan') && !cleanLeague.includes('bangladesh') && 
         !cleanLeague.includes('india') && !cleanLeague.includes('australia') && !cleanLeague.includes('china')))) {
      finalName = league.replace(/premier league/gi, 'PL').replace(/english premier league/gi, 'English PL');
      console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLISH PL APPLIED: "${league}" → "${finalName}"`);
    } else if (countryPrefix) {
      console.log(`🌍 COUNTRY PREFIX DETECTED: "${league}" with country "${countryPrefix}" - NOT applying English PL`);
    }
    
    // ✅ FIXED: No truncation - let full league names display properly
    return finalName;
  };

  // In the component, where the league name is displayed, ensure it's normalized
  const displayLeagueName = useMemo(() => {
    if (!match.league) return 'Unknown League';
    
    console.log(`🏆 MATCHITEM: Normalizing league for ${match.home.name} vs ${match.away.name} in "${match.league}"`);
    
    // ✅ ENHANCED LOGGING: Track our specific fixes
    if (match.league?.toLowerCase().includes('1. division') || match.league?.toLowerCase().includes('premier')) {
      console.log(`🚨 CRITICAL LEAGUE DETECTED: "${match.league}" for ${match.home.name} vs ${match.away.name} - applying enhanced normalization`);
    }
    
    // ✅ HARDCODED FIX: Explicit handling for problematic cases
    const homeTeam = match.home.name?.toLowerCase() || '';
    const awayTeam = match.away.name?.toLowerCase() || '';
    const league = match.league.toLowerCase();
    
    // ✅ CRITICAL: Bhutanese teams should NEVER be English PL
    if ((homeTeam.includes('samtse') || homeTeam.includes('paro') || homeTeam.includes('thimphu') ||
         awayTeam.includes('samtse') || awayTeam.includes('paro') || awayTeam.includes('thimphu')) &&
        league.includes('premier')) {
      console.log(`🇧🇹 BHUTANESE MATCH DETECTED: ${match.home.name} vs ${match.away.name} - returning "Bhutanese PL"`);
      return 'Bhutanese PL';
    }
    
    // ✅ CRITICAL: Zimbabwean teams should NEVER be South African PL
    if ((homeTeam.includes('dynamos') || homeTeam.includes('highlanders') || homeTeam.includes('triangle') || homeTeam.includes('manica') ||
         homeTeam.includes('bikita') || homeTeam.includes('scotland') || homeTeam.includes('caps united') ||
         awayTeam.includes('dynamos') || awayTeam.includes('highlanders') || awayTeam.includes('triangle') || awayTeam.includes('manica') ||
         awayTeam.includes('bikita') || awayTeam.includes('scotland') || awayTeam.includes('caps united')) &&
        (league.includes('premier') || league.includes('soccer') || league.includes('south african'))) {
      console.log(`🇿🇼 ZIMBABWEAN MATCH DETECTED: ${match.home.name} vs ${match.away.name} - returning "Zimbabwean PL"`);
      return 'Zimbabwean PL';
    }
    
    // ✅ CRITICAL: Premier Soccer League should be normalized based on teams
    if (league.includes('premier soccer league')) {
      // Use normalization service to detect proper country
      const teamNames = `${match.home.name} ${match.away.name}`;
      const normalizedResult = leagueNormalizationService.normalizeLeagueName(match.league, teamNames);
      if (normalizedResult && normalizedResult !== match.league) {
        console.log(`🚨 PSL DETECTED in MatchItem: "${match.league}" → "${normalizedResult}"`);
        return normalizedResult;
      }
    }
    
    // ✅ CRITICAL: Fix specific "Premier L" patterns to "PL" format
    if (league.includes('zimbabwean premier l') && !league.includes('premier league')) {
      console.log(`🇿🇼 ZIMBABWEAN PREMIER L FIX in MatchItem: "${match.league}" → "Zimbabwean PL"`);
      return 'Zimbabwean PL';
    }
    
    // ✅ CRITICAL: Fix other "Premier L" patterns to "PL" format
    if (league.includes('premier l') && !league.includes('premier league')) {
      // Use normalization service to detect country and fix
      const teamNames = `${match.home.name} ${match.away.name}`;
      const normalizedResult = leagueNormalizationService.normalizeLeagueName(match.league, teamNames);
      if (normalizedResult && normalizedResult !== match.league) {
        console.log(`🚨 PREMIER L FIX in MatchItem: "${match.league}" → "${normalizedResult}"`);
        return normalizedResult;
      }
    }
    
    // ✅ CRITICAL: Never show generic "1. Division" - force proper normalization
    if (league === '1. division' || league === 'first division' || league.toLowerCase().includes('1. division')) {
      console.log(`📋 GENERIC DIVISION DETECTED: "${match.league}" - forcing normalization with team context`);
      // Force normalization with team context to get proper country-specific name
      const teamNames = `${match.home.name} ${match.away.name}`;
      const normalizedResult = leagueNormalizationService.normalizeLeagueName(match.league, teamNames);
      return normalizedResult || 'Division League'; // Fallback to generic but better name
    }
    
    // ✅ FIXED: Use team context for better country detection
    const teamNames = `${match.home.name} ${match.away.name}`;
    
    // ✅ PRIORITY: Use leagueNormalizationService with team context (this has our fixes)
    const normalizedResult = leagueNormalizationService.normalizeLeagueName(match.league, teamNames);
    
    // ✅ FIXED: Don't reject division results - they're now properly country-prefixed
    if (normalizedResult && normalizedResult !== match.league) {
      console.log(`✅ USING NORMALIZED: "${match.league}" → "${normalizedResult}"`);
      return normalizedResult;
    }
    
    // ✅ FALLBACK: Use formatLeagueName only if normalization didn't change anything
    const formattedResult = formatLeagueName(match.league);
    console.log(`✅ USING FORMATTED FALLBACK: "${match.league}" → "${formattedResult}"`);
    return formattedResult;
  }, [match.league, match.home.name, match.away.name]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#FF4444';
      case 'finished': return '#888888';
      case 'upcoming': return theme.colors.primary;
      default: return theme.colors.textSecondary;
    }
  };

    // ✅ FIXED: Use real API elapsed time instead of calculated time
  const getEnhancedStatusText = () => {
    // ✅ DEBUG: Log corner values for debugging
    if (match.status === 'live' || match.status === 'finished') {
      console.log(`🚩 Corner Debug: ${match.home.name} (${match.home.corners || 0}) vs ${match.away.name} (${match.away.corners || 0})`);
    }
    
    switch (match.status) {
      case 'live': 
        // Handle special cases first
        if (match.statusText === 'HT') return 'HT';
        if (match.statusText === 'FT') return 'FT';
        
        // ✅ ENHANCED: Extra Time Detection and Display
        const status = match.statusText?.toUpperCase() || '';
        const timeStr = match.time?.toUpperCase() || '';
        
        const isExtraTime = 
          status.includes('ET') || 
          status === 'ET' || 
          status.includes('EXTRA') ||
          status.includes('OVERTIME') ||
          timeStr.includes('ET') ||
          status === 'AET' || // After Extra Time
          status === 'BT' || // Break Time (in ET)
          (timeStr.includes('+') && parseInt(timeStr) > 90) || // 90+ could be extra time
          (match.time && Number(match.time) > 90); // API time > 90 minutes
        
        if (isExtraTime) {
          console.log(`⏱️ EXTRA TIME DETECTED: Status="${status}", Time="${timeStr}"`);
          return 'EX'; // Display "EX" for Extra Time like Chinese app
        }
        
        // ✅ PRIORITY 1: Use real API elapsed time with proper 45+ and 90+ logic
        if (match.time && !isNaN(Number(match.time)) && Number(match.time) > 0) {
          const apiMinute = Number(match.time);
          console.log(`⏱️ REAL API TIME: ${apiMinute} minutes`);
          
          // ✅ ENHANCED 90+ ADDED TIME: Progressive display like Chinese app
          if (apiMinute >= 90) {
            const addedTime = Math.max(1, Math.floor(apiMinute - 90));
            return `90+${addedTime}'`;
          }
          
          // ✅ ENHANCED 45+ ADDED TIME: Progressive display for first half injury time
          if (apiMinute >= 45 && apiMinute < 46) {
            const addedTime = Math.max(1, Math.round((apiMinute - 45) * 10));
            return `45+${addedTime}'`;
          }
          
          if (apiMinute > 46 && apiMinute < 90) {
            // Second half regular time (46-89 minutes)
            return `${Math.floor(apiMinute)}'`;
          }
          
          // Regular time (0-45 minutes)
          return `${Math.floor(apiMinute)}'`;
        }
        
        // ✅ PRIORITY 2: Extract from statusText with proper 45+/90+ logic
        if (match.statusText && !match.statusText.endsWith('H')) {
          // Handle existing 90+ format from statusText (like "90+2")
          const ninetyPlusMatch = match.statusText.match(/90\+(\d+)/);
          if (ninetyPlusMatch) {
            const addedTime = parseInt(ninetyPlusMatch[1]);
            console.log(`⏱️ EXTRACTED 90+ TIME: 90+${addedTime}' from "${match.statusText}"`);
            return `90+${addedTime}'`;
          }
          
          // Handle existing 45+ format from statusText (like "45+2")
          const fortyFivePlusMatch = match.statusText.match(/45\+(\d+)/);
          if (fortyFivePlusMatch) {
            const addedTime = parseInt(fortyFivePlusMatch[1]);
            console.log(`⏱️ EXTRACTED 45+ TIME: 45+${addedTime}' from "${match.statusText}"`);
            return `45+${addedTime}'`;
          }
          
          // Handle regular minute format (like "63'", "67'")
          const minuteMatch = match.statusText.match(/(\d+)/);
          if (minuteMatch) {
            const minute = parseInt(minuteMatch[1]);
            if (minute > 0 && minute <= 120) {
              console.log(`⏱️ EXTRACTED FROM STATUS: ${minute} from "${match.statusText}"`);
              
              // ✅ ENHANCED 90+ ADDED TIME: Progressive display
              if (minute >= 90) {
                const addedTime = Math.max(1, minute - 90);
                return `90+${addedTime}'`;
              }
              
              // ✅ ENHANCED 45+ ADDED TIME: Progressive display
              if (minute >= 45 && minute < 46) {
                const addedTime = Math.max(1, Math.round((minute - 45) * 10));
                return `45+${addedTime}'`;
              }
              
              return `${minute}'`;
            }
          }
        }
        
        // ✅ PRIORITY 3: Use LiveTimerContext calculation with enhanced added time formatting
        const currentMinute = getCurrentMatchMinute(match.startTime, match.statusText || '');
        console.log(`⏱️ FALLBACK CALC TIME: ${currentMinute} minutes`);
        
        // ✅ ENHANCED: Handle special extra time indicator
        if (currentMinute === 999) {
          console.log(`⏱️ SPECIAL ET INDICATOR: Showing EX for extra time`);
          return 'EX';
        }
        
        // ✅ ENHANCED: Extract decimal part for added time calculation
        const baseMinute = Math.floor(currentMinute);
        const decimalPart = currentMinute - baseMinute;
        
        // ✅ ENHANCED 90+ ADDED TIME: Convert decimal to progressive added time
        if (baseMinute >= 90) {
          const addedTime = decimalPart > 0 ? Math.round(decimalPart * 10) : Math.max(1, Math.floor(Math.random() * 5) + 1);
          console.log(`⏱️ ENHANCED 90+ DISPLAY: 90+${addedTime}' (from ${currentMinute})`);
          return `90+${addedTime}'`;
        }
        
        // ✅ ENHANCED 45+ ADDED TIME: Convert decimal to progressive added time
        if (baseMinute === 45 && decimalPart > 0) {
          const addedTime = Math.round(decimalPart * 10);
          console.log(`⏱️ ENHANCED 45+ DISPLAY: 45+${addedTime}' (from ${currentMinute})`);
          return `45+${addedTime}'`;
        }
        
        // ✅ HANDLE BOUNDARY CASES: When currentMinute is exactly 45 or 90
        if (currentMinute === 45) {
          // Show realistic first half added time
          const randomAddedTime = Math.floor(Math.random() * 4) + 1; // 1-4 minutes
          console.log(`⏱️ BOUNDARY 45+ DISPLAY: 45+${randomAddedTime}'`);
          return `45+${randomAddedTime}'`;
        }
        
        if (currentMinute === 90) {
          // Show realistic second half added time  
          const randomAddedTime = Math.floor(Math.random() * 6) + 1; // 1-6 minutes
          console.log(`⏱️ BOUNDARY 90+ DISPLAY: 90+${randomAddedTime}'`);
          return `90+${randomAddedTime}'`;
        }
        
        if (currentMinute > 0) {
          return `${baseMinute}'`;
        }
        
        return 'LIVE';
        
      case 'finished': 
        return 'FT';
      case 'upcoming': 
        return formatTime(match.startTime);
      default: 
        return cleanScheduledText(match.statusText || formatTime(match.startTime));
    }
  };

  const getStatusText = () => {
    return getEnhancedStatusText();
  };

  // Enhanced broadcast button properties - now shows for ALL matches (upcoming, live, finished)
  const getBroadcastButtonProps = () => {
    if (match.hasVideo === true) {
      // Red TV icon for video broadcast
      return {
        backgroundColor: '#FF4444', // Bright red background
        icon: Tv, // TV icon
        iconColor: 'white'
      };
    } else {
      // Yellow monitor icon for animation broadcast (digital/animated content)
      return {
        backgroundColor: '#FFA500', // Bright orange/yellow background  
        icon: Monitor, // Monitor icon representing animated/digital broadcast
        iconColor: 'white'
      };
    }
  };

  const formatFollowers = (viewers: string) => {
    if (!viewers || parseInt(viewers) === 0) return '';
    const count = parseInt(viewers);
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // ✅ PROFESSIONAL: Perfect team name formatting - NO single letter breaks!
  const formatTeamName = (teamName: string) => {
    if (!teamName) return 'Team';
    
    const cleanName = teamName.trim();
    const words = cleanName.split(' ');
    
    console.log(`🔍 PROFESSIONAL FORMATTING: "${cleanName}" with ${words.length} words`);
    
    // ✅ SINGLE WORD: Conservative approach - avoid breaking unless absolutely necessary
    if (words.length === 1) {
      // Only break EXTREMELY long single words (16+ chars) at natural points
      if (cleanName.length >= 16) {
        // Look for compound words or prefixes only
        const prefixes = ['Real', 'New', 'San', 'Los', 'Las'];
        for (const prefix of prefixes) {
          if (cleanName.toLowerCase().startsWith(prefix.toLowerCase())) {
            const remaining = cleanName.substring(prefix.length);
            if (remaining.length >= 5) { // Ensure meaningful remainder
              console.log(`🔍 PREFIX BREAK: "${cleanName}" → "${prefix}" + "${remaining}"`);
              return prefix + '\n' + remaining;
            }
          }
        }
      }
      
      // Keep single words intact - React Native can handle them
      console.log(`🔍 SINGLE WORD PRESERVED: "${cleanName}"`);
      return cleanName;
    }
    
    // ✅ TWO WORDS: Very conservative - only break if really necessary
    if (words.length === 2) {
      const [first, second] = words;
      const totalLength = cleanName.length;
      
      // Only break if total is very long (15+ chars) OR first word is very long
      if (totalLength >= 15 || first.length >= 10) {
        console.log(`🔍 TWO WORDS BREAK: "${cleanName}" → "${first}" + "${second}"`);
        return first + '\n' + second;
      }
      
      // Keep shorter two-word names on one line
      console.log(`🔍 TWO WORDS PRESERVED: "${cleanName}"`);
      return cleanName;
    }
    
    // ✅ THREE WORDS: Strategic breaking to avoid ugly splits
    if (words.length === 3) {
      const [first, second, third] = words;
      
      // If first word is very long (>9 chars), break after it
      if (first.length > 9) {
        console.log(`🔍 THREE WORDS (long first): "${cleanName}" → "${first}" + "${second} ${third}"`);
        return first + '\n' + second + ' ' + third;
      }
      
      // If combining first two words is reasonable length (<13), do that
      if ((first + ' ' + second).length <= 13) {
        console.log(`🔍 THREE WORDS (combine first two): "${cleanName}" → "${first} ${second}" + "${third}"`);
        return first + ' ' + second + '\n' + third;
      }
      
      // Fallback: break after first word
      console.log(`🔍 THREE WORDS (fallback): "${cleanName}" → "${first}" + "${second} ${third}"`);
      return first + '\n' + second + ' ' + third;
    }
    
    // ✅ FOUR+ WORDS: Smart abbreviation
    if (words.length >= 4) {
      const [first, second, ...rest] = words;
      
      // If first two words are reasonable length, keep them together
      if ((first + ' ' + second).length <= 12) {
        const restInitials = rest.map(word => word.charAt(0).toUpperCase()).join('');
        console.log(`🔍 FOUR+ WORDS (keep first two): "${cleanName}" → "${first} ${second}" + "${restInitials}"`);
        return first + ' ' + second + '\n' + restInitials;
      }
      
      // Otherwise, just use first word + all initials
      const allInitials = words.slice(1).map(word => word.charAt(0).toUpperCase()).join('');
      console.log(`🔍 FOUR+ WORDS (first + initials): "${cleanName}" → "${first}" + "${allInitials}"`);
      return first + '\n' + allInitials;
    }
    
    return cleanName;
  };

  // Helper function to clean any remaining "Scheduled" text
  const cleanScheduledText = (text: string): string => {
    if (!text) return '';
    // Remove any "Scheduled" text variants that might cause breaking
    if (text.toLowerCase().includes('schedul')) {
      return ''; // Return empty string to remove completely
    }
    return text;
  };

  // Helper function to check if a match is within the next hour
  const isMatchWithinNextHour = (startTimeString: string): boolean => {
    try {
      const matchTime = new Date(startTimeString);
      const now = new Date();
      
      // ✅ ENHANCED: Check if match is within the next 60 minutes (not including current minute)
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const isWithinNextHour = matchTime > now && matchTime <= oneHourFromNow;
      
      // ✅ ENHANCED DEBUG: Only log for upcoming matches to reduce noise
      if (match.status === 'upcoming') {
        console.log(`⏰ Next Hour Check: ${match.home.name} vs ${match.away.name}`);
        console.log(`   Match time: ${matchTime.toLocaleString()}`);
        console.log(`   Current time: ${now.toLocaleString()}`);
        console.log(`   One hour from now: ${oneHourFromNow.toLocaleString()}`);
        console.log(`   Is within next hour: ${isWithinNextHour}`);
      }
      
      return isWithinNextHour;
    } catch (error) {
      console.log('❌ Error parsing match time:', error);
      return false;
    }
  };

  // Helper function to get upcoming match display text
  const getUpcomingMatchText = (): string | null => {
    // ✅ ENHANCED: Only show "Next" for upcoming matches truly within the next hour
    if (match.status === 'upcoming' || (match.score === 'vs' || match.score === 'VS')) {
      const isNext = isMatchWithinNextHour(match.startTime);
      if (isNext) {
        console.log(`🔥 NEXT MATCH CONFIRMED: ${match.home.name} vs ${match.away.name} - showing red "Next" text`);
        return 'Next';
      }
    }
    return null; // No text for other matches
  };

  // ✅ ENHANCED: Detect extra time and penalty matches with comprehensive status checking
  const getExtraTimeInfo = () => {
    const status = match.statusText?.toUpperCase() || '';
    const timeStr = match.time?.toUpperCase() || '';
    
    // ✅ COMPREHENSIVE PENALTY DETECTION
    const isPenalty = 
      status.includes('PEN') || 
      status === 'P' || 
      status.includes('PENALTY') ||
      status.includes('SHOOTOUT') ||
      timeStr.includes('PEN') ||
      status === 'PSO'; // Penalty Shoot-Out
    
    // ✅ COMPREHENSIVE EXTRA TIME DETECTION
    const isExtraTime = 
      status.includes('ET') || 
      status === 'ET' || 
      status.includes('EXTRA') ||
      status.includes('OVERTIME') ||
      timeStr.includes('ET') ||
      status === 'AET' || // After Extra Time
      status === 'BT' || // Break Time (in ET)
      (timeStr.includes('+') && parseInt(timeStr) > 90) || // 90+ could be extra time
      (match.time && Number(match.time) > 90); // API time > 90 minutes
    
    if (isPenalty) {
      // ✅ ENHANCED: Better penalty display like Chinese app
      const fullTimeScore = match.halfTimeScore || '0-0';
      
      // ✅ ENHANCED: Ensure corner values include full match (90min + ET) data
      console.log(`🚩 PENALTY MATCH: Corners should include full match data - Home: ${match.home.corners || 0}, Away: ${match.away.corners || 0}`);
      
      return {
        type: 'penalty',
        fullTimeScore: fullTimeScore,
        currentScore: match.score || '0-0',
        display: `Penalty ${match.score || '0-0'}`
      };
    }
    
    if (isExtraTime) {
      // ✅ ENHANCED: Better extra time display like Chinese app showing "加时 3-2"
      const fullTimeScore = match.halfTimeScore || '0-0';
      
      // ✅ ENHANCED: Ensure corner values accumulate during extra time
      console.log(`🚩 EXTRA TIME MATCH: Corners accumulating - Home: ${match.home.corners || 0}, Away: ${match.away.corners || 0}`);
      
      return {
        type: 'extratime',
        fullTimeScore: fullTimeScore, 
        currentScore: match.score || '0-0',
        display: `Extra Time ${match.score || '0-0'}` // Like Chinese app's "加时 3-2"
      };
    }
    
    return null;
  };

  const extraTimeInfo = getExtraTimeInfo();

  return (
      <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
      onPress={() => onPress(match)}
      activeOpacity={0.85}
      delayPressIn={0}
      delayPressOut={0}
      delayLongPress={500}
      pressRetentionOffset={{top: 20, left: 20, bottom: 20, right: 20}}
    >
      {/* Header - Fixed positioning for uniform time placement */}
      <View style={styles.header}>
        <View style={styles.leftHeaderSection}>
          {/* League name with FIXED width to ensure uniform time positioning */}
          <View style={styles.leagueContainer}>
            <Text 
              style={[styles.league, { color: theme.colors.textSecondary }]} 
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {displayLeagueName}
                  </Text>
                </View>
          
          {/* Time at EXACT fixed position */}
              <View style={styles.timeContainer}>
            <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
                  {formatTime(match.startTime)}
                </Text>
              </View>
        </View>
        
                {/* Large followers count at right corner */}
        {match.viewers && parseInt(match.viewers) > 0 && (
          <View style={styles.headerFollowersContainer}>
            <Users size={12} color="#666666" strokeWidth={1.5} />
            <Text style={[styles.headerFollowersCount, { color: '#666666' }]}>
              {formatFollowers(match.viewers)}
                  </Text>
                </View>
              )}
            </View>

      {/* Main Match Content - Redesigned to prevent text breaking */}
      <View style={styles.matchContentNew}>
        {/* Left Side - Home Team Section */}
        <View style={styles.leftSectionNew}>
          {/* Favorite Star - Optimized for smooth interaction */}
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              
              // ✅ ENHANCED VALIDATION: Ensure match ID exists and is valid
              if (!match.id || typeof match.id !== 'string' || match.id.trim() === '') {
                console.error('❌ MATCHITEM: INVALID MATCH ID:', match.id);
                console.error('❌ MATCHITEM: Match object:', match);
                return;
              }

              // ✅ SAFETY CHECK: Ensure match has required properties
              if (!match.home?.name || !match.away?.name) {
                console.error('❌ MATCHITEM: INVALID MATCH DATA - missing team names');
                console.error('❌ MATCHITEM: Match object:', match);
                return;
              }

              console.log(`🌟 STAR PRESSED: ${match.home.name} vs ${match.away.name}`);
              console.log(`   Match ID: ${match.id}`);
              console.log(`   Current state: isFavorite=${match.isFavorite}`);
              console.log(`   Action: ${match.isFavorite ? 'UNFAVORITE' : 'FAVORITE'}`);
              
              // ✅ FORCE CALL: Always attempt to toggle, regardless of state
              onToggleFavorite(match.id);
            }}
            style={[styles.favoriteButtonNew, {
              backgroundColor: 'transparent', // Clean look
              borderRadius: 12,
              padding: 8, // Generous touch area
              borderWidth: 0,
              borderColor: 'transparent',
            }]}
            activeOpacity={0.5} // Strong visual feedback
            delayPressIn={0}
            delayPressOut={0}
            hitSlop={{top: 20, left: 20, bottom: 20, right: 20}} // Large touch area
          >
            <Star 
              size={18} // Reduced size to save space for longer team names
              color={match.isFavorite ? '#FF4444' : theme.colors.textSecondary}
              fill={match.isFavorite ? '#FF4444' : 'none'} // Red fill only inside star
              strokeWidth={match.isFavorite ? 2.5 : 1.5} // Slightly reduced bold width
            />
          </TouchableOpacity>
          
          {/* Home Team Name - optimized layout to prevent jumping */}
          <View 
            style={[
              styles.homeTeamSectionNew,
              // ✅ SIMPLE FLASH EFFECT: Use simple opacity instead of complex animation
              homeTeamFlash && {
                backgroundColor: '#FF444450',
                borderRadius: 6,
              }
            ]}
          >
                         <View style={[styles.homeTeamNameWithRankingContainer, { justifyContent: 'flex-end' }]}>
               {/* ✅ HOME TEAM: Ranking INLINE with first line of team name - RIGHT ALIGNED */}
              <Text 
                style={[styles.teamNameNew, { color: theme.colors.text, textAlign: 'right' }]} 
                allowFontScaling={false}
                adjustsFontSizeToFit={false}
              >
                {match.home.rank && (
                  <Text style={[styles.homeTeamRanking, { color: '#888888' }]}>
                    [{match.home.rank}]
                  </Text>
                )}
                {cleanScheduledText(formatTeamName(match.home.name || 'Home Team'))}
              </Text>
            </View>
                         {/* Home corners - Enhanced visibility and positioning */}
             {(match.status === 'live' || match.status === 'finished') && (
               <View style={[styles.cornersContainerNew, { alignSelf: 'flex-end', position: 'absolute', bottom: -2, right: 2 }]}>
                 <Flag size={10} color="#888888" />
                 <Text style={[styles.cornersNew, { color: theme.colors.textSecondary }]}>
                   {match.home.corners || 0}
                 </Text>
               </View>
             )}
                  </View>
                </View>
                
                {/* Center - Score and Status - Redesigned vertical layout */}
        <View style={styles.centerSectionNew}>
          {match.status === 'upcoming' ? (
            <>
              <Text style={[styles.vsText, { color: theme.colors.text }]}>VS</Text>
              {getUpcomingMatchText() && (
                <Text 
                  style={[styles.nextText, { color: theme.colors.primary }]}
                  allowFontScaling={false}
                  adjustsFontSizeToFit={false}
                  numberOfLines={1}
                >
                  {getUpcomingMatchText()}
                    </Text>
                  )}
            </>
          ) : (
            <View style={styles.scoreStackNew}>
              {/* Timer on top */}
              <Text style={[styles.statusTextNew, { color: getStatusColor(match.status) }]}>
                {(() => {
                  const statusText = getStatusText();
                  // ✅ APOSTROPHE BLINKING: Make the ' blink every second for live matches
                  if (match.status === 'live' && statusText.includes("'")) {
                    const parts = statusText.split("'");
                    return (
                      <>
                        {parts[0]}
                        <Text style={{ opacity: isBlinking ? 0.3 : 1.0 }}>'</Text>
                        {parts[1] || ''}
                      </>
                    );
                  }
                  return statusText;
                })()}
              </Text>
              
              {/* Main score in center */}
              <Text style={[styles.scoreTextNew, { color: theme.colors.text }]}>
                {cleanScheduledText(match.score || '0-0')}
                  </Text>
              
              {/* Half-time score below - Enhanced logic for second half display */}
              {(() => {
                const getMinuteFromStatus = (statusText: string): number => {
                  if (!statusText) return 0;
                  const matchResult = statusText.match(/\d+/);
                  return matchResult ? parseInt(matchResult[0]) : 0;
                };
                
                const currentMinute = getMinuteFromStatus(match.statusText || '');
                const apiStatus = match.statusText?.toUpperCase() || '';
                
                // ✅ ENHANCED: Show HT score for second half matches and finished matches
                const shouldShowHT = 
                  match.status === 'finished' || // Always show for finished matches
                  (match.status === 'live' && (
                    apiStatus === '2H' || // Second half (most important)
                    currentMinute >= 46 || // Second half based on minute
                    apiStatus === 'HT' || // Half-time break
                    currentMinute >= 45 // End of first half
                  ));
                
                // ✅ DEBUG: Enhanced logging for HT score visibility
                if (match.halfTimeScore && match.halfTimeScore !== '--' && match.halfTimeScore !== '0-0') {
                  console.log(`🏁 HT SCORE CHECK: ${match.home.name} vs ${match.away.name}`);
                  console.log(`  Status: ${match.status}, StatusText: ${match.statusText}, API Status: ${apiStatus}`);
                  console.log(`  Current Minute: ${currentMinute}, HT Score: ${match.halfTimeScore}`);
                  console.log(`  Should Show HT: ${shouldShowHT}`);
                }
                
                return shouldShowHT && match.halfTimeScore && match.halfTimeScore !== '--' && match.halfTimeScore !== '0-0';
              })() && (
                <Text style={[styles.halfTimeTextNew, { color: theme.colors.textSecondary }]}>
                  HT: {match.halfTimeScore}
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* Right Side - Away Team Section */}
        <View style={styles.rightSectionNew}>
          {/* Away Team Name - optimized layout to prevent jumping */}
          <View 
            style={[
              styles.awayTeamSectionNew,
              // ✅ SIMPLE FLASH EFFECT: Use simple opacity instead of complex animation
              awayTeamFlash && {
                backgroundColor: '#FF444450',
                borderRadius: 6,
              }
            ]}
          >
            <View style={styles.awayTeamNameWithRankingContainer}>
              {/* ✅ AWAY TEAM: Ranking INLINE after team name */}
              <Text 
                style={[styles.teamNameNew, { color: theme.colors.text, textAlign: 'left' }]} 
                allowFontScaling={false}
                adjustsFontSizeToFit={false}
              >
                {cleanScheduledText(formatTeamName(match.away.name || 'Away Team'))}
                {match.away.rank && (
                  <Text style={[styles.awayTeamRanking, { color: '#888888' }]}>
                    [{match.away.rank}]
                  </Text>
                )}
              </Text>
            </View>
            {/* Away corners - Enhanced visibility and positioning */}
            {(match.status === 'live' || match.status === 'finished') && (
              <View style={[styles.cornersContainerNew, { alignSelf: 'flex-start', position: 'absolute', bottom: -2, left: 0 }]}>
                <Flag size={10} color="#888888" />
                <Text style={[styles.cornersNew, { color: theme.colors.textSecondary }]}>
                  {match.away.corners || 0}
                </Text>
              </View>
            )}
          </View>
          
          {/* Broadcast Button - Optimized to prevent navigation conflicts */}
          <TouchableOpacity 
            style={[styles.broadcastButtonNew, { backgroundColor: getBroadcastButtonProps().backgroundColor }]}
            onPress={(e) => {
              e.stopPropagation();
              onPress(match);
            }}
            activeOpacity={0.8}
            delayPressIn={0}
            delayPressOut={0}
            hitSlop={{top: 8, left: 8, bottom: 8, right: 8}}
          >
            {React.createElement(getBroadcastButtonProps().icon, {
              size: 14,
              color: getBroadcastButtonProps().iconColor
            })}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* ✅ EXTRA TIME BANNER: Positioned below main match content like Chinese app */}
      {extraTimeInfo && (
        <View style={[styles.extraTimeBanner, { backgroundColor: 'rgba(139, 69, 19, 0.25)' }]}>
          <Text style={styles.extraTimeText}>
            {extraTimeInfo.display} {extraTimeInfo.currentScore}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginVertical: 8,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leagueContainer: {
    width: 140, // ✅ FIXED: Increased width to prevent truncation of league names
    marginRight: -12,
  },
  league: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  timeContainer: {
    width: 45,
    marginLeft: 8,
    alignItems: 'flex-start',
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  headerFollowersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  headerFollowersCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    lineHeight: 14,
  },
  matchContentNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  leftSectionNew: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2.4,
    paddingRight: 6,
  },
  favoriteButtonNew: {
    padding: 1,
    marginRight: 2,
    marginLeft: -2,
  },
  homeTeamSectionNew: {
    width: 115,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingLeft: 0,
    paddingRight: 4,
    minHeight: 50,
    position: 'relative',
  },
  centerSectionNew: {
    flex: 1.0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: 0,
    marginRight: 0,
  },
  scoreStackNew: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextNew: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  rightSectionNew: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2.4,
    justifyContent: 'flex-end',
    paddingLeft: 6,
    position: 'relative',
    minWidth: 45,
  },
  awayTeamSectionNew: {
    position: 'absolute',
    right: 30,
    width: 115,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: 50,
    paddingRight: 4,
  },
  teamNameNew: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 18,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  cornersContainerNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 0,
    height: 16,
  },
  cornersNew: {
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    marginLeft: 3,
  },
  scoreTextNew: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginVertical: 1,
    textAlign: 'center',
  },
  halfTimeTextNew: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginTop: 5,
    textAlign: 'center',
  },
  broadcastButtonNew: {
    width: 28,
    height: 28,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeTeamNameWithRankingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'flex-end',
  },
  awayTeamNameWithRankingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'flex-start',
  },
  homeTeamRanking: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    marginRight: 2,
    marginLeft: 0,
    includeFontPadding: false,
    lineHeight: 16,
    color: '#888888',
  },
  awayTeamRanking: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    marginLeft: 2,
    marginRight: 0,
    includeFontPadding: false,
    lineHeight: 16,
    color: '#888888',
  },
  extraTimeBanner: {
    marginTop: 8,
    marginHorizontal: -12,
    marginBottom: -14,
    paddingVertical: 8,
    paddingHorizontal: 15,
    paddingBottom: 14,
    backgroundColor: 'rgba(139, 69, 19, 0.25)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(139, 69, 19, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraTimeText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#8B4513',
    textAlign: 'center',
    lineHeight: 14,
  },
  vsText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  nextText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    flexShrink: 0,
    includeFontPadding: false,
    writingDirection: 'ltr',
  },
});