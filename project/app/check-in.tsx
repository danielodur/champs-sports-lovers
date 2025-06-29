import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Platform,
  Image,
  Animated,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Gift, Star, Trophy, Coins, Calendar, Clock, Users, MessageCircle, Eye, Share, CircleCheck as CheckCircle, Target, Zap, Award, TrendingUp, BarChart3, Shield, Crown, Wallet, ArrowRight, Plus, Sparkles, Timer, Play, Settings, Bell, BellOff } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import useAuth from '@/hooks/useAuth';

// Generate professional realistic avatar using Dicebear adventurer style
const generateProfessionalAvatar = (seed: string) => {
  // Generate consistent background colors for professional look
  const backgroundColors = ['ffdfbf', 'f0f0f0', 'e8f4fd', 'fff2e6', 'f8f8ff', 'f0fff0', 'fffacd', 'f5f5dc'];
  const seedHash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const colorIndex = Math.abs(seedHash) % backgroundColors.length;
  const backgroundColor = backgroundColors[colorIndex];
  
  // Use Dicebear adventurer style for realistic professional avatars
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor}&size=160`;
};

interface UserStats {
  totalPoints: number;
  appCoins: number;
  level: number;
  checkInStreak: number;
  todayCheckedIn: boolean;
  nextLevelPoints: number;
  currentLevelPoints: number;
}

interface CheckInReward {
  day: number;
  points: number;
  appCoins?: number;
  bonus?: string;
  claimed: boolean;
  isToday: boolean;
}

interface DailyTask {
  id: string;
  title: string;
  description: string;
  points: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  icon: any;
  color: string;
  action: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: any;
  color: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export default function CheckInScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isLoggedIn, userInfo } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [savedProfilePicture, setSavedProfilePicture] = useState<string | null>(null);

  // Load saved profile picture
  useEffect(() => {
    if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.profilePicture) {
      setSavedProfilePicture(global.savedProfileData.personalInfo.profilePicture);
    }
  }, []);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // User stats and progress - Starting with 0 points
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    appCoins: 0,
    level: 1,
    checkInStreak: 0,
    todayCheckedIn: false,
    nextLevelPoints: 100,
    currentLevelPoints: 0
  });

  // Check-in rewards for 7 days
  const [checkInRewards, setCheckInRewards] = useState<CheckInReward[]>([
    { day: 1, points: 10, claimed: false, isToday: true },
    { day: 2, points: 15, appCoins: 1, claimed: false, isToday: false },
    { day: 3, points: 20, claimed: false, isToday: false },
    { day: 4, points: 25, appCoins: 2, bonus: 'Voucher Card', claimed: false, isToday: false },
    { day: 5, points: 30, claimed: false, isToday: false },
    { day: 6, points: 35, appCoins: 3, claimed: false, isToday: false },
    { day: 7, points: 50, appCoins: 5, bonus: 'Premium Voucher', claimed: false, isToday: false }
  ]);

  // Daily tasks
  const dailyTasks: DailyTask[] = [
    {
      id: 'player-rating',
      title: 'Player Rating',
      description: 'Rate players in matches',
      points: 3,
      progress: 0,
      maxProgress: 3,
      completed: false,
      icon: Star,
      color: '#FFD700',
      action: () => console.log('Navigate to player rating')
    },
    {
      id: 'chat-participate',
      title: 'Chat Participation',
      description: 'Participate in match discussions',
      points: 5,
      progress: 0,
      maxProgress: 5,
      completed: false,
      icon: MessageCircle,
      color: '#4CAF50',
      action: () => console.log('Navigate to chat')
    },
    {
      id: 'news-reading',
      title: 'News Reading',
      description: 'Read sports news articles',
      points: 3,
      progress: 0,
      maxProgress: 10,
      completed: false,
      icon: Eye,
      color: '#2196F3',
      action: () => router.push('/(tabs)/news')
    },
    {
      id: 'watch-videos',
      title: 'Watch Videos',
      description: 'Watch sports highlight videos',
      points: 5,
      progress: 0,
      maxProgress: 5,
      completed: false,
      icon: Play,
      color: '#FF9800',
      action: () => console.log('Navigate to videos')
    },
    {
      id: 'like-content',
      title: 'Like Content',
      description: 'Like posts and articles',
      points: 5,
      progress: 0,
      maxProgress: 10,
      completed: false,
      icon: Trophy,
      color: '#E91E63',
      action: () => console.log('Navigate to content')
    },
    {
      id: 'daily-share',
      title: 'Daily Share',
      description: 'Share content with friends',
      points: 5,
      progress: 0,
      maxProgress: 5,
      completed: false,
      icon: Share,
      color: '#607D8B',
      action: () => console.log('Navigate to share')
    }
  ];

  // Other tasks (one-time or special)
  const otherTasks = [
    {
      id: 'real-name-verification',
      title: 'Real Name Verification',
      description: 'Improve account security',
      points: 200,
      completed: false,
      icon: Shield,
      color: '#4CAF50',
      action: () => router.push('/user-id')
    },
    {
      id: 'vip-membership',
      title: 'VIP Membership',
      description: 'VIP exclusive benefits',
      points: 200,
      appCoins: 3,
      completed: false,
      icon: Crown,
      color: '#FFD700',
      action: () => router.push('/activate-vip')
    },
    {
      id: 'coin-recharge',
      title: 'Coin Recharge',
      description: 'Daily limit: 100 points',
      points: 1,
      appCoins: 1,
      completed: false,
      icon: Coins,
      color: '#FF9800',
      action: () => router.push('/Coins')
    }
  ];

  // Achievements
  const achievements: Achievement[] = [
    {
      id: 'first-check-in',
      title: 'First Check-in',
      description: 'Complete your first daily check-in',
      points: 50,
      icon: Calendar,
      color: '#4CAF50',
      unlocked: false,
      progress: 0,
      maxProgress: 1
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Check-in for 7 consecutive days',
      points: 500,
      icon: Trophy,
      color: '#FFD700',
      unlocked: false,
      progress: 0,
      maxProgress: 7
    },
    {
      id: 'social-butterfly',
      title: 'Social Butterfly',
      description: 'Participate in 50 chat discussions',
      points: 300,
      icon: MessageCircle,
      color: '#E91E63',
      unlocked: false,
      progress: 0,
      maxProgress: 50
    },
    {
      id: 'news-reader',
      title: 'News Expert',
      description: 'Read 100 news articles',
      points: 250,
      icon: Eye,
      color: '#2196F3',
      unlocked: false,
      progress: 0,
      maxProgress: 100
    }
  ];

  React.useEffect(() => {
    // Pulse animation for check-in button
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    // Sparkle animation
    const sparkle = () => {
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => sparkle());
    };

    // Check initial notification permission
    const checkNotificationPermission = () => {
      if (Platform.OS === 'web' && 'Notification' in window) {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    };

    pulse();
    sparkle();
    checkNotificationPermission();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const formatUGX = (appCoins: number): string => {
    const ugxAmount = appCoins * 100; // 100 AppCoins = standard UGX amount
    return `UGX ${ugxAmount.toLocaleString('en-UG')}`;
  };

  const handleCheckIn = () => {
    if (userStats.todayCheckedIn) {
      Alert.alert('Already Checked In', 'You have already checked in today. Come back tomorrow!');
      return;
    }

    const todayReward = checkInRewards.find(reward => reward.isToday);
    if (!todayReward) return;

    // Update user stats
    setUserStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + todayReward.points + (todayReward.appCoins ? todayReward.appCoins * 100 : 0),
      appCoins: prev.appCoins + (todayReward.appCoins || 0),
      checkInStreak: prev.checkInStreak + 1,
      todayCheckedIn: true
    }));

    // Update check-in rewards
    setCheckInRewards(prev => 
      prev.map(reward => 
        reward.isToday ? { ...reward, claimed: true } : reward
      )
    );

    // Show reward animation
    setShowRewardAnimation(true);
    setTimeout(() => setShowRewardAnimation(false), 3000);

    Alert.alert(
      'Check-in Successful!',
      `You earned ${todayReward.points} points${todayReward.appCoins ? ` and ${todayReward.appCoins} AppCoins` : ''}!\n\nStreak: ${userStats.checkInStreak + 1} days`,
      [{ text: 'Great!' }]
    );
  };

  const handleTaskAction = (task: DailyTask) => {
    if (task.completed) {
      Alert.alert('Task Completed', 'You have already completed this task today.');
      return;
    }
    task.action();
  };

  const handleConvertPoints = () => {
    if (userStats.totalPoints < 500) {
      Alert.alert(
        'Insufficient Points',
        'You need at least 500 points to convert to AppCoins.\n\n100 points = 1 AppCoin',
        [{ text: 'OK' }]
      );
      return;
    }

    const maxConversion = Math.floor(userStats.totalPoints / 100);
    Alert.alert(
      'Convert Points to AppCoins',
      `Convert points to AppCoins?\n\nRate: 100 points = 1 AppCoin\nYou can convert up to ${maxConversion} AppCoins\n\nAppCoins can be used to:\n• Purchase avatars (50-500 AppCoins)\n• Withdraw as UGX (100 AppCoins minimum)`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Convert', 
          onPress: () => {
            // For demo, convert 500 points to 5 AppCoins
            const pointsToConvert = 500;
            const appCoinsToAdd = 5;
            
            setUserStats(prev => ({
              ...prev,
              totalPoints: prev.totalPoints - pointsToConvert,
              appCoins: prev.appCoins + appCoinsToAdd
            }));
            
            Alert.alert('Success', `Converted ${pointsToConvert} points to ${appCoinsToAdd} AppCoins!`);
          }
        }
      ]
    );
  };

  const handleWithdrawAppCoins = () => {
    if (userStats.appCoins < 100) {
      Alert.alert(
        'Insufficient AppCoins',
        `You need at least 100 AppCoins to withdraw.\n\nCurrent balance: ${userStats.appCoins} AppCoins\nMinimum withdrawal: 100 AppCoins`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Withdraw AppCoins',
      `Withdraw ${userStats.appCoins} AppCoins as ${formatUGX(userStats.appCoins)}?\n\nThis will be transferred to your wallet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Withdraw', 
          onPress: () => {
            Alert.alert('Success', `${formatUGX(userStats.appCoins)} has been transferred to your wallet!`);
            setUserStats(prev => ({ ...prev, appCoins: 0 }));
          }
        }
      ]
    );
  };

  const handleNotificationSettings = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, show browser notification permission
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            setNotificationsEnabled(!notificationsEnabled);
            Alert.alert(
              notificationsEnabled ? 'Notifications Disabled' : 'Notifications Enabled',
              notificationsEnabled 
                ? 'You will no longer receive notifications.' 
                : 'You will now receive notifications about check-ins and rewards.'
            );
          } else {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              setNotificationsEnabled(true);
              Alert.alert('Success', 'Notifications enabled successfully! You will receive reminders about daily check-ins and rewards.');
            } else {
              Alert.alert('Permission Denied', 'Please enable notifications in your browser settings to receive daily check-in reminders.');
              setNotificationsEnabled(false);
            }
          }
        } else {
          Alert.alert('Not Supported', 'Notifications are not supported in this browser.');
          setNotificationsEnabled(false);
        }
      } else {
        // For mobile, open device settings with confirmation
        Alert.alert(
          'Notification Settings',
          'Opening device settings. Please enable notifications for this app to receive daily check-in reminders and reward notifications.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: async () => {
                await Linking.openSettings();
                // Simulate checking permission after returning from settings
                setTimeout(() => {
                  Alert.alert(
                    'Settings Updated',
                    'Did you enable notifications?',
                    [
                      { 
                        text: 'No', 
                        onPress: () => setNotificationsEnabled(false)
                      },
                      { 
                        text: 'Yes', 
                        onPress: () => setNotificationsEnabled(true)
                      }
                    ]
                  );
                }, 1000);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening notification settings:', error);
      Alert.alert('Error', 'Unable to open notification settings. Please check your device settings manually.');
      setNotificationsEnabled(false);
    }
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
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Check-in Center</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderUserStats = () => (
    <View style={[styles.userStatsCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.userProfile}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
          style={styles.profileImageContainer}
        >
          <Image
            source={{ 
              uri: savedProfilePicture || (isLoggedIn && userInfo?.username 
                ? generateProfessionalAvatar(userInfo.username)
                : generateProfessionalAvatar('DefaultUser'))
            }}
            style={styles.userAvatar}
          />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <View style={styles.pointsContainer}>
            <Text style={[styles.pointsAmount, { color: theme.colors.text }]}>
              {userStats.totalPoints.toLocaleString()}
            </Text>
            <Text style={[styles.pointsLabel, { color: theme.colors.textSecondary }]}>points</Text>
            <TouchableOpacity 
              onPress={() => router.push('/store')}
              style={styles.pointsArrow}
              activeOpacity={0.7}
            >
              <ArrowRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.levelContainer}>
            <Text style={[styles.levelText, { color: theme.colors.textSecondary }]}>
              Lv {userStats.level}
            </Text>
            <Text style={[styles.levelProgress, { color: theme.colors.textSecondary }]}>
              Distance to upgrade: {userStats.nextLevelPoints - userStats.totalPoints}
            </Text>
          </View>
        </View>
        <View style={styles.streakContainer}>
          <View style={styles.streakInfo}>
            <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              Continuous check-in, rewards keep coming
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationToggle}
            onPress={handleNotificationSettings}
            activeOpacity={0.7}
          >
            <View style={styles.notificationRow}>
              <Text style={[styles.notificationLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                Notifications
              </Text>
              <View style={[styles.toggle, { backgroundColor: notificationsEnabled ? '#4CAF50' : '#E0E0E0' }]}>
                {notificationsEnabled ? (
                  <Bell size={12} color="#FFFFFF" />
                ) : (
                  <BellOff size={12} color="#757575" />
                )}
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <ArrowRight size={14} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCheckInRewards = () => (
    <View style={styles.checkInSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Daily Check-in Rewards
      </Text>
      <View style={styles.checkInGrid}>
        {checkInRewards.map((reward) => (
          <View
            key={reward.day}
            style={[
              styles.checkInDay,
              { backgroundColor: theme.colors.background },
              reward.claimed && styles.claimedDay,
              reward.isToday && styles.todayDay
            ]}
          >
            <Text style={[styles.dayNumber, { color: theme.colors.textSecondary }]}>
              Day {reward.day}
            </Text>
            <View style={styles.rewardIcon}>
              {reward.appCoins ? (
                <Star size={24} color="#FFD700" />
              ) : (
                <Coins size={24} color="#FF9800" />
              )}
            </View>
            <Text style={[styles.rewardText, { color: theme.colors.textSecondary }]}>
              {reward.appCoins ? `${reward.appCoins} AppCoins` : `${reward.points} points`}
            </Text>
            {reward.bonus && (
              <View style={[styles.bonusCard, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.bonusText}>Voucher</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderAppCoinsSection = () => (
    <View style={[styles.appCoinsSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.appCoinsHeader}>
        <Coins size={24} color="#FFD700" />
        <Text style={[styles.appCoinsTitle, { color: theme.colors.text }]}>
          AppCoins Tasks
        </Text>
        <View style={styles.starIcon}>
          <Star size={20} color="#FFD700" />
        </View>
      </View>
      
      <View style={styles.appCoinsGrid}>
        <TouchableOpacity 
          style={[styles.appCoinsTask, { backgroundColor: theme.colors.background }]}
          onPress={() => console.log('Game center visit')}
        >
          <View style={styles.taskIcon}>
            <Target size={24} color="#FF9800" />
          </View>
          <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
            Game Center Visit (20s)
          </Text>
          <Text style={[styles.taskReward, { color: theme.colors.primary }]}>
            +5 AppCoins
          </Text>
          <Text style={[styles.taskProgress, { color: theme.colors.textSecondary }]}>
            0/1
          </Text>
          <TouchableOpacity style={[styles.taskButton, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.taskButtonText}>Visit</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.appCoinsTask, { backgroundColor: theme.colors.background }]}
          onPress={() => console.log('Game daily login')}
        >
          <View style={styles.taskIcon}>
            <Calendar size={24} color="#4CAF50" />
          </View>
          <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
            Game Daily Login
          </Text>
          <Text style={[styles.taskReward, { color: theme.colors.primary }]}>
            +5 AppCoins
          </Text>
          <Text style={[styles.taskProgress, { color: theme.colors.textSecondary }]}>
            0/1
          </Text>
          <TouchableOpacity style={[styles.taskButton, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.taskButtonText}>Login</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDailyTasks = () => (
    <View style={styles.dailyTasksSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Daily Tasks
      </Text>
      
      <View style={styles.tasksList}>
        {dailyTasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskItem, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={() => handleTaskAction(task)}
            activeOpacity={0.7}
          >
            <View style={[styles.taskIconContainer, { backgroundColor: task.color }]}>
              <task.icon size={20} color="#FFFFFF" />
            </View>
            <View style={styles.taskDetails}>
              <Text style={[styles.taskName, { color: theme.colors.text }]}>
                {task.title}
              </Text>
              <Text style={[styles.taskRewardPoints, { color: theme.colors.primary }]}>
                +{task.points} points
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(task.progress / task.maxProgress) * 100}%`,
                      backgroundColor: task.color 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                {task.progress}/{task.maxProgress}
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: task.completed ? theme.colors.textSecondary : theme.colors.primary 
                }
              ]}
              disabled={task.completed}
            >
              <Text style={styles.actionButtonText}>
                {task.completed ? 'Completed' : 'Go'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOtherTasks = () => (
    <View style={styles.otherTasksSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Other Tasks
      </Text>
      
      <View style={styles.tasksList}>
        {otherTasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskItem, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={task.action}
            activeOpacity={0.7}
          >
            <View style={[styles.taskIconContainer, { backgroundColor: task.color }]}>
              <task.icon size={20} color="#FFFFFF" />
            </View>
            <View style={styles.taskDetails}>
              <Text style={[styles.taskName, { color: theme.colors.text }]}>
                {task.title}
              </Text>
              <Text style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
                {task.description}
              </Text>
              <Text style={[styles.taskRewardPoints, { color: theme.colors.primary }]}>
                {task.points} points{task.appCoins ? ` (Annual: ${task.appCoins * 100} points)` : ''}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderConversionInfo = () => (
    <View style={[styles.conversionSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.conversionHeader}>
        <Wallet size={24} color={theme.colors.primary} />
        <Text style={[styles.conversionTitle, { color: theme.colors.text }]}>
          Points & AppCoins
        </Text>
      </View>
      
      <View style={styles.conversionStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {userStats.totalPoints.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Total Points
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {userStats.appCoins}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            AppCoins
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {formatUGX(userStats.appCoins)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            UGX Value
          </Text>
        </View>
      </View>
      
      <View style={styles.conversionActions}>
        <TouchableOpacity
          style={[styles.conversionButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleConvertPoints}
        >
          <Text style={styles.conversionButtonText}>Convert Points</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.conversionButton, { backgroundColor: '#4CAF50' }]}
          onPress={handleWithdrawAppCoins}
        >
          <Text style={styles.conversionButtonText}>Withdraw UGX</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.conversionNote, { color: theme.colors.textSecondary }]}>
        100 points = 1 AppCoin • 100 AppCoins = Standard UGX amount
      </Text>
    </View>
  );

  const renderCheckInButton = () => {
    if (userStats.todayCheckedIn) {
      return (
        <View style={[styles.checkInButton, { backgroundColor: theme.colors.textSecondary }]}>
          <CheckCircle size={24} color="#FFFFFF" />
          <Text style={styles.checkInButtonText}>Checked In Today</Text>
        </View>
      );
    }

    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[styles.checkInButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCheckIn}
          activeOpacity={0.8}
        >
          <Calendar size={24} color="#FFFFFF" />
          <Text style={styles.checkInButtonText}>Check In Now</Text>
          <Animated.View 
            style={[
              styles.sparkleContainer,
              { opacity: sparkleAnim }
            ]}
          >
            <Sparkles size={20} color="#FFD700" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderUserStats()}
        {renderCheckInRewards()}
        {renderAppCoinsSection()}
        {renderDailyTasks()}
        {renderOtherTasks()}
        {renderConversionInfo()}
        
        <View style={styles.checkInButtonContainer}>
          {renderCheckInButton()}
        </View>
      </ScrollView>

      {/* Reward Animation Overlay */}
      {showRewardAnimation && (
        <View style={styles.rewardOverlay}>
          <View style={styles.rewardAnimation}>
            <Trophy size={64} color="#FFD700" />
            <Text style={styles.rewardAnimationText}>
              Congratulations! You earned rewards!
            </Text>
            <Text style={styles.rewardAnimationSubtext}>
              Consecutive check-in: {userStats.checkInStreak} days
            </Text>
          </View>
        </View>
      )}
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
  headerRight: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  userStatsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsAmount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  pointsLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  pointsArrow: {
    padding: 4,
  },
  levelContainer: {
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  levelProgress: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  streakContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 8,
    maxWidth: 160,
  },
  streakInfo: {
    alignItems: 'flex-end',
    marginBottom: 12,
    maxWidth: '100%',
  },
  streakLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
    lineHeight: 14,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  notificationToggle: {
    alignItems: 'flex-end',
    width: '100%',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'flex-end',
  },
  notificationLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    marginRight: 6,
    flexShrink: 0,
  },
  toggle: {
    width: 32,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
  },
  checkInSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  checkInGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  checkInDay: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  claimedDay: {
    backgroundColor: '#FFD700',
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#EF5350',
  },
  dayNumber: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  rewardIcon: {
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  bonusCard: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bonusText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  appCoinsSection: {
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
  appCoinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appCoinsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    flex: 1,
  },
  starIcon: {
    marginLeft: 8,
  },
  appCoinsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  appCoinsTask: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  taskIcon: {
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 4,
  },
  taskReward: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  taskProgress: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  taskButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskButtonText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  dailyTasksSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  otherTasksSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  taskRewardPoints: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  conversionSection: {
    margin: 16,
    padding: 20,
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
  conversionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  conversionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  conversionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  conversionActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  conversionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  conversionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  conversionNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  checkInButtonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  checkInButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -8,
    right: 20,
  },
  rewardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  rewardAnimation: {
    alignItems: 'center',
    padding: 40,
  },
  rewardAnimationText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  rewardAnimationSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});