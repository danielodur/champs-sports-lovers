import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy, Gift, Star, Users } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export default function InviteRecordsScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  // State for invitation records
  const [invitationStats] = useState({
    successfulInvitations: 0,
    giftCards: 0,
    viewingCards: 0,
  });

  const StatCard = ({ 
    title, 
    value, 
    icon 
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
  }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.statValue, { color: '#EF5350' }]}>
        {value}
      </Text>
      <Text style={[styles.statTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
    </View>
  );

  const UgandaFlag = () => (
    <View style={styles.flagContainer}>
      <View style={[styles.flagStripe, { backgroundColor: '#000000' }]} />
      <View style={[styles.flagStripe, { backgroundColor: '#FFFF00' }]} />
      <View style={[styles.flagStripe, { backgroundColor: '#FF0000' }]} />
      <View style={[styles.flagStripe, { backgroundColor: '#FFFF00' }]} />
      <View style={[styles.flagStripe, { backgroundColor: '#FF0000' }]} />
      <View style={[styles.flagStripe, { backgroundColor: '#000000' }]} />
      <View style={styles.flagCenter}>
        <View style={styles.flagCircle} />
      </View>
    </View>
  );

  const EmptyStateIllustration = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.illustrationContainer}>
        {/* Computer/Laptop illustration */}
        <View style={styles.laptopContainer}>
          <View style={[styles.laptopScreen, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.screenContent}>
              <View style={styles.screenDot} />
              <View style={styles.screenLine} />
              <View style={styles.screenLine} />
            </View>
          </View>
          <View style={[styles.laptopBase, { backgroundColor: theme.colors.textSecondary }]} />
        </View>
        
        {/* Floating elements */}
        <View style={styles.floatingElements}>
          <View style={[styles.floatingDot, { backgroundColor: '#4CAF50' }]} />
          <View style={[styles.floatingDot, { backgroundColor: '#2196F3' }]} />
          <View style={[styles.floatingDot, { backgroundColor: '#FF9800' }]} />
        </View>
        
        {/* Person illustration */}
        <View style={styles.personContainer}>
          <View style={[styles.personHead, { backgroundColor: '#FFB74D' }]} />
          <View style={[styles.personBody, { backgroundColor: '#EF5350' }]} />
        </View>
      </View>
      
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
        No invitation records
      </Text>
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
          Invite Friends
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Football Field Header */}
        <View style={styles.footballFieldContainer}>
          <View style={styles.fieldBackground}>
            {/* Stadium banners */}
            <View style={styles.stadiumBanner}>
              <Text style={styles.leagueText}>UGANDA</Text>
              <Text style={styles.leagueText}>PREMIER</Text>
              <Text style={styles.leagueText}>LEAGUE</Text>
              <Text style={styles.leagueText}>UGANDA</Text>
              <Text style={styles.leagueText}>PREMIER</Text>
            </View>
            
            {/* Football field */}
            <View style={styles.footballField}>
              <View style={styles.centerCircle}>
                <View style={styles.sportsIconsContainer}>
                  <View style={[styles.sportIcon, styles.sportIconTop]}>
                    <Text style={styles.sportEmoji}>⚽️</Text>
                  </View>
                  <View style={[styles.sportIcon, styles.sportIconRight]}>
                    <Text style={styles.sportEmoji}>🏀</Text>
                  </View>
                  <View style={[styles.sportIcon, styles.sportIconBottom]}>
                    <Text style={styles.sportEmoji}>🏉</Text>
                  </View>
                  <View style={[styles.sportIcon, styles.sportIconLeft]}>
                    <Text style={styles.sportEmoji}>🥊</Text>
                  </View>
                </View>
              </View>
              <View style={styles.fieldLines} />
            </View>
            
            {/* Uganda flags */}
            <View style={styles.flagsContainer}>
              <UgandaFlag />
              <UgandaFlag />
            </View>
          </View>
        </View>

        {/* Invitation Achievements Section */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Invitation Achievements</Text>
          </View>
          
          <View style={styles.statsMainContainer}>
            {/* Left side - Large Successful Invitations card */}
            <View style={styles.leftStatsContainer}>
              <View style={[styles.statCardLarge, { backgroundColor: '#FFF8E1' }]}>
                <Text style={[styles.statValueLarge, { color: '#EF5350' }]}>
                  {invitationStats.successfulInvitations}
                </Text>
                <Text style={[styles.statTitleLarge, { color: theme.colors.text }]}>
                  Successful Invitations
                </Text>
              </View>
            </View>
            
            {/* Right side - Stacked Gift Cards and Viewing Cards */}
            <View style={styles.rightStatsContainer}>
              <View style={[styles.statCardSmall, { backgroundColor: '#FFF8E1' }]}>
                <Text style={[styles.statValueSmall, { color: '#EF5350' }]}>
                  {invitationStats.giftCards}
                </Text>
                <Text style={[styles.statTitleSmall, { color: theme.colors.text }]}>
                  Gift Cards
                </Text>
              </View>
              
              <View style={[styles.statCardSmall, { backgroundColor: '#FFF8E1' }]}>
                <Text style={[styles.statValueSmall, { color: '#EF5350' }]}>
                  {invitationStats.viewingCards}
                </Text>
                <Text style={[styles.statTitleSmall, { color: theme.colors.text }]}>
                  Viewing Cards
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Empty State */}
        <EmptyStateIllustration />
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
  },
  headerPlaceholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  footballFieldContainer: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fieldBackground: {
    flex: 1,
    backgroundColor: '#4CAF50',
    position: 'relative',
  },
  stadiumBanner: {
    flexDirection: 'row',
    backgroundColor: '#FF5722',
    paddingVertical: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  leagueText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  footballField: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportsIconsContainer: {
    width: 60,
    height: 60,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportIcon: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportIconTop: {
    top: 0,
    left: 20,
  },
  sportIconRight: {
    top: 20,
    right: 0,
  },
  sportIconBottom: {
    bottom: 0,
    left: 20,
  },
  sportIconLeft: {
    top: 20,
    left: 0,
  },
  sportEmoji: {
    fontSize: 16,
  },
  fieldLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 8,
  },
  flagsContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flagContainer: {
    width: 30,
    height: 20,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  flagStripe: {
    flex: 1,
  },
  flagCenter: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagCircle: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
  },
  achievementsSection: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    backgroundColor: '#FF5722',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statsMainContainer: {
    flexDirection: 'row',
    gap: 16,
    height: 160,
  },
  leftStatsContainer: {
    flex: 1,
  },
  rightStatsContainer: {
    flex: 1,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  statCardLarge: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardSmall: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardEmpty: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  statValueLarge: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  statValueSmall: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 16,
  },
  statTitleLarge: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    lineHeight: 18,
  },
  statTitleSmall: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 14,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    width: 200,
    height: 150,
    position: 'relative',
    marginBottom: 20,
  },
  laptopContainer: {
    position: 'absolute',
    top: 20,
    left: 50,
    alignItems: 'center',
  },
  laptopScreen: {
    width: 80,
    height: 50,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 8,
  },
  screenContent: {
    flex: 1,
    justifyContent: 'space-around',
  },
  screenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BDBDBD',
    alignSelf: 'center',
  },
  screenLine: {
    height: 2,
    backgroundColor: '#BDBDBD',
    borderRadius: 1,
    marginVertical: 2,
  },
  laptopBase: {
    width: 90,
    height: 8,
    borderRadius: 4,
    marginTop: -2,
  },
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  personContainer: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    alignItems: 'center',
  },
  personHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  personBody: {
    width: 16,
    height: 24,
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
}); 