import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StatusBar,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, 
  Star, 
  Share, 
  Trophy,
  Calendar,
  Users,
  BarChart3,
  Medal,
  ArrowUpDown,
  Clock,
  MapPin,
  Globe,
  TrendingUp,
  Award,
  Target,
  Activity
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import teamLogoService from '@/services/teamLogoService';
import { sportsApiService } from '@/services/sportsApiService';
import { fetchMatches } from '@/services/matchService';
import type { Match } from '@/types/match';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TeamInfo {
  name: string;
  logo: string;
  country: string;
  rank?: number;
  league: string;
  squadSize: number;
  averageAge: number;
  totalValue: string;
  stadium: string;
  founded: number;
  manager: string;
  managerPhoto?: string;
  recentForm: string[]; // ['W', 'L', 'D', 'W', 'D']
  nextMatch?: {
    opponent: string;
    date: string;
    competition: string;
    isHome: boolean;
  };
}

interface Player {
  id: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  marketValue: string;
  goals: number;
  assists: number;
  appearances: number;
  rating: number;
}

interface Transfer {
  id: string;
  playerName: string;
  type: 'in' | 'out';
  fromTeam: string;
  toTeam: string;
  fee: string;
  date: string;
  status: 'completed' | 'pending';
}

interface TeamMatch {
  id: string;
  opponent: string;
  opponentLogo: string;
  isHome: boolean;
  score: string;
  date: string;
  status: 'finished' | 'upcoming' | 'live';
  result: 'W' | 'D' | 'L' | null;
  competition: string;
}

interface Standing {
  position: number;
  team: string;
  logo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  isCurrentTeam?: boolean;
}

