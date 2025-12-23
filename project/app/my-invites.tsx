import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Modal,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  UserPlus,
  Check,
  Clock,
  Download,
  Users,
  MessageCircle,
  Send,
  Copy,
  Inbox,
  CheckCircle,
  AlertCircle,
  UserCheck,
  User,
  Plus,
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface InviteUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  inviteDate: string;
  status: 'pending' | 'downloaded' | 'registered' | 'active';
  inviteMethod: 'sms' | 'email' | 'link' | 'whatsapp';
}

export default function UserInvitesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Mock data for invites
  const [invites, setInvites] = useState<InviteUser[]>([
    {
      id: '1',
      name: 'John Doe',
      phone: '+256 777 123456',
      inviteDate: '2022/06/10 14:30',
      status: 'pending',
      inviteMethod: 'sms',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      inviteDate: '2022/06/09 16:45',
      status: 'downloaded',
      inviteMethod: 'email',
    },
    {
      id: '3',
      name: 'Mike Wilson',
      phone: '+256 788 987654',
      inviteDate: '2022/06/08 09:15',
      status: 'registered',
      inviteMethod: 'whatsapp',
    },
    {
      id: '4',
      name: 'Emma Davis',
      phone: '+256 799 456789',
      inviteDate: '2022/06/07 11:20',
      status: 'active',
      inviteMethod: 'link',
    },
  ]);

  const tabs = [
    { id: 'all', label: 'All', icon: Inbox },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'downloaded', label: 'Downloaded', icon: Download },
    { id: 'registered', label: 'Registered', icon: UserCheck },
  ];

  const getFilteredInvites = () => {
    switch (activeTab) {
      case 'pending':
        return invites.filter(invite => invite.status === 'pending');
      case 'downloaded':
        return invites.filter(invite => invite.status === 'downloaded');
      case 'registered':
        return invites.filter(invite => invite.status === 'registered' || invite.status === 'active');
      default:
        return invites;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#FF9800" />;
      case 'downloaded':
        return <Download size={16} color="#2196F3" />;
      case 'registered':
        return <UserCheck size={16} color="#4CAF50" />;
      case 'active':
        return <CheckCircle size={16} color="#4CAF50" />;
      default:
        return <AlertCircle size={16} color="#9E9E9E" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Invite Sent';
      case 'downloaded':
        return 'App Downloaded';
      case 'registered':
        return 'Account Created';
      case 'active':
        return 'Active User';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'downloaded':
        return '#2196F3';
      case 'registered':
        return '#4CAF50';
      case 'active':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const handleInvitePress = (inviteId: string) => {
    const invite = invites.find(inv => inv.id === inviteId);
    if (invite && invite.status === 'pending') {
      Alert.alert(
        'Resend Invite',
        `Do you want to resend invite to ${invite.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Resend', onPress: () => resendInvite(invite) }
        ]
      );
    }
  };

  const resendInvite = (invite: InviteUser) => {
    // Implement resend logic here
    Alert.alert('Success', `Invite resent to ${invite.name}`);
  };

  const handleNewInvite = () => {
    router.push('/invite-friends');
  };

  const sendInviteViaSMS = async () => {
    const message = "Hey! Join me on Champs - the best sports prediction app! Download: https://champs.app/download";
    const url = `sms:?body=${encodeURIComponent(message)}`;
    
    try {
      await Linking.openURL(url);
      setShowInviteModal(false);
    } catch (error) {
      Alert.alert('Error', 'Could not open SMS app');
    }
  };

  const sendInviteViaWhatsApp = async () => {
    const message = "Hey! Join me on Champs - the best sports prediction app! Download: https://champs.app/download";
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        setShowInviteModal(false);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open WhatsApp');
    }
  };

  const shareInviteLink = async () => {
    try {
      const result = await Share.share({
        message: 'Join me on Champs - the best sports prediction app! Download: https://champs.app/download',
        title: 'Join Champs Sports App',
      });
      
      if (result.action === Share.sharedAction) {
        setShowInviteModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share invite');
    }
  };

  const copyInviteLink = async () => {
    // Note: For a real implementation, you'd use Clipboard API
    Alert.alert('Copied!', 'Invite link copied to clipboard');
    setShowInviteModal(false);
  };

  const renderInvite = ({ item }: { item: InviteUser }) => (
    <TouchableOpacity
      style={[
        styles.inviteItem,
        { 
          backgroundColor: theme.colors.backgroundSecondary
        }
      ]}
      onPress={() => handleInvitePress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.inviteHeader}>
        <View style={styles.inviteLeft}>
          <UserPlus size={20} color={theme.colors.primary} />
          <View style={styles.inviteInfo}>
            <Text style={[styles.inviteName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.inviteContact, { color: theme.colors.textSecondary }]}>
              {item.phone || item.email}
            </Text>
          </View>
        </View>
        <View style={styles.inviteRight}>
          <Text style={[styles.inviteTime, { color: theme.colors.textSecondary }]}>
            {item.inviteDate}
          </Text>
        </View>
      </View>
      <View style={styles.inviteStatus}>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) }
            ]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={[styles.inviteMethod, { color: theme.colors.textSecondary }]}>
          via {item.inviteMethod.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationBackground}>
          <Users size={60} color="#9CA3AF" />
        </View>
        <View style={styles.illustrationDetail}>
          <UserPlus size={24} color="#6B7280" />
        </View>
      </View>
      <Text style={[styles.emptyStateText, { color: '#9CA3AF' }]}>
        No Invites Yet
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: '#9CA3AF' }]}>
        Start inviting friends to join Champs!
      </Text>
      <TouchableOpacity
        style={[styles.inviteButton, { backgroundColor: "#EF5350" }]}
        onPress={handleNewInvite}
        activeOpacity={0.8}
      >
        <UserPlus size={20} color="#FFFFFF" />
        <Text style={styles.inviteButtonText}>Invite Friends</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredInvites = getFilteredInvites();

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
          My Invites
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleNewInvite}
          activeOpacity={0.7}
        >
          <View style={styles.userPlusContainer}>
            <User size={24} color={theme.colors.textSecondary} />
            <View style={styles.plusOverlay}>
              <Plus size={12} color="#EF5350" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

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

      {/* Invites List */}
      <View style={styles.content}>
        {filteredInvites.length > 0 ? (
          <FlatList
            data={filteredInvites}
            renderItem={renderInvite}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.invitesList}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Invite Options Modal */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Invite Friends
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Choose how you'd like to invite your friends
            </Text>
            
            <View style={styles.inviteOptions}>
              <TouchableOpacity
                style={[styles.inviteOption, { backgroundColor: theme.colors.background }]}
                onPress={sendInviteViaSMS}
                activeOpacity={0.7}
              >
                <MessageCircle size={24} color={theme.colors.primary} />
                <Text style={[styles.optionText, { color: theme.colors.text }]}>SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.inviteOption, { backgroundColor: theme.colors.background }]}
                onPress={sendInviteViaWhatsApp}
                activeOpacity={0.7}
              >
                <Send size={24} color="#25D366" />
                <Text style={[styles.optionText, { color: theme.colors.text }]}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.inviteOption, { backgroundColor: theme.colors.background }]}
                onPress={shareInviteLink}
                activeOpacity={0.7}
              >
                <Send size={24} color={theme.colors.primary} />
                <Text style={[styles.optionText, { color: theme.colors.text }]}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.inviteOption, { backgroundColor: theme.colors.background }]}
                onPress={copyInviteLink}
                activeOpacity={0.7}
              >
                <Copy size={24} color={theme.colors.textSecondary} />
                <Text style={[styles.optionText, { color: theme.colors.text }]}>Copy Link</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowInviteModal(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
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
  addButton: {
    padding: 4,
  },
  userPlusContainer: {
    position: 'relative',
  },
  plusOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 1,
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
  invitesList: {
    padding: 16,
  },
  inviteItem: {
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
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  inviteContact: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  inviteRight: {
    alignItems: 'flex-end',
  },
  inviteTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  inviteStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  inviteMethod: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
    marginBottom: 24,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 32,
  },
  inviteOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  inviteOption: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
}); 