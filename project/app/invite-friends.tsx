import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Share2, Gift, Trophy, Users, Target, Star, ArrowRight, ChevronRight, MessageCircle, Phone, X, MessageSquare } from 'lucide-react-native';
import { useTheme, useThemeMode } from '@/hooks/useTheme';
import { BlurView } from 'expo-blur';

export default function InviteFriendsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  
  // State for user's invitation data
  const [invitationStats, setInvitationStats] = useState({
    successfulInvitations: 0,
    speedVouchers: 0,
    viewingCards: 0,
    weeklyShares: 0,
  });

  // State for share modal
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShareInvitation = () => {
    setShowShareModal(true);
  };

  const handleShareOption = (platform: string) => {
    setShowShareModal(false);
    Alert.alert(
      'Share Invitation',
      `Sharing via ${platform}`,
      [{ text: 'OK' }]
    );
  };

  const ShareModal = () => (
    <Modal
      visible={showShareModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowShareModal(false)}
    >
      <View style={styles.modalOverlay}>
        <BlurView 
          intensity={80} 
          style={styles.blurBackground}
          tint={themeMode === 'dark' || (themeMode === 'system' && theme.colors.background === '#121212') ? 'dark' : 'light'}
        >
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowShareModal(false)}
          />
        </BlurView>
        <View style={[styles.shareModalContainer, { backgroundColor: theme.colors.background }]}>
          {/* Modal Content */}
          <View style={styles.shareModalContent}>
            {/* Share Options */}
            <View style={styles.shareOptionsContainer}>
              {/* Facebook */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareOption('Facebook')}
                activeOpacity={0.7}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: '#1877F2' }]}>
                  <Text style={styles.shareIconText}>f</Text>
                </View>
                <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>
                  Facebook
                </Text>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareOption('WhatsApp')}
                activeOpacity={0.7}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
                  <View style={styles.whatsappIcon}>
                    <View style={styles.whatsappBubble}>
                      <Phone size={16} color="#25D366" style={styles.whatsappPhone} />
                    </View>
                  </View>
                </View>
                <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>

              {/* SMS/Phone */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareOption('SMS')}
                activeOpacity={0.7}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: '#007AFF' }]}>
                  <MessageSquare size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>
                  SMS
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.backgroundSecondary }]}
              onPress={() => setShowShareModal(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const handleWeeklyShare = () => {
    Alert.alert(
      'Weekly Share',
      'Share this week to earn viewing cards!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => {
          setInvitationStats(prev => ({
            ...prev,
            weeklyShares: prev.weeklyShares + 1,
            viewingCards: prev.viewingCards + 1
          }));
        }}
      ]
    );
  };

  const InvitationCard = ({ 
    icon, 
    title, 
    subtitle, 
    reward, 
    onPress, 
    completed = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    reward: string;
    onPress?: () => void;
    completed?: boolean;
  }) => (
    <View
      style={[
        styles.invitationCard,
        { backgroundColor: theme.colors.backgroundSecondary },
        completed && styles.completedCard
      ]}
    >
      <View style={styles.cardIcon}>
        {icon}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
        <Text style={[styles.cardReward, { color: '#EF5350' }]}>
          {reward}
        </Text>
      </View>
    </View>
  );

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
      <View style={styles.statIcon}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: '#EF5350' }]}>
        {value}
      </Text>
      <Text style={[styles.statTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
    </View>
  );

  const StrategyStep = ({ 
    number, 
    icon, 
    title, 
    isLast = false 
  }: {
    number: number;
    icon: React.ReactNode;
    title: string;
    isLast?: boolean;
  }) => (
    <View style={styles.strategyStep}>
      <View style={styles.stepContainer}>
        <View style={styles.stepIconWrapper}>
          <View style={styles.stepIcon}>
            {icon}
          </View>
        </View>
        <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
      </View>
      {!isLast && (
        <View style={styles.stepConnector}>
          <View style={styles.arrowContainer}>
            <ChevronRight size={16} color="#FF9800" />
            <ChevronRight size={16} color="#FF9800" style={styles.arrowSecond} />
          </View>
        </View>
      )}
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
        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Invite Friends</Text>
            <Text style={styles.bannerSubtitle}>Get Rewards & Watch Matches for Free</Text>
            <View style={styles.bannerDecoration}>
              <Trophy size={24} color="#FFD700" />
              <Star size={20} color="#FF4444" />
              <Gift size={22} color="#FFD700" />
            </View>
          </View>
        </View>

        {/* Football Teams Banner */}
        <View style={styles.teamsBanner}>
          <Text style={[styles.teamsText, { color: theme.colors.text }]}>
            Featuring Top Football Leagues
          </Text>
          <View style={styles.teamsContainer}>
            {/* Real Team Logos */}
            <View style={styles.teamLogoContainer}>
              <Image 
                source={{ uri: 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/manchester-united.png' }} 
                style={styles.teamLogoImage}
              />
              <Text style={styles.teamText}>EPL</Text>
            </View>
            <View style={styles.teamLogoContainer}>
              <Image 
                source={{ uri: 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/la-liga/real-madrid.png' }} 
                style={styles.teamLogoImage}
              />
              <Text style={styles.teamText}>UCL</Text>
            </View>
            <View style={styles.teamLogoContainer}>
              <Image 
                source={{ uri: 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/bundesliga/bayern-munich.png' }} 
                style={styles.teamLogoImage}
              />
              <Text style={styles.teamText}>BUN</Text>
            </View>
            <View style={styles.teamLogoContainer}>
              <Image 
                source={{ uri: 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/serie-a/juventus.png' }} 
                style={styles.teamLogoImage}
              />
              <Text style={styles.teamText}>SER</Text>
            </View>
          </View>
        </View>

        {/* Invitation Tasks */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Invitation Tasks
          </Text>
          
          <InvitationCard
            icon={<Share2 size={24} color="#4CAF50" />}
            title="Share Activity"
            subtitle={`Weekly shares: ${invitationStats.weeklyShares}/1`}
            reward="Earn 1 viewing card per week"
            completed={invitationStats.weeklyShares >= 1}
          />

          <InvitationCard
            icon={<Users size={24} color="#2196F3" />}
            title="Invite Friends"
            subtitle="Each successful invitation earns rewards"
            reward="Get vouchers + viewing card"
          />
        </View>

        {/* Share Invitation Button */}
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleShareInvitation}
          activeOpacity={0.8}
        >
          <Text style={styles.shareButtonText}>Invite Friends</Text>
        </TouchableOpacity>

        {/* Invitation Achievements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Invitation Achievements
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Successful Invitations"
              value={invitationStats.successfulInvitations}
              icon={<Trophy size={20} color="#FFD700" />}
            />
            <StatCard
              title="SportWee Vouchers"
              value={invitationStats.speedVouchers}
              icon={<Target size={20} color="#4CAF50" />}
            />
            <StatCard
              title="Viewing Cards"
              value={invitationStats.viewingCards}
              icon={<Star size={20} color="#2196F3" />}
            />
          </View>

          <TouchableOpacity 
            style={styles.viewRecordsButton}
            onPress={() => router.push('/invite-records')}
          >
            <Text style={[styles.viewRecordsText, { color: theme.colors.textSecondary }]}>
              View Records
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invitation Strategy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Invitation Strategy
          </Text>
          
          <View style={styles.strategyContainer}>
            <StrategyStep
              number={1}
              icon={<Share2 size={18} color="#FFFFFF" />}
              title="Share to Friends"
            />
            <StrategyStep
              number={2}
              icon={<Users size={18} color="#FFFFFF" />}
              title="Friend Registers Successfully"
            />
            <StrategyStep
              number={3}
              icon={<Gift size={18} color="#FFFFFF" />}
              title="Rewards Auto-Distributed"
              isLast={true}
            />
          </View>

          <View style={styles.strategyInfo}>
            <View style={styles.infoItem}>
              <View style={styles.infoBullet} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Share with your sports-loving friends and get 1 viewing card immediately.🔥
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoBullet} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
             Invitation rewards will be automatically issued after successful registration.🔥
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Share Modal */}
      <ShareModal />
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
  heroBanner: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerContent: {
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 16,
  },
  bannerDecoration: {
    flexDirection: 'row',
    gap: 12,
  },
  teamsBanner: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  teamsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 12,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  teamLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  teamText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.7,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  cardReward: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  shareButton: {
    marginHorizontal: 16,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 16,
  },
  viewRecordsButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewRecordsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textDecorationLine: 'underline',
  },
  strategyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  strategyStep: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 100,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepIconWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  stepIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF5350',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF5350',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    lineHeight: 18,
    color: '#333333',
    flexWrap: 'wrap',
    width: '100%',
  },
  stepConnector: {
    position: 'absolute',
    right: -25,
    top: 30,
    zIndex: 1,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowSecond: {
    marginLeft: -4,
  },
  strategyInfo: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF5350',
    marginTop: 6,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  blurBackground: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
  },
  shareModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  shareModalContent: {
    paddingHorizontal: 20,
  },
  shareOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  shareOption: {
    alignItems: 'center',
    flex: 1,
  },
  shareIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  shareIconText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  shareOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  
  // WhatsApp Icon Styles
  whatsappIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappBubble: {
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-15deg' }],
  },
  whatsappPhone: {
    transform: [{ rotate: '15deg' }],
  },
}); 