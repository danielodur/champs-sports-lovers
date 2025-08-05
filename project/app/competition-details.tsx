import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trophy, Calendar, Users, Star, MapPin, ChevronRight, Clock, Target } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { competitions, EnhancedCompetition } from '@/data/leagues';
import { useTranslation } from 'react-i18next';

// Mock data structures for standings and fixtures
interface TeamStanding {
  position: number;
  team: {
    name: string;
    logo: string;
  };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface Fixture {
  id: string;
  date: string;
  time: string;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  score?: {
    home: number;
    away: number;
  };
  status: 'scheduled' | 'live' | 'finished';
  matchday?: number;
}

export default function CompetitionDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  
  const [competition, setCompetition] = useState<EnhancedCompetition | null>(null);
  const [activeTab, setActiveTab] = useState('standings');
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab options
  const tabs = [
    { id: 'standings', label: 'Standings', icon: <Trophy size={16} color={theme.colors.text} /> },
    { id: 'fixtures', label: 'Fixtures', icon: <Calendar size={16} color={theme.colors.text} /> },
    { id: 'results', label: 'Results', icon: <Target size={16} color={theme.colors.text} /> },
    { id: 'teams', label: 'Teams', icon: <Users size={16} color={theme.colors.text} /> }
  ];

  useEffect(() => {
    loadCompetitionData();
    
    // Set initial tab from URL parameter
    if (params.tab && typeof params.tab === 'string') {
      setActiveTab(params.tab);
    }
  }, [params.id, params.tab]);

  const loadCompetitionData = async () => {
    try {
      setLoading(true);
      
      // Find competition by ID
      const competitionId = params.id as string;
      const foundCompetition = competitions.football.find(comp => comp.id === competitionId);
      
      if (!foundCompetition) {
        Alert.alert('Error', 'Competition not found');
        router.back();
        return;
      }
      
      setCompetition(foundCompetition);
      
      // Load mock data (in real app, this would come from SportRadar/RapidAPI)
      await loadStandings(foundCompetition);
      await loadFixtures(foundCompetition);
      
    } catch (error) {
      console.error('Error loading competition data:', error);
      Alert.alert('Error', 'Failed to load competition data');
    } finally {
      setLoading(false);
    }
  };

  const loadStandings = async (comp: EnhancedCompetition) => {
    // Mock standings data - in real app, fetch from API
    const mockStandings: TeamStanding[] = generateMockStandings(comp);
    setStandings(mockStandings);
  };

  const loadFixtures = async (comp: EnhancedCompetition) => {
    // Mock fixtures data - in real app, fetch from API
    const mockFixtures: Fixture[] = generateMockFixtures(comp);
    setFixtures(mockFixtures);
  };

