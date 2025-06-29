import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, HelpCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function VibrationSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();

  // Vibration Settings States
  const [vibrationSwitch, setVibrationSwitch] = useState(false);
  const [footballGoalVibration, setFootballGoalVibration] = useState(false);
  const [footballRedCardVibration, setFootballRedCardVibration] = useState(false);
  const [otherVibration, setOtherVibration] = useState(false);

  // Broadcast Settings States
  const [inAppMiniWindow, setInAppMiniWindow] = useState(false);
  const [mobileNetworkAutoplay, setMobileNetworkAutoplay] = useState(false);
  const [videoLiveAutoplay, setVideoLiveAutoplay] = useState(false);

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
            vibrationSwitch,
            setVibrationSwitch,
            false,
            'Turn on to experience vibration feedback'
          )}

          {/* Football Goal Vibration */}
          {renderSettingRow(
            'Football Goal Vibration',
            footballGoalVibration,
            setFootballGoalVibration,
            !vibrationSwitch
          )}

          {/* Football Red Card Vibration */}
          {renderSettingRow(
            'Football Red Card Vibration',
            footballRedCardVibration,
            setFootballRedCardVibration,
            !vibrationSwitch
          )}

          {/* Other Vibration */}
          {renderSettingRow(
            'Other Vibration',
            otherVibration,
            setOtherVibration,
            !vibrationSwitch
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
            setInAppMiniWindow
          )}

          {/* Mobile Network Auto-play */}
          {renderSettingRow(
            'Mobile Network Auto-play',
            mobileNetworkAutoplay,
            setMobileNetworkAutoplay
          )}

          {/* Video Live Auto-play */}
          {renderSettingRow(
            'Video Live Auto-play',
            videoLiveAutoplay,
            setVideoLiveAutoplay
          )}
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
    marginBottom: 32,
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
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    lineHeight: 18,
  },
  helpButton: {
    marginLeft: 8,
    padding: 2,
  },
}); 