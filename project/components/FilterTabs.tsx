import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { Goal, BarChart3, TrendingUp, Clock, Trophy, X, Target, Zap, Shield, Award, Activity, Timer, Sliders, Calculator, CornerDownRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

interface FilterTabsProps {
  active: string;
  onSelect: (filter: string) => void;
  currentSport: string;
  onSortChange?: (sortMode: string) => void;
  onDisplayModeChange?: (displayMode: string) => void;
  favoritesCount?: number;
  currentSortMode?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Custom Score Icon Component
const ScoreIcon = ({ color }: { color: string }) => (
  <Text style={[styles.scoreIconText, { color }]}>|2:1|</Text>
);

// Custom Modal Score Icon Component  
const ModalScoreIcon = ({ color }: { color: string }) => (
  <View style={[styles.scoreIcon, { borderColor: color }]}>
    <Text style={[styles.scoreText, { color }]}>2-1</Text>
  </View>
);

export default function FilterTabs({ 
  active, 
  onSelect, 
  currentSport, 
  onSortChange, 
  onDisplayModeChange, 
  favoritesCount,
  currentSortMode = 'time'
}: FilterTabsProps) {
  const theme = useTheme();
  const [showMatchModeModal, setShowMatchModeModal] = useState(false);
  const [selectedMatchMode, setSelectedMatchMode] = useState('score');
  const [selectedSortMode, setSelectedSortMode] = useState(currentSortMode);
  const { t } = useTranslation();
  
  // Update internal state when external sort mode changes
  useEffect(() => {
    setSelectedSortMode(currentSortMode);
  }, [currentSortMode]);

  // Ensure translation function is working
  const safeT = (key: string) => {
    try {
      return (t && typeof t === 'function') ? String(t(key) || key) : String(key);
    } catch (error) {
      console.warn('Translation error for key:', key);
      return String(key);
    }
  };
  
  const tabs = [
    { id: 'all', label: safeT('All') },
    { id: 'live', label: safeT('Live') },
    { id: 'fixture', label: safeT('Fixture') },
    { id: 'finished', label: safeT('Finished') },
    { id: 'follows', label: safeT('Follows') },
  ];

  // ✅ TOP SCREEN NAVIGATION: Zero-jump transitions from Top screen
  const handleTabPress = (tabId: string) => {
    console.log('⚡ TOP NAVIGATION TAB PRESS:', tabId);
    
    // ✨ TOP SCREEN OPTIMIZATION: Enhanced handling for smooth transitions
    if (currentSport === 'football') {
      console.log('🎯 TOP → FOOTBALL: Zero-jump transition optimization');
    }
    
    // ✅ INSTANT TAB SELECTION: Immediate UI response for professional navigation
    onSelect(tabId);
  };

  // Sport-specific match modes
  const getMatchModes = (sport: string) => {
    switch (sport) {
      case 'football':
        return [
          { id: 'score', label: 'Score', icon: ModalScoreIcon },
          { id: 'score-index', label: 'Score & Odds', icon: BarChart3 },
          { id: 'corner-index', label: 'Corners & Odds', icon: CornerDownRight },
        ];
      case 'basketball':
        return [
          { id: 'score', label: 'Score', icon: ModalScoreIcon },
          { id: 'score-index', label: 'Score & Odds', icon: BarChart3 },
          { id: 'points-rebounds', label: 'Points & Rebounds', icon: Activity },
        ];
      case 'rugby':
        return [
          { id: 'score', label: 'Score', icon: ModalScoreIcon },
          { id: 'score-index', label: 'Score & Odds', icon: BarChart3 },
          { id: 'tries-conversions', label: 'Tries & Conversions', icon: Award },
        ];
      case 'boxing':
        return [
          { id: 'rounds', label: 'Rounds', icon: Timer },
          { id: 'rounds-index', label: 'Rounds & Odds', icon: BarChart3 },
          { id: 'knockouts', label: 'Knockouts & KO', icon: Zap },
        ];
      default:
        return [
          { id: 'score', label: 'Score', icon: ModalScoreIcon },
          { id: 'score-index', label: 'Score & Odds', icon: BarChart3 },
          { id: 'general-stats', label: 'General Stats', icon: TrendingUp },
        ];
    }
  };

  // Sport-specific sorting modes
  const getSortModes = (sport: string) => {
    switch (sport) {
      case 'football':
        return [
          { id: 'time', label: 'By Time', icon: Clock },
          { id: 'league', label: 'By League', icon: Trophy },
        ];
      case 'basketball':
        return [
          { id: 'time', label: 'By Time', icon: Clock },
          { id: 'conference', label: 'By Conference', icon: Trophy },
        ];
      case 'rugby':
        return [
          { id: 'time', label: 'By Time', icon: Clock },
          { id: 'tournament', label: 'By Tournament', icon: Trophy },
        ];
      case 'boxing':
        return [
          { id: 'time', label: 'By Time', icon: Clock },
          { id: 'weight-class', label: 'By Weight Class', icon: Award },
        ];
      default:
        return [
          { id: 'time', label: 'By Time', icon: Clock },
          { id: 'league', label: 'By League', icon: Trophy },
        ];
    }
  };

  const matchModes = getMatchModes(currentSport);
  const sortModes = getSortModes(currentSport);

  // Get sport-specific modal title
  const getModalTitle = (sport: string) => {
    switch (sport) {
      case 'football':
        return 'Football Match Settings';
      case 'basketball':
        return 'Basketball Game Settings';
      case 'rugby':
        return 'Rugby Match Settings';
      case 'boxing':
        return 'Boxing Match Settings';
      default:
        return 'Match Display Settings';
    }
  };

  const handleConfirm = () => {
    // Apply the selected settings
    setShowMatchModeModal(false);
    
    // ✅ INSTANT RESPONSE - Apply changes immediately
    console.log('⚡ INSTANT SETTINGS APPLY:', selectedMatchMode, selectedSortMode);
    
    // Notify parent components about the changes with immediate callbacks
    if (onSortChange) {
      onSortChange(selectedSortMode);
    }
    if (onDisplayModeChange) {
      onDisplayModeChange(selectedMatchMode);
    }
    
    console.log('✅ Applied settings for', currentSport, ': Mode:', selectedMatchMode, ', Sort:', selectedSortMode);
  };

  const handleCancel = () => {
    setShowMatchModeModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        scrollEventThrottle={1}
        removeClippedSubviews={false}
        disableIntervalMomentum={true}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              active === tab.id && styles.activeTab
            ]}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.6}
          >
            <View style={styles.tabContent}>
              <Text 
                style={[
                  styles.tabText,
                  {
                    color: active === tab.id ? (theme.colors.background === '#FFFFFF' ? '#666666' : '#888888') : theme.colors.textSecondary,
                    fontFamily: active === tab.id ? 'Inter-SemiBold' : 'Inter-Regular'
                  }
                ]}
              >
                {tab.label}
                {tab.id === 'follows' && (
                  <Text style={[styles.badgeText, { 
                    color: (favoritesCount ?? 0) > 0 ? '#FF4444' : theme.colors.primary,
                    fontFamily: 'Inter-Bold'
                  }]}>
                    {' '}({favoritesCount || 0})
                  </Text>
                )}
              </Text>
              {active === tab.id && (
                <View style={[styles.indicator, { backgroundColor: theme.colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          style={[styles.settingsButton, { 
            backgroundColor: theme.colors.backgroundSecondary,
            borderWidth: 1,
            borderColor: theme.colors.border 
          }]}
          onPress={() => setShowMatchModeModal(true)}
          activeOpacity={0.7}
        >
          <ScoreIcon color={theme.colors.background === '#FFFFFF' ? '#000000' : '#FFFFFF'} />
        </TouchableOpacity>
      </ScrollView>

      {/* Match Mode Modal */}
      <Modal
        visible={showMatchModeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            {/* Header - Hidden for Rugby */}
            {currentSport !== 'rugby' && (
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {getModalTitle(currentSport)}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleCancel}
                >
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Close button for Rugby (since header is hidden) */}
            {currentSport === 'rugby' && (
              <View style={styles.rugbyCloseButtonContainer}>
                <TouchableOpacity 
                  style={styles.rugbyCloseButton}
                  onPress={handleCancel}
                >
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Content */}
            <ScrollView style={styles.modalContent}>
              {/* Match Mode Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {currentSport === 'boxing' ? 'Fight Mode' : 'Match Mode'}
                </Text>
                <View style={styles.optionsGrid}>
                  {matchModes.map((mode) => {
                    const IconComponent = mode.icon;
                    const isSelected = selectedMatchMode === mode.id;
                    return (
                      <TouchableOpacity
                        key={mode.id}
                        style={[
                          styles.optionCard,
                          { 
                            backgroundColor: isSelected ? theme.colors.primary : theme.colors.backgroundSecondary,
                            borderColor: isSelected ? theme.colors.primary : theme.colors.border
                          }
                        ]}
                        onPress={() => setSelectedMatchMode(mode.id)}
                      >
                        {IconComponent === ModalScoreIcon ? (
                          <IconComponent 
                            color={isSelected ? '#FFFFFF' : theme.colors.textSecondary} 
                          />
                        ) : (
                          <IconComponent 
                            size={24} 
                            color={isSelected ? '#FFFFFF' : theme.colors.textSecondary} 
                          />
                        )}
                        <Text style={[
                          styles.optionText,
                          { color: isSelected ? '#FFFFFF' : theme.colors.text }
                        ]}>
                          {mode.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Match Sorting Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {currentSport === 'boxing' ? 'Fight Sorting' : 'Match Sorting'}
                </Text>
                <View style={styles.sortingOptions}>
                  {sortModes.map((mode) => {
                    const IconComponent = mode.icon;
                    const isSelected = selectedSortMode === mode.id;
                    return (
                      <TouchableOpacity
                        key={mode.id}
                        style={[
                          styles.sortingCard,
                          { 
                            backgroundColor: isSelected ? theme.colors.primary : theme.colors.backgroundSecondary,
                            borderColor: isSelected ? theme.colors.primary : theme.colors.border
                          }
                        ]}
                        onPress={() => setSelectedSortMode(mode.id)}
                      >
                        <IconComponent 
                          size={20} 
                          color={isSelected ? '#FFFFFF' : theme.colors.textSecondary} 
                        />
                        <Text style={[
                          styles.sortingText,
                          { color: isSelected ? '#FFFFFF' : theme.colors.text }
                        ]}>
                          {mode.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.footerButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.footerButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  tab: {
    height: '100%',
    paddingHorizontal: 6,
    marginRight: 1,
    justifyContent: 'center',
    flex: 1,
  },
  tabContent: {
    position: 'relative',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: [{ translateX: -12 }],
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
  },
  settingsButton: {
    height: 24,
    width: 28,
    borderRadius: 4,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  scoreIconText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
  },
  scoreIcon: {
    borderWidth: 1,
    borderRadius: 3,
    padding: 2,
  },
  scoreText: {
    fontSize: 8, // Reduced font size
    fontFamily: 'Inter-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  sortingOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  sortingCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sortingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  rugbyCloseButtonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  rugbyCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  activeTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});