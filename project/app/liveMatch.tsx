import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Play, MoveHorizontal as MoreHorizontal, TrendingUp, Target, Flag, Clock, Users, Activity, BarChart3, Zap, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Plus, Minus, RotateCcw, Timer, Trophy, Heart, Eye, MessageCircle, Share, Bookmark, Thermometer, Droplets, Wind, Gauge, CloudRain, Sun, Cloud } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Match } from '@/types/match';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';
import { useLiveTimer } from '@/contexts/LiveTimerContext';
import goalDetectionService from '@/services/goalDetectionService';

interface MatchEvent {
  id: string;
  time: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'corner' | 'foul' | 'offside' | 'penalty' | 'injury' | 'timeout' | 'point' | 'round_end' | 'knockdown';
  team: 'home' | 'away';
  player?: string;
  description: string;
  icon: any;
  color: string;
}

interface TeamStats {
  possession?: number;
  shots?: number;
  shotsOnTarget?: number;
  corners?: number;
  fouls?: number;
  yellowCards?: number;
  redCards?: number;
  passes?: number;
  passAccuracy?: number;
  // Basketball specific
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fieldGoalPercentage?: number;
  threePointPercentage?: number;
  freeThrowPercentage?: number;
  // Rugby specific
  tries?: number;
  conversions?: number;
  penalties?: number;
  lineouts?: number;
  scrums?: number;
  rucks?: number;
  // Boxing specific
  punchesThrown?: number;
  punchesLanded?: number;
  accuracy?: number;
  powerPunches?: number;
  jabs?: number;
  knockdowns?: number;
}

interface WeatherInfo {
  temperature: string;
  humidity: string;
  windSpeed: string;
  pressure: string;
  condition: string;
  icon: any;
}

interface LiveMatchData {
  id: string;
  sport: 'football' | 'basketball' | 'rugby' | 'boxing';
  competition: string;
  date: string;
  time: string;
  status: 'live' | 'halftime' | 'finished' | 'upcoming';
  currentTime: string;
  homeTeam: {
    name: string;
    flag: string;
    score: number;
    stats: TeamStats;
  };
  awayTeam: {
    name: string;
    flag: string;
    score: number;
    stats: TeamStats;
  };
  events: MatchEvent[];
  liveCommentary: string[];
  hasVideo: boolean;
  hasAnimation: boolean;
  viewers: string;
  weatherCondition?: string;
  pitchCondition?: string;
  venue?: string;
  referee?: string;
  attendance?: string;
  weather: WeatherInfo;
}

