import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated 
} from 'react-native';
import { Star, Play, Flag, Users } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter, usePathname } from 'expo-router';
import { Match } from '@/types/match';
import { useLiveTimer } from '@/contexts/LiveTimerContext';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';
import goalDetectionService from '@/services/goalDetectionService';

interface MatchItemProps {
  match: Match;
  showLeague?: boolean;
  onPress?: (match: Match) => void;
  onToggleFavorite?: (matchId: string) => void;
}

const MatchItem = memo(function MatchItem({ match, showLeague = true, onPress, onToggleFavorite }: MatchItemProps) {
  // ✅ CRITICAL FIX: Early validation of match object
  if (!match || typeof match !== 'object') {
    console.error('❌ MatchItem received invalid match object:', match);
    return null;
  }

  // ✅ VALIDATE REQUIRED MATCH FIELDS
  if (!match.home || !match.away || !match.league) {
    console.error('❌ MatchItem missing required fields:', {
      home: match.home,
      away: match.away,
      league: match.league,
      id: match.id
    });
    return null;
  }

  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { isBlinking, getCurrentMatchMinute } = useLiveTimer();
  const { settings } = useMatchSettings();
  const [currentMinute, setCurrentMinute] = useState<number>(0);

  const [teamHighlight, setTeamHighlight] = useState<{
    home: boolean;
    away: boolean;
  }>({ home: false, away: false });
  
  // ✨ BEAUTIFUL MATCH ITEM: Smooth entrance animation for each match
  const itemOpacity = useRef(new Animated.Value(0)).current;
  const itemTranslateY = useRef(new Animated.Value(10)).current;
  
  // ✨ FOOTBALL MATCH ENTRANCE: Individual match item animation
  useEffect(() => {
    // 🎨 SMOOTH ENTRANCE: Each match appears with subtle slide-up
    Animated.parallel([
      Animated.timing(itemOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(itemTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const formatTime = useCallback((isoTime: string): string => {
    try {
      // Handle empty or null time
      if (!isoTime || isoTime === '') return 'TBD';
      
      const date = new Date(isoTime);
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date format:', isoTime);
        return 'TBD';
      }
      
      // Always use local time for better user understanding
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('❌ Error formatting time:', error, 'for time:', isoTime);
      return 'TBD';
    }
  }, []);

  // CRITICAL FIX: Get real-time minute from match statusText or calculate it
  const getRealTimeMinute = useCallback((): number => {
    if (match.status !== 'live') return 0;
    
    // First, try to extract minute from statusText (API-provided)
    if (match.statusText) {
      const minuteMatch = match.statusText.match(/(\d+)/);
      if (minuteMatch) {
        const extractedMinute = parseInt(minuteMatch[1]);
        if (extractedMinute > 0) {
          return extractedMinute;
        }
      }
    }
    
    // Fallback: Calculate real-time minute based on match start time
    return getCurrentMatchMinute(match.startTime, match.statusText);
  }, [match.status, match.statusText, match.startTime, getCurrentMatchMinute]);

  // Update current minute for live matches - use real-time calculation
  useEffect(() => {
    if (match.status === 'live') {
      // Set initial minute
      setCurrentMinute(getRealTimeMinute());
      
      // Update every 30 seconds for real-time minute tracking (not every second to avoid interfering with blinker)
      const interval = setInterval(() => {
        setCurrentMinute(getRealTimeMinute());
      }, 30000); // 30 seconds instead of 1 second to avoid blinker interference
      return () => clearInterval(interval);
    } else {
      setCurrentMinute(0);
    }
  }, [match.status, getRealTimeMinute]);

  // Subscribe to goal notifications for this match
  useEffect(() => {
    if (!settings.goalNotification) {
      console.log('⚠️ Goal notifications disabled in settings for match:', match.id);
      return;
    }

    console.log('🔔 MatchItem subscribing to goal notifications for match:', match.id, 'status:', match.status);

    const unsubscribe = goalDetectionService.subscribe((goalData) => {
      console.log('🔔 MatchItem received goal notification:', goalData.matchId, 'for match:', match.id);
      // Only show inline alert if this is the match that scored/had goal cancelled
      if (goalData.matchId === match.id) {
        console.log('🚨 Showing inline goal alert for match:', match.id, goalData);
        showGoalAlert(goalData.scoringTeam, goalData.scorer, goalData.minute, goalData.eventType);
      }
    });

    return unsubscribe;
  }, [match.id, match.status, settings.goalNotification]);

  const showGoalAlert = (scoringTeam: 'home' | 'away', scorer?: string, minute?: string, eventType?: string) => {
    // Highlight the affected team (scoring team for goals, team that lost goal for cancelled)
    setTeamHighlight({
      home: scoringTeam === 'home',
      away: scoringTeam === 'away',
    });

    // Remove highlights after 3 seconds (as requested)
    setTimeout(() => {
      setTeamHighlight({ home: false, away: false });
    }, 3000);
  };

  const handlePress = () => {
    if (onPress) {
      onPress(match);
    }
  };

  const handleFavoritePress = () => {
    if (onToggleFavorite) {
      onToggleFavorite(match.id);
    }
  };

  // Format live time display with blinking apostrophe
  const formatLiveTime = (minutes: number): string => {
    const apostrophe = isBlinking ? "'" : ' '; // Blink the apostrophe
    
    if (minutes >= 90) {
      const extraTime = minutes - 90;
      return `${90 + extraTime}${apostrophe}+`; // Extra time
    }
    
    if (minutes >= 45 && minutes <= 46) {
      return `HT`; // Half-time (no blinking during break)
    }
    
    return `${minutes}${apostrophe}`;
  };

  const getScoreColor = () => {
    if (match.status === 'live') return theme.colors.primary;
    return theme.colors.text;
  };

  const handleMatchPress = () => {
    // Navigate to live match screen with match data
    router.push({
      pathname: '/liveMatch',
      params: {
        matchId: match.id,
        sport: match.sport,
        homeTeam: match.home.name,
        awayTeam: match.away.name,
        score: match.score,
        status: match.status,
        statusText: match.statusText,
        league: match.league,
        startTime: match.startTime,
        halfTimeScore: match.halfTimeScore,
        viewers: match.viewers,
        hasVideo: match.hasVideo.toString(),
        homeCorners: (match.home.corners || 0).toString(),
        awayCorners: (match.away.corners || 0).toString(),
      }
    });
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const renderCornerData = (team: Match['home'] | Match['away']) => {
    // Only show corner data for live and finished matches
    if (match.status === 'live' || match.status === 'finished') {
      return (
        <View style={styles.cornerContainer}>
          <Flag size={14} color="#A0A0A0" />
          <Text style={[styles.cornerText, { color: theme.colors.textSecondary }]}>
            {team.corners || 0}
          </Text>
        </View>
      );
    }
    return null;
  };

  const shouldShowViewers = () => {
    // Show viewers for live matches, finished matches, or high-profile upcoming matches
    if (match.status === 'live' || match.status === 'finished') {
      return true;
    }
    
    // For upcoming matches, only show if there are actually viewers (indicating high-profile match)
    if (match.status === 'upcoming' && match.viewers && match.viewers !== '0') {
      return true;
    }
    
    return false;
  };

  const renderTeamName = (team: Match['home'] | Match['away']) => {
    return (
      <Text style={[styles.teamName, { color: theme.colors.text }]}>
        {team.rank ? <Text style={styles.rank}>[{team.rank}] </Text> : ''}{truncateText(team.name, 20)}
      </Text>
    );
  };

  return (
    <>
      
      <Animated.View 
        style={[
          styles.container, 
          { backgroundColor: theme.colors.background },
          { 
            opacity: itemOpacity,
            transform: [{ translateY: itemTranslateY }]
          }
        ]}
      >
      <TouchableOpacity 
        style={[styles.matchContainer, { 
          backgroundColor: theme.colors.background,
          shadowColor: theme.colors.text,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        }]} 
        onPress={handlePress}
      >
        <View style={styles.matchContent}>
          <TouchableOpacity 
            onPress={handleFavoritePress} 
            style={styles.favoriteButton}
          >
            <Star 
              size={20} 
              color={match.isFavorite ? theme.colors.primary : theme.colors.textSecondary}
              fill={match.isFavorite ? theme.colors.primary : 'transparent'}
            />
          </TouchableOpacity>

          <View style={styles.mainContent}>
            <View style={styles.topRow}>
              {showLeague && (
                <View style={styles.leagueContainer}>
                  <Text style={[styles.league, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {truncateText(match.league, 12)}
                  </Text>
                </View>
              )}
              <View style={styles.timeContainer}>
                <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>
                  {formatTime(match.startTime)}
                </Text>
              </View>
              {shouldShowViewers() && (
                <View style={styles.viewersTopContainer}>
                  <Users size={12} color="#999" />
                  <Text style={[styles.viewersCount, { color: theme.colors.textSecondary }]}>
                    {match.viewers}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.matchRow}>
              <View style={styles.teamContainer}>
                <View style={[
                  styles.teamInfo, 
                  styles.homeTeam,
                  teamHighlight.home && styles.teamHighlightRed
                ]}>
                  <View style={styles.teamContent}>
                    {renderTeamName(match.home)}
                    {renderCornerData(match.home)}
                  </View>
                </View>
                
                <View style={styles.scoreContainer}>
                  {match.status === 'live' && (
                    <Text style={[styles.liveTime, { color: theme.colors.primary }]}>
                      {formatLiveTime(currentMinute)}
                    </Text>
                  )}
                  <Text style={[styles.score, { color: getScoreColor() }]}>
                    {match.score}
                  </Text>
                  <Text style={[styles.halfTime, { color: theme.colors.textSecondary }]}>
                    {match.halfTimeScore}
                  </Text>
                </View>
                
                <View style={[
                  styles.teamInfo, 
                  styles.awayTeam,
                  teamHighlight.away && styles.teamHighlightRed
                ]}>
                  <View style={styles.teamContent}>
                    {renderTeamName(match.away)}
                    {renderCornerData(match.away)}
                  </View>
                </View>
              </View>
              
              <View style={styles.rightContainer}>
                {match.hasVideo ? (
                  <View style={[styles.videoButton, { backgroundColor: theme.colors.primary }]}>
                    <Play size={12} color="#fff" fill="#fff" />
                  </View>
                ) : (
                  <View style={[styles.animationButton, { backgroundColor: '#FFA726' }]}>
                    <Play size={12} color="#fff" fill="#fff" />
                  </View>
                )}
              </View>
            </View>
            
            {match.status !== 'live' && (
              <View style={styles.statusContainer}>
                <Text style={[styles.status, { color: getScoreColor() }]}>
                  {match.statusText}
                </Text>
              </View>
            )}
            

          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  matchContainer: {
    borderRadius: 8,
    padding: 8,
    paddingVertical: 6,
  },
  matchContent: {
    flexDirection: 'row',
    position: 'relative',
    minHeight: 42,
  },
  mainContent: {
    flex: 1,
    marginLeft: 24,
  },
  favoriteButton: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 2,
    height: 20,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: -24,
  },
  leagueContainer: {
    flex: 1,
    marginLeft: 8,
    maxWidth: '30%',
  },
  league: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#999',
    width: '100%',
    lineHeight: 12,
  },
  timeContainer: {
    position: 'absolute',
    left: '35%',
    top: 0,
  },
  matchTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  viewersTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingRight: 4,
  },
  viewersCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginLeft: 3,
    color: '#999',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    marginTop: 1,
  },
  teamInfo: {
    flex: 0.45,
    justifyContent: 'center',
    minWidth: 20,
  },
  teamContent: {
    alignItems: 'center',
    width: '100%',
  },
  homeTeam: {
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  awayTeam: {
    alignItems: 'flex-start',
    paddingLeft: 4,
    marginLeft: -4,
  },
  teamName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    marginBottom: 3,
    textAlign: 'center',
    flexWrap: 'wrap',
    width: '100%',
    lineHeight: 13,
  },
  rank: {
    color: '#A0A0A0',
  },
  cornerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 18,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  cornerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginLeft: 4,
    color: '#999',
    lineHeight: 18,
    textAlign: 'center',
    minWidth: 14,
  },
  scoreContainer: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginVertical: 1,
    transform: [{ translateX: -4 }],
  },
  liveTime: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginBottom: 1,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
    lineHeight: 13,
    transform: [{ translateX: -4 }],
  },
  score: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    marginBottom: 1,
    textAlign: 'center',
    lineHeight: 17,
  },
  halfTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
    color: '#999',
    lineHeight: 12,
  },
  rightContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  videoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  status: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    textAlign: 'center',
    color: '#999',
  },
  goalAlertContainer: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    alignItems: 'center',
    zIndex: 1000,
  },
  goalAlert: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6B00',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  goalAlertText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  compactGoalAlert: {
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FFA500',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    alignSelf: 'center',
  },
  compactGoalText: {
    color: '#000',
    fontSize: 8,
    fontFamily: 'Inter-Bold',
  },
  compactGoalNumber: {
    color: '#000',
    fontSize: 8,
    fontFamily: 'Inter-Bold',
  },
  chineseGoalBadge: {
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FFA500',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    alignSelf: 'center',
  },
  chineseGoalText: {
    color: '#000',
    fontSize: 8,
    fontFamily: 'Inter-Bold',
  },
  chineseGoalNumber: {
    color: '#000',
    fontSize: 8,
    fontFamily: 'Inter-Bold',
  },
  topGoalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingTop: 20,
  },
  topGoalAlert: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  topGoalHeader: {
    color: '#FFD700',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  topGoalTime: {
    color: '#FF5722',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  topGoalScorer: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  topGoalTeam: {
    color: '#BBBBBB',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  teamHighlightRed: {
    backgroundColor: 'rgba(255, 51, 51, 0.85)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.6)',
  }
});

export default MatchItem;