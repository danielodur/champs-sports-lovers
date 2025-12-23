import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  PanGestureHandler,
  Animated,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, RotateCcw, Save, Share, Download, Plus, Minus, Move, CreditCard as Edit3, Trash2, Settings, Users, Target, Zap, Play, Pause, Square } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

interface Player {
  id: string;
  x: number;
  y: number;
  team: 'home' | 'away';
  position: string;
  number: number;
}

interface Formation {
  id: string;
  name: string;
  homeFormation: string;
  awayFormation: string;
  players: Player[];
}

export default function TacticsBoardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [selectedTool, setSelectedTool] = useState('move');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFormation, setCurrentFormation] = useState('4-4-2');
  const { t } = useTranslation();

  const formations: Formation[] = [
    {
      id: '442',
      name: '4-4-2',
      homeFormation: '4-4-2',
      awayFormation: '4-3-3',
      players: [
        // Home team (blue)
        { id: 'h1', x: 50, y: 90, team: 'home', position: 'GK', number: 1 },
        { id: 'h2', x: 20, y: 70, team: 'home', position: 'LB', number: 3 },
        { id: 'h3', x: 40, y: 75, team: 'home', position: 'CB', number: 4 },
        { id: 'h4', x: 60, y: 75, team: 'home', position: 'CB', number: 5 },
        { id: 'h5', x: 80, y: 70, team: 'home', position: 'RB', number: 2 },
        { id: 'h6', x: 25, y: 50, team: 'home', position: 'LM', number: 11 },
        { id: 'h7', x: 40, y: 55, team: 'home', position: 'CM', number: 6 },
        { id: 'h8', x: 60, y: 55, team: 'home', position: 'CM', number: 8 },
        { id: 'h9', x: 75, y: 50, team: 'home', position: 'RM', number: 7 },
        { id: 'h10', x: 40, y: 30, team: 'home', position: 'ST', number: 9 },
        { id: 'h11', x: 60, y: 30, team: 'home', position: 'ST', number: 10 },
        
        // Away team (red)
        { id: 'a1', x: 50, y: 10, team: 'away', position: 'GK', number: 1 },
        { id: 'a2', x: 20, y: 30, team: 'away', position: 'LB', number: 3 },
        { id: 'a3', x: 40, y: 25, team: 'away', position: 'CB', number: 4 },
        { id: 'a4', x: 60, y: 25, team: 'away', position: 'CB', number: 5 },
        { id: 'a5', x: 80, y: 30, team: 'away', position: 'RB', number: 2 },
        { id: 'a6', x: 35, y: 45, team: 'away', position: 'CM', number: 6 },
        { id: 'a7', x: 50, y: 50, team: 'away', position: 'CM', number: 8 },
        { id: 'a8', x: 65, y: 45, team: 'away', position: 'CM', number: 10 },
        { id: 'a9', x: 25, y: 65, team: 'away', position: 'LW', number: 11 },
        { id: 'a10', x: 50, y: 70, team: 'away', position: 'ST', number: 9 },
        { id: 'a11', x: 75, y: 65, team: 'away', position: 'RW', number: 7 },
      ]
    }
  ];

  const [players, setPlayers] = useState<Player[]>(formations[0].players);

  const tools = [
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'add', icon: Plus, label: 'Add Player' },
    { id: 'delete', icon: Trash2, label: 'Delete' },
    { id: 'draw', icon: Edit3, label: 'Draw' },
  ];

  const formationOptions = [
    '4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2', '3-4-3'
  ];

  const handlePlayerPress = (playerId: string) => {
    if (selectedTool === 'delete') {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    } else {
      setSelectedPlayer(playerId);
    }
  };

  const handleFieldPress = (x: number, y: number) => {
    if (selectedTool === 'add') {
      const newPlayer: Player = {
        id: `new_${Date.now()}`,
        x: (x / screenWidth) * 100,
        y: (y / 400) * 100,
        team: 'home',
        position: 'SUB',
        number: players.length + 1
      };
      setPlayers(prev => [...prev, newPlayer]);
    }
  };

  const resetFormation = () => {
    setPlayers(formations[0].players);
    setSelectedPlayer(null);
  };

  const saveFormation = () => {
    Alert.alert('Formation Saved', 'Your tactical setup has been saved successfully.');
  };

  const shareFormation = () => {
    Alert.alert('Share Formation', 'Formation shared successfully!');
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('tacticsBoard.headerTitle')}</Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderToolbar = () => (
    <View style={[styles.toolbar, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.toolsContainer}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.toolButton,
                {
                  backgroundColor: selectedTool === tool.id ? theme.colors.primary : 'transparent',
                }
              ]}
              onPress={() => setSelectedTool(tool.id)}
              activeOpacity={0.7}
            >
              <tool.icon 
                size={20} 
                color={selectedTool === tool.id ? '#FFFFFF' : theme.colors.text} 
              />
              <Text
                style={[
                  styles.toolLabel,
                  {
                    color: selectedTool === tool.id ? '#FFFFFF' : theme.colors.text,
                  }
                ]}
              >
                {tool.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderFormationSelector = () => (
    <View style={[styles.formationSelector, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.formationTitle, { color: theme.colors.text }]}>{t('tacticsBoard.formationTitle')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.formationOptions}>
          {formationOptions.map((formation) => (
            <TouchableOpacity
              key={formation}
              style={[
                styles.formationButton,
                {
                  backgroundColor: currentFormation === formation ? theme.colors.primary : theme.colors.background,
                }
              ]}
              onPress={() => setCurrentFormation(formation)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.formationText,
                  {
                    color: currentFormation === formation ? '#FFFFFF' : theme.colors.text,
                  }
                ]}
              >
                {formation}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderField = () => (
    <View style={styles.fieldContainer}>
      <TouchableOpacity
        style={[styles.field, { backgroundColor: '#2E7D32' }]}
        onPress={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          handleFieldPress(locationX, locationY);
        }}
        activeOpacity={1}
      >
        {/* Field markings */}
        <View style={styles.fieldMarkings}>
          {/* Center circle */}
          <View style={styles.centerCircle} />
          <View style={styles.centerLine} />
          
          {/* Penalty areas */}
          <View style={styles.topPenaltyArea} />
          <View style={styles.bottomPenaltyArea} />
          
          {/* Goal areas */}
          <View style={styles.topGoalArea} />
          <View style={styles.bottomGoalArea} />
        </View>
        
        {/* Players */}
        {players.map((player) => (
          <TouchableOpacity
            key={player.id}
            style={[
              styles.player,
              {
                left: `${player.x}%`,
                top: `${player.y}%`,
                backgroundColor: player.team === 'home' ? '#1976D2' : '#D32F2F',
                borderColor: selectedPlayer === player.id ? '#FFD700' : 'transparent',
              }
            ]}
            onPress={() => handlePlayerPress(player.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.playerNumber}>{player.number}</Text>
          </TouchableOpacity>
        ))}
      </TouchableOpacity>
    </View>
  );

  const renderControls = () => (
    <View style={[styles.controls, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.background }]}
          onPress={resetFormation}
          activeOpacity={0.7}
        >
          <RotateCcw size={20} color={theme.colors.text} />
          <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>{t('tacticsBoard.resetButton')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.background }]}
          onPress={saveFormation}
          activeOpacity={0.7}
        >
          <Save size={20} color={theme.colors.text} />
          <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>{t('tacticsBoard.saveButton')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.background }]}
          onPress={shareFormation}
          activeOpacity={0.7}
        >
          <Share size={20} color={theme.colors.text} />
          <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>{t('tacticsBoard.shareButton')}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.playbackControls}>
        <TouchableOpacity
          style={[styles.playbackButton, { backgroundColor: theme.colors.primary }]}
          onPress={togglePlayback}
          activeOpacity={0.8}
        >
          {isPlaying ? (
            <Pause size={24} color="#FFFFFF" />
          ) : (
            <Play size={24} color="#FFFFFF" />
          )}
          <Text style={styles.playbackButtonText}>
            {isPlaying ? 'Pause' : 'Play'} Animation
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderToolbar()}
        {renderFormationSelector()}
        {renderField()}
        {renderControls()}
      </ScrollView>
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
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  toolbar: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  toolsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  toolLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  formationSelector: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  formationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  formationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  formationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  formationText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  fieldContainer: {
    padding: 16,
  },
  field: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  fieldMarkings: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFFFFF',
  },
  topPenaltyArea: {
    position: 'absolute',
    top: 0,
    left: '25%',
    width: '50%',
    height: 60,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#FFFFFF',
  },
  bottomPenaltyArea: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    width: '50%',
    height: 60,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#FFFFFF',
  },
  topGoalArea: {
    position: 'absolute',
    top: 0,
    left: '37.5%',
    width: '25%',
    height: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#FFFFFF',
  },
  bottomGoalArea: {
    position: 'absolute',
    bottom: 0,
    left: '37.5%',
    width: '25%',
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#FFFFFF',
  },
  player: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  playerNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  controls: {
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
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  controlButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  playbackControls: {
    alignItems: 'center',
  },
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  playbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});