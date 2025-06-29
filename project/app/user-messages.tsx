import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Switch,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Calendar,
  Bell,
  MessageSquare,
  Heart,
  UserPlus,
  BookOpen,
  MessageCircle,
  AlertCircle,
  Inbox,
  Paintbrush,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useMessages } from '@/contexts/MessagesContext';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions';

// Re-export Message type for local use
type Message = {
  id: string;
  type: 'announcement' | 'comment' | 'like' | 'follow' | 'system';
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  hasRedDot?: boolean;
};

export default function UserMessagesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { 
    messages, 
    markAllAsRead, 
    markMessageAsRead 
  } = useMessages();
  const { granted, loading, requestPermission } = useNotificationPermissions();
  const [activeTab, setActiveTab] = useState('all');
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);

  // No need for useFocusEffect as useNotificationPermissions handles this

  const tabs = [
    { id: 'all', label: 'All', icon: Inbox },
    { id: 'comments', label: 'Comments/Replies', icon: MessageCircle },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'follows', label: 'Follows', icon: UserPlus },
    { id: 'subscriptions', label: 'Subscriptions', icon: BookOpen },
  ];

  const getFilteredMessages = () => {
    switch (activeTab) {
      case 'comments':
        return messages.filter(msg => msg.type === 'comment');
      case 'likes':
        return messages.filter(msg => msg.type === 'like');
      case 'follows':
        return messages.filter(msg => msg.type === 'follow');
      case 'subscriptions':
        return messages.filter(msg => msg.type === 'system');
      default:
        return messages;
    }
  };

  const handleAllowNotifications = async () => {
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

  const handleMessagePress = (messageId: string) => {
    markMessageAsRead(messageId);
    // Navigate to message detail or perform action
    console.log('Message pressed:', messageId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setShowMarkAllModal(false);
  };

  const handleBrushPress = () => {
    setShowMarkAllModal(true);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <AlertCircle size={20} color="#EF5350" />;
      case 'comment':
        return <MessageCircle size={20} color="#2196F3" />;
      case 'like':
        return <Heart size={20} color="#E91E63" />;
      case 'follow':
        return <UserPlus size={20} color="#4CAF50" />;
      case 'system':
        return <Bell size={20} color="#FF9800" />;
      default:
        return <MessageSquare size={20} color="#9E9E9E" />;
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={[
        styles.messageItem,
        { 
          backgroundColor: theme.colors.backgroundSecondary
        }
      ]}
      onPress={() => handleMessagePress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.messageHeader}>
        <View style={styles.messageLeft}>
          {item.hasRedDot && <View style={styles.redDot} />}
          {getMessageIcon(item.type)}
          <Text style={[styles.messageTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
        </View>
        <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
          {item.timestamp}
        </Text>
      </View>
      <Text
        style={[
          styles.messageContent,
          { color: theme.colors.textSecondary }
        ]}
        numberOfLines={2}
      >
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationBackground}>
          <MessageSquare size={60} color="#9CA3AF" />
        </View>
        <View style={styles.illustrationDetail}>
          <Inbox size={24} color="#6B7280" />
        </View>
      </View>
      <Text style={[styles.emptyStateText, { color: '#9CA3AF' }]}>
        No Data
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: '#9CA3AF' }]}>
        No messages in this category yet
      </Text>
    </View>
  );

  const filteredMessages = getFilteredMessages();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Messages
        </Text>
        <TouchableOpacity
          style={styles.brushButton}
          onPress={handleBrushPress}
          activeOpacity={0.7}
        >
          <Paintbrush size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Allow Notifications Setting - Only show if notifications are not granted */}
      {!granted && (
        <TouchableOpacity
          style={[
            styles.settingItem, 
            { 
              backgroundColor: theme.colors.backgroundSecondary,
              opacity: granted ? 1 : 0.5,
            }
          ]}
          onPress={handleAllowNotifications}
          activeOpacity={granted ? 1 : 0.7}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              Message Notification Settings
            </Text>
            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
              It is recommended to turn on to get the latest updates in time
            </Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[
              styles.openText, 
              { 
                color: granted ? theme.colors.primary : theme.colors.textSecondary 
              }
            ]}>
              {granted ? 'Enabled' : 'Open'}
            </Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                activeTab === tab.id && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <tab.icon 
                size={16} 
                color={activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <Text
                style={[
                  styles.tabText,
                  { 
                    color: activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary 
                  }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages List */}
      <View style={styles.content}>
        {filteredMessages.length > 0 ? (
          <FlatList
            data={filteredMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesList}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Mark All As Read Modal */}
      <Modal
        visible={showMarkAllModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Mark all messages as read?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMarkAllModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleMarkAllAsRead}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>
                  Confirm
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
  brushButton: {
    padding: 4,
  },
  notificationSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  settingLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  tabContainer: {
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF5350',
  },
  messageTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  messageContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginLeft: 32,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  illustrationContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  illustrationBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationDetail: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 24,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  confirmButton: {
    backgroundColor: '#EF5350',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
}); 