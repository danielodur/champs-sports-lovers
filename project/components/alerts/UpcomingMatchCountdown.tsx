import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Clock, Calendar, Bell, X, Play } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface UpcomingMatchCountdownProps {
  visible: boolean;
  onClose: () => void;
  matchTitle: string;
  matchDate: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  leagueName?: string;
  onNotifyMe?: () => void;
  onPreviewMatch?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function UpcomingMatchCountdown({
  visible,
  onClose,
  matchTitle,
  matchDate,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  leagueName,
  onNotifyMe,
  onPreviewMatch,
}: UpcomingMatchCountdownProps) {
  const theme = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isActive, setIsActive] = useState(false);

  // Animation values
  const scaleAnimation = new Animated.Value(0);
  const fadeAnimation = new Animated.Value(0);
  const pulseAnimation = new Animated.Value(1);
  const countdownPulse = new Animated.Value(1);

  // Calculate time remaining
  useEffect(() => {
    if (!visible || !matchDate) return;

    const targetTime = new Date(matchDate).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });

        // Animate countdown numbers
        Animated.sequence([
          Animated.timing(countdownPulse, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(countdownPulse, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [visible, matchDate, countdownPulse]);

  // Entrance animation
  useEffect(() => {
    if (visible) {
      setIsActive(true);
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulsing animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
      };
    } else {
      setIsActive(false);
    }
  }, [visible, scaleAnimation, fadeAnimation, pulseAnimation]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      scaleAnimation.setValue(0);
      fadeAnimation.setValue(0);
    });
  };

  const formatMatchDate = () => {
    const date = new Date(matchDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatMatchTime = () => {
    const date = new Date(matchDate);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const renderCountdownUnit = (value: number, label: string) => (
    <Animated.View
      style={[
        styles.countdownUnit,
        {
          backgroundColor: `${theme.colors.primary}20`,
          transform: [{ scale: countdownPulse }]
        }
      ]}
    >
      <Text style={[styles.countdownNumber, { color: theme.colors.primary }]}>
        {value.toString().padStart(2, '0')}
      </Text>
      <Text style={[styles.countdownLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </Animated.View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <BlurView intensity={20} style={styles.blurContainer}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnimation,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouch}
            onPress={handleClose}
            activeOpacity={1}
          />

          <Animated.View
            style={[
              styles.alertContainer,
              {
                backgroundColor: theme.colors.background,
                transform: [{ scale: scaleAnimation }],
              },
            ]}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {/* Header */}
            <Animated.View
              style={[
                styles.header,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.accent}20` }]}>
                <Clock size={32} color={theme.colors.accent} />
              </View>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Upcoming Match
              </Text>
              {leagueName && (
                <Text style={[styles.league, { color: theme.colors.textSecondary }]}>
                  {leagueName}
                </Text>
              )}
            </Animated.View>

            {/* Teams */}
            <View style={styles.teamsContainer}>
              <View style={styles.teamSection}>
                <View style={[styles.teamLogo, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Text style={styles.teamLogoText}>
                    {homeTeamName.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.teamName, { color: theme.colors.text }]}>
                  {homeTeamName}
                </Text>
              </View>

              <View style={styles.vsContainer}>
                <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>
                  VS
                </Text>
              </View>

              <View style={styles.teamSection}>
                <View style={[styles.teamLogo, { backgroundColor: `${theme.colors.secondary}20` }]}>
                  <Text style={styles.teamLogoText}>
                    {awayTeamName.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.teamName, { color: theme.colors.text }]}>
                  {awayTeamName}
                </Text>
              </View>
            </View>

            {/* Match Date & Time */}
            <View style={[styles.dateTimeContainer, { backgroundColor: `${theme.colors.backgroundSecondary}50` }]}>
              <View style={styles.dateTimeRow}>
                <Calendar size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.dateText, { color: theme.colors.text }]}>
                  {formatMatchDate()}
                </Text>
              </View>
              <Text style={[styles.timeText, { color: theme.colors.primary }]}>
                {formatMatchTime()}
              </Text>
            </View>

            {/* Countdown */}
            <View style={styles.countdownContainer}>
              <Text style={[styles.countdownTitle, { color: theme.colors.text }]}>
                Time Until Kickoff
              </Text>
              <View style={styles.countdownRow}>
                {renderCountdownUnit(timeRemaining.days, 'Days')}
                {renderCountdownUnit(timeRemaining.hours, 'Hours')}
                {renderCountdownUnit(timeRemaining.minutes, 'Min')}
                {renderCountdownUnit(timeRemaining.seconds, 'Sec')}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {onNotifyMe && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.notifyButton, { backgroundColor: `${theme.colors.accent}20` }]}
                  onPress={() => {
                    onNotifyMe();
                    handleClose();
                  }}
                >
                  <Bell size={18} color={theme.colors.accent} />
                  <Text style={[styles.buttonText, { color: theme.colors.accent }]}>
                    Notify Me
                  </Text>
                </TouchableOpacity>
              )}

              {onPreviewMatch && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.previewButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    onPreviewMatch();
                    handleClose();
                  }}
                >
                  <Play size={18} color="#FFFFFF" />
                  <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                    Preview Match
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Motivational Message */}
            <View style={styles.messageContainer}>
              <Text style={[styles.messageText, { color: theme.colors.textSecondary }]}>
                🔥 Don't miss this exciting match! Set your reminder now.
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  league: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  teamSection: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamLogoText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  dateTimeContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  countdownUnit: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  countdownNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  countdownLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  notifyButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewButton: {
    // Primary color set in component
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  messageContainer: {
    alignItems: 'center',
  },
  messageText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
});
