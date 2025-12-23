import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  HelpCircle,
  UserX,
  Users,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface BlockedUser {
  id: string;
  username: string;
  avatar?: string;
  blockedDate: string;
  reason?: string;
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Mock data - empty for now to show empty state
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  const handleUnblockUser = (userId: string) => {
    setBlockedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationBackground}>
          <Shield size={60} color="#9CA3AF" />
        </View>
        <View style={styles.illustrationDetail}>
          <UserX size={24} color="#DC2626" />
        </View>
      </View>
      <Text style={[styles.emptyStateText, { color: '#9CA3AF' }]}>
        No Data
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: '#9CA3AF' }]}>
        You haven't blocked any users yet
      </Text>
    </View>
  );

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: '#DC2626' }]}>
          <Text style={styles.avatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {item.username}
          </Text>
          <Text style={[styles.blockedDate, { color: '#6B7280' }]}>
            Blocked on {item.blockedDate}
          </Text>
          {item.reason && (
            <Text style={[styles.reason, { color: '#6B7280' }]}>
              Reason: {item.reason}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblockUser(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.unblockButtonText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHelpModal = () => (
    <Modal
      visible={showHelpModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowHelpModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Tips
            </Text>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={[styles.modalText, { color: theme.colors.text }]}>
              Blocked users cannot follow your account. Once blocked users become premium members, they will be automatically removed from your blocked list and can follow your account.
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={() => setShowHelpModal(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          Blocked Users
        </Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowHelpModal(true)}
          activeOpacity={0.7}
        >
          <HelpCircle size={24} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {blockedUsers.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={blockedUsers}
            renderItem={renderBlockedUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Help Modal */}
      {renderHelpModal()}
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
    marginHorizontal: 16,
  },
  helpButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    backgroundColor: '#FEF2F2',
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
  listContainer: {
    paddingVertical: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  blockedDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  reason: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  unblockButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unblockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: 200,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  modalContent: {
    marginBottom: 30,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    textAlign: 'left',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
}); 