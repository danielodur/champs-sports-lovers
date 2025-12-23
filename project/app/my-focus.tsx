import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Edit, Calendar, MapPin, User, Phone, Mail, Briefcase, Camera, Edit3, X, Check, ChevronRight, Lock, Navigation, Search, Crown, Palette, Hash } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import useAuth from '../hooks/useAuth';
import { getCurrentUsername, getCurrentProfilePicture } from '../utils/userDataHelpers';

export default function MyFocusScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { userInfo } = useAuth();
  const [showJerseyModal, setShowJerseyModal] = useState(false);
  const [showVipPrompt, setShowVipPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');
  const [savedProfilePicture, setSavedProfilePicture] = useState<string | null>(null);

  // Load saved profile data and update username
  useEffect(() => {
    if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.profilePicture) {
      setSavedProfilePicture(global.savedProfileData.personalInfo.profilePicture);
    }
    // Update username when profile data changes
    setProfileData(prev => ({
      ...prev,
      username: getCurrentUsername()
    }));
  }, [userInfo]);

  // Update data when screen comes into focus (when returning from edit screens)
  useFocusEffect(
    React.useCallback(() => {
      // Reload profile picture
      if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.profilePicture) {
        setSavedProfilePicture(global.savedProfileData.personalInfo.profilePicture);
      }
      // Update username
      setProfileData(prev => ({
        ...prev,
        username: getCurrentUsername()
      }));
    }, [])
  );

  // Function to get current username with priority: custom username > real name > default
  const getCurrentUsername = () => {
    if (global.savedProfileData?.personalInfo?.champsUsername) {
      return global.savedProfileData.personalInfo.champsUsername;
    }
    if (userInfo?.username && userInfo.username !== 'DefaultUser123' && !userInfo.username.startsWith('DefaultUser')) {
      return userInfo.username;
    }
    if (global.savedProfileData?.personalInfo?.realName) {
      return global.savedProfileData.personalInfo.realName;
    }
    return userInfo?.username || 'DefaultUser123';
  };

  // User profile data 
  const [profileData, setProfileData] = useState({
    username: getCurrentUsername(),
    level: 8,
    joinedDays: 0, // Set to 0 since app is under development
    following: 0,
    fans: 0,
    myFocus: [
      { id: 1, label: 'Posts', value: 0 },
      { id: 2, label: 'Replies', value: 0 },
      { id: 3, label: 'Comments', value: 0 },
      { id: 4, label: 'Reviews', value: 0 }
    ]
  });

  const handleEditProfile = () => {
    // Navigate to profile page screen
    router.push('/profile-page');
  };

  const handleJerseyPress = () => {
    // Show VIP prompt first
    setShowVipPrompt(true);
  };

  const handleJerseyCustomization = () => {
    setShowJerseyModal(true);
  };

  const handleWallpaperCustomization = () => {
    Alert.alert('VIP Feature', 'Wallpaper customization is available for VIP members only.');
  };

  const handleTabPress = (tabLabel: string) => {
    setActiveTab(tabLabel);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Posts':
        return (
          <ScrollView 
            style={styles.tabScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <View style={styles.emptyStateContainer}>
              <Text style={[styles.emptyStateIcon, { color: theme.colors.textSecondary }]}>📝</Text>
              <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No Posts Yet</Text>
              <Text style={[styles.emptyStateDescription, { color: theme.colors.textSecondary }]}>
                Share your thoughts about sports, matches, and players
              </Text>
            </View>
          </ScrollView>
        );
      case 'Replies':
        return (
          <ScrollView 
            style={styles.tabScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <View style={styles.emptyStateContainer}>
              <Text style={[styles.emptyStateIcon, { color: theme.colors.textSecondary }]}>💬</Text>
              <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No Replies Yet</Text>
              <Text style={[styles.emptyStateDescription, { color: theme.colors.textSecondary }]}>
                Join conversations and reply to other users' posts
              </Text>
            </View>
          </ScrollView>
        );
      case 'Comments':
        return (
          <ScrollView 
            style={styles.tabScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <View style={styles.emptyStateContainer}>
              <Text style={[styles.emptyStateIcon, { color: theme.colors.textSecondary }]}>💭</Text>
              <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No Comments Yet</Text>
              <Text style={[styles.emptyStateDescription, { color: theme.colors.textSecondary }]}>
                Comment on news articles and match discussions
              </Text>
            </View>
          </ScrollView>
        );
      case 'Reviews':
        return (
          <ScrollView 
            style={styles.tabScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <View style={styles.emptyStateContainer}>
              <Text style={[styles.emptyStateIcon, { color: theme.colors.textSecondary }]}>⭐</Text>
              <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No Reviews Yet</Text>
              <Text style={[styles.emptyStateDescription, { color: theme.colors.textSecondary }]}>
                Rate and review players, teams, and matches
              </Text>
            </View>
          </ScrollView>
        );
      default:
        return null;
    }
  };

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Focus</Text>
        <View style={styles.editButton} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.colors.backgroundSecondary }]}>
          {/* Jersey Icon positioned on the right like jersey number */}
          <TouchableOpacity
            style={styles.jerseyContainer}
            onPress={handleJerseyPress}
            activeOpacity={0.7}
          >
            <View style={styles.jerseyIcon}>
              <View style={styles.jerseyBody}>
                <Text style={styles.jerseyNumber}>{profileData.level}</Text>
              </View>
              <View style={styles.jerseySleeves}>
                <View style={styles.jerseySleeve} />
                <View style={styles.jerseySleeve} />
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Profile content - image and user info below */}
          <View style={styles.profileContent}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Image
                  source={{ 
                    uri: getCurrentProfilePicture(userInfo)
                  }}
                  style={styles.profileImageInner}
                  fadeDuration={0}
                  resizeMode="contain"
                  onError={(error) => console.log('Profile page avatar load error:', error)}
                  onLoad={() => console.log('Profile page avatar loaded successfully')}
                />
              </View>
            </View>
            
            {/* User info positioned under profile picture */}
            <View style={styles.userInfoBelow}>
              <Text style={[styles.username, { color: theme.colors.text }]}>{profileData.username}</Text>
              
              <View style={styles.statsColumn}>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  Following: <Text style={{ color: theme.colors.text }}>{profileData.following}</Text>
                </Text>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  Fans: <Text style={{ color: theme.colors.text }}>{profileData.fans}</Text>
                </Text>
              </View>
              
              <Text style={[styles.joinedText, { color: theme.colors.textSecondary }]}>
                Joined <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>{profileData.joinedDays}</Text> days ago
              </Text>
            </View>
          </View>
        </View>

        {/* Separator between sections */}
        <View style={styles.sectionSeparator} />

        {/* My Focus Section - Expanded to fill bottom */}
        <View style={[styles.sectionExpanded, { backgroundColor: theme.colors.backgroundSecondary }]}>
          {/* My Focus header hidden as requested */}
          
          {/* Tab Navigation */}
          <View style={styles.tabNavigationContainer}>
            <View style={styles.tabNavigation}>
              {profileData.myFocus.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.tabButton}
                  onPress={() => handleTabPress(item.label)}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={[
                      styles.tabButtonText, 
                      { color: theme.colors.textSecondary },
                      activeTab === item.label && [styles.activeTabButtonText, { color: '#EF5350' }]
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {item.label}
                  </Text>
                  <Text style={[
                    styles.tabValue, 
                    { color: theme.colors.textSecondary },
                    activeTab === item.label && { color: '#EF5350' }
                  ]}>
                    {item.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Gray underline for all tabs */}
            <View style={[styles.tabUnderline, { backgroundColor: '#4A4A4A' }]} />
            {/* Red active indicator positioned within the gray line */}
            {profileData.myFocus.map((item, index) => (
              activeTab === item.label && (
                <View 
                  key={`indicator-${item.id}`}
                  style={[
                    styles.activeTabIndicator, 
                    { 
                      backgroundColor: '#EF5350',
                      left: `${(index * 25) + 4}%`,
                      width: `${17}%`,
                    }
                  ]} 
                />
              )
            ))}
          </View>
          
          {/* Tab Content */}
          {renderTabContent()}
        </View>

      </ScrollView>

      {/* VIP Prompt Modal */}
      <Modal
        visible={showVipPrompt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVipPrompt(false)}
      >
        <View style={styles.vipPromptOverlay}>
          <View style={[styles.vipPromptModal, { backgroundColor: theme.colors.backgroundSecondary }]}>
            {/* VIP Icon */}
            <View style={styles.vipPromptIcon}>
              <Crown size={40} color="#FFD700" />
            </View>
            
            {/* Title */}
            <Text style={[styles.vipPromptTitle, { color: theme.colors.text }]}>VIP Feature</Text>
            
            {/* Description */}
            <Text style={[styles.vipPromptDescription, { color: theme.colors.textSecondary }]}>
              Jersey customization and wallpapers are VIP exclusive features. Would you like to upgrade to VIP to unlock these features?
            </Text>
            
            {/* Button separator line */}
            <View style={styles.vipPromptButtonSeparator} />
            
            {/* Buttons */}
            <View style={styles.vipPromptButtons}>
              <TouchableOpacity
                style={styles.vipPromptNotNowButton}
                onPress={() => setShowVipPrompt(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.vipPromptNotNowText}>Not Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.vipPromptUpgradeButton}
                onPress={() => {
                  setShowVipPrompt(false);
                  router.push('/activate-vip');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.vipPromptUpgradeText}>Upgrade to VIP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Jersey Customization Modal */}
      <Modal
        visible={showJerseyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJerseyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.jerseyModal, { backgroundColor: theme.colors.backgroundSecondary }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Customize Profile</Text>
              <TouchableOpacity
                onPress={() => setShowJerseyModal(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              {/* Jersey Number Option */}
              <TouchableOpacity
                style={[styles.customizationOption, { borderBottomColor: theme.colors.border }]}
                onPress={handleJerseyCustomization}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, { backgroundColor: '#6B7280' }]}>
                    <Hash size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Jersey Number</Text>
                    <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                      Change your profile jersey number
                    </Text>
                  </View>
                </View>
                <View style={[styles.vipBadge, { backgroundColor: '#FFD700' }]}>
                  <Crown size={16} color="#000" />
                  <Text style={styles.vipText}>VIP</Text>
                </View>
              </TouchableOpacity>

              {/* Wallpaper Option */}
              <TouchableOpacity
                style={[styles.customizationOption, { borderBottomWidth: 0 }]}
                onPress={handleWallpaperCustomization}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, { backgroundColor: theme.colors.primary }]}>
                    <Palette size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Profile Wallpaper</Text>
                    <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                      Customize your profile background
                    </Text>
                  </View>
                </View>
                <View style={[styles.vipBadge, { backgroundColor: '#FFD700' }]}>
                  <Crown size={16} color="#000" />
                  <Text style={styles.vipText}>VIP</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Upgrade to VIP Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setShowJerseyModal(false);
                  router.push('/activate-vip');
                }}
                activeOpacity={0.8}
              >
                <Crown size={20} color="#FFFFFF" />
                <Text style={styles.upgradeButtonText}>Upgrade to VIP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  editButton: {
    padding: 4,
  },
  saveText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 0,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  profileHeader: {
    padding: 16,
    paddingHorizontal: 20,
    margin: 0,
    borderRadius: 0,
    position: 'relative',
  },
  profileContent: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  username: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  jerseyNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 2,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  joinedText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
    textAlign: 'center',
  },
  noSupportText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  section: {
    margin: 12,
    marginTop: 0,
    borderRadius: 12,
    padding: 12,
  },
  sectionExpanded: {
    flex: 1,
    margin: 0,
    marginBottom: -50,
    borderRadius: 0,
    padding: 12,
    paddingBottom: 50,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionSeparator: {
    height: 16,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  focusItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  focusValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  focusLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'column',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  rightArrowButton: {
    padding: 4,
    marginRight: 4,
  },
  checkContainer: {
    marginLeft: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    minHeight: 20,
  },
  infoDisplayBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  infoDisplayText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  infoInput: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
  },
  dateInputContainer: {
    width: '100%',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  datePickerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  datePicker: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 4,
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 28,
  },
  datePickerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  datePickerWheel: {
    width: '100%',
    height: 200,
  },
  datePickerModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  okButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  resetPasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 4,
  },
  changePasswordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 40,
  },
  changePasswordValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  locationValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  locationArrowButton: {
    padding: 4,
    marginLeft: 8,
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModal: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  locationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  locationCancelButton: {
    padding: 4,
  },
  locationModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  locationSaveButton: {
    padding: 4,
  },
  locationSaveText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  locationModalContent: {
    flex: 1,
    padding: 16,
  },
  locationSection: {
    marginBottom: 20,
  },
  locationSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gpsButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
  },
  currentLocationDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  currentLocationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  districtsList: {
    maxHeight: 300,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  districtText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  selectedLocationSection: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedLocationLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  selectedLocationText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  userInfoBelow: {
    width: '100%',
    alignItems: 'center',
  },
  statsColumn: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  jerseyContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  jerseyIcon: {
    position: 'relative',
    alignItems: 'center',
  },
  jerseyBody: {
    backgroundColor: '#6B7280',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  jerseySleeves: {
    flexDirection: 'row',
    position: 'absolute',
    top: 2,
    left: -8,
    right: -8,
    justifyContent: 'space-between',
  },
  jerseySleeve: {
    backgroundColor: '#6B7280',
    width: 14,
    height: 16,
    borderRadius: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  jerseyModal: {
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  modalContent: {
    padding: 16,
  },
  customizationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    gap: 4,
  },
  vipText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  modalFooter: {
    padding: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  // VIP Prompt Modal Styles
  vipPromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipPromptModal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 0,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  vipPromptIcon: {
    marginTop: 32,
    marginBottom: 20,
  },
  vipPromptTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  vipPromptDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  vipPromptButtonSeparator: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 0,
  },
  vipPromptButtons: {
    flexDirection: 'row',
    width: '100%',
    height: 44,
  },
  vipPromptNotNowButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9CA3AF',
  },
  vipPromptNotNowText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#F9FAFB',
  },
  vipPromptUpgradeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
  },
  vipPromptUpgradeText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#F9FAFB',
  },
  // Tab Navigation Styles
  tabNavigationContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  tabNavigation: {
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    minHeight: 60,
  },
  tabButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
    textAlign: 'center',
  },
  activeTabButtonText: {
    fontFamily: 'Inter-SemiBold',
  },
  tabValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    height: 1,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 7,
    height: 4,
    borderRadius: 2,
  },
  // Tab Content Styles
  tabContent: {
    minHeight: 200,
    paddingVertical: 16,
  },
  tabScrollView: {
    flex: 1,
    maxHeight: 400, // Constrain height so tabs stay visible
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 