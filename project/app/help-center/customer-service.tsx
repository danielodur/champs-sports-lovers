import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  X, 
  Mic, 
  Image as ImageIcon, 
  Send,
  Circle,
  ChevronLeft,
  Star
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import { getCurrentProfilePicture } from '../../utils/userDataHelpers';
import { Audio } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type: 'text' | 'voice' | 'image';
}

export default function CustomerServiceScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { userInfo, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! Welcome to Champs Sports Customer Service. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [chatEnded, setChatEnded] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [rating, setRating] = useState(0);
  const [lastUserMessageTime, setLastUserMessageTime] = useState<Date>(new Date());
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;

  // Check if customer service is online (9:30 - 22:00)
  const isOnline = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + currentMinute / 60;
    
    return currentTime >= 9.5 && currentTime <= 22; // 9:30 to 22:00
  };

  const [online] = useState(isOnline());

  useEffect(() => {
    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Setup audio permissions
    setupAudioPermissions();

    // Start chat timeout
    startChatTimeout();

    // Cleanup on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (chatTimeoutRef.current) {
        clearTimeout(chatTimeoutRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  // Typing indicator animation
  const startTypingAnimation = () => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      animateDot(typingDot1, 0),
      animateDot(typingDot2, 200),
      animateDot(typingDot3, 400),
    ]).start();
  };

  const stopTypingAnimation = () => {
    typingDot1.stopAnimation();
    typingDot2.stopAnimation();
    typingDot3.stopAnimation();
    typingDot1.setValue(0);
    typingDot2.setValue(0);
    typingDot3.setValue(0);
  };

  const startChatTimeout = () => {
    // Clear existing timeout
    if (chatTimeoutRef.current) {
      clearTimeout(chatTimeoutRef.current);
    }

    // Set 5-minute timeout
    chatTimeoutRef.current = setTimeout(() => {
      if (!chatEnded) {
        endChat(true); // true indicates timeout
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  const resetChatTimeout = () => {
    setLastUserMessageTime(new Date());
    startChatTimeout();
  };

  const endChat = (isTimeout: boolean = false) => {
    setChatEnded(true);
    
    if (chatTimeoutRef.current) {
      clearTimeout(chatTimeoutRef.current);
    }

    // Add system message about chat ending
    const endMessage: Message = {
      id: Date.now().toString(),
      text: isTimeout 
        ? "Chat session ended due to inactivity. Thank you for contacting Champs Sports Customer Service."
        : "Chat session ended. Thank you for contacting Champs Sports Customer Service.",
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, endMessage]);

    // Show rating modal after a short delay
    setTimeout(() => {
      setShowRatingModal(true);
    }, 1500);
  };

  const handleBackPress = () => {
    console.log('Back button pressed, chatEnded:', chatEnded);
    
    if (chatEnded) {
      handleClose();
    } else {
      console.log('Showing back confirmation modal');
      setShowBackConfirmation(true);
    }
  };

  const setupAudioPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Audio recording permission is required for voice messages.');
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio permissions:', error);
    }
  };

  const handleClose = (skipAnimation = false) => {
    if (skipAnimation) {
      // Skip animation for smooth navigation from modals
      router.back();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.back();
      });
    }
  };

  const sendMessage = () => {
    if (inputText.trim() && !chatEnded) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      // Reset chat timeout when user sends message
      resetChatTimeout();

      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Show typing indicator and simulate customer service response
      setIsAgentTyping(true);
      startTypingAnimation();
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      setTimeout(() => {
        const responses = [
          "Thank you for contacting us. I'm reviewing your request.",
          "I understand your concern. Let me help you with that.",
          "Could you please provide more details about the issue?",
          "I'll escalate this to our technical team for a quick resolution.",
          "Is there anything else I can help you with today?"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // Stop typing indicator
        setIsAgentTyping(false);
        stopTypingAnimation();
        
        const serviceMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: randomResponse,
          isUser: false,
          timestamp: new Date(),
          type: 'text'
        };

        setMessages(prev => [...prev, serviceMessage]);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 2000);
    }
  };

  const handleVoiceMessage = async () => {
    if (!online) {
      Alert.alert('Service Offline', 'Customer service is currently offline. Please try again between 9:30 AM - 10:00 PM.');
      return;
    }

    // Only handle voice message when there's no text input
    if (inputText.trim()) {
      return;
    }

    try {
      if (!isRecording) {
        // Start recording
        await startRecording();
      } else {
        // Stop recording and send
        await stopRecording();
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      Alert.alert('Recording Error', 'Failed to record voice message. Please try again.');
      setIsRecording(false);
      setRecording(null);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is required for voice messages.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setIsRecording(false);
      setRecording(null);

      // Create voice message
      const voiceMessage: Message = {
        id: Date.now().toString(),
        text: `🎤 Voice message (${recordingDuration}s)`,
        isUser: true,
        timestamp: new Date(),
        type: 'voice'
      };

      setMessages(prev => [...prev, voiceMessage]);
      setRecordingDuration(0);
      
      // Reset chat timeout when user sends voice message
      resetChatTimeout();

      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Simulate customer service response
      setTimeout(() => {
        const serviceMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Thank you for your voice message. I'll review it and get back to you shortly.",
          isUser: false,
          timestamp: new Date(),
          type: 'text'
        };

        setMessages(prev => [...prev, serviceMessage]);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 1500);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to save voice message.');
    }
  };

  const handleImageAttachment = () => {
    if (!online) {
      Alert.alert('Service Offline', 'Customer service is currently offline. Please try again between 9:30 AM - 10:00 PM.');
      return;
    }

    Alert.alert(
      'Attach Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => Alert.alert('Camera', 'Camera functionality will be implemented.') },
        { text: 'Gallery', onPress: () => Alert.alert('Gallery', 'Gallery functionality will be implemented.') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.serviceMessage
      ]}
    >
      {/* Service Avatar - Left side */}
      {!message.isUser && (
        <View style={styles.serviceAvatar}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>C</Text>
          </View>
        </View>
      )}
      
      <View style={[
        styles.bubbleContainer,
        message.isUser ? styles.userBubbleContainer : styles.serviceBubbleContainer
      ]}>
        {/* Service Arrow - Left side pointing to avatar */}
        {!message.isUser && (
          <View
            style={[
              styles.bubbleArrow,
              styles.serviceArrow,
              { 
                borderRightColor: '#FFFFFF',
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderLeftColor: 'transparent'
              }
            ]}
          />
        )}
        
        <View
          style={[
            styles.messageBubble,
            message.isUser 
              ? [styles.userBubble, { backgroundColor: '#DC2626' }]
              : [styles.serviceBubble, { backgroundColor: '#FFFFFF' }]
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: message.isUser ? '#FFFFFF' : '#000000' }
            ]}
          >
            {message.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: message.isUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
        
        {/* User Arrow - Right side pointing to avatar */}
        {message.isUser && (
          <View
            style={[
              styles.bubbleArrow,
              styles.userArrow,
              { 
                borderLeftColor: '#DC2626',
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderRightColor: 'transparent'
              }
            ]}
          />
        )}
      </View>

      {/* User Avatar - Right side */}
      {message.isUser && (
        <View style={styles.userAvatar}>
          <Image
            source={{
              uri: getCurrentProfilePicture(userInfo, profile) || 'https://api.dicebear.com/7.x/adventurer/png?seed=DefaultUser'
            }}
            style={styles.avatarImage}
            defaultSource={{ uri: 'https://api.dicebear.com/7.x/adventurer/png?seed=DefaultUser' }}
          />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
      <Animated.View
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: '#E5E5E5' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#666666" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.serviceInfo}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>C</Text>
              </View>
              <View style={styles.serviceDetails}>
                <Text style={[styles.serviceName, { color: theme.colors.text }]}>
                  Champs Customer Service
                </Text>
                <View style={styles.statusContainer}>
                  <Circle
                    size={8}
                    fill={online ? '#4CAF50' : '#9E9E9E'}
                    color={online ? '#4CAF50' : '#9E9E9E'}
                  />
                  <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                    {online ? 'Online' : 'Offline'} • 9:30-22:00
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          
          {/* Typing Indicator */}
          {isAgentTyping && (
            <View style={styles.messageContainer}>
              {/* Service Avatar */}
              <View style={styles.serviceAvatar}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>C</Text>
                </View>
              </View>
              
              <View style={styles.typingIndicatorContainer}>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDots}>
                    <Animated.View
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingDot1,
                          transform: [{
                            translateY: typingDot1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -3],
                            }),
                          }],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingDot2,
                          transform: [{
                            translateY: typingDot2.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -3],
                            }),
                          }],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingDot3,
                          transform: [{
                            translateY: typingDot3.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -3],
                            }),
                          }],
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border
            }
          ]}>
            <View style={[
              styles.inputWrapper,
              { 
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border
              }
            ]}>
              <TextInput
                style={[
                  styles.messageInput,
                  { color: theme.colors.text }
                ]}
                placeholder={
                  chatEnded 
                    ? "Chat session ended" 
                    : online 
                      ? "Type your message..." 
                      : "Service offline (9:30-22:00)"
                }
                placeholderTextColor={theme.colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline={false}
                maxLength={500}
                editable={online && !chatEnded}
                returnKeyType="send"
                onSubmitEditing={inputText.trim() ? sendMessage : undefined}
                blurOnSubmit={false}
              />
              
              {/* Image Attachment Button - Only show when typing */}
              {inputText.trim() && online && (
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={handleImageAttachment}
                >
                  <ImageIcon 
                    size={20} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Recording Duration Display */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={[styles.recordingText, { color: theme.colors.text }]}>
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            )}

            {/* Send Button - Shows Send icon when text exists, Mic icon when empty */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: inputText.trim() && online 
                    ? theme.colors.primary 
                    : isRecording
                      ? '#EF4444'
                      : online 
                        ? theme.colors.backgroundSecondary 
                        : '#E0E0E0'
                }
              ]}
              onPress={inputText.trim() ? sendMessage : handleVoiceMessage}
              disabled={!online || chatEnded}
            >
              {inputText.trim() ? (
                <Send 
                  size={20} 
                  color="#FFFFFF" 
                />
              ) : (
                <Mic 
                  size={20} 
                  color={isRecording ? '#FFFFFF' : (online ? theme.colors.primary : '#9E9E9E')} 
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Back Confirmation Modal */}
      <Modal visible={showBackConfirmation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmationModal, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.confirmationTitle, { color: theme.colors.text }]}>
              End Chat Session?
            </Text>
            <Text style={[styles.confirmationText, { color: theme.colors.textSecondary }]}>
              The chat will be terminated if you go back. Are you sure you want to leave?
            </Text>
            
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={() => setShowBackConfirmation(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                  Not Now
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmationButton, styles.confirmButton]}
                onPress={() => {
                  setShowBackConfirmation(false);
                  endChat();
                }}
              >
                <Text style={styles.confirmButtonText}>
                  Yes, Go Back
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.ratingModal, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.ratingTitle, { color: theme.colors.text }]}>
              Rate Our Service
            </Text>
            <Text style={[styles.ratingSubtitle, { color: theme.colors.textSecondary }]}>
              How was your experience with our customer service?
            </Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={styles.starButton}
                  onPress={() => setRating(star)}
                >
                  <Star
                    size={32}
                    color={star <= rating ? '#FFD700' : '#E0E0E0'}
                    fill={star <= rating ? '#FFD700' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.ratingButtons}>
              <TouchableOpacity
                style={[styles.ratingButton, styles.skipButton]}
                onPress={() => {
                  // Close modal first, then navigate back smoothly
                  setShowRatingModal(false);
                  setTimeout(() => {
                    handleClose(true); // Skip animation to prevent white screen
                  }, 100); // Shorter delay since we're skipping animation
                }}
              >
                <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
                  Skip
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.ratingButton, 
                  styles.submitButton,
                  { backgroundColor: rating > 0 ? theme.colors.primary : '#E0E0E0' }
                ]}
                onPress={() => {
                  if (rating > 0) {
                    // Show thank you alert first
                    Alert.alert(
                      'Thank You!', 
                      'Your rating has been submitted.',
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            // Close modal and navigate back after user acknowledges
                            setShowRatingModal(false);
                            setTimeout(() => {
                              handleClose(true); // Skip animation to prevent white screen
                            }, 100); // Shorter delay since alert is already dismissed
                          }
                        }
                      ]
                    );
                  }
                }}
                disabled={rating === 0}
              >
                <Text style={[
                  styles.submitButtonText,
                  { color: rating > 0 ? '#FFFFFF' : '#9E9E9E' }
                ]}>
                  Submit Rating
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  serviceDetails: {
    alignItems: 'flex-start',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 6,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  serviceMessage: {
    justifyContent: 'flex-start',
  },
  userAvatar: {
    marginLeft: 0,
  },
  serviceAvatar: {
    marginRight: 0,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '75%',
  },
  serviceBubbleContainer: {
    marginLeft: 0,
  },
  userBubbleContainer: {
    marginRight: 0,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  serviceBubble: {
    borderBottomLeftRadius: 2,
  },
  bubbleArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  userArrow: {
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightWidth: 0,
    marginLeft: 0,
    width: 15,
    height: 20,
  },
  serviceArrow: {
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftWidth: 0,
    marginRight: 0,
    width: 15,
    height: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    fontFamily: 'Inter-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    gap: 12,
    borderTopWidth: 1,
    minHeight: 72,
    position: 'relative',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 48,
    minHeight: 48,
    height: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: 'transparent',
    paddingRight: 12,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 20,
    textAlignVertical: 'center',
    minHeight: 24,
    maxHeight: 24,
    height: 24,
  },
  attachButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
    marginRight: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  recordingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmationModal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmationTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  confirmButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  ratingModal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  ratingTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  starButton: {
    padding: 4,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  submitButton: {
    // backgroundColor set dynamically
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderBottomLeftRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999999',
    marginHorizontal: 2,
  },
});
