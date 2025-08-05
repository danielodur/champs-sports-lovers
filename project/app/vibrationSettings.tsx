import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, HelpCircle, Volume2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';
import { testSound, playRedCardSound } from '@/utils/SoundManager';
import { testVibration, vibrateForRedCard } from '@/utils/VibrationManager';

export default function VibrationSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { settings, updateSetting } = useMatchSettings();

  // Local state for broadcast settings (these could be moved to context later if needed)
  const [inAppMiniWindow, setInAppMiniWindow] = useState(false);
  const [mobileNetworkAutoplay, setMobileNetworkAutoplay] = useState(false);
  const [videoLiveAutoplay, setVideoLiveAutoplay] = useState(false);

  // Test sound functionality
  const handleTestSound = async (soundType: string) => {
    try {
      console.log(`🧪 Testing ${soundType} sound`);
      
      if (soundType === 'redcard') {
        // Test red card sound with current settings
        await playRedCardSound(settings);
        
        // Also test vibration if enabled
        vibrateForRedCard(settings);
      } else {
        await testSound(soundType);
      }
    } catch (error) {
      console.error(`❌ Error testing ${soundType} sound:`, error);
      // Show user-friendly error message
      Alert.alert(
        'Sound Test Failed',
        `Could not test ${soundType} sound. Please check your device's audio settings.`,
        [{ text: 'OK' }]
      );
    }
  };

  // Safely update settings with error handling
  const updateSettingWithErrorHandling = (key: string, value: any) => {
    try {
      updateSetting(key as any, value);
    } catch (error) {
      console.error(`❌ Error updating setting ${key}:`, error);
      Alert.alert(
        'Settings Update Failed',
        'Could not save your settings. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderSettingRow = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    isBlurred: boolean = false,
    subtitle?: string,
    showHelp?: boolean
  ) => (
    <View style={[
      styles.settingRow,
      { backgroundColor: theme.colors.backgroundSecondary, opacity: isBlurred ? 0.3 : 1 }
    ]}>
      <View style={styles.settingLeft}>
        <View style={styles.settingLabelContainer}>
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
            {label}
          </Text>
          {showHelp && (
            <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
              <HelpCircle size={16} color="#FFB300" />
            </TouchableOpacity>
          )}
        </View>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={isBlurred ? undefined : onValueChange}
        trackColor={{ false: '#767577', true: '#4CD964' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        disabled={isBlurred}
      />
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Vibration & Broadcast Settings
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vibration Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Vibration Settings
          </Text>
          
          {/* Main Vibration Switch */}
          {renderSettingRow(
            'Vibration Switch',
            settings.vibrationEnabled,
            (value) => updateSettingWithErrorHandling('vibrationEnabled', value),
            false,
            'Turn on to experience vibration feedback'
          )}

          {/* Football Goal Vibration */}
          {renderSettingRow(
            'Football Goal Vibration',
            settings.goalNotification,
            (value) => updateSettingWithErrorHandling('goalNotification', value),
            !settings.vibrationEnabled
          )}

          {/* Football Red Card Vibration */}
          {renderSettingRow(
            'Football Red Card Vibration',
            settings.redCardSound,
            (value) => updateSettingWithErrorHandling('redCardSound', value),
            !settings.vibrationEnabled
          )}

          {/* Other Vibration */}
          {renderSettingRow(
            'Other Vibration',
            settings.goalAnimation,
            (value) => updateSettingWithErrorHandling('goalAnimation', value),
            !settings.vibrationEnabled,
            'Vibration for other match events'
          )}
        </View>

        {/* Broadcast Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Broadcast Settings
          </Text>

          {/* In-app Mini Window Broadcast */}
          {renderSettingRow(
            'In-app Mini Window Broadcast',
            inAppMiniWindow,
            setInAppMiniWindow,
            false,
            'Enable mini window for live match broadcasts'
          )}

          {/* Mobile Network Auto-play */}
          {renderSettingRow(
            'Mobile Network Auto-play',
            mobileNetworkAutoplay,
            setMobileNetworkAutoplay,
            false,
            'Auto-play videos when using mobile data'
          )}

          {/* Video Live Auto-play */}
          {renderSettingRow(
            'Video Live Auto-play',
            videoLiveAutoplay,
            setVideoLiveAutoplay,
            false,
            'Auto-play live video streams'
          )}
        </View>

        {/* Sound Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Sound Information
          </Text>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              Available Sounds
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • Default - Standard notification sound{'\n'}
              • Whistle - Football referee whistle{'\n'}
              • Drum - Victory drum beat{'\n'}
              • Broadcast - Professional broadcast tone{'\n'}
              • Red Card - Special alert for red cards{'\n'}
              • Notification - General notification chime
            </Text>

          </View>
        </View>
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
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  helpButton: {
    marginLeft: 8,
    padding: 2,
  },

  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },

}); 