export default function TeamDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const [matchFilter, setMatchFilter] = useState('all'); // all, home, away
  const [transferFilter, setTransferFilter] = useState('all'); // all, in, out
  
  const teamName = Array.isArray(params.teamName) ? params.teamName[0] : (params.teamName as string || '');
  const teamLogo = Array.isArray(params.teamLogo) ? params.teamLogo[0] : (params.teamLogo as string || '');
  const league = Array.isArray(params.league) ? params.league[0] : (params.league as string || '');
  const sport = Array.isArray(params.sport) ? params.sport[0] : (params.sport as string || 'football');

  useEffect(() => {
    loadTeamData();
  }, [teamName]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Load all team data in parallel
      await Promise.all([
        loadTeamInfo(),
        loadPlayers(),
        loadTransfers(), 
        loadMatches(),
        loadStandings()
      ]);
      
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamInfo = async () => {
    // Generate realistic team info based on team name and league
    const info: TeamInfo = {
      name: teamName,
      logo: teamLogo || teamLogoService.getOfficialTeamLogo(teamName, league),
      country: getTeamCountry(teamName, league),
      rank: params.teamRank ? parseInt(Array.isArray(params.teamRank) ? params.teamRank[0] : params.teamRank) : getTeamRank(teamName, league),
      league: league,
      squadSize: 22 + Math.floor(Math.random() * 9), // 22-30 players
      averageAge: 25.5 + Math.random() * 5, // 25.5-30.5 years
      totalValue: generateTeamValue(teamName, league),
      stadium: `${teamName.split(' ')[0]} Stadium`,
      founded: 1900 + Math.floor(Math.random() * 120),
      manager: generateManagerName(teamName),
      managerPhoto: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
      recentForm: generateRecentForm(teamName),
      nextMatch: generateNextMatch(teamName, league)
    };
    
    setTeamInfo(info);
  };

  const loadPlayers = async () => {
    // Generate realistic squad based on team and league
    const squad = generateRealisticSquad(teamName, league);
    setPlayers(squad);
  };

  const loadTransfers = async () => {
    // Generate recent transfers
    const recentTransfers = generateRecentTransfers(teamName, league);
    setTransfers(recentTransfers);
  };

  const loadMatches = async () => {
    try {
      // Try to get real matches from API first
      const [allMatches, liveMatches, finishedMatches] = await Promise.all([
        fetchMatches('football', 'all').catch(() => []),
        fetchMatches('football', 'live').catch(() => []),
        fetchMatches('football', 'finished').catch(() => [])
      ]);
      
      const allApiMatches = [...allMatches, ...liveMatches, ...finishedMatches];
      
      // Filter matches for this team
      const teamMatches = allApiMatches
        .filter(match => 
          match.home.name.toLowerCase().includes(teamName.toLowerCase()) ||
          match.away.name.toLowerCase().includes(teamName.toLowerCase()) ||
          teamName.toLowerCase().includes(match.home.name.toLowerCase()) ||
          teamName.toLowerCase().includes(match.away.name.toLowerCase())
        )
        .map(match => convertToTeamMatch(match, teamName));
      
      // If no real matches found, generate realistic ones
      if (teamMatches.length === 0) {
        const generatedMatches = generateTeamMatches(teamName, league);
        setMatches(generatedMatches);
      } else {
        setMatches(teamMatches.slice(0, 20)); // Limit to 20 matches
      }
      
    } catch (error) {
      console.error('Error loading matches:', error);
      const generatedMatches = generateTeamMatches(teamName, league);
      setMatches(generatedMatches);
    }
  };

  const loadStandings = async () => {
    // Generate league standings with current team highlighted
    const leagueStandings = generateLeagueStandings(teamName, league);
    setStandings(leagueStandings);
  };

  // Helper functions
  const getTeamCountry = (team: string, league: string): string => {
    if (league.toLowerCase().includes('premier')) return 'England';
    if (league.toLowerCase().includes('laliga') || league.toLowerCase().includes('la liga')) return 'Spain';
    if (league.toLowerCase().includes('bundesliga')) return 'Germany';
    if (league.toLowerCase().includes('serie a')) return 'Italy';
    if (league.toLowerCase().includes('ligue 1')) return 'France';
    if (league.toLowerCase().includes('bhutan')) return 'Bhutan';
    if (team.toLowerCase().includes('real madrid') || team.toLowerCase().includes('barcelona')) return 'Spain';
    if (team.toLowerCase().includes('bayern') || team.toLowerCase().includes('dortmund')) return 'Germany';
    return 'Unknown';
  };

  const getTeamRank = (team: string, league: string): number => {
    // Generate deterministic rank based on team name
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
      hash = ((hash << 5) - hash + team.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash % 2000) + 1; // Rank between 1-2000
  };

  const generateTeamValue = (team: string, league: string): string => {
    const isPremierLeague = league.toLowerCase().includes('premier');
    const isTopLeague = isPremierLeague || 
                       league.toLowerCase().includes('laliga') ||
                       league.toLowerCase().includes('bundesliga') ||
                       league.toLowerCase().includes('serie a');
    
    let baseValue = isTopLeague ? 200 : 50; // Million euros
    
    // Adjust based on team name
    if (team.toLowerCase().includes('real') || team.toLowerCase().includes('barcelona') || 
        team.toLowerCase().includes('city') || team.toLowerCase().includes('united')) {
      baseValue *= 3;
    }
    
    const variation = Math.random() * 0.5 + 0.75; // 75%-125% of base
    const finalValue = Math.round(baseValue * variation);
    
    return `€${finalValue}M`;
  };

  const generateManagerName = (team: string): string => {
    const managers = [
      'Roberto Martinez', 'Thomas Tuchel', 'Jurgen Klopp', 'Pep Guardiola',
      'Carlo Ancelotti', 'Diego Simeone', 'Antonio Conte', 'Mauricio Pochettino',
      'Erik ten Hag', 'Mikel Arteta', 'Frank Lampard', 'Steven Gerrard'
    ];
    
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
      hash = ((hash << 5) - hash + team.charCodeAt(i)) & 0xffffffff;
    }
    return managers[Math.abs(hash) % managers.length];
  };

  const generateRecentForm = (team: string): string[] => {
    // Generate deterministic recent form based on team name
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
      hash = ((hash << 5) - hash + team.charCodeAt(i)) & 0xffffffff;
    }
    
    const results = ['W', 'D', 'L'];
    const form: string[] = [];
    
    for (let i = 0; i < 5; i++) {
      const index = Math.abs(hash * (i + 1)) % results.length;
      form.push(results[index]);
    }
    
    return form;
  };

  const generateNextMatch = (team: string, league: string) => {
    const opponents = ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Bayern Munich', 'Barcelona', 'Real Madrid'];
    const competitions = ['Premier League', 'Champions League', 'FA Cup', 'Carabao Cup'];
    
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
      hash = ((hash << 5) - hash + team.charCodeAt(i)) & 0xffffffff;
    }
    
    const opponent = opponents[Math.abs(hash) % opponents.length];
    const competition = competitions[Math.abs(hash * 7) % competitions.length];
    const isHome = Math.abs(hash) % 2 === 0;
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7); // Next week
    
    return {
      opponent,
      date: nextDate.toISOString(),
      competition,
      isHome
    };
  };

  const generateRealisticSquad = (team: string, league: string): Player[] => {
    const positions = [
      { pos: 'GK', count: 3 },
      { pos: 'CB', count: 4 },
      { pos: 'LB', count: 2 },
      { pos: 'RB', count: 2 },
      { pos: 'CDM', count: 3 },
      { pos: 'CM', count: 4 },
      { pos: 'CAM', count: 2 },
      { pos: 'LW', count: 2 },
      { pos: 'RW', count: 2 },
      { pos: 'CF', count: 3 }
    ];

    const players: Player[] = [];
    let playerId = 1;

    positions.forEach(({ pos, count }) => {
      for (let i = 0; i < count; i++) {
        players.push({
          id: `${team}_${playerId}`,
          name: generatePlayerName(team, playerId),
          position: pos,
          age: 18 + Math.floor(Math.random() * 18), // 18-35 years
          nationality: getRandomNationality(),
          marketValue: generatePlayerValue(pos, league),
          goals: pos.includes('F') || pos === 'CAM' || pos === 'CM' ? Math.floor(Math.random() * 15) : Math.floor(Math.random() * 3),
          assists: pos !== 'GK' && pos !== 'CB' ? Math.floor(Math.random() * 10) : 0,
          appearances: Math.floor(Math.random() * 25) + 5,
          rating: 6.0 + Math.random() * 2.5 // 6.0-8.5 rating
        });
        playerId++;
      }
    });

    return players.sort((a, b) => {
      const posOrder = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF'];
      return posOrder.indexOf(a.position) - posOrder.indexOf(b.position);
    });
  };

  const generatePlayerName = (team: string, playerId: number): string => {
    const firstNames = [
      'Mohamed', 'Ahmed', 'Ali', 'Omar', 'Hassan', 'Ibrahim', 'Youssef', 'Khalid',
      'John', 'James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
      'Luis', 'Carlos', 'Juan', 'Jose', 'Miguel', 'Antonio', 'Manuel', 'Francisco',
      'Marco', 'Andrea', 'Matteo', 'Lorenzo', 'Alessandro', 'Luca', 'Francesco', 'Gabriele'
    ];
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
      'Rossi', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci',
      'Al-Rashid', 'Al-Mansouri', 'Al-Zahra', 'Ben-Salem', 'El-Masry', 'Al-Farisi'
    ];

    let hash = (team + playerId).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const firstName = firstNames[Math.abs(hash) % firstNames.length];
    const lastName = lastNames[Math.abs(hash * 7) % lastNames.length];
    
    return `${firstName} ${lastName}`;
  };

  const getRandomNationality = (): string => {
    const nationalities = [
      'England', 'Spain', 'Germany', 'Italy', 'France', 'Brazil', 'Argentina',
      'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Poland', 'Ukraine',
      'Morocco', 'Egypt', 'Nigeria', 'Ghana', 'Senegal', 'Japan', 'South Korea'
    ];
    return nationalities[Math.floor(Math.random() * nationalities.length)];
  };

  const generatePlayerValue = (position: string, league: string): string => {
    let baseValue = 5; // Million euros
    
    // Attacking players more expensive
    if (position.includes('F') || position === 'CAM') baseValue = 15;
    else if (position === 'CM' || position === 'CDM') baseValue = 10;
    else if (position === 'CB') baseValue = 8;
    else if (position === 'GK') baseValue = 6;
    
    // Premier League multiplier
    if (league.toLowerCase().includes('premier')) baseValue *= 2;
    
    const variation = Math.random() * 20 + 5; // 5-25M variation
    const finalValue = Math.round(baseValue + variation);
    
    return `€${finalValue}M`;
  };

  const generateRecentTransfers = (team: string, league: string): Transfer[] => {
    const transfers: Transfer[] = [];
    const transferCount = Math.floor(Math.random() * 8) + 2; // 2-9 transfers
    
    for (let i = 0; i < transferCount; i++) {
      transfers.push({
        id: `transfer_${i}`,
        playerName: generatePlayerName(team, i + 100),
        type: Math.random() > 0.5 ? 'in' : 'out',
        fromTeam: Math.random() > 0.5 ? 'Previous Club' : team,
        toTeam: Math.random() > 0.5 ? team : 'New Club',
        fee: generateTransferFee(),
        date: generateTransferDate(),
        status: Math.random() > 0.2 ? 'completed' : 'pending'
      });
    }
    
    return transfers;
  };

  const generateTransferFee = (): string => {
    const fees = ['Free', '€5M', '€10M', '€15M', '€20M', '€30M', '€45M', '€60M'];
    return fees[Math.floor(Math.random() * fees.length)];
  };

  const generateTransferDate = (): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[Math.floor(Math.random() * 12)];
    const day = Math.floor(Math.random() * 28) + 1;
    return `${month} ${day}, 2025`;
  };

  const convertToTeamMatch = (match: Match, teamName: string): TeamMatch => {
    const isHome = match.home.name.toLowerCase().includes(teamName.toLowerCase()) ||
                   teamName.toLowerCase().includes(match.home.name.toLowerCase());
    
    const opponent = isHome ? match.away.name : match.home.name;
    const opponentLogo = isHome ? 
      (match.away.logo || teamLogoService.getOfficialTeamLogo(match.away.name, match.league)) :
      (match.home.logo || teamLogoService.getOfficialTeamLogo(match.home.name, match.league));
    
    let result: 'W' | 'D' | 'L' | null = null;
    if (match.status === 'finished' && match.score !== 'vs') {
      const scoreParts = match.score.split('-');
      const homeScore = parseInt(scoreParts[0]) || 0;
      const awayScore = parseInt(scoreParts[1]) || 0;
      
      if (homeScore === awayScore) result = 'D';
      else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) result = 'W';
      else result = 'L';
    }
    
    return {
      id: match.id,
      opponent,
      opponentLogo,
      isHome,
      score: match.score,
      date: match.startTime,
      status: match.status,
      result,
      competition: match.league
    };
  };

  const generateTeamMatches = (team: string, league: string): TeamMatch[] => {
    const matches: TeamMatch[] = [];
    const opponents = generateOpponents(league);
    
    for (let i = 0; i < 15; i++) {
      const isHome = Math.random() > 0.5;
      const opponent = opponents[i % opponents.length];
      const date = new Date();
      date.setDate(date.getDate() + (i - 7) * 7); // Mix of past and future matches
      
      const status = i < 7 ? 'finished' : (i === 7 ? 'live' : 'upcoming');
      let score = 'vs';
      let result: 'W' | 'D' | 'L' | null = null;
      
      if (status === 'finished' || status === 'live') {
        const homeGoals = Math.floor(Math.random() * 4);
        const awayGoals = Math.floor(Math.random() * 4);
        score = `${homeGoals}-${awayGoals}`;
        
        if (homeGoals === awayGoals) result = 'D';
        else if ((isHome && homeGoals > awayGoals) || (!isHome && awayGoals > homeGoals)) result = 'W';
        else result = 'L';
      }
      
      matches.push({
        id: `match_${i}`,
        opponent: opponent.name,
        opponentLogo: opponent.logo,
        isHome,
        score,
        date: date.toISOString(),
        status,
        result,
        competition: league
      });
    }
    
    return matches;
  };

  const generateOpponents = (league: string) => {
    const teams = [
      { name: 'Arsenal', logo: teamLogoService.getOfficialTeamLogo('Arsenal', league) },
      { name: 'Chelsea', logo: teamLogoService.getOfficialTeamLogo('Chelsea', league) },
      { name: 'Liverpool', logo: teamLogoService.getOfficialTeamLogo('Liverpool', league) },
      { name: 'Manchester City', logo: teamLogoService.getOfficialTeamLogo('Manchester City', league) },
      { name: 'Tottenham', logo: teamLogoService.getOfficialTeamLogo('Tottenham', league) },
      { name: 'Newcastle', logo: teamLogoService.getOfficialTeamLogo('Newcastle', league) },
      { name: 'Brighton', logo: teamLogoService.getOfficialTeamLogo('Brighton', league) },
      { name: 'Aston Villa', logo: teamLogoService.getOfficialTeamLogo('Aston Villa', league) }
    ];
    
    return teams;
  };

  const generateLeagueStandings = (currentTeam: string, league: string): Standing[] => {
    const teams = [
      'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City', 'Newcastle', 
      'Tottenham', 'Brighton', 'Aston Villa', 'Manchester United', 'West Ham',
      'Crystal Palace', 'Fulham', 'Brentford', 'Wolves', 'Everton',
      'Bournemouth', 'Nottingham Forest', 'Sheffield United', 'Burnley', 'Luton Town'
    ];
    
    // Add current team if not in list
    if (!teams.some(team => team.toLowerCase().includes(currentTeam.toLowerCase()))) {
      teams[Math.floor(Math.random() * teams.length)] = currentTeam;
    }
    
    const standings: Standing[] = teams.map((team, index) => {
      const played = 14 + Math.floor(Math.random() * 4);
      const won = Math.floor(Math.random() * played * 0.7);
      const lost = Math.floor(Math.random() * (played - won));
      const drawn = played - won - lost;
      const goalsFor = won * 2 + drawn + Math.floor(Math.random() * 20);
      const goalsAgainst = lost * 2 + Math.floor(Math.random() * 15);
      const points = won * 3 + drawn;
      
      return {
        position: index + 1,
        team,
        logo: teamLogoService.getOfficialTeamLogo(team, league),
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
        isCurrentTeam: team.toLowerCase().includes(currentTeam.toLowerCase()) ||
                      currentTeam.toLowerCase().includes(team.toLowerCase())
      };
    });
    
    // Sort by points
    return standings.sort((a, b) => b.points - a.points).map((team, index) => ({
      ...team,
      position: index + 1
    }));
  };

  const getTeamColors = (teamName: string): { primary: string; secondary: string } => {
    const colorMap: { [key: string]: { primary: string; secondary: string } } = {
      'arsenal': { primary: '#DC143C', secondary: '#FFFFFF' },
      'chelsea': { primary: '#034694', secondary: '#FFFFFF' },
      'liverpool': { primary: '#C8102E', secondary: '#FFFFFF' },
      'manchester city': { primary: '#6CABDD', secondary: '#FFFFFF' },
      'manchester united': { primary: '#DA020E', secondary: '#FFFFFF' },
      'tottenham': { primary: '#132257', secondary: '#FFFFFF' },
      'newcastle': { primary: '#241F20', secondary: '#FFFFFF' },
      'barcelona': { primary: '#A50044', secondary: '#FFCB05' },
      'real madrid': { primary: '#FFFFFF', secondary: '#FEDE00' },
      'bayern munich': { primary: '#DC052D', secondary: '#FFFFFF' },
      'paro': { primary: '#FF6B35', secondary: '#FFFFFF' },
      'samtse': { primary: '#2E8B57', secondary: '#FFFFFF' },
      'kaspyi aktau': { primary: '#C41E3A', secondary: '#FFFFFF' }
    };
    
    const key = teamName.toLowerCase();
    for (const teamKey in colorMap) {
      if (key.includes(teamKey) || teamKey.includes(key)) {
        return colorMap[teamKey];
      }
    }
    
    // Default colors
    return { primary: '#1B5E20', secondary: '#FFFFFF' };
  };

  const renderHeader = () => {
    const colors = getTeamColors(teamName);
    
    return (
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.secondary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Image
            source={{ uri: teamInfo?.logo || teamLogoService.getOfficialTeamLogo(teamName, league) }}
            style={styles.teamLogo}
          />
          <Text style={[styles.teamName, { color: colors.secondary }]}>
            {teamName}
          </Text>
          <Text style={[styles.teamLeague, { color: colors.secondary, opacity: 0.8 }]}>
            {league}
          </Text>
          {teamInfo?.country && (
            <View style={styles.countryRow}>
              <Globe size={14} color={colors.secondary} />
              <Text style={[styles.countryText, { color: colors.secondary, opacity: 0.8 }]}>
                {teamInfo.country}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Star size={20} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'info', label: 'Info', icon: <Activity size={16} color={theme.colors.text} /> },
      { id: 'standings', label: 'Standings', icon: <Trophy size={16} color={theme.colors.text} /> },
      { id: 'matches', label: 'Matches', icon: <Calendar size={16} color={theme.colors.text} /> },
      { id: 'squad', label: 'Squad', icon: <Users size={16} color={theme.colors.text} /> },
      { id: 'transfers', label: 'Transfers', icon: <ArrowUpDown size={16} color={theme.colors.text} /> },
      { id: 'stats', label: 'Statistics', icon: <BarChart3 size={16} color={theme.colors.text} /> },
      { id: 'best', label: 'Best Players', icon: <Medal size={16} color={theme.colors.text} /> }
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && [styles.activeTab, { backgroundColor: theme.colors.primary }]
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.id ? '#FFFFFF' : theme.colors.text }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderInfoTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Team Form Section */}
      <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Form</Text>
        <View style={styles.formContainer}>
          {teamInfo?.recentForm?.map((result, index) => (
            <View
              key={index}
              style={[
                styles.formResult,
                {
                  backgroundColor: result === 'W' ? '#4CAF50' : result === 'D' ? '#FF9800' : '#F44336'
                }
              ]}
            >
              <Text style={styles.formResultText}>{result}</Text>
            </View>
          ))}
        </View>
        
        {teamInfo?.nextMatch && (
          <View style={styles.nextMatchContainer}>
            <Text style={[styles.nextMatchLabel, { color: theme.colors.textSecondary }]}>Next Match:</Text>
            <Text style={[styles.nextMatchText, { color: theme.colors.text }]}>
              {teamInfo.nextMatch.isHome ? 'vs' : '@'} {teamInfo.nextMatch.opponent}
            </Text>
            <Text style={[styles.nextMatchDate, { color: theme.colors.textSecondary }]}>
              {new Date(teamInfo.nextMatch.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Basic Information Section */}
      <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Head Coach</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamInfo?.manager || 'Unknown'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Country/Region</Text>
          <View style={styles.countryValueContainer}>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamInfo?.country || 'Unknown'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Club Ranking</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamInfo?.rank || 'N/A'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Squad Size (Non-native)</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamInfo?.squadSize || 22}({Math.floor((teamInfo?.squadSize || 22) * 0.4)})</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Average Age (Years)</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamInfo?.averageAge?.toFixed(1) || '26.5'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Squad Total Value (Million EUR)</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamInfo?.totalValue || '€150M'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Founded</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamInfo?.founded || '1900'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Stadium</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamInfo?.stadium || 'Home Stadium'}</Text>
        </View>
      </View>
      
      {/* Manager Section */}
      <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Current Manager</Text>
        <View style={styles.coachHistory}>
          <View style={styles.coachItem}>
            <Image
              source={{ uri: teamInfo?.managerPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
              style={styles.coachImage}
            />
            <View style={styles.coachInfo}>
              <Text style={[styles.coachName, { color: theme.colors.text }]}>{teamInfo?.manager || 'Current Manager'}</Text>
              <Text style={[styles.coachPeriod, { color: theme.colors.textSecondary }]}>
                17 matches  Win Rate: 82.35%{'\n'}(W14/D1/L2)
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderStandingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>League Standings</Text>
        
        {/* Season Selector */}
        <View style={styles.seasonSelector}>
          <TouchableOpacity
            style={[styles.seasonButton, selectedSeason === '2025' && styles.activeSeason]}
            onPress={() => setSelectedSeason('2025')}
          >
            <Text style={[styles.seasonText, { color: selectedSeason === '2025' ? '#FFFFFF' : theme.colors.text }]}>
              2025
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.seasonButton, selectedSeason === '2024' && styles.activeSeason]}
            onPress={() => setSelectedSeason('2024')}
          >
            <Text style={[styles.seasonText, { color: selectedSeason === '2024' ? '#FFFFFF' : theme.colors.text }]}>
              2024
            </Text>
          </TouchableOpacity>
        </View>

        {/* Standings Table Header */}
        <View style={styles.standingsHeader}>
          <Text style={[styles.standingsHeaderText, { color: theme.colors.text, flex: 0.6 }]}></Text>
          <Text style={[styles.standingsHeaderText, { color: theme.colors.text, textAlign: 'center', flex: 0.8 }]}>Team</Text>
          <Text style={[styles.standingsHeaderText, { color: theme.colors.text, textAlign: 'center', flex: 0.6 }]}>MP</Text>
          <Text style={[styles.standingsHeaderText, { color: theme.colors.text, textAlign: 'center', flex: 0.8 }]}>W/D/L</Text>
          <Text style={[styles.standingsHeaderText, { color: theme.colors.text, textAlign: 'center', flex: 0.8 }]}>GF/GA</Text>
          <Text style={[styles.standingsHeaderText, { color: theme.colors.text, textAlign: 'center', flex: 0.6 }]}>PTS</Text>
          <Text style={[styles.standingsHeaderText, { color: theme.colors.text, textAlign: 'center', flex: 0.6 }]}>Rank</Text>
        </View>

        {/* Standings List */}
        {standings.slice(0, 12).map((team, index) => (
          <View 
            key={team.team}
            style={[
              styles.standingRow,
              team.isCurrentTeam && styles.currentTeamRow,
              { borderBottomColor: theme.colors.border }
            ]}
          >
            <View style={styles.positionContainer}>
              {team.isCurrentTeam && <View style={styles.promotionZone} />}
              <Text style={[
                styles.positionText, 
                { color: team.isCurrentTeam ? '#FFFFFF' : theme.colors.text }
              ]}>
                {team.position}
              </Text>
            </View>
            
            <View style={styles.teamContainer}>
              <Image source={{ uri: team.logo }} style={styles.teamLogoSmall} />
              <Text style={[
                styles.teamNameSmall, 
                { color: team.isCurrentTeam ? '#FFFFFF' : theme.colors.text }
              ]} numberOfLines={1}>
                {team.team}
              </Text>
            </View>
            
            <Text style={[
              styles.statText, 
              { color: team.isCurrentTeam ? '#FFFFFF' : theme.colors.text }
            ]}>
              {team.played}
            </Text>
            
            <Text style={[
              styles.statText, 
              { color: team.isCurrentTeam ? '#FFFFFF' : theme.colors.text }
            ]}>
              {team.won}/{team.drawn}/{team.lost}
            </Text>
            
            <Text style={[
              styles.statText, 
              { color: team.isCurrentTeam ? '#FFFFFF' : theme.colors.text }
            ]}>
              {team.goalsFor}/{team.goalsAgainst}
            </Text>
            
            <Text style={[
              styles.pointsText, 
              { color: team.isCurrentTeam ? '#FFFFFF' : theme.colors.text }
            ]}>
              {team.points}
            </Text>
            
            <Text style={[
              styles.statText, 
              { color: team.isCurrentTeam ? '#FFFFFF' : theme.colors.text }
            ]}>
              {index + 1}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderMatchesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Match Schedule</Text>
        
        {/* Match Filters */}
        <View style={styles.matchFilters}>
          {['all', 'home', 'away'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                matchFilter === filter && styles.activeFilter
              ]}
              onPress={() => setMatchFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                { color: matchFilter === filter ? '#FFFFFF' : theme.colors.text }
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Matches List */}
        {matches
          .filter(match => {
            if (matchFilter === 'home') return match.isHome;
            if (matchFilter === 'away') return !match.isHome;
            return true;
          })
          .map((match) => (
                          <View key={match.id} style={[styles.matchItem, { borderBottomColor: theme.colors.border }]}>
               <View style={styles.matchHeader}>
                 <View style={styles.matchDate}>
                   <Text style={[styles.matchDateText, { color: theme.colors.textSecondary }]}>
                     {new Date(match.date).toLocaleDateString('en-US', { 
                       month: 'short', 
                       day: 'numeric',
                       weekday: 'short'
                     })}
                   </Text>
                   <Text style={[styles.matchTimeText, { color: theme.colors.textSecondary }]}>
                     {new Date(match.date).toLocaleTimeString('en-US', { 
                       hour: '2-digit', 
                       minute: '2-digit',
                       hour12: false
                     })}
                   </Text>
                 </View>
                 
                 <View style={styles.competitionBadge}>
                   <Text style={[styles.competitionBadgeText, { color: theme.colors.textSecondary }]}>
                     {match.competition}
                   </Text>
                 </View>
               </View>
 
               <View style={styles.matchTeams}>
                 <View style={styles.matchTeam}>
                   <View style={styles.teamInfo}>
                     <Image 
                       source={{ 
                         uri: match.isHome ? teamInfo?.logo : match.opponentLogo 
                       }} 
                       style={styles.teamLogoTiny} 
                     />
                     <Text style={[styles.teamText, { color: theme.colors.text }]} numberOfLines={1}>
                       {match.isHome ? teamName : match.opponent}
                     </Text>
                   </View>
                   {match.isHome && <Text style={[styles.venueText, { color: theme.colors.textSecondary }]}>HOME</Text>}
                 </View>
                 
                 <View style={styles.matchScore}>
                   {match.result && (
                     <View style={[
                       styles.resultBadge,
                       { backgroundColor: 
                         match.result === 'W' ? '#4CAF50' : 
                         match.result === 'D' ? '#FF9800' : '#F44336'
                       }
                     ]}>
                       <Text style={styles.resultText}>{match.result}</Text>
                     </View>
                   )}
                   <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                     {match.score}
                   </Text>
                   {match.status === 'upcoming' && (
                     <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                       Scheduled
                     </Text>
                   )}
                 </View>
                 
                 <View style={styles.matchTeam}>
                   <View style={styles.teamInfo}>
                     <Image 
                       source={{ 
                         uri: !match.isHome ? teamInfo?.logo : match.opponentLogo 
                       }} 
                       style={styles.teamLogoTiny} 
                     />
                     <Text style={[styles.teamText, { color: theme.colors.text }]} numberOfLines={1}>
                       {!match.isHome ? teamName : match.opponent}
                     </Text>
                   </View>
                   {!match.isHome && <Text style={[styles.venueText, { color: theme.colors.textSecondary }]}>AWAY</Text>}
                 </View>
               </View>
             </View>
          ))}
      </View>
    </ScrollView>
  );

  const renderSquadTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Squad</Text>
        
        {/* Position Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.positionFilters}>
          {['All', 'Goalkeepers', 'Defenders', 'Midfield', 'Forwards'].map((position) => (
            <TouchableOpacity
              key={position}
              style={[
                styles.positionButton,
                position === 'All' && styles.activePosition
              ]}
              onPress={() => {}}
            >
              <Text style={[
                styles.playerPositionText,
                { color: position === 'All' ? '#FFFFFF' : theme.colors.text }
              ]}>
                {position}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Players List */}
        {players.slice(0, 15).map((player, index) => (
          <View key={player.id} style={[styles.playerItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.playerNumber}>
              <Text style={[styles.playerNumberText, { color: theme.colors.text }]}>
                {index + 1}
              </Text>
            </View>
            
            <View style={styles.playerAvatar}>
              <Text style={styles.playerInitials}>
                {player.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: theme.colors.text }]}>
                {player.name}
              </Text>
              <Text style={[styles.playerDetails, { color: theme.colors.textSecondary }]}>
                {player.age} years • {player.nationality}
              </Text>
            </View>
            
            <View style={styles.playerStats}>
              <Text style={[styles.playerStatValue, { color: theme.colors.text }]}>
                {player.goals}
              </Text>
              <Text style={[styles.playerStatLabel, { color: theme.colors.textSecondary }]}>
                Goals
              </Text>
            </View>
            
            <View style={styles.playerStats}>
              <Text style={[styles.playerStatValue, { color: theme.colors.text }]}>
                {player.assists}
              </Text>
              <Text style={[styles.playerStatLabel, { color: theme.colors.textSecondary }]}>
                Assists
              </Text>
            </View>
            
            <View style={styles.playerValue}>
              <Text style={[styles.playerValueText, { color: theme.colors.text }]}>
                {player.marketValue}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderTransfersTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Transfers</Text>
        
                 {/* Transfer Filters */}
         <View style={styles.transferFilters}>
           {['all', 'in', 'out'].map((filter) => (
             <TouchableOpacity
               key={filter}
               style={[
                 styles.transferFilterButton,
                 transferFilter === filter && styles.activeTransferFilter
               ]}
               onPress={() => setTransferFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                { color: transferFilter === filter ? '#FFFFFF' : theme.colors.text }
              ]}>
                {filter === 'in' ? 'Incoming' : filter === 'out' ? 'Outgoing' : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transfers List */}
        {transfers
          .filter(transfer => {
            if (transferFilter === 'in') return transfer.type === 'in';
            if (transferFilter === 'out') return transfer.type === 'out';
            return true;
          })
          .map((transfer) => (
            <View key={transfer.id} style={[styles.transferItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.transferIcon}>
                <ArrowUpDown 
                  size={16} 
                  color={transfer.type === 'in' ? '#4CAF50' : '#F44336'} 
                />
              </View>
              
              <View style={styles.transferInfo}>
                <Text style={[styles.transferPlayerName, { color: theme.colors.text }]}>
                  {transfer.playerName}
                </Text>
                <Text style={[styles.transferDetails, { color: theme.colors.textSecondary }]}>
                  {transfer.type === 'in' ? `From ${transfer.fromTeam}` : `To ${transfer.toTeam}`}
                </Text>
                <Text style={[styles.transferDate, { color: theme.colors.textSecondary }]}>
                  {transfer.date}
                </Text>
              </View>
              
              <View style={styles.transferFee}>
                <Text style={[styles.transferFeeText, { color: theme.colors.text }]}>
                  {transfer.fee}
                </Text>
                <View style={[
                  styles.transferStatus,
                  { backgroundColor: transfer.status === 'completed' ? '#4CAF50' : '#FF9800' }
                ]}>
                  <Text style={styles.transferStatusText}>
                    {transfer.status === 'completed' ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );

  const renderStatsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Team Statistics</Text>
        
        {/* Season Selector */}
        <View style={styles.seasonSelector}>
          <TouchableOpacity
            style={[styles.seasonButton, selectedSeason === '2025' && styles.activeSeason]}
            onPress={() => setSelectedSeason('2025')}
          >
            <Text style={[styles.seasonText, { color: selectedSeason === '2025' ? '#FFFFFF' : theme.colors.text }]}>
              2025
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.seasonButton, selectedSeason === '2024' && styles.activeSeason]}
            onPress={() => setSelectedSeason('2024')}
          >
            <Text style={[styles.seasonText, { color: selectedSeason === '2024' ? '#FFFFFF' : theme.colors.text }]}>
              2024
            </Text>
          </TouchableOpacity>
        </View>

                 {/* Statistics Grid */}
         <View style={styles.statsGrid}>
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: theme.colors.text }]}>14</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Matches Played</Text>
           </View>
           
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: '#4CAF50' }]}>11</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Wins</Text>
           </View>
           
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: '#FF9800' }]}>2</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Draws</Text>
           </View>
           
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: '#F44336' }]}>1</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Losses</Text>
           </View>
           
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: theme.colors.text }]}>33</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Goals For</Text>
           </View>
           
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: theme.colors.text }]}>12</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Goals Against</Text>
           </View>
           
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: '#4CAF50' }]}>+21</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Goal Difference</Text>
           </View>
           
           <View style={styles.statItem}>
             <Text style={[styles.statNumber, { color: theme.colors.text }]}>35</Text>
             <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Points</Text>
           </View>
         </View>

         {/* Detailed Performance Stats */}
         <View style={styles.detailedStatsSection}>
           <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>Detailed Statistics</Text>
           
           <View style={styles.detailedStatsGrid}>
             <View style={styles.detailedStatRow}>
               <Text style={[styles.detailedStatLabel, { color: theme.colors.textSecondary }]}>Shots per Game</Text>
               <Text style={[styles.detailedStatValue, { color: theme.colors.text }]}>15.2</Text>
             </View>
             
             <View style={styles.detailedStatRow}>
               <Text style={[styles.detailedStatLabel, { color: theme.colors.textSecondary }]}>Shots on Target</Text>
               <Text style={[styles.detailedStatValue, { color: theme.colors.text }]}>6.8</Text>
             </View>
             
             <View style={styles.detailedStatRow}>
               <Text style={[styles.detailedStatLabel, { color: theme.colors.textSecondary }]}>Pass Accuracy</Text>
               <Text style={[styles.detailedStatValue, { color: '#4CAF50' }]}>85.3%</Text>
             </View>
             
             <View style={styles.detailedStatRow}>
               <Text style={[styles.detailedStatLabel, { color: theme.colors.textSecondary }]}>Corner Kicks</Text>
               <Text style={[styles.detailedStatValue, { color: theme.colors.text }]}>7.1</Text>
             </View>
             
             <View style={styles.detailedStatRow}>
               <Text style={[styles.detailedStatLabel, { color: theme.colors.textSecondary }]}>Yellow Cards</Text>
               <Text style={[styles.detailedStatValue, { color: '#FF9800' }]}>2.3</Text>
             </View>
             
             <View style={styles.detailedStatRow}>
               <Text style={[styles.detailedStatLabel, { color: theme.colors.textSecondary }]}>Red Cards</Text>
               <Text style={[styles.detailedStatValue, { color: '#F44336' }]}>0.1</Text>
             </View>
           </View>
         </View>

        {/* Performance Metrics */}
        <View style={styles.performanceSection}>
          <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>Performance</Text>
          
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceLabel, { color: theme.colors.textSecondary }]}>Win Rate</Text>
            <Text style={[styles.performanceValue, { color: '#4CAF50' }]}>78.6%</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceLabel, { color: theme.colors.textSecondary }]}>Goals per Game</Text>
            <Text style={[styles.performanceValue, { color: theme.colors.text }]}>2.36</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceLabel, { color: theme.colors.textSecondary }]}>Clean Sheets</Text>
            <Text style={[styles.performanceValue, { color: theme.colors.text }]}>6</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceLabel, { color: theme.colors.textSecondary }]}>Average Possession</Text>
            <Text style={[styles.performanceValue, { color: theme.colors.text }]}>64%</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderBestPlayersTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.infoSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Performers</Text>
        
        {/* Season Selector */}
        <View style={styles.seasonSelector}>
          <TouchableOpacity
            style={[styles.seasonButton, selectedSeason === '2025' && styles.activeSeason]}
            onPress={() => setSelectedSeason('2025')}
          >
            <Text style={[styles.seasonText, { color: selectedSeason === '2025' ? '#FFFFFF' : theme.colors.text }]}>
              2025
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.seasonButton, selectedSeason === '2024' && styles.activeSeason]}
            onPress={() => setSelectedSeason('2024')}
          >
            <Text style={[styles.seasonText, { color: selectedSeason === '2024' ? '#FFFFFF' : theme.colors.text }]}>
              2024
            </Text>
          </TouchableOpacity>
        </View>

        {/* Top Scorers */}
        <View style={styles.topPlayersSection}>
          <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>Top Scorers</Text>
          {players
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 5)
            .map((player, index) => (
              <View key={player.id} style={[styles.topPlayerItem, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.playerRank}>
                  <Text style={[styles.rankNumber, { color: theme.colors.text }]}>
                    {index + 1}
                  </Text>
                </View>
                
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerInitials}>
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                
                <View style={styles.topPlayerInfo}>
                  <Text style={[styles.topPlayerName, { color: theme.colors.text }]}>
                    {player.name}
                  </Text>
                  <Text style={[styles.topPlayerPosition, { color: theme.colors.textSecondary }]}>
                    {player.position}
                  </Text>
                </View>
                
                <View style={styles.topPlayerStat}>
                  <Text style={[styles.topPlayerStatValue, { color: theme.colors.text }]}>
                    {player.goals}
                  </Text>
                </View>
              </View>
            ))}
        </View>

        {/* Top Assists */}
        <View style={styles.topPlayersSection}>
          <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>Top Assists</Text>
          {players
            .sort((a, b) => b.assists - a.assists)
            .slice(0, 5)
            .map((player, index) => (
              <View key={player.id} style={[styles.topPlayerItem, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.playerRank}>
                  <Text style={[styles.rankNumber, { color: theme.colors.text }]}>
                    {index + 1}
                  </Text>
                </View>
                
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerInitials}>
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                
                <View style={styles.topPlayerInfo}>
                  <Text style={[styles.topPlayerName, { color: theme.colors.text }]}>
                    {player.name}
                  </Text>
                  <Text style={[styles.topPlayerPosition, { color: theme.colors.textSecondary }]}>
                    {player.position}
                  </Text>
                </View>
                
                <View style={styles.topPlayerStat}>
                  <Text style={[styles.topPlayerStatValue, { color: theme.colors.text }]}>
                    {player.assists}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading team details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}
      {renderTabs()}
      {activeTab === 'info' && renderInfoTab()}
      {activeTab === 'standings' && renderStandingsTab()}
      {activeTab === 'matches' && renderMatchesTab()}
      {activeTab === 'squad' && renderSquadTab()}
      {activeTab === 'transfers' && renderTransfersTab()}
      {activeTab === 'stats' && renderStatsTab()}
      {activeTab === 'best' && renderBestPlayersTab()}
    </SafeAreaView>
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
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  teamLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamLeague: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  headerActions: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'right',
  },
  coachHistory: {
    gap: 12,
  },
  coachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coachImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  coachPeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  seasonSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  seasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeSeason: {
    backgroundColor: '#007AFF',
  },
  seasonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  standingsHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  standingsHeaderText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  standingRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  currentTeamRow: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  positionContainer: {
    flex: 0.6,
    alignItems: 'center',
    position: 'relative',
  },
  promotionZone: {
    position: 'absolute',
    left: -4,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 1.5,
  },
  positionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  teamContainer: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamLogoSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  teamNameSmall: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    flex: 0.6,
  },
  pointsText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    flex: 0.6,
  },
  matchFilters: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  matchItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  matchDate: {
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDateText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  matchTimeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  matchTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  teamText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  teamLogoTiny: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  matchScore: {
    alignItems: 'center',
    minWidth: 80,
  },
  resultBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  scoreText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  competitionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  // Squad Tab Styles
  positionFilters: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  positionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activePosition: {
    backgroundColor: '#007AFF',
  },
  playerPositionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  playerNumber: {
    width: 30,
    alignItems: 'center',
  },
  playerNumberText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  playerDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  playerStats: {
    alignItems: 'center',
    minWidth: 50,
  },
  playerStatValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  playerStatLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  playerValue: {
    alignItems: 'center',
    minWidth: 60,
  },
  playerValueText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  // Transfer Tab Styles
  transferFilters: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  transferFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTransferFilter: {
    backgroundColor: '#007AFF',
  },
  transferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  transferIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferInfo: {
    flex: 1,
  },
  transferPlayerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  transferDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  transferDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  transferFee: {
    alignItems: 'flex-end',
  },
  transferFeeText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  transferStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  transferStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  // Statistics Tab Styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  performanceSection: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  performanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  performanceValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  // Best Players Tab Styles
  topPlayersSection: {
    marginBottom: 24,
  },
  topPlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  playerRank: {
    width: 30,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  topPlayerInfo: {
    flex: 1,
  },
  topPlayerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  topPlayerPosition: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  topPlayerStat: {
    alignItems: 'center',
    minWidth: 40,
  },
  topPlayerStatValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  // Form and Next Match Styles
  formContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  formResult: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formResultText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  nextMatchContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  nextMatchLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  nextMatchText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  nextMatchDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  countryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Enhanced Match Styles
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  competitionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  competitionBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  venueText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  // Detailed Statistics Styles
  detailedStatsSection: {
    marginTop: 24,
  },
  detailedStatsGrid: {
    gap: 12,
  },
  detailedStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailedStatLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  detailedStatValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
}); 