import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Keyboard,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback // Add this import
} from 'react-native';
import { Send, Users, MessageCircle, Smile, Gift, Mic } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeMode } from '@/hooks/useTheme';
import useAuth from '@/hooks/useAuth';
import { chatService, ChatMessage } from '@/services/chatService';

interface MatchChatProps {
  matchId: string;
  matchTitle?: string;
  hideHeader?: boolean;
}

const MatchChat: React.FC<MatchChatProps> = ({ matchId, matchTitle, hideHeader = false }) => {
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const { isLoggedIn, userInfo } = useAuth();
  
  // Enhanced authentication detection
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; level: number } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [chatStats, setChatStats] = useState({ 
    messageCount: 0, 
    activeUsers: 1 // Show actual user count (just the current user)
  });
  const flatListRef = useRef<FlatList>(null);
  
  // Features state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiftAnimation, setShowGiftAnimation] = useState(false);
  const giftAnimation = useRef(new Animated.Value(0)).current;
  
  // Keyboard handling
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const screenHeight = Dimensions.get('window').height;

  // Enhanced authentication check
  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('🔍 AUTH: Starting authentication check...');
      console.log('🔍 AUTH: isLoggedIn:', isLoggedIn);
      console.log('🔍 AUTH: userInfo:', userInfo);
      
      // Method 1: Check useAuth hook
      if (isLoggedIn && userInfo?.username) {
        console.log('✅ AUTH: User authenticated via useAuth:', userInfo.username);
        const userId = `user_${userInfo.username}_${Date.now()}`;
        chatService.setCurrentUser(userId);
        setIsAuthenticated(true);
        setCurrentUser({ 
          username: userInfo.username, 
          level: (userInfo as any).level || 1 
        });
        console.log('✅ AUTH: Chat service user set to:', userId);
        return;
      }

      // Method 2: Check Supabase session
      try {
        const { supabase } = await import('@/services/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ AUTH: User authenticated via Supabase:', session.user.id);
          chatService.setCurrentUser(session.user.id);
          setIsAuthenticated(true);
          setCurrentUser({ 
            username: `User${session.user.id.slice(-4)}`, 
            level: 1 
          });
          console.log('✅ AUTH: Chat service user set to:', session.user.id);
          return;
        }
      } catch (error) {
        console.log('🔍 AUTH: Supabase check failed:', error);
      }

      // Method 3: Create guest user (ALWAYS works)
      console.log('🎯 AUTH: Creating guest user for chat');
      const guestId = `guest_${Date.now()}`;
      chatService.setCurrentUser(guestId);
      setIsAuthenticated(true);
      setCurrentUser({ 
        username: 'Guest', 
        level: 1 
      });
      console.log('✅ AUTH: Chat service guest user set to:', guestId);
    };

    checkAuthentication();
  }, [isLoggedIn, userInfo]);

  // Initialize chat on component mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeChat = async () => {
      try {
        console.log('💬 Initializing chat for match:', matchId);

        // Run all operations in parallel for faster loading
        const [messagesResult, statsResult, usersResult] = await Promise.allSettled([
          chatService.getMatchMessages(matchId, 50),
          chatService.getChatStats(matchId),
          chatService.getActiveChatUsers(matchId)
        ]);

        // Subscribe to real-time updates (non-blocking)
        chatService.subscribeToMatchChat(matchId, (newMessage: ChatMessage) => {
          if (isMounted) {
            setMessages(prev => {
              // Remove any optimistic message with same content and replace with real message
              const filtered = prev.filter(msg => {
                // Remove optimistic messages that match this real message
                if (msg.id.startsWith('temp-') && 
                    msg.content === newMessage.content && 
                    msg.username === newMessage.username) {
                  return false;
                }
                // Avoid duplicates of real messages
                return msg.id !== newMessage.id;
              });
              
              return [...filtered, newMessage];
            });
            
            // Keep user count accurate (just the current user)
            setChatStats(prev => ({
              ...prev,
              activeUsers: 1 // Always show 1 user since only current user is in the chat
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
          if (messagesResult.status === 'fulfilled') {
            setMessages(messagesResult.value);
          }

          // Set stats if successful, but maintain accurate user count
          if (statsResult.status === 'fulfilled') {
            setChatStats(prev => ({
              ...statsResult.value,
              activeUsers: 1 // Always show 1 user (current user only)
            }));
          }

          // Set users if successful
          if (usersResult.status === 'fulfilled') {
            setActiveUsers(usersResult.value);
          }

          // Data loaded successfully
          
          // Scroll to bottom after loading
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }

      } catch (error) {
        console.error('Error initializing chat:', error);
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
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Professional keyboard handling
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        setIsKeyboardVisible(true);
        // Auto-scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
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



  // Gift animation
  const triggerGiftAnimation = () => {
    setShowGiftAnimation(true);
    Animated.sequence([
      Animated.timing(giftAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(giftAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowGiftAnimation(false);
    });
  };

  // Emoji selection
  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Common emojis for quick access
  const commonEmojis = ['⚽', '🏆', '👏', '🔥', '💪', '😍', '😂', '❤️', '👍', '🎉'];

  // Send message function - Enhanced for instant response
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please wait while we authenticate you for the chat.',
        [{ text: 'OK' }]
      );
      return;
    }

    const messageContent = newMessage.trim();
    
    // ✅ INSTANT UI UPDATE: Clear input immediately for better UX
    setNewMessage('');
    
    // ✅ OPTIMISTIC UPDATE: Add message to UI immediately while sending
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      match_id: matchId,
      user_id: currentUser?.username || 'Unknown',
      username: currentUser?.username || 'You',
      level: currentUser?.level || 1,
      content: messageContent,
      created_at: new Date().toISOString()
    };
    
    // Add optimistic message to UI
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Auto-scroll to show the new message
    setTimeout(() => scrollToBottom(), 50);

    // Send to server in background (don't await to keep UI responsive)
    chatService.sendMessage(matchId, messageContent).then(result => {
      if (!result.success) {
        console.error('❌ Failed to send message:', result.error);
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setNewMessage(messageContent); // Restore message to input
        Alert.alert('Failed to send message', result.error || 'Network error. Please try again.');
      } else {
        console.log('✅ Message sent successfully');
        // Real message will come through real-time subscription and replace optimistic one
      }
    }).catch(error => {
      console.error('❌ Exception sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageContent); // Restore message to input
      Alert.alert('Failed to send message', 'Network error. Please try again.');
    });
  };

  // Render individual message
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isCurrentUser = currentUser?.username === item.username;
    const formattedTime = chatService.formatMessageTime(item.created_at);

    console.log('🔍 RENDER MESSAGE:', { 
      messageId: item.id, 
      username: item.username, 
      content: item.content,
      isCurrentUser 
    });

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser && styles.currentUserMessage
      ]}>
        <View style={styles.messageHeader}>
          <View style={styles.userInfo}>
            <Text style={[styles.userLevel, { color: theme.colors.primary }]}>
              Lv {item.level}
            </Text>
            <Text style={[
              styles.username, 
              { color: isCurrentUser ? theme.colors.primary : theme.colors.text }
            ]}>
              {item.username}
            </Text>
          </View>
          <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
            {formattedTime}
          </Text>
        </View>
        <Text style={[
          styles.messageContent, 
          { color: theme.colors.text }
        ]}>
          {item.content}
        </Text>
      </View>
    );
  };

  // Render chat header
  const renderChatHeader = () => (
    <View style={[styles.chatHeader, { backgroundColor: '#181818' }]}> 
      <View style={styles.chatHeaderLeft}>
        <MessageCircle size={20} color={theme.colors.primary} />
        <Text style={[styles.chatTitle, { color: '#FFFFFF' }]}> 
          Habari
        </Text>
        <View style={[styles.userCountBadge, { backgroundColor: theme.colors.primary }]}> 
          <Users size={12} color="#FFFFFF" />
          <Text style={styles.userCountText}>{chatStats.activeUsers}</Text>
        </View>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={48} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
        Start the conversation!
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
        Be the first to share your thoughts about this match.
      </Text>
    </View>
  );

  // Render emoji picker
  const renderEmojiPicker = () => {
    if (!showEmojiPicker) return null;
    
    return (
      <View style={[styles.emojiPicker, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <FlatList
          data={commonEmojis}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.emojiButton}
              onPress={() => insertEmoji(item)}
            >
              <Text style={styles.emoji}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // Render message input with enhanced features
  const renderMessageInput = () => (
    <View style={{ 
      position: 'absolute', 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: theme.colors.background, 
      zIndex: 10 
    }}>
      {renderEmojiPicker()}
      <View style={[styles.inputContainer, { backgroundColor: 'transparent' }]}>        
        <View style={[
          styles.inputWrapper, 
          { 
            backgroundColor: themeMode === 'dark' ? '#2A2A2A' : '#F5F5F5', 
            borderColor: themeMode === 'dark' ? '#404040' : '#E0E0E0'
          }
        ]}> 
          <TextInput
            style={[
              styles.messageInput,
              { 
                color: theme.colors.text,
              }
            ]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={isAuthenticated ? "Type your message..." : "Authenticating..."}
            placeholderTextColor={theme.colors.textSecondary}
            multiline={false}
            numberOfLines={1}
            maxLength={500}
            editable={isAuthenticated}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
            enablesReturnKeyAutomatically={true}
            scrollEnabled={false}
            onFocus={() => {
              // Auto-scroll when input is focused
              setTimeout(() => {
                scrollToBottom();
              }, 300);
            }}
          />
          <TouchableOpacity
            style={styles.emojiToggleInside}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            { 
              backgroundColor: theme.colors.primary,
              opacity: (!newMessage.trim() || !isAuthenticated) ? 0.5 : 1
            }
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || !isAuthenticated}
        >
          <Send size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.giftButton, { backgroundColor: theme.colors.background }]}
          onPress={triggerGiftAnimation}
        >
          <Animated.View
            style={{
              transform: [
                {
                  scale: giftAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2]
                  })
                }
              ]
            }}
          >
            <Gift size={20} color={theme.colors.primary} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // No loading screen needed - chat loads instantly

  // No need for separate upper section animation - handled by parent container now

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>  
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {/* Main chat area: FlatList and input in a single flex column */}
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          {!hideHeader && renderChatHeader()}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={[
              styles.messagesContainer,
              messages.length === 0 && styles.emptyContainer
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            onContentSizeChange={() => {
              if (isKeyboardVisible) setTimeout(() => scrollToBottom(), 100);
            }}
            onLayout={() => {
              if (isKeyboardVisible) setTimeout(() => scrollToBottom(), 100);
            }}
            extraData={messages.length}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 100,
            }}
          />
          {/* Input always at bottom, above keyboard, no extra wrapper */}
          {renderMessageInput()}
        </View>
      </TouchableWithoutFeedback>
      {/* Gift animation overlay */}
      {showGiftAnimation && (
        <Animated.View style={[
          styles.giftAnimationOverlay,
          {
            opacity: giftAnimation,
            transform: [
              {
                scale: giftAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 2]
                })
              }
            ]
          }
        ]}>
          <Gift size={80} color={theme.colors.primary} />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Ensure transparent background
    paddingTop: 0, // Ensure no top padding
    marginTop: 0, // Ensure no top margin
    borderTopWidth: 0, // Ensure no top border
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7, // Reduced from 12 to 8 for tighter spacing
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  chatHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeUsersCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  messagesList: {
    flex: 1,
    marginBottom: 0, // Ensure no extra margin at bottom
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8, // Restore normal padding since Habari is properly positioned
    paddingBottom: 12, // Keep bottom padding for separation from input
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 60, // Extra bottom padding to separate from input area
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  messageContainer: {
    marginVertical: 3, // Reduced from 6 to 3 for tighter message spacing
    paddingVertical: 6, // Reduced from 8 to 6
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  currentUserMessage: {
    backgroundColor: 'rgba(58, 141, 255, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#3A8DFF',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userLevel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(58, 141, 255, 0.2)',
    overflow: 'hidden',
  },
  username: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  messageContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
    minHeight: 44,
    height: 44,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 44,
    minHeight: 44,
    height: 44,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    backgroundColor: 'transparent',
    paddingRight: 8,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 20,
    textAlignVertical: 'center',
    minHeight: 28,
    maxHeight: 28,
    height: 28,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    marginBottom: 2,
  },
  // New styles for enhanced features
  chatContainer: {
    flex: 1,
    paddingBottom: 0, // Ensure no extra bottom padding
    paddingTop: 0, // Ensure no top padding
    marginTop: 0, // Ensure no top margin
    borderTopWidth: 0, // Remove any top border
    backgroundColor: '#181818', // Force same background color to eliminate any gaps
  },
  userCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  userCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },

  emojiPicker: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  emojiButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emoji: {
    fontSize: 24,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emojiToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emojiToggleInside: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginBottom: Platform.OS === 'ios' ? 2 : 0,
  },
  giftButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 2,
  },
  giftAnimationOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
});

export default MatchChat; 