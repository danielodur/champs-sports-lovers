import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  PanResponder,
} from "react-native";
import { User, X, Share2, Timer, Shield, Activity, Target, Footprints, Flag } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import ShareModal from "@/modules/news/components/content/shared/share-modal";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// Detailed stats interface based on API-Sports player statistics structure
export interface PlayerPerformanceStats {
  rating?: string | number;
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  saves?: number;
  yellowCards?: number;
  redCards?: number;
  
  // Shooting
  shots?: {
    total?: number;
    on?: number;
  };
  
  // Passing
  passes?: {
    total?: number;
    key?: number;
    accuracy?: string | number;
  };
  
  // Dribbles
  dribbles?: {
    attempts?: number;
    success?: number;
    past?: number;
  };
  
  // Defense
  tackles?: {
    total?: number;
    blocks?: number;
    interceptions?: number;
  };
  duels?: {
    total?: number;
    won?: number;
  };
  
  // Other
  fouls?: {
    drawn?: number;
    committed?: number;
  };
  offsides?: number;
}

// Extended Player interface that includes stats
export interface PlayerWithStats {
  id: string | number;
  name: string;
  photo?: string;
  position?: string;
  number?: number;
  teamName?: string;
  teamLogo?: string;
  age?: number;
  country?: string; // e.g., "Denmark"
  statistics?: PlayerPerformanceStats;
}

interface PlayerPerformanceModalProps {
  visible: boolean;
  onClose: () => void;
  player: PlayerWithStats | null;
  teamColor?: string; // ✅ New prop for dynamic team color inheritance
}

