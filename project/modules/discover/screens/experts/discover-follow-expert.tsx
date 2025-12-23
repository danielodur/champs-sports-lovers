import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Pressable,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Bell,
  X,
  Check,
  Users,
  Heart,
  Star,
  Zap,
} from "lucide-react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface FollowButtonProps {
  expertId: string;
  expertName: string;
  initialFollowState?: boolean;
  followerCount: number;
  onFollowChange: (isFollowing: boolean, newFollowerCount: number) => void;
  style?: any;
}

export default function DiscoverFollowExpert({
  expertId,
  expertName,
  initialFollowState = false,
  followerCount,
  onFollowChange,
  style,
}: FollowButtonProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // States
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(initialFollowState);
  const [currentFollowerCount, setCurrentFollowerCount] =
    useState(followerCount);

  // Sync with initial follow state changes
  React.useEffect(() => {
    setIsFollowing(initialFollowState);
    setCurrentFollowerCount(followerCount);
    // If initially following, enable push by default
    if (initialFollowState) {
      setIsPushEnabled(true);
    }
  }, [initialFollowState, followerCount]);

  // Animations
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(screenHeight)).current;

  // Handle follow button press
  const handleFollowPress = () => {
    if (isFollowing) {
      // Show unfollow modal
      setShowUnfollowModal(true);
    } else {
      // Show follow modal
      setShowFollowModal(true);
    }
  };

  // Handle animations with useEffect
  useEffect(() => {
    if (showFollowModal) {
      animateModalIn();
    }
  }, [showFollowModal]);

  useEffect(() => {
    if (showUnfollowModal) {
      animateSlideUp();
    }
  }, [showUnfollowModal]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      modalAnimation.stopAnimation();
      slideAnimation.stopAnimation();
    };
  }, [modalAnimation, slideAnimation]);

  // Handle push notifications toggle
  const handlePushPress = () => {
    setIsPushEnabled(!isPushEnabled);
    // Here you would typically make an API call to update push preferences
  };

  // Animation functions
  const animateModalIn = () => {
    if (!modalAnimation) return;
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const animateModalOut = () => {
    if (!modalAnimation) return;
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowFollowModal(false);
    });
  };

  const animateSlideUp = () => {
    if (!slideAnimation) return;
    Animated.spring(slideAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const animateSlideDown = () => {
    if (!slideAnimation) return;
    Animated.spring(slideAnimation, {
      toValue: screenHeight,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowUnfollowModal(false);
    });
  };

  // Confirm follow action
  const confirmFollow = () => {
    try {
      setIsFollowing(true);
      setIsPushEnabled(true); // Auto-enable push notifications when following
      const newCount = currentFollowerCount + 1;
      setCurrentFollowerCount(newCount);
      onFollowChange(true, newCount);
      animateModalOut();
    } catch (error) {
      console.error("Error in confirmFollow:", error);
    }
  };

  // Confirm unfollow action
  const confirmUnfollow = () => {
    try {
      setIsFollowing(false);
      setIsPushEnabled(false);
      const newCount = Math.max(0, currentFollowerCount - 1);
      setCurrentFollowerCount(newCount);
      onFollowChange(false, newCount);
      animateSlideDown();
    } catch (error) {
      console.error("Error in confirmUnfollow:", error);
    }
  };

  // Handle push toggle when already following
  const handlePushToggle = () => {
    const newPushState = !isPushEnabled;
    setIsPushEnabled(newPushState);
    // Here you would typically make an API call to update push preferences
  };

  // Cancel follow action
  const cancelFollow = () => {
    try {
      animateModalOut();
    } catch (error) {
      console.error("Error in cancelFollow:", error);
      setShowFollowModal(false);
    }
  };

  // Cancel unfollow action
  const cancelUnfollow = () => {
    try {
      animateSlideDown();
    } catch (error) {
      console.error("Error in cancelUnfollow:", error);
      setShowUnfollowModal(false);
    }
  };

  // Follow Modal Content
  const renderFollowModal = () => (
    <Modal
      visible={showFollowModal}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={cancelFollow}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={cancelFollow} />
        <Animated.View
          style={[
            styles.followModalContainer,
            { backgroundColor: theme.colors.background },
            {
              transform: [
                {
                  scale: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: modalAnimation,
            },
          ]}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Follow Success
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={cancelFollow}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View
              style={[
                styles.successIcon,
                { backgroundColor: theme.colors.success + "20" },
              ]}
            >
              <Check size={40} color={theme.colors.success} />
            </View>
          </View>

          {/* Follow Options */}
          <View style={styles.followOptionsContainer}>
            <View style={styles.expertInfo}>
              <Users size={20} color={theme.colors.text} />
              <Text
                style={[styles.expertInfoText, { color: theme.colors.text }]}
              >
                Following {expertName}
              </Text>
            </View>

            <Text
              style={[
                styles.modalDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              Enable automatic push notifications to receive real-time updates
              from this expert
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={cancelFollow}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Not Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { borderColor: theme.colors.primary, borderWidth: 1 },
              ]}
              onPress={confirmFollow}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                Enable
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  // Unfollow Modal Content
  const renderUnfollowModal = () => (
    <Modal
      visible={showUnfollowModal}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={cancelUnfollow}
    >
      <View style={styles.unfollowOverlay}>
        <Pressable style={styles.unfollowBackdrop} onPress={cancelUnfollow} />
        <Animated.View
          style={[
            styles.unfollowModalContainer,
            { backgroundColor: theme.colors.background },
            {
              transform: [
                {
                  translateY: slideAnimation,
                },
              ],
            },
          ]}
        >
          {/* Modal Handle */}
          <View style={styles.modalHandle} />

          {/* Unfollow Content */}
          <View style={styles.unfollowContent}>
            <View style={styles.unfollowHeader}>
              <Heart size={24} color={theme.colors.error} />
              <Text
                style={[styles.unfollowTitle, { color: theme.colors.text }]}
              >
                Unfollow Expert
              </Text>
            </View>

            <Text
              style={[
                styles.unfollowDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              Are you sure you want to unfollow {expertName}? You will no longer
              receive their predictions and updates.
            </Text>

            {/* Expert Stats */}
            <View style={styles.expertStats}>
              <View style={styles.statItem}>
                <Star size={16} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.statText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Expert Level 15
                </Text>
              </View>
              <View style={styles.statItem}>
                <Zap size={16} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.statText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  85% Win Rate
                </Text>
              </View>
            </View>
          </View>

          {/* Unfollow Actions */}
          <View style={styles.unfollowActions}>
            <TouchableOpacity
              style={[
                styles.unfollowButton,
                { borderColor: theme.colors.border, borderWidth: 1 },
              ]}
              onPress={confirmUnfollow}
            >
              <Text
                style={[
                  styles.unfollowButtonText,
                  { color: theme.colors.error },
                ]}
              >
                Unfollow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.keepFollowingButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={cancelUnfollow}
            >
              <Text
                style={[
                  styles.keepFollowingButtonText,
                  { color: theme.colors.text },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, style]}>
      {!isFollowing ? (
        // Follow Button (Not Following)
        <TouchableOpacity
          style={[styles.followButton, { backgroundColor: "#FFFFFF" }]}
          onPress={handleFollowPress}
          activeOpacity={0.8}
        >
          <Plus size={16} color={theme.colors.primary} />
          <Text
            style={[styles.followButtonText, { color: theme.colors.primary }]}
          >
            Follow
          </Text>
        </TouchableOpacity>
      ) : (
        // Following State (Two Buttons)
        <View style={styles.followingButtonsContainer}>
          <View style={styles.followingContainer}>
            <TouchableOpacity
              style={[
                styles.followedButton,
                {
                  backgroundColor: theme.colors.success + "20",
                  borderColor: theme.colors.success,
                },
              ]}
              onPress={handleFollowPress}
              activeOpacity={0.8}
            >
              <Check size={14} color="#FFFFFF" />
              <Text
                style={[
                  styles.followedButtonText,
                  { color: theme.colors.success },
                ]}
              >
                Following
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bellButton,
                {
                  backgroundColor: isPushEnabled
                    ? "#FFD700" + "20"
                    : "rgba(255, 255, 255, 0.1)",
                },
              ]}
              onPress={handlePushToggle}
              activeOpacity={0.8}
            >
              <Bell size={18} fill={isPushEnabled ? "#FFD700" : "none"} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modals */}
      {renderFollowModal()}
      {renderUnfollowModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    minWidth: 120,
  },

  // Follow Button Styles
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    gap: 6,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Following State Styles
  followingButtonsContainer: {
    alignItems: "flex-end",
    maxWidth: 120,
  },
  followingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  followedButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 3,
  },
  followedButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bellButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  // Unfollow Modal Overlay
  unfollowOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  unfollowBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  // Follow Modal Styles
  followModalContainer: {
    width: screenWidth * 0.85,
    borderRadius: 20,
    padding: 0,
    maxHeight: screenHeight * 0.7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  successIconContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  followOptionsContainer: {
    padding: 20,
  },
  expertInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  expertInfoText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  modalActions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Unfollow Modal Styles
  unfollowModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    minHeight: 280,
    maxHeight: screenHeight * 0.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  unfollowContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  unfollowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  unfollowTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  unfollowDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  expertStats: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: "500",
  },
  unfollowActions: {
    paddingHorizontal: 24,
    gap: 12,
  },
  unfollowButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  unfollowButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  keepFollowingButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
  },
  keepFollowingButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