  const generateMockStandings = (comp: EnhancedCompetition): TeamStanding[] => {
    const teamCount = Math.min(comp.participantCount || 20, 20);
    const standings: TeamStanding[] = [];
    
    // Generate realistic team names based on competition
    const teamNames = getTeamNamesForCompetition(comp);
    
    for (let i = 0; i < teamCount; i++) {
      const played = Math.floor(Math.random() * 20) + 10;
      const won = Math.floor(Math.random() * played);
      const lost = Math.floor(Math.random() * (played - won));
      const drawn = played - won - lost;
      const goalsFor = Math.floor(Math.random() * 50) + 20;
      const goalsAgainst = Math.floor(Math.random() * 40) + 15;
      
      standings.push({
        position: i + 1,
        team: {
          name: teamNames[i] || `Team ${i + 1}`,
          logo: `https://via.placeholder.com/40x40?text=${(teamNames[i] || `T${i + 1}`).substring(0, 2)}`
        },
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: won * 3 + drawn
      });
    }
    
    // Sort by points, then goal difference
    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalDifference - a.goalDifference;
    }).map((team, index) => ({ ...team, position: index + 1 }));
  };

  const generateMockFixtures = (comp: EnhancedCompetition): Fixture[] => {
    const fixtures: Fixture[] = [];
    const teamNames = getTeamNamesForCompetition(comp);
    
    // Generate upcoming fixtures
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      fixtures.push({
        id: `fixture_${i}`,
        date: date.toISOString().split('T')[0],
        time: `${Math.floor(Math.random() * 12) + 12}:${Math.random() > 0.5 ? '00' : '30'}`,
        homeTeam: {
          name: teamNames[Math.floor(Math.random() * teamNames.length)],
          logo: 'https://via.placeholder.com/30x30?text=H'
        },
        awayTeam: {
          name: teamNames[Math.floor(Math.random() * teamNames.length)],
          logo: 'https://via.placeholder.com/30x30?text=A'
        },
        status: i === 0 ? 'live' : 'scheduled',
        matchday: Math.floor(i / 2) + 1
      });
    }
    
    return fixtures;
  };

  const getTeamNamesForCompetition = (comp: EnhancedCompetition): string[] => {
    // Return realistic team names based on competition
    switch (comp.id) {
      case 'premier-league':
        return ['Manchester City', 'Arsenal', 'Liverpool', 'Manchester United', 'Chelsea', 'Newcastle', 'Tottenham', 'Brighton', 'Aston Villa', 'West Ham', 'Crystal Palace', 'Bournemouth', 'Fulham', 'Wolves', 'Everton', 'Brentford', 'Nottingham Forest', 'Luton Town', 'Burnley', 'Sheffield United'];
      case 'la-liga':
        return ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Real Sociedad', 'Real Betis', 'Villarreal', 'Valencia', 'Athletic Bilbao', 'Sevilla', 'Getafe', 'Las Palmas', 'Girona', 'Osasuna', 'Rayo Vallecano', 'Mallorca', 'Cadiz', 'Celta Vigo', 'Alaves', 'Granada', 'Almeria'];
      case 'bundesliga':
        return ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Union Berlin', 'SC Freiburg', 'Bayer Leverkusen', 'Eintracht Frankfurt', 'VfL Wolfsburg', 'Mainz 05', 'Borussia Monchengladbach', 'FC Koln', 'Werder Bremen', 'VfB Stuttgart', 'FC Augsburg', 'TSG Hoffenheim', 'VfL Bochum', 'FC Heidenheim', 'SV Darmstadt'];
      case 'fifa-world-cup':
        return ['Brazil', 'France', 'Argentina', 'England', 'Spain', 'Portugal', 'Netherlands', 'Germany', 'Italy', 'Belgium', 'Croatia', 'Morocco', 'Uruguay', 'Colombia', 'Mexico', 'Japan'];
      case 'uefa-champions-league':
        return ['Manchester City', 'Real Madrid', 'Bayern Munich', 'PSG', 'Barcelona', 'Arsenal', 'Inter Milan', 'Atletico Madrid', 'Borussia Dortmund', 'AC Milan', 'Chelsea', 'Liverpool', 'Porto', 'Napoli', 'Lazio', 'Real Sociedad'];
      case 'uganda-premier-league':
        return ['Vipers SC', 'KCCA FC', 'Express FC', 'SC Villa', 'BUL FC', 'Wakiso Giants', 'URA FC', 'Mbarara City', 'Arua Hill SC', 'Gaddafi FC', 'Police FC', 'Busoga United', 'Onduparaka FC', 'Bright Stars FC', 'Soltilo Bright Stars', 'UPDF FC'];
      default:
        return ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H', 'Team I', 'Team J'];
    }
  };

  const getCompetitionLogo = (competition: EnhancedCompetition) => {
    return competition.logo || `https://via.placeholder.com/60x60?text=${competition.name.substring(0, 2)}`;
  };

  const getCountryFlag = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'International': 'un',
      'Europe': 'eu',
      'England': 'gb-eng',
      'Spain': 'es',
      'Germany': 'de',
      'Italy': 'it',
      'France': 'fr',
      'Uganda': 'ug',
      'Brazil': 'br',
      'Argentina': 'ar',
      'USA': 'us',
      'Japan': 'jp',
      'South Korea': 'kr',
      'China': 'cn',
      'Australia': 'au',
      'New Zealand': 'nz'
    };
    
    const code = flagMap[country] || country.toLowerCase().replace(/\s+/g, '-');
    return `https://flagcdn.com/w40/${code}.png`;
  };

  const renderStandings = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.tableHeader, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>Pos</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary, flex: 1 }]}>Team</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>P</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>W</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>D</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>L</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>GD</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>Pts</Text>
      </View>
      
      {standings.map((team, index) => (
        <TouchableOpacity
          key={team.position}
          style={[
            styles.tableRow,
            { borderBottomColor: theme.colors.border },
            index < 4 && competition?.type === 'league' && { backgroundColor: `${theme.colors.primary}15` }
          ]}
        >
          <View style={styles.positionContainer}>
            <Text style={[styles.position, { color: theme.colors.text }]}>{team.position}</Text>
            {index < 4 && competition?.type === 'league' && (
              <View style={[styles.qualificationDot, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
          
          <View style={styles.teamContainer}>
            <Image source={{ uri: team.team.logo }} style={styles.teamLogo} resizeMode="contain" />
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {team.team.name}
            </Text>
          </View>
          
          <Text style={[styles.stat, { color: theme.colors.textSecondary }]}>{team.played}</Text>
          <Text style={[styles.stat, { color: theme.colors.textSecondary }]}>{team.won}</Text>
          <Text style={[styles.stat, { color: theme.colors.textSecondary }]}>{team.drawn}</Text>
          <Text style={[styles.stat, { color: theme.colors.textSecondary }]}>{team.lost}</Text>
          <Text style={[styles.stat, { color: team.goalDifference >= 0 ? theme.colors.primary : '#E74C3C' }]}>
            {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
          </Text>
          <Text style={[styles.points, { color: theme.colors.text }]}>{team.points}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFixtures = () => (
    <ScrollView style={styles.tabContent}>
      {fixtures.map((fixture) => (
        <TouchableOpacity
          key={fixture.id}
          style={[styles.fixtureItem, { borderBottomColor: theme.colors.border }]}
        >
          <View style={styles.fixtureHeader}>
            <Text style={[styles.fixtureDate, { color: theme.colors.textSecondary }]}>
              {new Date(fixture.date).toLocaleDateString()} • {fixture.time}
            </Text>
            {fixture.status === 'live' && (
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          
          <View style={styles.fixtureTeams}>
            <View style={styles.fixtureTeam}>
              <Image source={{ uri: fixture.homeTeam.logo }} style={styles.fixtureTeamLogo} />
              <Text style={[styles.fixtureTeamName, { color: theme.colors.text }]} numberOfLines={1}>
                {fixture.homeTeam.name}
              </Text>
            </View>
            
            <View style={styles.fixtureScore}>
              {fixture.score ? (
                <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                  {fixture.score.home} - {fixture.score.away}
                </Text>
              ) : (
                <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>vs</Text>
              )}
            </View>
            
            <View style={styles.fixtureTeam}>
              <Text style={[styles.fixtureTeamName, { color: theme.colors.text, textAlign: 'right' }]} numberOfLines={1}>
                {fixture.awayTeam.name}
              </Text>
              <Image source={{ uri: fixture.awayTeam.logo }} style={styles.fixtureTeamLogo} />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading || !competition) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView edges={['top']} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading competition details...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={theme.colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} backgroundColor={theme.colors.backgroundSecondary} translucent />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView edges={['top']} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Image
              source={{ uri: getCompetitionLogo(competition) }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
                {competition.name}
              </Text>
              <View style={styles.headerMeta}>
                <Image
                  source={{ uri: getCountryFlag(competition.country) }}
                  style={styles.countryFlag}
                  resizeMode="contain"
                />
                <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                  {competition.country} • {competition.currentSeason}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Competition Info */}
        <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.infoItem}>
            <Users size={16} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {competition.participantCount} teams
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Trophy size={16} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Tier {competition.tier}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Calendar size={16} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {competition.currentSeason}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.colors.backgroundSecondary, borderBottomColor: theme.colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    activeTab === tab.id && { borderBottomColor: theme.colors.primary }
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <Text style={[
                    styles.tabText,
                    { color: theme.colors.textSecondary },
                    activeTab === tab.id && { color: theme.colors.primary, fontWeight: '600' }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'standings' && renderStandings()}
          {activeTab === 'fixtures' && renderFixtures()}
          {activeTab === 'results' && renderFixtures()}
          {activeTab === 'teams' && (
            <View style={styles.tabContent}>
              <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
                Teams section coming soon...
              </Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlag: {
    width: 20,
    height: 15,
    marginRight: 8,
    borderRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingVertical: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    width: 30,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 30,
  },
  position: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    width: 20,
  },
  qualificationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: 4,
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  teamName: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  stat: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    width: 30,
  },
  points: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    width: 30,
  },
  fixtureItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  fixtureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fixtureDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  liveIndicator: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  fixtureTeams: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fixtureTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fixtureTeamLogo: {
    width: 30,
    height: 30,
    marginHorizontal: 8,
  },
  fixtureTeamName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  fixtureScore: {
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  vsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  comingSoonText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 40,
  },
}); 