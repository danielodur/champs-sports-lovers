import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import {
  MessageCircle,
  Users,
  Send,
  Mic,
  Image as ImageIcon,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useThemeMode } from "@/hooks/useTheme";
import useAuth from "@/hooks/useAuth";
import { chatService, ChatMessage } from "@/services/chatService";

interface ChatProps {
  matchId?: string;
  matchTitle?: string;
  homeTeamName?: string;
  awayTeamName?: string;
}

export default function Chat({
  matchId = "default",
  homeTeamName = "Home",
  awayTeamName = "Away",
}: ChatProps) {
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const { isLoggedIn, userInfo } = useAuth();

  // Enhanced authentication detection
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    level: number;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [chatStats, setChatStats] = useState({
    messageCount: 0,
    activeUsers: 1, // Show actual user count (just the current user)
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const userColorsRef = useRef<Map<string, string>>(new Map());
  // removed message splitting state



  // Generate unique color for each user (deterministic)
  const getUserColor = (username: string): string => {
    const map = userColorsRef.current;
    if (map.has(username)) return map.get(username)!;
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7B731",
      "#5F27CD",
      "#00D2D3",
      "#FF6348",
      "#1DD1A1",
      "#F368E0",
      "#FF9FF3",
      "#54A0FF",
      "#48DBFB",
      "#EE5A6F",
      "#C44569",
      "#FD79A8",
      "#A29BFE",
      "#6C5CE7",
      "#00B894",
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    map.set(username, color);
    return color;
  };

  // Announcement scrolling animation
  useEffect(() => {
    const animateScroll = () => {
      scrollAnim.setValue(screenWidth);
      Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -500, // Scroll distance (adjust based on text length)
          duration: 15000, // 15 seconds for full cycle
          useNativeDriver: true,
        })
      ).start();
    };
    animateScroll();
  }, []);

  // Features state - Simplified for dev stage

  // Keyboard handling
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const screenHeight = Dimensions.get("window").height;

  // Enhanced authentication check
  useEffect(() => {
    const checkAuthentication = async () => {
      console.log("🔍 AUTH: Starting authentication check...");
      console.log("🔍 AUTH: isLoggedIn:", isLoggedIn);
      console.log("🔍 AUTH: userInfo:", userInfo);

      // Method 1: Check useAuth hook
      if (isLoggedIn && userInfo?.username) {
        console.log(
          "✅ AUTH: User authenticated via useAuth:",
          userInfo.username,
        );
        const userId = `user_${userInfo.username}_${Date.now()}`;
        chatService.setCurrentUser(userId);
        setIsAuthenticated(true);
        setCurrentUser({
          username: userInfo.username,
          level: (userInfo as any).level || 1,
        });
        console.log("✅ AUTH: Chat service user set to:", userId);
        return;
      }

      // Method 2: Check Supabase session
      try {
        const { supabase } = await import("@/services/supabaseClient");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          console.log(
            "✅ AUTH: User authenticated via Supabase:",
            session.user.id,
          );
          chatService.setCurrentUser(session.user.id);
          setIsAuthenticated(true);
          setCurrentUser({
            username: `User${session.user.id.slice(-4)}`,
            level: 1,
          });
          console.log("✅ AUTH: Chat service user set to:", session.user.id);
          return;
        }
      } catch (error) {
        console.log("🔍 AUTH: Supabase check failed:", error);
      }

      // Method 3: Create guest user (ALWAYS works)
      // TODO: After auth integration, replace "Guest" with actual registered username
      console.log("🎯 AUTH: Creating guest user for chat");
      const guestId = `guest_${Date.now()}`;
      chatService.setCurrentUser(guestId);
      setIsAuthenticated(true);
      setCurrentUser({
        username: "Guest", // Will be replaced with real username after auth
        level: 1,
      });
      console.log("✅ AUTH: Chat service guest user set to:", guestId);
    };

    checkAuthentication();
  }, [isLoggedIn, userInfo]);

  // Initialize chat on component mount
  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      try {
        console.log("💬 Initializing chat for match:", matchId);

        // Run all operations in parallel for faster loading
        const [messagesResult, statsResult, usersResult] =
          await Promise.allSettled([
            chatService.getMatchMessages(matchId, 50),
            chatService.getChatStats(matchId),
            chatService.getActiveChatUsers(matchId),
          ]);

        // Subscribe to real-time updates (non-blocking)
        chatService.subscribeToMatchChat(matchId, (newMessage: ChatMessage) => {
          if (isMounted) {
            setMessages((prev) => {
              // Remove any optimistic message with same content and replace with real message
              const filtered = prev.filter((msg) => {
                // Remove optimistic messages that match this real message
                if (
                  msg.id.startsWith("temp-") &&
                  msg.content === newMessage.content &&
                  msg.username === newMessage.username
                ) {
                  return false;
                }
                // Avoid duplicates of real messages
                return msg.id !== newMessage.id;
              });

              return [...filtered, newMessage];
            });

            // Keep user count accurate (just the current user)
            setChatStats((prev) => ({
              ...prev,
              activeUsers: 1, // Always show 1 user since only current user is in the chat
            }));

            // Auto-scroll to bottom when new message arrives
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
        });

        // Process results if component is still mounted
        if (isMounted) {
          // Set messages if successful
          if (messagesResult.status === "fulfilled") {
            setMessages(messagesResult.value);
          }

          // Set stats if successful, but maintain accurate user count
          if (statsResult.status === "fulfilled") {
            setChatStats((prev) => ({
              ...statsResult.value,
              activeUsers: 1, // Always show 1 user (current user only)
            }));
          }

          // Set users if successful
          if (usersResult.status === "fulfilled") {
            setActiveUsers(usersResult.value);
          }

          // Scroll to bottom after loading
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      chatService.unsubscribeFromMatchChat(matchId);
    };
  }, [matchId, isAuthenticated]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Professional keyboard handling
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        setIsKeyboardVisible(true);
        // Auto-scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      },
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      },
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  // Auto-scroll when new messages arrive and keyboard is visible
  useEffect(() => {
    if (isKeyboardVisible && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages.length, isKeyboardVisible]);


  // Send message function - Enhanced for instant response
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!isAuthenticated) {
      Alert.alert(
        "Authentication Required",
        "Please wait while we authenticate you for the chat.",
        [{ text: "OK" }],
      );
      return;
    }

    const messageContent = newMessage.trim();

    // ✅ INSTANT UI UPDATE: Clear input immediately for better UX
    setNewMessage("");

    // ✅ OPTIMISTIC UPDATE: Add message to UI immediately while sending
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      match_id: matchId,
      user_id: currentUser?.username || "Unknown",
      username: currentUser?.username || "You",
      level: currentUser?.level || 1,
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    // Add optimistic message to UI
    setMessages((prev) => [...prev, optimisticMessage]);

    // Auto-scroll to show the new message
    setTimeout(() => scrollToBottom(), 50);

    // Send to server in background (don't await to keep UI responsive)
    chatService
      .sendMessage(matchId, messageContent)
      .then((result) => {
        if (!result.success) {
          console.error("❌ Failed to send message:", result.error);
          // Remove optimistic message on failure
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== optimisticMessage.id),
          );
          setNewMessage(messageContent); // Restore message to input
          Alert.alert(
            "Failed to send message",
            result.error || "Network error. Please try again.",
          );
        } else {
          console.log("✅ Message sent successfully");
          // Real message will come through real-time subscription and replace optimistic one
        }
      })
      .catch((error) => {
        console.error("❌ Exception sending message:", error);
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMessage.id),
        );
        setNewMessage(messageContent); // Restore message to input
        Alert.alert(
          "Failed to send message",
          "Network error. Please try again.",
        );
      });
  };

  // Render individual message - Chinese app style: Badge + Username + Message inline, wraps from left edge
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isCurrentUser = currentUser?.username === item.username;
    const userColor = getUserColor(item.username);

    return (
      <View style={styles.messageWrapper}>
        <Text style={[styles.messageText, { color: theme.colors.text }]}>
          {/* Badge as inline styled text */}
          <Text style={[styles.levelBadgeInline, { backgroundColor: userColor }]}>
            Lv {item.level}
          </Text>
          {/* Username inline */}
          <Text
            style={[
              styles.usernameInline,
              {
                color: isCurrentUser ? theme.colors.primary : theme.colors.text,
              },
            ]}
          >
            {" "}{item.username}{" "}
          </Text>
          {/* Message content - flows inline, wraps to left edge */}
          <Text style={styles.messageContentInline}>
            {item.content}
          </Text>
        </Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={48} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
        Start the conversation!
      </Text>
      <Text
        style={[
          styles.emptyStateSubtitle,
          { color: theme.colors.textSecondary },
        ]}
      >
        Be the first to share your thoughts about this match.
      </Text>
    </View>
  );



  return (
    <View style={styles.container}>
      {/* Messages ScrollView - FULL SCREEN, scrolls UNDER announcement and input */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Announcement Message - Inside chat */}
        <View style={styles.topAnnouncementContainer}>
          <Text style={styles.topAnnouncementIcon}>📣</Text>
          <Text style={[styles.topAnnouncementText, { color: "#FFB800" }]}>
            Welcome! Be respectful, avoid profanity, stay safe. Follow the rules and enjoy chatting with fellow fans!
          </Text>
        </View>

        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          messages.map((item) => (
            <View key={item.id}>
              {renderMessage({ item })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Announcement Banner - ABSOLUTELY FIXED at top */}
      <View style={[styles.announcementBanner, { backgroundColor: theme.colors.background }]}>
        <View style={styles.announcementHighlight}>
          <View style={styles.speakerIcon}>
            <Text style={styles.speakerEmoji}>📣</Text>
          </View>
          <View style={styles.announcementTextContainer}>
            <Animated.Text 
              style={[
                styles.announcementText,
                {
                  transform: [{ translateX: scrollAnim }],
                },
              ]}
            >
              Welcome! Be respectful, no profanity, stay safe.
            </Animated.Text>
          </View>
        </View>
      </View>
      
      {/* Input Box - ABSOLUTELY FIXED AT BOTTOM */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inputKeyboardAvoid}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
            <TextInput
              style={[styles.messageInput, { color: theme.colors.text }]}
              placeholder={isAuthenticated ? "Type your message..." : "Authenticating..."}
              placeholderTextColor={theme.colors.textSecondary}
              value={newMessage}
              onChangeText={setNewMessage}
              editable={isAuthenticated}
              returnKeyType="send"
              onSubmitEditing={newMessage.trim() ? handleSendMessage : undefined}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: newMessage.trim() ? theme.colors.primary : theme.colors.backgroundSecondary }]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || !isAuthenticated}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  announcementBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  announcementHighlight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 210, 90, 0.14)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    overflow: "hidden",
  },
  speakerIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ scaleX: -1 }], // Flip horizontally to face right
  },
  speakerEmoji: {
    fontSize: 18,
  },
  announcementTextContainer: {
    flex: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  announcementText: {
    fontSize: 13,
    color: "#D4AF37",
    fontFamily: "Inter-Medium",
    flexShrink: 0,
  },
  habariSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  habariLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  habariTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  habariUserBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  habariUserText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  chatContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 0, // Remove horizontal padding - messages touch edges
    paddingTop: 45, // Space for fixed announcement banner at top
    paddingBottom: 70, // Space for fixed input box at bottom
    flexGrow: 1,
  },
  topAnnouncementContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
    gap: 6,
  },
  topAnnouncementIcon: {
    fontSize: 14,
    marginTop: 2,
    transform: [{ scaleX: -1 }], // Flip to face right
  },
  topAnnouncementText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter-Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingBottom: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  messageWrapper: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 8,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  messageInline: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  messageFullText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    marginTop: 2,
  },
  messageTextContainer: {
    flex: 1,
  },
  inlineMessage: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  measureMessage: {
    position: "absolute",
    opacity: 0,
    left: -10000,
    top: -10000,
  },
  messageText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadgeInline: {
    fontSize: 11,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 1,
  },
  levelText: {
    fontSize: 11,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  messageContentWrapper: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  userNameSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userLevel: {
    fontSize: 11,
    fontFamily: "Inter-Bold",
  },
  username: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  usernameInline: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  messageFirstLineText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  messageContinuation: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    paddingTop: 2,
  },
  messageContent: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  messageContentInline: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  messageContentFullWidth: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    paddingLeft: 0,
  },
  messageFullWidth: {
    width: "100%",
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
    gap: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  attachButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  inputKeyboardAvoid: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
