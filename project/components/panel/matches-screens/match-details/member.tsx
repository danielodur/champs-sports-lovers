import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Users, Crown, Star, MessageCircle, Trophy, Calendar } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface MemberProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  points: number;
  badge: string;
  matchesWatched: number;
  correctPredictions: number;
  favoriteTeam: string;
  joinedDate: string;
  isVIP: boolean;
  isPremium: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedDate: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface MatchDetailsMemberProps {
  homeTeamName?: string;
  awayTeamName?: string;
  matchId?: string;
}

export default function MatchDetailsMember({
  homeTeamName = 'Home',
  awayTeamName = 'Away',
  matchId,
}: MatchDetailsMemberProps) {
  const theme = useTheme();

  // Generate sample member data
  const generateMemberProfile = (): MemberProfile => ({
    id: '1',
    name: 'Football Fan Pro',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    level: 42,
    points: 15680,
    badge: 'Elite Predictor',
    matchesWatched: 347,
    correctPredictions: 189,
    favoriteTeam: homeTeamName,
    joinedDate: '2022-08-15',
    isVIP: true,
    isPremium: true,
  });

  const generateAchievements = (): Achievement[] => [
    {
      id: '1',
      title: 'First Goal Predictor',
      description: 'Predicted first goal in 10 matches',
      icon: '⚽',
      unlockedDate: '2024-01-15',
      rarity: 'rare',
    },
    {
      id: '2',
      title: 'Streak Master',
      description: 'Correct predictions for 5 matches in a row',
      icon: '🔥',
      unlockedDate: '2024-01-10',
      rarity: 'epic',
    },
    {
      id: '3',
      title: 'Match Enthusiast',
      description: 'Watched 100 live matches',
      icon: '📺',
      unlockedDate: '2023-12-20',
      rarity: 'common',
    },
    {
      id: '4',
      title: 'Social Butterfly',
      description: 'Posted 50 match comments',
      icon: '💬',
      unlockedDate: '2023-11-30',
      rarity: 'rare',
    },
    {
      id: '5',
      title: 'Legend Status',
      description: 'Reached level 40',
      icon: '👑',
      unlockedDate: '2024-01-01',
      rarity: 'legendary',
    },
  ];

  const generateLeaderboard = () => [
    {
      rank: 1,
      name: 'Soccer Genius',
      points: 22450,
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    },
    {
      rank: 2,
      name: 'Match Prophet',
      points: 19830,
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
    },
    {
      rank: 3,
      name: 'Goal Hunter',
      points: 18960,
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
    },
    {
      rank: 4,
      name: 'Football Fan Pro',
      points: 15680,
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      isCurrentUser: true,
    },
    {
      rank: 5,
      name: 'Stadium Expert',
      points: 14220,
      avatar: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg',
    },
  ];

  const member = generateMemberProfile();
  const achievements = generateAchievements();
  const leaderboard = generateLeaderboard();

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return '#94a3b8';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const renderAchievement = (achievement: Achievement) => (
    <View
      key={achievement.id}
      style={[
        styles.achievementItem,
        {
          backgroundColor: theme.colors.backgroundSecondary,
          borderLeftColor: getRarityColor(achievement.rarity),
        },
      ]}
    >
      <View style={styles.achievementIcon}>
        <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
      </View>
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
          {achievement.title}
        </Text>
        <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
          {achievement.description}
        </Text>
        <Text style={[styles.achievementDate, { color: getRarityColor(achievement.rarity) }]}>
          Unlocked {achievement.unlockedDate}
        </Text>
      </View>
    </View>
  );

  const renderLeaderboardItem = (item: any) => (
    <View
      key={item.rank}
      style={[
        styles.leaderboardItem,
        {
          backgroundColor: item.isCurrentUser
            ? `${theme.colors.primary}20`
            : theme.colors.backgroundSecondary,
          borderColor: item.isCurrentUser ? theme.colors.primary : 'transparent',
        },
      ]}
    >
      <View style={styles.rankBadge}>
        {item.rank <= 3 ? (
          <Text style={styles.rankEmoji}>
            {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
          </Text>
        ) : (
          <Text style={[styles.rankNumber, { color: theme.colors.textSecondary }]}>
            #{item.rank}
          </Text>
        )}
      </View>

      <Image source={{ uri: item.avatar }} style={styles.leaderboardAvatar} />

      <View style={styles.leaderboardInfo}>
        <Text style={[styles.leaderboardName, { color: theme.colors.text }]}>
          {item.name}
          {item.isCurrentUser && <Text style={styles.youLabel}> (You)</Text>}
        </Text>
        <Text style={[styles.leaderboardPoints, { color: theme.colors.primary }]}>
          {item.points.toLocaleString()} pts
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Member Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
            {member.isVIP && (
              <View style={styles.vipBadge}>
                <Crown size={16} color="#FFD700" />
              </View>
            )}
          </View>

          <View style={styles.memberInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.memberName, { color: theme.colors.text }]}>
                {member.name}
              </Text>
              {member.isPremium && (
                <View style={[styles.premiumBadge, { backgroundColor: theme.colors.primary }]}>
                  <Star size={12} color="#FFFFFF" />
                  <Text style={styles.premiumText}>PRO</Text>
                </View>
              )}
            </View>

            <Text style={[styles.memberBadge, { color: theme.colors.primary }]}>
              {member.badge}
            </Text>

            <View style={styles.levelContainer}>
              <Text style={[styles.levelText, { color: theme.colors.textSecondary }]}>
                Level {member.level} • {member.points.toLocaleString()} pts
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Stats
          </Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                {member.matchesWatched}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Matches Watched
              </Text>
            </View>

            <View style={[styles.statItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Trophy size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                {member.correctPredictions}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Correct Predictions
              </Text>
            </View>

            <View style={[styles.statItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Star size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                {Math.round((member.correctPredictions / member.matchesWatched) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Accuracy Rate
              </Text>
            </View>

            <View style={[styles.statItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Users size={20} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                #{leaderboard.find(item => item.isCurrentUser)?.rank || 'N/A'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Global Rank
              </Text>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Achievements ({achievements.length})
          </Text>

          {achievements.map(renderAchievement)}
        </View>

        {/* Leaderboard Section */}
        <View style={styles.leaderboardContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Weekly Leaderboard
          </Text>

          {leaderboard.map(renderLeaderboardItem)}
        </View>

        {/* Member Since */}
        <View style={styles.memberSinceContainer}>
          <Text style={[styles.memberSinceText, { color: theme.colors.textSecondary }]}>
            Member since {new Date(member.joinedDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long'
            })}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  memberAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  vipBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#000',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  memberBadge: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  achievementsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  achievementItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  leaderboardContainer: {
    padding: 20,
    paddingTop: 0,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  rankBadge: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankEmoji: {
    fontSize: 20,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  youLabel: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  leaderboardPoints: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginTop: 2,
  },
  memberSinceContainer: {
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
  },
  memberSinceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});
