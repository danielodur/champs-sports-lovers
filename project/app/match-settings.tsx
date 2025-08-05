import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Dimensions, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Volume2, VolumeX, RotateCcw, Smartphone, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';
import { testSound, getAvailableSounds } from '@/utils/SoundManager';

const { width } = Dimensions.get('window');

export default function MatchSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { settings, updateSetting, showGoalNotification } = useMatchSettings();

  // Tab states
  const [activeTab, setActiveTab] = useState('football');
  const tabs = [
    { id: 'football', label: 'Football' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'rugby', label: 'Rugby' },
    { id: 'boxing', label: 'Boxing' },
  ];

  // Sport-specific data
  const sportData = {
    football: {
      competitionRange: {
        all: {
          label: 'All',
          tags: ['Football', 'Live', 'Fixtures', 'Finished'],
          count: 6
        },
        following: {
          label: 'Following',
          tags: ['Football', 'Live', 'Fixtures', 'Finished'],
          count: 2
        }
      },
      sounds: {
        homeTeam: 'Home Team Sound',
        awayTeam: 'Away Team Sound',
        goal: 'Goal Sound',
        redCard: 'Red Card Sound'
      }
    },
    basketball: {
      competitionRange: {
        all: {
          label: 'All',
          tags: ['Basketball', 'Live', 'NBA', 'EuroLeague'],
          count: 8
        },
        following: {
          label: 'Following',
          tags: ['Basketball', 'Live', 'NBA', 'Favorites'],
          count: 3
        }
      },
      sounds: {
        homeTeam: 'Home Team Sound',
        awayTeam: 'Away Team Sound',
        score: 'Score Sound',
        buzzer: 'Buzzer Sound'
      }
    },
    rugby: {
      competitionRange: {
        all: {
          label: 'All',
          tags: ['Rugby', 'Live', 'Union', 'League'],
          count: 4
        },
        following: {
          label: 'Following',
          tags: ['Rugby', 'Live', 'Union', 'Favorites'],
          count: 2
        }
      },
      sounds: {
        homeTeam: 'Home Team Sound',
        awayTeam: 'Away Team Sound',
        try: 'Try Sound',
        whistle: 'Whistle Sound'
      }
    },
    boxing: {
      competitionRange: {
        all: {
          label: 'All',
          tags: ['Boxing', 'Live', 'Championship', 'Amateur'],
          count: 5
        },
        following: {
          label: 'Following',
          tags: ['Boxing', 'Live', 'Championship', 'Favorites'],
          count: 2
        }
      },
      sounds: {
        bell: 'Round Bell Sound',
        knockout: 'Knockout Sound',
        decision: 'Decision Sound',
        entrance: 'Entrance Sound'
      }
    }
  };

  // Settings states - now using context
  const goalNotification = settings.goalNotification;
  const competitionRange = settings.competitionRange;
  const soundNotification = settings.soundNotification;
  const homeTeamSound = settings.homeTeamSound;
  const awayTeamSound = settings.awayTeamSound;
  const cancelGoalSound = settings.goalSound;
  const redCardSound = settings.redCardSound;
  const vibrationSwitch = settings.vibrationEnabled;
  const goalAnimation = settings.goalAnimation;

  // Modal states
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [currentSoundType, setCurrentSoundType] = useState('');

  // Sound options - get from SoundManager
  const soundOptions = getAvailableSounds();

  const openSoundModal = (soundType: string) => {
    if (!goalNotification || !soundNotification) return;
    setCurrentSoundType(soundType);
    setShowSoundModal(true);
  };

  const selectSound = async (sound: string) => {
    // Test the sound when selecting it
    try {
      await testSound(sound);
      
      switch (currentSoundType) {
        case 'home':
          updateSetting('homeTeamSound', sound);
          break;
        case 'away':
          updateSetting('awayTeamSound', sound);
          break;
        case 'cancel':
          updateSetting('goalSound', sound);
          break;
      }
      setShowSoundModal(false);
    } catch (error) {
      console.log('Could not test sound:', error);
      // Still save the setting even if test fails
      switch (currentSoundType) {
        case 'home':
          updateSetting('homeTeamSound', sound);
          break;
        case 'away':
          updateSetting('awayTeamSound', sound);
          break;
        case 'cancel':
          updateSetting('goalSound', sound);
          break;
      }
      setShowSoundModal(false);
      
      Alert.alert(
        'Sound Test Failed',
        `Could not test the ${sound} sound, but your selection has been saved.`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderSoundRow = (
    label: string,
    value: string,
    soundType: string,
    isBlurred: boolean = false
  ) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { backgroundColor: theme.colors.backgroundSecondary, opacity: isBlurred ? 0.3 : 1 }
      ]}
      onPress={() => openSoundModal(soundType)}
      disabled={isBlurred}
      activeOpacity={0.7}
    >
      <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <View style={styles.settingRight}>
        <Text style={[styles.settingRightText, { color: theme.colors.textSecondary }]}>
          {value}
        </Text>
        <ChevronRight size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderCompetitionRangeOption = (type: 'all' | 'following', optionData: any) => {
    const isSelected = competitionRange === type;
    const isBlurred = !goalNotification;

    return (
      <TouchableOpacity
        style={[
          styles.competitionOption,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: isSelected ? '#EF5350' : 'transparent',
            opacity: isBlurred ? 0.3 : 1,
          }
        ]}
        onPress={() => goalNotification && updateSetting('competitionRange', type)}
        disabled={!goalNotification}
        activeOpacity={0.7}
      >
        <View style={styles.competitionContent}>
          <Text style={[styles.competitionLabel, { color: theme.colors.text }]}>
            {optionData.label}
          </Text>
          <View style={styles.competitionTags}>
            {optionData.tags.map((tag: string, index: number) => (
              <Text key={index} style={[styles.competitionTag, { color: theme.colors.textSecondary }]}>
                {tag}
              </Text>
            ))}
          </View>
        </View>
        <View style={[
          styles.radioButton,
          {
            borderColor: isSelected ? '#EF5350' : theme.colors.textSecondary,
            backgroundColor: isSelected ? '#EF5350' : 'transparent',
          }
        ]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
        <Text style={[styles.competitionCount, { color: theme.colors.textSecondary }]}>
          Page count: {optionData.count}
        </Text>
        <Text style={[styles.competitionSubtext, { color: theme.colors.textSecondary }]}>
          Click to enter competition
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSettingRow = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    isBlurred: boolean = false,
    rightText?: string
  ) => (
    <View style={[
      styles.settingRow,
      { backgroundColor: theme.colors.backgroundSecondary, opacity: isBlurred ? 0.3 : 1 }
    ]}>
      <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <View style={styles.settingRight}>
        {rightText && (
          <Text style={[styles.settingRightText, { color: theme.colors.textSecondary }]}>
            {rightText}
          </Text>
        )}
        <Switch
          value={value}
          onValueChange={isBlurred ? undefined : onValueChange}
          trackColor={{ false: '#767577', true: '#4CD964' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          disabled={isBlurred}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Match Settings</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { borderBottomColor: '#EF5350' }
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              {
                color: activeTab === tab.id ? '#EF5350' : theme.colors.textSecondary
              }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {activeTab === 'football' && 'Goal Notification'}
            {activeTab === 'basketball' && 'Score Notification'}
            {activeTab === 'rugby' && 'Try Notification'}
            {activeTab === 'boxing' && 'Fight Notification'}
          </Text>
          {renderSettingRow(
            activeTab === 'football' ? 'Goal Notification' :
            activeTab === 'basketball' ? 'Score Notification' :
            activeTab === 'rugby' ? 'Try Notification' : 'Fight Notification',
            goalNotification, 
            (value) => updateSetting('goalNotification', value)
          )}
        </View>

        {/* Competition Range */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Competition Range
          </Text>
          <View style={styles.competitionRangeContainer}>
            {renderCompetitionRangeOption('all', sportData[activeTab as keyof typeof sportData].competitionRange.all)}
            {renderCompetitionRangeOption('following', sportData[activeTab as keyof typeof sportData].competitionRange.following)}
          </View>
        </View>

        {/* Sound Notification */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Sound Notification
          </Text>
          {renderSettingRow(
            'Sound Notification',
            soundNotification,
            (value) => updateSetting('soundNotification', value),
            !goalNotification
          )}
          {activeTab === 'football' && (
            <>
              {renderSoundRow(
                'Home Team Sound',
                homeTeamSound,
                'home',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Away Team Sound',
                awayTeamSound,
                'away',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Goal Sound',
                cancelGoalSound,
                'cancel',
                !goalNotification || !soundNotification
              )}
              {renderSettingRow(
                'Red Card Sound',
                redCardSound,
                (value) => updateSetting('redCardSound', value),
                !goalNotification || !soundNotification
              )}
            </>
          )}
          {activeTab === 'basketball' && (
            <>
              {renderSoundRow(
                'Home Team Sound',
                homeTeamSound,
                'home',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Away Team Sound',
                awayTeamSound,
                'away',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Score Sound',
                cancelGoalSound,
                'cancel',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Buzzer Sound',
                'Default',
                'buzzer',
                !goalNotification || !soundNotification
              )}
            </>
          )}
          {activeTab === 'rugby' && (
            <>
              {renderSoundRow(
                'Home Team Sound',
                homeTeamSound,
                'home',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Away Team Sound',
                awayTeamSound,
                'away',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Try Sound',
                cancelGoalSound,
                'cancel',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Whistle Sound',
                'Default',
                'whistle',
                !goalNotification || !soundNotification
              )}
            </>
          )}
          {activeTab === 'boxing' && (
            <>
              {renderSoundRow(
                'Round Bell Sound',
                homeTeamSound,
                'home',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Knockout Sound',
                awayTeamSound,
                'away',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Decision Sound',
                cancelGoalSound,
                'cancel',
                !goalNotification || !soundNotification
              )}
              {renderSoundRow(
                'Entrance Sound',
                'Default',
                'entrance',
                !goalNotification || !soundNotification
              )}
            </>
          )}
        </View>

        {/* Vibration Switch */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Vibration Switch
          </Text>
          <TouchableOpacity 
            style={[
              styles.vibrationContainer,
              { backgroundColor: theme.colors.backgroundSecondary, opacity: !goalNotification ? 0.3 : 1 }
            ]}
            onPress={() => goalNotification && router.push('/vibrationSettings')}
            disabled={!goalNotification}
            activeOpacity={0.7}
          >
            <Smartphone size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.vibrationText, { color: theme.colors.textSecondary }]}>
              Turn on to experience vibration feedback
            </Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Animation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {activeTab === 'football' && 'Goal Animation'}
            {activeTab === 'basketball' && 'Score Animation'}
            {activeTab === 'rugby' && 'Try Animation'}
            {activeTab === 'boxing' && 'Fight Animation'}
          </Text>
          {renderSettingRow(
            activeTab === 'football' ? 'Goal Animation' :
            activeTab === 'basketball' ? 'Score Animation' :
            activeTab === 'rugby' ? 'Try Animation' : 'Fight Animation',
            goalAnimation,
            (value) => updateSetting('goalAnimation', value),
            !goalNotification
          )}
        </View>



        {/* Samsung Phone Mockup Preview */}
        <View style={styles.previewSection}>
          <View style={[
            styles.samsungMockup,
            {
              opacity: !goalNotification || !goalAnimation ? 0.3 : 1
            }
          ]}>
            {/* Samsung Phone Frame */}
            <View style={styles.samsungFrame}>
              {/* Status Bar */}
              <View style={styles.statusBar}>
                <Text style={styles.statusTime}>15:47</Text>
                <View style={styles.statusRight}>
                  <Text style={styles.statusText}>SportsWee</Text>
                  <View style={styles.statusIcons}>
                    <View style={styles.signalIcon} />
                    <View style={styles.wifiIcon} />
                    <View style={styles.batteryIcon}>
                      <Text style={styles.batteryText}>81%</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* App Header */}
              <View style={styles.appHeader}>
                <Text style={styles.appTitle}>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </Text>
                <View style={styles.appTabs}>
                  <Text style={[styles.appTab, styles.appTabActive]}>Live</Text>
                  <Text style={styles.appTab}>
                    {activeTab === 'boxing' ? 'Upcoming' : 'Fixtures'}
                  </Text>
                  <Text style={styles.appTab}>Results</Text>
                </View>
              </View>

              {/* Match List */}
              <View style={styles.matchList}>
                {activeTab === 'football' && (
                  <View style={styles.sportContainer}>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>19:30</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>Kampala City</Text>
                          <Text style={styles.matchScore}>2-1</Text>
                          <Text style={styles.teamName}>Vipers SC</Text>
                        </View>
                        <Text style={styles.matchStatus}>HT 2-1 • 45+2'</Text>
                      </View>
                    </View>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>19:00</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>KCCA FC</Text>
                          <Text style={styles.matchScore}>1-0</Text>
                          <Text style={styles.teamName}>Express FC</Text>
                        </View>
                        <Text style={styles.matchStatus}>Live • 67'</Text>
                      </View>
                    </View>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>18:45</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>URA FC</Text>
                          <Text style={styles.matchScore}>1-1</Text>
                          <Text style={styles.teamName}>Villa SC</Text>
                        </View>
                        <Text style={styles.matchStatus}>Live • 23'</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {activeTab === 'basketball' && (
                  <View style={styles.sportContainer}>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>20:00</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>Lakers</Text>
                          <Text style={styles.matchScore}>108-95</Text>
                          <Text style={styles.teamName}>Warriors</Text>
                        </View>
                        <Text style={styles.matchStatus}>Q4 • 2:15</Text>
                      </View>
                    </View>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>19:30</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>Celtics</Text>
                          <Text style={styles.matchScore}>87-89</Text>
                          <Text style={styles.teamName}>Heat</Text>
                        </View>
                        <Text style={styles.matchStatus}>Q3 • 8:45</Text>
                      </View>
                    </View>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>18:00</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>Nets</Text>
                          <Text style={styles.matchScore}>76-82</Text>
                          <Text style={styles.teamName}>Knicks</Text>
                        </View>
                        <Text style={styles.matchStatus}>Q3 • 5:20</Text>
                      </View>
                    </View>
                  </View>
                )}

                {activeTab === 'rugby' && (
                  <View style={styles.sportContainer}>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>16:00</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>England</Text>
                          <Text style={styles.matchScore}>21-14</Text>
                          <Text style={styles.teamName}>Ireland</Text>
                        </View>
                        <Text style={styles.matchStatus}>HT • 40+2'</Text>
                      </View>
                    </View>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>15:30</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>Wales</Text>
                          <Text style={styles.matchScore}>7-12</Text>
                          <Text style={styles.teamName}>Scotland</Text>
                        </View>
                        <Text style={styles.matchStatus}>Live • 28'</Text>
                      </View>
                    </View>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>14:00</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>France</Text>
                          <Text style={styles.matchScore}>15-8</Text>
                          <Text style={styles.teamName}>Italy</Text>
                        </View>
                        <Text style={styles.matchStatus}>Live • 35'</Text>
                      </View>
                    </View>
                  </View>
                )}

                {activeTab === 'boxing' && (
                  <View style={styles.sportContainer}>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>22:00</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>Joshua</Text>
                          <Text style={styles.matchScore}>R8</Text>
                          <Text style={styles.teamName}>Fury</Text>
                        </View>
                        <Text style={styles.matchStatus}>Live • R8 1:45</Text>
                      </View>
                    </View>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>21:30</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>Wilder</Text>
                          <Text style={styles.matchScore}>R5</Text>
                          <Text style={styles.teamName}>Ruiz</Text>
                        </View>
                        <Text style={styles.matchStatus}>Live • R5 0:30</Text>
                      </View>
                    </View>
                    <View style={styles.matchItem}>
                      <Text style={styles.matchTime}>20:00</Text>
                      <View style={styles.matchTeams}>
                        <View style={styles.teamRow}>
                          <Text style={styles.teamName}>Canelo</Text>
                          <Text style={styles.matchScore}>R3</Text>
                          <Text style={styles.teamName}>GGG</Text>
                        </View>
                        <Text style={styles.matchStatus}>Live • R3 2:10</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Sport Notification Overlay - Only show when animation is enabled */}
              {goalNotification && goalAnimation && (
                <View style={styles.goalNotification}>
                  <View style={styles.goalContent}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalMinute}>
                        {activeTab === 'football' ? '23\'' :
                         activeTab === 'basketball' ? 'Q3 5:20' :
                         activeTab === 'rugby' ? '35\'' : 'R3 2:10'}
                      </Text>
                      <View style={styles.goalIcon}>
                        <Text style={styles.goalIconText}>
                          {activeTab === 'football' ? '⚽' :
                           activeTab === 'basketball' ? '🏀' :
                           activeTab === 'rugby' ? '🏉' : '🥊'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.goalMatch}>
                      <Text style={styles.goalTeams}>
                        {activeTab === 'football' ? 'URA FC' :
                         activeTab === 'basketball' ? 'Nets' :
                         activeTab === 'rugby' ? 'France' : 'Canelo'}
                      </Text>
                      <Text style={styles.goalVs}>vs</Text>
                      <Text style={styles.goalTeams}>
                        {activeTab === 'football' ? 'Villa SC' :
                         activeTab === 'basketball' ? 'Knicks' :
                         activeTab === 'rugby' ? 'Italy' : 'GGG'}
                      </Text>
                    </View>
                    <View style={styles.goalScoreUpdate}>
                      <Text style={styles.goalText}>
                        {activeTab === 'football' ? 'GOAL!' : 
                         activeTab === 'basketball' ? 'SCORE!' :
                         activeTab === 'rugby' ? 'TRY!' : 'KNOCKOUT!'}
                      </Text>
                      <Text style={styles.goalNewScore}>
                        {activeTab === 'football' ? '1 - 1' :
                         activeTab === 'basketball' ? '76 - 82' :
                         activeTab === 'rugby' ? '15 - 8' : 'KO R3'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Competition Range Info */}
            <View style={styles.mockupInfo}>
              <Text style={[styles.mockupInfoText, { color: theme.colors.text }]}>
                Animation Preview: {goalAnimation ? 'ON' : 'OFF'}
              </Text>
              <Text style={[styles.mockupSubText, { color: theme.colors.textSecondary }]}>
                {activeTab === 'football' && 'Goal notifications will appear like this'}
                {activeTab === 'basketball' && 'Score notifications will appear like this'}
                {activeTab === 'rugby' && 'Try notifications will appear like this'}
                {activeTab === 'boxing' && 'Fight notifications will appear like this'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sound Selection Modal */}
      <Modal
        visible={showSoundModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSoundModal(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSoundModal(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: theme.colors.backgroundSecondary }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Sound
            </Text>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {soundOptions.map((sound) => (
                <TouchableOpacity
                  key={sound}
                  style={[styles.modalOption, { backgroundColor: theme.colors.background }]}
                  onPress={() => selectSound(sound)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>
                    {sound}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowSoundModal(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalCancelText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 36,
  },
  tabContainer: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginRight: 12,
  },
  competitionRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  competitionOption: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    minHeight: 120,
  },
  competitionContent: {
    flex: 1,
  },
  competitionLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  competitionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  competitionTag: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignSelf: 'flex-end',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  competitionCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  competitionSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  vibrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  vibrationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  previewSection: {
    marginBottom: 32,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 12,
    gap: 16,
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    padding: 0,
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#C0C0C0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScrollView: {
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  modalCancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  // Samsung Phone Mockup Styles
  samsungMockup: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: '#1C1C1E',
    marginHorizontal: -16,
    marginTop: -10,
  },
  samsungFrame: {
    width: '100%',
    height: 320,
    backgroundColor: '#000000',
    borderRadius: 0,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
    backgroundColor: '#000000',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  statusTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginRight: 10,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalIcon: {
    width: 14,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  wifiIcon: {
    width: 14,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  batteryIcon: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 3,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  batteryText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '500',
  },
  appHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  appTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  appTab: {
    fontSize: 14,
    color: '#8E8E93',
    paddingVertical: 5,
  },
  appTabActive: {
    color: '#EF5350',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#EF5350',
  },
  matchList: {
    backgroundColor: '#F5F5F5',
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 8,
    position: 'relative',
  },
  sportContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  matchItem: {
    backgroundColor: '#FFFFFF',
    marginVertical: 2,
    padding: 8,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchTime: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 2,
  },
  matchTeams: {
    alignItems: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 2,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  matchScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF5350',
    marginHorizontal: 15,
    minWidth: 40,
    textAlign: 'center',
  },
  matchStatus: {
    fontSize: 9,
    color: '#34C759',
    fontWeight: '500',
  },
  goalNotification: {
    position: 'absolute',
    top: 100,
    left: 15,
    right: 15,
    backgroundColor: '#EF5350',
    borderRadius: 6,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  goalContent: {
    alignItems: 'center',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalMinute: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  goalIcon: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalIconText: {
    fontSize: 12,
  },
  goalMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalTeams: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  goalVs: {
    color: '#FFFFFF',
    fontSize: 10,
    marginHorizontal: 8,
  },
  goalScoreUpdate: {
    alignItems: 'center',
  },
  goalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  goalNewScore: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mockupInfo: {
    marginTop: 15,
    alignItems: 'center',
  },
  mockupInfoText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mockupSubText: {
    fontSize: 12,
    textAlign: 'center',
  },

}); 