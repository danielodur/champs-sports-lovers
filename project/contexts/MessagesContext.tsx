import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking, AppState } from 'react-native';

interface Message {
  id: string;
  type: 'announcement' | 'comment' | 'like' | 'follow' | 'system';
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  hasRedDot?: boolean;
}

interface MessagesContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  unreadCount: number;
  notificationsEnabled: boolean;
  markAllAsRead: () => void;
  markMessageAsRead: (messageId: string) => void;
  requestNotificationPermission: () => Promise<void>;
  checkNotificationPermission: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};

interface MessagesProviderProps {
  children: ReactNode;
}

export const MessagesProvider: React.FC<MessagesProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'announcement',
      title: 'Announcement',
      content: '[Important Reminder] For your account security, if you encounter the following situations, please...',
      timestamp: '2022/06/10 11:43',
      isRead: false,
      hasRedDot: true,
    },
    {
      id: '2',
      type: 'system',
      title: 'System Notification',
      content: 'Your account has been successfully verified. Welcome to Champs!',
      timestamp: '2022/06/09 15:30',
      isRead: true,
    },
    {
      id: '3',
      type: 'comment',
      title: 'New Comment',
      content: 'Someone commented on your post: "Great prediction!"',
      timestamp: '2022/06/08 20:15',
      isRead: true,
    },
  ]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const unreadCount = messages.filter(msg => !msg.isRead).length;

  // Check notification permission on mount and when app becomes active
  useEffect(() => {
    checkNotificationPermission();
    
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground, check permissions again
        checkNotificationPermission();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.log('Error checking notification permission:', error);
      setNotificationsEnabled(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setNotificationsEnabled(true);
        return;
      }

      if (existingStatus === 'denied') {
        // Permission was previously denied, need to go to settings
        Alert.alert(
          'Notifications Disabled',
          'Notifications are currently disabled for this app. To enable notifications, please go to your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      // Request permission
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      if (status === 'granted') {
        setNotificationsEnabled(true);
      } else if (status === 'denied') {
        Alert.alert(
          'Notification Permission Required',
          'To receive important updates and messages, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.log('Error requesting notification permission:', error);
      Alert.alert('Error', 'Failed to request notification permission. Please try again.');
    }
  };

  const markAllAsRead = () => {
    setMessages(prev => 
      prev.map(msg => ({ ...msg, isRead: true, hasRedDot: false }))
    );
  };

  const markMessageAsRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true, hasRedDot: false } : msg
      )
    );
  };

  return (
    <MessagesContext.Provider value={{
      messages,
      setMessages,
      unreadCount,
      notificationsEnabled,
      markAllAsRead,
      markMessageAsRead,
      requestNotificationPermission,
      checkNotificationPermission,
    }}>
      {children}
    </MessagesContext.Provider>
  );
}; 