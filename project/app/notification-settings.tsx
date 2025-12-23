import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Bell, Settings, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useNotificationPermissions } from '../hooks/useNotificationPermissions';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { granted, loading, requestPermission } = useNotificationPermissions();
  
  // State for various notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    commentsReplies: true,
    recommendedSubscriptions: true,
    sportweeNumber: true,
    predictionNumber: true,
  });

  const [frequencySettings, setFrequencySettings] = useState({
    football: 'high',
    basketball: 'high',
  });

  const handleNotificationToggle = (setting: string) => {
    if (!granted) return; // Prevent interaction if permission not granted
    
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleFrequencyChange = (sport: string, frequency: string) => {
    if (!granted) return; // Prevent interaction if permission not granted
    
    setFrequencySettings(prev => ({
      ...prev,
      [sport]: frequency
    }));
  };

  const handleAllowNotifications = async () => {
    console.log('Opening device notification settings...');
    try {
      // Try to open app-specific notification settings first
      const canOpenSettings = await Linking.canOpenURL('app-settings:');
      if (canOpenSettings) {
        await Linking.openURL('app-settings:');
      } else {
        // Fallback to general settings
        await Linking.openSettings();
      }
    } catch (error) {
      console.log('Could not open settings:', error);
      try {
        // Fallback to requesting permission
        await requestPermission();
      } catch (permissionError) {
        console.error('Error requesting notification permission:', permissionError);
        Alert.alert(
          'Settings Error',
          'Could not open notification settings. Please manually enable notifications in your device settings.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const renderFrequencyButtons = (sport: string, currentFrequency: string) => {
    const frequencies = [
      { id: 'high', label: 'High', color: '#EF5350' },
      { id: 'low', label: 'Low', color: '#666666' },
      { id: 'mute', label: 'Mute', color: '#666666' },
    ];

    return (
      <View style={styles.frequencyContainer}>
        {frequencies.map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: currentFrequency === freq.id ? freq.color : theme.colors.backgroundSecondary,
                opacity: granted ? 1 : 0.5,
              }
            ]}
            onPress={() => handleFrequencyChange(sport, freq.id)}
            activeOpacity={granted ? 0.7 : 1}
            disabled={!granted}
          >
            <Text
              style={[
                styles.frequencyText,
                {
                  color: currentFrequency === freq.id ? '#FFFFFF' : theme.colors.textSecondary,
                }
              ]}
            >
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderNotificationPreview = () => (
    <View style={styles.notificationPreviewSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Notification Example
      </Text>
      
      {/* iPhone 16 Style Notification */}
      <View style={styles.phoneContainer}>
        <View style={[styles.phoneFrame, { backgroundColor: '#1C1C1E' }]}>
          {/* Status Bar */}
          <View style={styles.statusBar}>
            <Text style={styles.statusTime}>9:41</Text>
            <View style={styles.statusIcons}>
              <View style={styles.signalBars}>
                <View style={[styles.bar, styles.bar1]} />
                <View style={[styles.bar, styles.bar2]} />
                <View style={[styles.bar, styles.bar3]} />
                <View style={[styles.bar, styles.bar4]} />
              </View>
              <View style={styles.wifiIcon} />
              <View style={styles.batteryIcon}>
                <View style={styles.batteryLevel} />
              </View>
            </View>
          </View>

          {/* Dynamic Island */}
          <View style={styles.dynamicIsland} />

          {/* Notification */}
          <View style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <View style={styles.appIconContainer}>
                <View style={[styles.appIcon, { backgroundColor: theme.colors.primary }]}>
                  <Bell size={16} color="#FFFFFF" />
                </View>
                <View style={styles.notificationMeta}>
                  <Text style={styles.appName}>SportWee</Text>
                  <Text style={styles.notificationTime}>now</Text>
                </View>
              </View>
            </View>
            <Text style={styles.notificationTitle}>
              The Ugandan Premier League kicks off this Saturday
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMainContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Allow Notifications Setting - always visible */}
      <TouchableOpacity
        style={[
          styles.settingItem, 
          { 
            backgroundColor: theme.colors.backgroundSecondary,
            opacity: 1,
          }
        ]}
        onPress={handleAllowNotifications}
        activeOpacity={1}
      >
        <View style={styles.settingLeft}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Message Notification Settings</Text>
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>It is recommended to turn on to get the latest updates in time</Text>
        </View>
        <View style={styles.settingRight}>
          <Text style={[
            styles.openText, 
            { color: granted ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            {granted ? 'Enabled' : 'Open'}
          </Text>
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {/* The rest of the content, blurred if !granted */}
      <View style={{ position: 'relative' }}>
        <View style={{ opacity: granted ? 1 : 0.3 }}>
          {/* Matches Section */}
          <View style={[
            styles.section, 
            { backgroundColor: theme.colors.backgroundSecondary }
          ]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Matches</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Unsubscribed matches will not receive any match notifications</Text>
            </View>
            <TouchableOpacity style={styles.matchItem} disabled={!granted} activeOpacity={granted ? 0.7 : 1}>
              <Text style={[styles.matchTitle, { color: theme.colors.text }]}>Followed Football Matches</Text>
              <Text style={[styles.matchCount, { color: theme.colors.textSecondary }]}>5/7</Text>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.matchItem} disabled={!granted} activeOpacity={granted ? 0.7 : 1}>
              <Text style={[styles.matchTitle, { color: theme.colors.text }]}>Followed Basketball Matches</Text>
              <Text style={[styles.matchCount, { color: theme.colors.textSecondary }]}>2/2</Text>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {/* Information Section */}
          <View style={[
            styles.section, 
            { backgroundColor: theme.colors.backgroundSecondary }
          ]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Information</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Customize personalized notifications</Text>
            </View>
            <View style={styles.sportFrequencyItem}>
              <Text style={[styles.sportTitle, { color: theme.colors.text }]}>Football</Text>
              <Text style={[styles.sportSubtitle, { color: theme.colors.textSecondary }]}>Don't miss any hot spots</Text>
              {renderFrequencyButtons('football', frequencySettings.football)}
            </View>
            <View style={styles.sportFrequencyItem}>
              <Text style={[styles.sportTitle, { color: theme.colors.text }]}>Basketball</Text>
              <Text style={[styles.sportSubtitle, { color: theme.colors.textSecondary }]}>Don't miss any hot spots</Text>
              {renderFrequencyButtons('basketball', frequencySettings.basketball)}
            </View>
          </View>
          {/* Toggle Settings */}
          <View style={[
            styles.section, 
            { backgroundColor: theme.colors.backgroundSecondary }
          ]}>
            <View style={styles.toggleItem}>
              <Text style={[styles.toggleTitle, { color: theme.colors.text }]}>Comments/Replies</Text>
              <Switch value={notificationSettings.commentsReplies} onValueChange={() => handleNotificationToggle('commentsReplies')} trackColor={{ false: '#767577', true: theme.colors.primary }} thumbColor="#FFFFFF" disabled={!granted} />
            </View>
            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, { color: theme.colors.text }]}>Recommended Subscriptions</Text>
                <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>Real-time master status updates</Text>
              </View>
              <Switch value={notificationSettings.recommendedSubscriptions} onValueChange={() => handleNotificationToggle('recommendedSubscriptions')} trackColor={{ false: '#767577', true: theme.colors.primary }} thumbColor="#FFFFFF" disabled={!granted} />
            </View>
            <View style={styles.toggleItem}>
              <Text style={[styles.toggleTitle, { color: theme.colors.text }]}>SportWee Number</Text>
              <Switch value={notificationSettings.sportweeNumber} onValueChange={() => handleNotificationToggle('sportweeNumber')} trackColor={{ false: '#767577', true: theme.colors.primary }} thumbColor="#FFFFFF" disabled={!granted} />
            </View>
            <View style={styles.toggleItem}>
              <Text style={[styles.toggleTitle, { color: theme.colors.text }]}>Prediction Number</Text>
              <Switch value={notificationSettings.predictionNumber} onValueChange={() => handleNotificationToggle('predictionNumber')} trackColor={{ false: '#767577', true: theme.colors.primary }} thumbColor="#FFFFFF" disabled={!granted} />
            </View>
          </View>
          {/* Notification Preview */}
          {renderNotificationPreview()}
        </View>
        {/* Blur overlay for the rest of the content if not granted */}
        {!granted && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.background + 'CC', zIndex: 5 }} pointerEvents="none" />
        )}
      </View>
    </ScrollView>
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
          Notification Settings
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Main Content with Conditional Blur */}
      <View style={styles.mainContainer}>
        {renderMainContent()}
      </View>
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
    zIndex: 10,
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
  headerRight: {
    width: 36,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 12,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  section: {
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  matchTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  matchCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  sportFrequencyItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sportTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  sportSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  frequencyText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  toggleSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  notificationPreviewSection: {
    padding: 16,
    marginTop: 12,
  },
  phoneContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  phoneFrame: {
    width: 280,
    height: 400,
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  statusTime: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  bar1: { height: 4 },
  bar2: { height: 6 },
  bar3: { height: 8 },
  bar4: { height: 10 },
  wifiIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  batteryIcon: {
    width: 20,
    height: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batteryLevel: {
    width: 14,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  dynamicIsland: {
    width: 100,
    height: 24,
    backgroundColor: '#000000',
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
  },
  notificationCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 20,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  notificationMeta: {
    flex: 1,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  notificationTime: {
    color: '#8E8E93',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
});