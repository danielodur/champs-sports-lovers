import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Vibration, Dimensions } from 'react-native';
import { useMatchSettings } from '@/contexts/MatchSettingsContext';
import { useTheme } from '@/hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CompactGoalAlertProps {
  notification: any;
  index: number;
  totalNotifications: number;
}

// Individual compact goal alert component (like Chinese app)
const CompactGoalAlert: React.FC<CompactGoalAlertProps> = ({ notification, index, totalNotifications }) => {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ballRotation = useRef(new Animated.Value(0)).current; // Rolling ball animation

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rolling ball animation for live match feeling
    const startBallRolling = () => {
      ballRotation.setValue(0);
      Animated.loop(
        Animated.timing(ballRotation, {
          toValue: 1,
          duration: 2000, // 2 seconds per full rotation
          useNativeDriver: true,
        }),
        { iterations: -1 } // Infinite rolling
      ).start();
    };

    startBallRolling();

    // Cleanup animation on unmount
    return () => {
      ballRotation.stopAnimation();
    };
  }, []);

  // Convert rotation value to degrees for rolling ball effect
  const ballRotationInterpolate = ballRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'football':
        return '⚽';
      case 'basketball':
        return '🏀';
      case 'rugby':
        return '🏉';
      default:
        return '⚽';
    }
  };

  const getEventText = (sport: string, eventType: string = 'goal') => {
    if (eventType === 'cancelled') {
      // Cancelled goal text based on sport
      switch (sport.toLowerCase()) {
        case 'football':
          return 'CANCELLED';
        case 'basketball':
          return 'CANCELLED';
        case 'rugby':
          return 'CANCELLED';
        default:
          return 'CANCELLED';
      }
    }
    
    // Regular goal text
    switch (sport.toLowerCase()) {
      case 'football':
        return 'GOAL';
      case 'basketball':
        return 'SCORE';
      case 'rugby':
        return 'TRY';
      default:
        return 'GOAL';
    }
  };

  // Determine if this is a cancelled goal alert
  const isCancelled = notification.eventType === 'cancelled';

  // Calculate position based on index (stack vertically with proper spacing)
  const topPosition = 50 + (index * 80); // Increased to 80px for better spacing between alerts

  return (
    <Animated.View
      style={[
        styles.compactAlert,
        {
          top: topPosition,
          transform: [
            { translateX: slideAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Main banner - red for goals, grey for cancelled */}
      <View style={[
        styles.alertBanner,
        isCancelled && styles.cancelledAlertBanner // Grey styling for cancelled goals
      ]}>
        {/* Left section: Time and Event (vertical layout) */}
        <View style={styles.leftSection}>
          <Text style={styles.minute}>{notification.minute}</Text>
          <Text style={styles.eventText}>{getEventText(notification.sport, notification.eventType)}</Text>
        </View>

        {/* Center section: Teams (vertical layout like Chinese app) */}
        <View style={styles.centerSection}>
          <Text 
            style={[
              styles.homeTeam, 
              notification.scoringTeam === 'home' && styles.scoringTeam
            ]} 
            numberOfLines={1}
          >
            {notification.homeTeam}
          </Text>
          <Text style={styles.vsText}>vs</Text>
          <Text 
            style={[
              styles.awayTeam,
              notification.scoringTeam === 'away' && styles.scoringTeam
            ]} 
            numberOfLines={1}
          >
            {notification.awayTeam}
          </Text>
        </View>

        {/* Right section: Score (vertical layout like Chinese app) */}
        <View style={styles.rightSection}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <View style={styles.scoreValues}>
            <Text 
              style={[
                styles.homeScore,
                notification.scoringTeam === 'home' && styles.scoringScore
              ]}
            >
              {notification.score.split('-')[0] || '0'}
            </Text>
            <Text 
              style={[
                styles.awayScore,
                notification.scoringTeam === 'away' && styles.scoringScore
              ]}
            >
              {notification.score.split('-')[1] || '0'}
            </Text>
          </View>
        </View>

        {/* Sport icon with rolling animation */}
        <View style={styles.sportIconSection}>
          <Animated.View
            style={{
              transform: [{ rotate: ballRotationInterpolate }],
            }}
          >
            <Text style={styles.sportIcon}>
              {isCancelled ? '❌' : getSportIcon(notification.sport)}
            </Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

export default function GoalNotificationOverlay() {
  const { goalNotifications, settings } = useMatchSettings();

  useEffect(() => {
    if (goalNotifications.length > 0 && settings.vibrationEnabled) {
      // Single vibration for new goal
      Vibration.vibrate([0, 200]);
    }
  }, [goalNotifications.length]);

  if (!goalNotifications.length || !settings.goalNotification) {
    return null;
  }

  return (
    <View style={styles.container}>
      {goalNotifications.map((notification, index) => (
        <CompactGoalAlert
          key={notification.id}
          notification={notification}
          index={index}
          totalNotifications={goalNotifications.length}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 999,
    pointerEvents: 'none', // Allow touches to pass through
  },
  compactAlert: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 60, // Slightly increased for better vertical spacing
    marginBottom: 5, // Additional spacing between alerts
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#B91C1C', // Duller red color (was #E53E3E)
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10, // Increased vertical padding
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  leftSection: {
    alignItems: 'center',
    marginRight: 12,
  },
  minute: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
  eventText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    marginTop: 2,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  homeTeam: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  vsText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Inter-Medium',
    opacity: 0.8,
    marginVertical: 1,
  },
  awayTeam: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  rightSection: {
    alignItems: 'center',
    marginLeft: 12,
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    opacity: 0.9,
  },
  scoreValues: {
    flexDirection: 'column', // Vertical layout like Chinese app
    alignItems: 'center',
  },
  homeScore: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    lineHeight: 16,
  },
  awayScore: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    lineHeight: 16,
  },
  sportIconSection: {
    marginLeft: 8,
  },
  sportIcon: {
    fontSize: 16,
  },
  scoringTeam: {
    color: '#FFD700', // Bright yellow for scoring team name
    fontFamily: 'Inter-Bold', // Make it bolder
    textShadowColor: '#000',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  scoringScore: {
    color: '#FFD700', // Bright yellow for scoring team's score
    fontFamily: 'Inter-Bold',
    textShadowColor: '#000',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  cancelledAlertBanner: {
    backgroundColor: '#6B7280', // Grey color for cancelled goals
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444', // Red left border to indicate it was a goal that got cancelled
  },
}); 