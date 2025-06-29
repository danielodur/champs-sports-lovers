import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, X, MessageCircle, Star, Calendar, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions';

interface Notification {
  id: string;
  type: 'announcement' | 'comment' | 'like' | 'follow' | 'system';
  title: string;
  content: string;
  date: string;
  read: boolean;
  icon?: any;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { granted, requestPermission } = useNotificationPermissions();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'announcement',
      title: 'Announcement',
      content: 'Important Notice: For your account security, please update your password if you notice any suspicious activity.',
      date: '2022/06/10 11:43',
      read: false,
      icon: AlertCircle
    },
    {
      id: '2',
      type: 'comment',
      title: 'New Comment',
      content: 'John Smith commented on your post about Arsenal vs Bayern Munich match analysis.',
      date: '2 hours ago',
      read: false,
      icon: MessageCircle
    },
    {
      id: '3',
      type: 'like',
      title: 'Post Liked',
      content: 'Sarah Wilson and 15 others liked your analysis of the Champions League match.',
      date: '5 hours ago',
      read: true,
      icon: Star
    },
    {
      id: '4',
      type: 'follow',
      title: 'New Follower',
      content: 'Mike Johnson started following you. Check out their profile!',
      date: 'Yesterday',
      read: true,
      icon: Bell
    },
    {
      id: '5',
      type: 'system',
      title: 'System Update',
      content: 'We\'ve updated our privacy policy. Please review the changes.',
      date: '3 days ago',
      read: true,
      icon: AlertCircle
    }
  ]);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'comments', label: 'Comments/Replies' },
    { id: 'likes', label: 'Likes' },
    { id: 'follows', label: 'Follows' },
    { id: 'subscriptions', label: 'Subscriptions' }
  ];

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
  };

  const handleTurnOnNotifications = async () => {
    console.log('Opening device notification settings...');
    try {
      // Try to open app-specific notification settings first
      const canOpenSettings = await Linking.canOpenURL('app-settings:');
      if (canOpenSettings) {
        await Linking.openURL('app-settings:');
      } else {
        // Fallback to general settings
        await Linking.openSettings();
      }
    } catch (error) {
      console.log('Could not open settings:', error);
      // Fallback to requesting permission
      await requestPermission();
    }
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'all') return notifications;
    
    return notifications.filter(notification => {
      switch (activeTab) {
        case 'comments':
          return notification.type === 'comment';
        case 'likes':
          return notification.type === 'like';
        case 'follows':
          return notification.type === 'follow';
        case 'subscriptions':
          return notification.type === 'system';
        default:
          return true;
      }
    });
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
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
      <TouchableOpacity 
        style={styles.headerRight}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <X size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
              activeTab === tab.id && { borderBottomColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === tab.id && { color: theme.colors.text }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderNotificationItem = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        { borderBottomColor: theme.colors.border },
        !notification.read && { backgroundColor: theme.colors.backgroundSecondary }
      ]}
      onPress={() => markAsRead(notification.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        {!notification.read && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
        
        <View style={styles.notificationIcon}>
          {notification.icon && (
            <notification.icon size={24} color={theme.colors.primary} />
          )}
        </View>
        
        <View style={styles.notificationTextContent}>
          <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
            {notification.title}
          </Text>
          <Text 
            style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {notification.content}
          </Text>
          <View style={styles.notificationMeta}>
            <Clock size={12} color={theme.colors.textSecondary} />
            <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
              {notification.date}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image
        source={{ uri: 'https://images.pexels.com/photos/4439901/pexels-photo-4439901.jpeg' }}
        style={styles.emptyStateImage}
        resizeMode="contain"
      />
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
        Turn on notifications to stay updated
      </Text>
    </View>
  );

  const renderNotificationPrompt = () => {
    // Only show if notifications are not granted
    if (granted) return null;
    
    return (
      <View style={[styles.notificationPrompt, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.promptText, { color: theme.colors.text }]}>
          Turn on notifications, don't miss any messages.
        </Text>
        <TouchableOpacity 
          style={[styles.promptButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleTurnOnNotifications}
          activeOpacity={0.8}
        >
          <Text style={styles.promptButtonText}>Turn On Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderTabs()}
      
      {renderNotificationPrompt()}
      
      {filteredNotifications.length > 0 ? (
        <ScrollView style={styles.notificationsList}>
          {filteredNotifications.map(renderNotificationItem)}
        </ScrollView>
      ) : (
        renderEmptyState()
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
    padding: 4,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  notificationPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  promptButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  promptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },

  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadDot: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTextContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});