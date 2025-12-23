import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, X, FileCheck, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { appealsService } from '../../services/appealsService';
import { AccountAppeal } from '../../types/appeal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AccountAppealsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const [appeals, setAppeals] = useState<AccountAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      setError(null);
      const data = await appealsService.getAccountAppeals();
      setAppeals(data);
    } catch (err) {
      console.error('Error fetching appeals:', err);
      setError('Failed to load appeals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppeals();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getStatusColor = (status: AccountAppeal['status']) => {
    switch (status) {
      case 'pending':
        return '#FFA726';
      case 'approved':
        return '#66BB6A';
      case 'rejected':
        return '#EF5350';
      case 'cancelled':
        return '#9E9E9E';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: AccountAppeal['status']) => {
    const color = getStatusColor(status);
    const size = 20;

    switch (status) {
      case 'pending':
        return <Clock size={size} color={color} />;
      case 'approved':
        return <CheckCircle size={size} color={color} />;
      case 'rejected':
        return <XCircle size={size} color={color} />;
      case 'cancelled':
        return <AlertCircle size={size} color={color} />;
      default:
        return <Clock size={size} color={color} />;
    }
  };

  const getStatusText = (status: AccountAppeal['status']): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getAppealTypeText = (type: AccountAppeal['appeal_type']): string => {
    switch (type) {
      case 'account_suspension':
        return 'Account Suspension';
      case 'account_restriction':
        return 'Account Restriction';
      case 'content_removal':
        return 'Content Removal';
      case 'verification_issue':
        return 'Verification Issue';
      case 'payment_issue':
        return 'Payment Issue';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  const handleAppealPress = (appeal: AccountAppeal) => {
    // Navigate to appeal details screen (can be implemented later)
    console.log('Appeal pressed:', appeal.id);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.emptyIconCircle}>
          <FileCheck size={64} color="#EF5350" strokeWidth={1.5} />
          <View style={styles.checkmarkBadge}>
            <CheckCircle size={32} color="#66BB6A" fill="#66BB6A" />
          </View>
        </View>
      </View>
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
        Account is normal, no appeal needed
      </Text>
      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: '#EF5350' }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAppealCard = (appeal: AccountAppeal) => (
    <TouchableOpacity
      key={appeal.id}
      style={[styles.appealCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
      onPress={() => handleAppealPress(appeal)}
      activeOpacity={0.7}
    >
      <View style={styles.appealHeader}>
        <View style={styles.appealTitleRow}>
          <Text style={[styles.appealType, { color: theme.colors.text }]}>
            {getAppealTypeText(appeal.appeal_type)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appeal.status) + '20' }]}>
            {getStatusIcon(appeal.status)}
            <Text style={[styles.statusText, { color: getStatusColor(appeal.status) }]}>
              {getStatusText(appeal.status)}
            </Text>
          </View>
        </View>
        <Text style={[styles.appealId, { color: theme.colors.textSecondary }]}>
          ID: {appeal.id.slice(0, 8)}...
        </Text>
      </View>

      <View style={styles.appealBody}>
        <Text style={[styles.appealReason, { color: theme.colors.text }]} numberOfLines={2}>
          {appeal.reason}
        </Text>
        {appeal.description && (
          <Text style={[styles.appealDescription, { color: theme.colors.textSecondary }]} numberOfLines={3}>
            {appeal.description}
          </Text>
        )}
      </View>

      <View style={styles.appealFooter}>
        <View style={styles.dateRow}>
          <Clock size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            Submitted: {formatDate(appeal.submitted_at)}
          </Text>
        </View>
        {appeal.reviewed_at && (
          <View style={styles.dateRow}>
            <CheckCircle size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
              Reviewed: {formatDate(appeal.reviewed_at)}
            </Text>
          </View>
        )}
      </View>

      {appeal.admin_notes && (
        <View style={[styles.adminNotesContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.adminNotesLabel, { color: theme.colors.textSecondary }]}>
            Admin Notes:
          </Text>
          <Text style={[styles.adminNotesText, { color: theme.colors.text }]}>
            {appeal.admin_notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading appeals...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <XCircle size={64} color="#EF5350" />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchAppeals}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (appeals.length === 0) {
      return renderEmptyState();
    }

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Your Appeals ({appeals.length})
        </Text>
        {appeals.map(renderAppealCard)}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Account Appeal
        </Text>
        <TouchableOpacity
          style={styles.closeHeaderButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
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
    borderBottomWidth: 1,
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
  closeHeaderButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyIconCircle: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  closeButton: {
    width: SCREEN_WIDTH - 60,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  appealCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  appealHeader: {
    marginBottom: 12,
  },
  appealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appealType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  appealId: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  appealBody: {
    marginBottom: 12,
  },
  appealReason: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    marginBottom: 6,
    lineHeight: 22,
  },
  appealDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  appealFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
    gap: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  adminNotesContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  adminNotesLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 20,
  },
});