export default function PlayerPerformanceModal({
  visible,
  onClose,
  player,
  teamColor,
}: PlayerPerformanceModalProps) {
  const theme = useTheme();
  const [showShareModal, setShowShareModal] = useState(false);
  // Animation value for slide up effect
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Generic slide up/down animation
  useEffect(() => {
    if (visible) {
      // Slide Up
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: screenHeight * 0.1, // ✅ UPDATED: Stop at 10% from top (90% height) for better visibility
          useNativeDriver: true,
          damping: 40,
          stiffness: 400, // Faster/Snappier spring
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide Down
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: screenHeight,
          useNativeDriver: true,
          damping: 40,
          stiffness: 400,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      // ]).start(() => { if (!visible) onClose(); }); // Removed this callback logic which might have caused premature hiding
    }
  }, [visible]);

  // Pan Responder for swipe-to-close gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Also allow taking over if moving down
        return gestureState.dy > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        // Check for tap (minimal movement) or significant swipe down
        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
        if (gestureState.dy > 100 || isTap) {
          // If swiped down enough or tapped, trigger slide down THEN close
          Animated.parallel([
             Animated.spring(slideAnim, {
                toValue: screenHeight,
                useNativeDriver: true,
                damping: 40,
                stiffness: 400,
             }),
             Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
             })
          ]).start(() => {
              onClose(); // Only call onClose (which unmounts/hides modal) AFTER animation completes
          });
        } else {
          // Otherwise snap back to position
          Animated.spring(slideAnim, {
            toValue: screenHeight * 0.1, // ✅ UPDATED: Snap back to 90% height
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        // Allow dragging down
        if (gestureState.dy > 0) {
          slideAnim.setValue(screenHeight * 0.1 + gestureState.dy);
        }
      },
    })
  ).current;

  // Safe data access helpers
  const stats = player?.statistics || {};
  const isGoalkeeper = player?.position === "G";
  
  // Rating Badge Color
  // ✅ UPDATED: Use inherited teamColor if available, otherwise fallback to performance-based colors
  const getRatingColor = (rating: number) => {
    if (teamColor) return teamColor; // ✅ Use inherited team color for rating text/accents
    
    // Fallback logic
    if (rating >= 8.0) return "#00b894";
    if (rating >= 7.0) return "#55efc4";
    if (rating >= 6.0) return "#ffeaa7";
    if (rating < 6.0 && rating > 0) return "#ff7675";
    return "#b2bec3";
  };

  const ratingValue = typeof stats.rating === 'string' ? parseFloat(stats.rating) : (stats.rating || 0);
  const ratingColor = getRatingColor(ratingValue);

  if (!visible && !player) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlayContainer}>
        {/* Backdrop Tap to Close */}
        <Animated.View 
          style={[styles.backdrop, { opacity: opacityAnim }]} 
        >
          <TouchableOpacity 
            style={styles.backdropButton} 
            activeOpacity={1} 
            onPress={onClose} 
          />
        </Animated.View>

        {/* Sliding Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
              backgroundColor: "#1e1e1e", // Deep dark background like screenshot
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          {/* Modal Header Title */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Player Performance</Text>
            <TouchableOpacity onPress={() => setShowShareModal(true)} style={styles.iconButton}>
               <Share2 size={20} color="#b2bec3" />
            </TouchableOpacity>
          </View>

          {/* Player Header Info */}
          <View style={styles.playerHeader}>
            <View style={styles.playerInfoRow}>
                {/* Player Photo with Team Badge */}
                <View style={styles.avatarContainer}>
                    <Image 
                        source={{ uri: player?.photo }} 
                        style={styles.avatar} 
                        // removed defaultSource to prevent crash if asset missing
                    />
                    {!!player?.teamLogo && (
                        <Image source={{ uri: player.teamLogo }} style={styles.miniTeamLogo} />
                    )}
                    {/* Jersey Number */}
                    {player?.number != null && (
                        <View style={[
                            styles.jerseyNumberBadge, 
                            teamColor ? { backgroundColor: teamColor } : {} // ✅ Use inherited color for jersey badge
                        ]}>
                            <Text style={styles.jerseyNumberText}>{player.number}</Text>
                        </View>
                    )}
                </View>

                {/* Name & Basic Info */}
                <View style={styles.infoTextContainer}>
                    <Text style={styles.playerName}>{player?.name || "Unknown Player"}</Text>
                    <View style={styles.subInfoRow}>
                        {!!player?.country && (
                             <Text style={styles.subInfoText}>{player.country}</Text>
                        )}
                        {player?.age != null && (
                             <Text style={styles.subInfoText}>{player.age} yrs</Text>
                        )}
                        <Text style={styles.subInfoText}>{player?.position || "Player"}</Text>
                    </View>
                </View>

                {/* Rating Hexagon Badge */}
                <View style={styles.ratingContainer}>
                    <View style={[styles.ratingHexagon, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Text style={styles.ratingLabel}>Rating</Text>
                        <Text style={[styles.ratingValue, { color: ratingColor }]}>
                            {ratingValue > 0 ? ratingValue.toFixed(1) : "-"}
                        </Text>
                    </View>
                </View>
            </View>
          </View>

          <ScrollView 
            style={styles.statsScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Top Stats Summary Row */}
            <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{stats.minutesPlayed || 0}'</Text>
                    <Text style={styles.summaryLabel}>Minutes</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                        {isGoalkeeper ? (stats.saves || 0) : (stats.goals || 0)}
                    </Text>
                    <Text style={styles.summaryLabel}>
                        {isGoalkeeper ? "Saves" : "Goals"}
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                         {isGoalkeeper ? "0/0" : `${stats.goals || 0}/${stats.assists || 0}`}
                    </Text>
                    <Text style={styles.summaryLabel}>
                         {isGoalkeeper ? "Goals/Ast" : "Goals/Ast"}
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                        {stats.yellowCards || 0}/{stats.redCards || 0}
                    </Text>
                    <Text style={styles.summaryLabel}>Cards</Text>
                </View>
            </View>

            {/* Detailed Sections */}
            
            {/* 1. Attack / Goalkeeping */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{isGoalkeeper ? "Goalkeeper Stats" : "Attack"}</Text>
                <View style={styles.statsGrid}>
                    {isGoalkeeper ? (
                        <>
                            <StatItem label="Saves" value={stats.saves || 0} />
                            <StatItem label="Punches" value={0} />
                            <StatItem label="Run Outs" value={0} />
                            <StatItem label="High Claims" value={0} />
                        </>
                    ) : (
                        <>
                            <StatItem label="Shots" value={stats.shots?.total || 0} />
                            <StatItem label="On Target" value={`${stats.shots?.on || 0}/${stats.shots?.total || 0}`} />
                            <StatItem label="Dribbles" value={`${stats.dribbles?.success || 0}/${stats.dribbles?.attempts || 0}`} />
                            <StatItem label="Offsides" value={stats.offsides || 0} />
                        </>
                    )}
                </View>
            </View>

             <View style={styles.separator} />

            {/* 2. Passing */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Passing</Text>
                <View style={styles.statsGrid}>
                    <StatItem label="Passes" value={stats.passes?.total || 0} />
                    <StatItem label="Key Passes" value={stats.passes?.key || 0} />
                    <StatItem label="Accuracy" value={typeof stats.passes?.accuracy === 'number' ? `${stats.passes.accuracy}%` : (stats.passes?.accuracy || "0%")} />
                    <StatItem label="Crosses" value="-" />
                </View>
            </View>

            <View style={styles.separator} />

            {/* 3. Defense */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Defense</Text>
                <View style={styles.statsGrid}>
                    <StatItem label="Tackles" value={stats.tackles?.total || 0} />
                    <StatItem label="Interceptions" value={stats.tackles?.interceptions || 0} />
                    <StatItem label="Blocks" value={stats.tackles?.blocks || 0} />
                    <StatItem label="Duels Won" value={stats.duels?.won || 0} />
                </View>
            </View>

             <View style={styles.separator} />

            {/* 4. Discipline / Other */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Other</Text>
                <View style={styles.statsGrid}>
                    <StatItem label="Fouls" value={stats.fouls?.committed || 0} />
                    <StatItem label="Was Fouled" value={stats.fouls?.drawn || 0} />
                    <StatItem label="Dispossessed" value="-" />
                    <StatItem label="Turnovers" value="-" />
                </View>
            </View>

          </ScrollView>
        </Animated.View>
      </View>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Player Stats"
        shareUrl={`https://champssportslovers.com/player/${player?.id || ''}`}
        shareText={`${player?.name || 'Player'} Stats - ${player?.teamName || ''}`}
      />
    </Modal>
  );
}

// Helper Subcomponent for individual stat items
const StatItem = ({ label, value }: { label: string; value: string | number }) => (
    <View style={styles.statItem}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end", // Align modal to bottom
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  backdropButton: {
    flex: 1,
  },
  modalContent: {
    width: "100%",
    height: screenHeight * 0.9, // ✅ UPDATED: Cover 90% of screen height
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    paddingTop: 10,
  },
  dragHandleContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center", // Center title
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
    position: 'relative',
  },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  iconButton: {
      position: 'absolute',
      right: 20,
  },
  
  // Player Header Grid
  playerHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  playerInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  avatarContainer: {
      position: 'relative',
      marginRight: 15,
  },
  avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: '#333',
  },
  miniTeamLogo: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#fff',
  },
  jerseyNumberBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    backgroundColor: '#00b894',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  jerseyNumberText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
  },
  infoTextContainer: {
      flex: 1,
  },
  playerName: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  subInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  subInfoText: {
      color: '#b2bec3',
      fontSize: 12,
  },
  
  // Rating Hexagon (Simulated with View)
  ratingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  ratingHexagon: {
      padding: 10,
      borderRadius: 12, // Soft rounded square instead of strict hexagon for cleaner UI
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 50,
  },
  ratingLabel: {
      color: '#b2bec3',
      fontSize: 10,
      textTransform: 'uppercase',
  },
  ratingValue: {
      fontSize: 18,
      fontWeight: 'bold',
  },

  // Stats Scroll Region
  statsScroll: {
      flex: 1,
      paddingHorizontal: 20,
  },
  summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
  },
  summaryItem: {
      alignItems: 'center',
      flex: 1,
  },
  summaryValue: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  summaryLabel: {
      color: '#b2bec3',
      fontSize: 12,
  },

  // Detailed Stats Sections
  sectionContainer: {
      marginBottom: 5,
  },
  sectionTitle: {
      color: '#dfe6e9',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 15,
      marginTop: 5,
  },
  statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
  },
  statItem: {
      width: '23%', // 4 items per row roughly
      alignItems: 'center',
      marginBottom: 15,
  },
  statLabel: {
      color: '#636e72',
      fontSize: 11,
      marginBottom: 6,
      textAlign: 'center',
  },
  statValue: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
  separator: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.08)',
      marginVertical: 15,
  },
});