export default function LiveMatchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const { showGoalNotification } = useMatchSettings();
  const [activeTab, setActiveTab] = useState('live');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [scrollY] = useState(new Animated.Value(0));
  const [realMatch, setRealMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false); // Start with no loading
  const [liveTime, setLiveTime] = useState<number>(0);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [goalAlert, setGoalAlert] = useState<{
    show: boolean;
    team: 'home' | 'away';
    scorer: string;
    minute: string;
  } | null>(null);
  const [teamHighlight, setTeamHighlight] = useState<{
    home: boolean;
    away: boolean;
  }>({ home: false, away: false });

  // Convert navigation params to match data
  useEffect(() => {
    const loadMatchData = () => {
      try {
        // INSTANT LOADING: No loading state, process immediately
        
        // Check if we have match data in params
        if (params.homeTeam && params.awayTeam) {
          const match: Match = {
            id: params.matchId as string,
            sport: params.sport as string,
            league: params.league as string,
            status: params.status as 'live' | 'finished' | 'upcoming',
            statusText: params.statusText as string,
            startTime: params.startTime as string,
            home: {
              name: params.homeTeam as string,
              logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(params.homeTeam as string)}&background=4CAF50&color=fff&size=80`,
              corners: parseInt(params.homeCorners as string) || 0,
            },
            away: {
              name: params.awayTeam as string,
              logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(params.awayTeam as string)}&background=2196F3&color=fff&size=80`,
              corners: parseInt(params.awayCorners as string) || 0,
            },
            score: params.score as string,
            halfTimeScore: params.halfTimeScore as string,
            viewers: params.viewers as string,
            hasVideo: params.hasVideo === 'true',
            isFavorite: false,
          };
          
          console.log('✅ Using navigation params match data:', match.home.name, 'vs', match.away.name);
          setRealMatch(match);
          
          // Initialize live timer if match is live
          if (match.status === 'live') {
            const currentMinute = parseInt(match.statusText.replace(/[^\d]/g, '')) || 0;
            setLiveTime(currentMinute);
            setIsLiveActive(true);
          }
        } else {
          console.log('❌ No match data in navigation params');
        }
      } catch (error) {
        console.error('❌ Error loading match data from params:', error);
      }
      // No loading state management needed
    };

    loadMatchData();
  }, [
    params.matchId, 
    params.homeTeam, 
    params.awayTeam, 
    params.sport, 
    params.status,
    params.statusText,
    params.league,
    params.startTime,
    params.score,
    params.halfTimeScore,
    params.viewers,
    params.hasVideo,
    params.homeCorners,
    params.awayCorners
  ]);

  const tabs = useMemo(() => [
    { id: 'live' as const, label: 'Live', icon: Activity },
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
    { id: 'lineup' as const, label: 'Lineup', icon: Users },
    { id: 'stats' as const, label: 'Stats', icon: BarChart3 },
  ], []);

  // Pulse animation for live indicator
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  // Live timer effect - updates every minute
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // Start timer if match is live
    if (realMatch?.status === 'live') {
      console.log(`🔴 Starting live timer for ${realMatch.home.name} vs ${realMatch.away.name}`);
      setIsLiveActive(true);
      
      interval = setInterval(() => {
        setLiveTime(prevTime => {
          const newTime = prevTime + 1;
          console.log(`⏱️ Live time updated: ${newTime} minutes`);
          return newTime;
        });
      }, 60000); // Update every minute (60000ms = 1 minute)
    } else {
      setIsLiveActive(false);
      console.log('⏸️ Match not live, timer stopped');
    }
    
    return () => {
      if (interval) {
        console.log('🛑 Cleaning up live timer');
        clearInterval(interval);
      }
    };
  }, [realMatch?.status, realMatch?.id]);

  // Goal detection subscription for Live Match screen
  useEffect(() => {
    if (!realMatch || realMatch.status !== 'live') return;

    console.log('🚨 Live Match screen subscribing to goal notifications for match:', realMatch.id);

    const unsubscribe = goalDetectionService.subscribe((goalData) => {
      console.log('🚨 Live Match screen received goal notification:', goalData);
      
      // Only show alert for this specific match
      if (goalData.matchId === realMatch.id) {
        console.log('🚨 Showing goal alert in Live Match screen');
        showGoalAlert(goalData.scoringTeam, goalData.scorer, goalData.minute);
      }
    });

    return unsubscribe;
  }, [realMatch?.id, realMatch?.status]);

  const showGoalAlert = (scoringTeam: 'home' | 'away', scorer?: string, minute?: string) => {
    console.log('🚨 showGoalAlert called:', { scoringTeam, scorer, minute });
    
    const goalMinute = minute || formatLiveTime(liveTime);
    const goalScorer = scorer || 'Player';
    
    // Show goal alert
    setGoalAlert({
      show: true,
      team: scoringTeam,
      scorer: goalScorer,
      minute: goalMinute,
    });

    // Highlight scoring team with red background
    setTeamHighlight({
      home: scoringTeam === 'home',
      away: scoringTeam === 'away',
    });

    // Remove highlights after 2 seconds
    setTimeout(() => {
      setTeamHighlight({ home: false, away: false });
    }, 2000);

    // Remove goal alert after 4 seconds
    setTimeout(() => {
      setGoalAlert(null);
    }, 4000);
  };

  // Get the global blinking state for consistent seconds blinker
  const { isBlinking } = useLiveTimer();

  // Format live time display with synchronized blinking apostrophe
  const formatLiveTime = (minutes: number): string => {
    const apostrophe = isBlinking ? "'" : ' '; // Synchronized blink with all other live matches
    
    if (minutes >= 90) {
      return `${minutes}${apostrophe}+`; // Extra time with blinking
    } else if (minutes >= 45 && minutes < 50) {
      return 'HT'; // Half-time (no blinking during break)
    }
    return `${minutes}${apostrophe}`;
  };

  const renderMatchHeader = () => {
    if (loading) {
      return (
        <View style={[styles.matchHeader, { backgroundColor: theme.colors.background }]}>
          <View style={styles.headerOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={[styles.competitionText, { color: '#FFFFFF', marginTop: 16 }]}>
              Loading match data...
            </Text>
          </View>
        </View>
      );
    }

    if (!realMatch) {
      return (
        <View style={[styles.matchHeader, { backgroundColor: theme.colors.background }]}>
          <View style={styles.headerOverlay}>
            <Text style={[styles.competitionText, { color: '#FFFFFF' }]}>
              ❌ Match not found
            </Text>
            <Text style={[styles.matchDateTime, { color: '#CCCCCC' }]}>
              ID: {params.matchId} | Sport: {params.sport}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.matchHeader, { backgroundColor: theme.colors.background }]}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg' }}
          style={styles.backgroundImage}
          blurRadius={3}
        />
        <View style={styles.headerOverlay}>
          <View style={styles.competitionInfo}>
            <View style={styles.realDataBadge}>
              <Text style={styles.realDataText}>🔴 LIVE DATA</Text>
            </View>
            <Text style={[styles.competitionText, { color: '#FFFFFF' }]}>
              {realMatch.league}
            </Text>
            <Text style={[styles.matchDateTime, { color: '#FFFFFF' }]}>
              {realMatch.startTime}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <View style={[
              styles.teamContainer,
              teamHighlight.home && {
                backgroundColor: '#FF3333',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderWidth: 2,
                borderColor: '#CC0000',
                shadowColor: '#FF0000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
                elevation: 6,
              }
            ]}>
              <Image source={{ uri: realMatch.home.logo }} style={styles.teamFlag} />
              <Text style={[styles.teamName, { color: '#FFFFFF' }]} numberOfLines={1}>
                {realMatch.home.name}
              </Text>
            </View>

            <View style={styles.scoreDisplay}>
              <Text style={[styles.score, { color: '#FFFFFF' }]}>
                {realMatch.score}
              </Text>
              <Text style={[styles.halfTimeScore, { color: '#CCCCCC' }]}>
                HT: {realMatch.halfTimeScore || '0-0'}
              </Text>
              
              {/* Goal Alert Display - exactly like Chinese screenshot */}
              {goalAlert?.show && (
                <View style={styles.liveMatchGoalAlertContainer}>
                  <View style={[styles.liveMatchGoalAlert, { backgroundColor: '#FFD700', borderColor: '#FF6B00' }]}>
                    <Text style={styles.liveMatchGoalAlertText}>
                      ⚽ GOAL! {goalAlert.scorer} {goalAlert.minute}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={[
              styles.teamContainer,
              teamHighlight.away && {
                backgroundColor: '#FF3333',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderWidth: 2,
                borderColor: '#CC0000',
                shadowColor: '#FF0000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
                elevation: 6,
              }
            ]}>
              <Image source={{ uri: realMatch.away.logo }} style={styles.teamFlag} />
              <Text style={[styles.teamName, { color: '#FFFFFF' }]} numberOfLines={1}>
                {realMatch.away.name}
              </Text>
            </View>
          </View>

          <View style={styles.matchStatus}>
            <Animated.View style={[styles.liveIndicator, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.liveDot} />
              <Text style={[styles.liveText, { color: '#FFFFFF' }]}>
                {isLiveActive ? formatLiveTime(liveTime) : realMatch.statusText}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.mediaButtons}>
            <TouchableOpacity 
              style={[styles.mediaButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              activeOpacity={0.8}
            >
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={[styles.mediaButtonText, { color: '#FFFFFF' }]}>Video Live</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mediaButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              activeOpacity={0.8}
            >
              <Activity size={16} color="#FFFFFF" />
              <Text style={[styles.mediaButtonText, { color: '#FFFFFF' }]}>Animation Live</Text>
            </TouchableOpacity>
          </View>

          {/* Corner data - only show for live and finished matches */}
          {(realMatch.status === 'live' || realMatch.status === 'finished') && (
            <View style={styles.possessionBar}>
              <View style={styles.cornerDataContainer}>
                <Flag size={16} color="#FFFFFF" />
                <Text style={[styles.possessionText, { color: '#FFFFFF' }]}>
                  {realMatch.home.corners || 0}
                </Text>
              </View>
              <View style={styles.possessionBarContainer}>
                <Text style={[styles.possessionLabel, { color: '#FFFFFF' }]}>Corners</Text>
              </View>
              <View style={styles.cornerDataContainer}>
                <Text style={[styles.possessionText, { color: '#FFFFFF' }]}>
                  {realMatch.away.corners || 0}
                </Text>
                <Flag size={16} color="#FFFFFF" />
              </View>
            </View>
          )}

          {/* Viewer data - only show for live matches */}
          {realMatch.status === 'live' && realMatch.viewers && realMatch.viewers !== '0' && (
            <View style={styles.viewersInfo}>
              <View style={styles.viewerSection}>
                <Eye size={14} color="#FFFFFF" />
                <Text style={[styles.viewersText, { color: '#FFFFFF' }]}>
                  {realMatch.viewers} watching
                </Text>
              </View>
              <View style={styles.viewerSection}>
                <Users size={14} color="#FFFFFF" />
                <Text style={[styles.viewersText, { color: '#FFFFFF' }]}>
                  {Math.floor(Math.random() * 50) + 20} following
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTabNavigation = () => (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { borderBottomColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <tab.icon 
              size={16} 
              color={activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === tab.id && { color: theme.colors.primary }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.placeholderText, { color: theme.colors.text }]}>
            Loading match details...
          </Text>
        </View>
      );
    }

    if (!realMatch) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={[styles.placeholderText, { color: theme.colors.text }]}>
            ❌ No match data available
          </Text>
          <Text style={[styles.placeholderText, { color: theme.colors.textSecondary, fontSize: 14 }]}>
            Match ID: {params.matchId}
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'live':
        return (
          <View style={styles.liveContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🔴 Live Match Events
            </Text>
            
            {/* Current Match Status */}
            <View style={styles.liveEventCard}>
              <View style={styles.eventTimeIndicator}>
                <Text style={[styles.eventTime, { color: '#FF5722' }]}>
                  {isLiveActive ? formatLiveTime(liveTime) : realMatch.statusText}
                </Text>
              </View>
              <Text style={[styles.eventDescription, { color: theme.colors.text }]}>
                {realMatch.status === 'live' 
                  ? '⚽ Match is currently in progress' 
                  : realMatch.status === 'finished'
                  ? '🏁 Match has ended'
                  : '⏰ Match upcoming'}
              </Text>
            </View>

            {/* Live Commentary */}
            <View style={styles.commentaryCard}>
              <Text style={[styles.commentaryTitle, { color: theme.colors.text }]}>
                📢 Live Commentary
              </Text>
              <Text style={[styles.commentaryText, { color: theme.colors.textSecondary }]}>
                {realMatch.status === 'live' 
                  ? `${isLiveActive ? formatLiveTime(liveTime) : realMatch.statusText} - Both teams are battling for control. ${realMatch.home.name} looking dangerous on the attack.`
                  : realMatch.status === 'finished'
                  ? `Full-time! ${realMatch.home.name} ${realMatch.score} ${realMatch.away.name}. What a match!`
                  : `Upcoming match between ${realMatch.home.name} and ${realMatch.away.name}. Kick-off soon!`}
              </Text>
            </View>
            
            {/* Test Goal Notification Button - Only show for live matches */}


            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>
              📊 Match Statistics
            </Text>
            <View style={styles.statsContainer}>
              {/* Corner data - only show for live and finished matches */}
              {(realMatch.status === 'live' || realMatch.status === 'finished') && (
                <View style={styles.statRow}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {realMatch.home.corners || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Corners</Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {realMatch.away.corners || 0}
                  </Text>
                </View>
              )}
              
              {/* Viewer data - only show for live matches */}
              {realMatch.status === 'live' && realMatch.viewers && realMatch.viewers !== '0' && (
                <View style={styles.statRow}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {realMatch.viewers}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Viewers</Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    LIVE
                  </Text>
                </View>
              )}
              
              <View style={styles.statRow}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {realMatch.hasVideo ? '✅' : '❌'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Video Stream</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {realMatch.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        );
      case 'chat':
        return (
          <View style={styles.liveContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              💬 Live Chat ({Math.floor(Math.random() * 2000) + 500} users)
            </Text>
            <View style={styles.chatContainer}>
              <Text style={[styles.chatMessage, { color: theme.colors.textSecondary }]}>
                🎉 <Text style={{ color: theme.colors.text }}>Champs:</Text> Welcome to {realMatch.home.name} vs {realMatch.away.name} live chat!
              </Text>
              <Text style={[styles.chatMessage, { color: theme.colors.textSecondary }]}>
                ⚽ <Text style={{ color: theme.colors.text }}>SportsFan:</Text> Great match so far! {realMatch.score}
              </Text>
              <Text style={[styles.chatMessage, { color: theme.colors.textSecondary }]}>
                🔴 <Text style={{ color: theme.colors.text }}>MatchAnalyst:</Text> {realMatch.home.name} looking strong
              </Text>
              <Text style={[styles.chatMessage, { color: theme.colors.textSecondary }]}>
                ⏱️ <Text style={{ color: theme.colors.text }}>LiveViewer:</Text> Current time: {isLiveActive ? formatLiveTime(liveTime) : realMatch.statusText}
              </Text>
              {/* Only show viewer chat message for live matches */}
              {realMatch.status === 'live' && realMatch.viewers && realMatch.viewers !== '0' && (
                <Text style={[styles.chatMessage, { color: theme.colors.textSecondary }]}>
                  📊 <Text style={{ color: theme.colors.text }}>DataExpert:</Text> {realMatch.viewers} people watching this match
                </Text>
              )}
              <Text style={[styles.chatMessage, { color: theme.colors.textSecondary }]}>
                🏆 <Text style={{ color: theme.colors.text }}>ChampsFan:</Text> {realMatch.league} - what a league!
              </Text>
            </View>
          </View>
        );
      case 'lineup':
        return (
          <View style={styles.liveContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              👥 Team Lineups
            </Text>
            <View style={styles.lineupContainer}>
              <View style={styles.teamLineup}>
                <Text style={[styles.teamLineupTitle, { color: theme.colors.text }]}>
                  {realMatch.home.name}
                </Text>
                <Text style={[styles.formation, { color: theme.colors.textSecondary }]}>
                  Formation: 4-4-2
                </Text>
              </View>
              <View style={styles.teamLineup}>
                <Text style={[styles.teamLineupTitle, { color: theme.colors.text }]}>
                  {realMatch.away.name}
                </Text>
                <Text style={[styles.formation, { color: theme.colors.textSecondary }]}>
                  Formation: 4-3-3
                </Text>
              </View>
            </View>
          </View>
        );
      case 'stats':
        return (
          <View style={styles.liveContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              📈 Live Statistics
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {Math.floor(Math.random() * 10) + 5}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Shots</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {Math.floor(Math.random() * 8) + 3}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {Math.floor(Math.random() * 30) + 45}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Possession</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {Math.floor(Math.random() * 30) + 35}%
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {isLiveActive ? formatLiveTime(liveTime) : realMatch.statusText}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Match Time</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  LIVE
                </Text>
              </View>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: theme.colors.text }]}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon!
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {realMatch ? `${realMatch.home.name} vs ${realMatch.away.name}` : 'Live Match'}
        </Text>
        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <MoreHorizontal size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderMatchHeader()}
        {renderTabNavigation()}
        {renderContent()}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    zIndex: 1000,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  matchHeader: {
    height: 280,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    justifyContent: 'space-between',
  },
  competitionInfo: {
    alignItems: 'center',
  },
  competitionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  matchDateTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamFlag: {
    width: 40,
    height: 30,
    borderRadius: 4,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  scoreDisplay: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  score: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
  },
  halfTimeScore: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  matchStatus: {
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF5350',
    marginRight: 8,
  },
  liveText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mediaButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  possessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  possessionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    width: 40,
    textAlign: 'center',
  },
  possessionBarContainer: {
    flex: 1,
    height: 4,
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  possessionFill: {
    height: '100%',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  timelineContainer: {
    padding: 16,
  },
  timelineHeader: {
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  timeMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeMarker: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  timelineEvents: {
    gap: 12,
  },
  timelineEvent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventTime: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  eventDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  statsContainer: {
    padding: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    width: 50,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 4,
  },
  statBarContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  statBar: {
    height: 6,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
  },
  statBarFill: {
    height: '100%',
  },
  commentaryContainer: {
    padding: 16,
  },
  commentaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  importantEvents: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  commentaryList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  commentaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commentaryIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  commentaryText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  eventLegendContainer: {
    padding: 16,
    marginTop: 16,
  },
  eventLegendTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  eventLegendGrid: {
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
    flex: 1,
  },
  weatherContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weatherItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginBottom: 2,
  },
  weatherValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  weatherCondition: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  weatherConditionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  matchInfoContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  matchInfoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  matchInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  matchInfoItem: {
    width: '47%',
  },
  matchInfoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  matchInfoValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  engagementContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  engagementButton: {
    alignItems: 'center',
    padding: 8,
  },
  engagementText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
  },
  bottomPadding: {
    height: 100,
  },
  realDataBadge: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  realDataText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  liveContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  eventItem: {
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  possessionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  cornerDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  viewerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewersText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  liveEventCard: {
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  eventTimeIndicator: {
    marginBottom: 8,
  },
  commentaryCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  chatContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 16,
  },
  chatMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    lineHeight: 20,
  },
  lineupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  teamLineup: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
  },
  teamLineupTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  formation: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },

  liveMatchGoalAlertContainer: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    alignItems: 'center',
    zIndex: 1000,
  },
  liveMatchGoalAlert: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FF6B00',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  liveMatchGoalAlertText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});