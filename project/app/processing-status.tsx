import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  MessageSquare
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface FeedbackRecord {
  id: string;
  title: string;
  description: string;
  status: 'unprocessed' | 'processing' | 'completed';
  submittedDate: string;
  responseDate?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  response?: string;
}

type TabType = 'all' | 'unprocessed' | 'processing' | 'completed';

export default function ProcessingStatusScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [feedbackRecords, setFeedbackRecords] = useState<FeedbackRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'all', label: 'All', count: 0 },
    { id: 'unprocessed', label: 'Unprocessed', count: 0 },
    { id: 'processing', label: 'Processing', count: 0 },
    { id: 'completed', label: 'Completed', count: 0 }
  ];

  // Mock data for demonstration
  const mockFeedbackRecords: FeedbackRecord[] = [
    {
      id: '1',
      title: 'App Crashes on Login',
      description: 'The app crashes when I try to log in with my credentials.',
      status: 'processing',
      submittedDate: '2024-01-15T10:30:00Z',
      priority: 'high',
      category: 'Bug Report'
    },
    {
      id: '2',
      title: 'Feature Request: Dark Mode',
      description: 'Please add a dark mode option to the app settings.',
      status: 'completed',
      submittedDate: '2024-01-10T14:20:00Z',
      responseDate: '2024-01-12T09:15:00Z',
      priority: 'medium',
      category: 'Feature Request',
      response: 'Dark mode has been implemented in the latest update. Please update your app to access this feature.'
    },
    {
      id: '3',
      title: 'Payment Issue',
      description: 'Unable to process payment for premium subscription.',
      status: 'unprocessed',
      submittedDate: '2024-01-14T16:45:00Z',
      priority: 'high',
      category: 'Payment'
    }
  ];

  useEffect(() => {
    loadFeedbackRecords();
  }, []);

  const loadFeedbackRecords = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFeedbackRecords(mockFeedbackRecords);
    } catch (error) {
      console.error('Error loading feedback records:', error);
      Alert.alert('Error', 'Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeedbackRecords();
    setRefreshing(false);
  };

  const getFilteredRecords = (): FeedbackRecord[] => {
    if (activeTab === 'all') return feedbackRecords;
    return feedbackRecords.filter(record => record.status === activeTab);
  };

  const getTabCounts = () => {
    const counts = {
      all: feedbackRecords.length,
      unprocessed: feedbackRecords.filter(r => r.status === 'unprocessed').length,
      processing: feedbackRecords.filter(r => r.status === 'processing').length,
      completed: feedbackRecords.filter(r => r.status === 'completed').length
    };
    return counts;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unprocessed':
        return <AlertCircle size={16} color="#FF9800" />;
      case 'processing':
        return <Clock size={16} color="#2196F3" />;
      case 'completed':
        return <CheckCircle size={16} color="#4CAF50" />;
      default:
        return <FileText size={16} color={theme.colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'unprocessed':
        return '#FF9800';
      case 'processing':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#EF5350';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderTabBar = () => {
    const counts = getTabCounts();
    
    return (
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.id as TabType)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              {
                color: activeTab === tab.id ? '#EF5350' : theme.colors.textSecondary,
                fontFamily: activeTab === tab.id ? 'Inter-SemiBold' : 'Inter-Regular'
              }
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && (
              <View style={[styles.activeTabIndicator, { backgroundColor: '#EF5350' }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFeedbackItem = ({ item }: { item: FeedbackRecord }) => (
    <TouchableOpacity
      style={[styles.feedbackItem, { backgroundColor: theme.colors.backgroundSecondary }]}
      activeOpacity={0.7}
      onPress={() => {
        Alert.alert(
          item.title,
          `Description: ${item.description}\n\nStatus: ${item.status}\nSubmitted: ${formatDate(item.submittedDate)}${item.response ? `\n\nResponse: ${item.response}` : ''}`,
          [{ text: 'OK' }]
        );
      }}
    >
      <View style={styles.feedbackHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.feedbackTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.feedbackDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.feedbackFooter}>
        <View style={styles.categoryContainer}>
          <MessageSquare size={12} color={theme.colors.textSecondary} />
          <Text style={[styles.categoryText, { color: theme.colors.textSecondary }]}>
            {item.category}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Calendar size={12} color={theme.colors.textSecondary} />
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.submittedDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FileText size={48} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No feedback records found
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
        {activeTab === 'all' 
          ? 'Submit your first feedback to see it here'
          : `No ${activeTab} feedback records`
        }
      </Text>
    </View>
  );

  const filteredRecords = getFilteredRecords();

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
          Feedback Records
        </Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading feedback records...
            </Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredRecords}
            renderItem={renderFeedbackItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
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
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative',
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    textAlign: 'center',
    flexShrink: 0,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '80%',
    borderRadius: 1,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingVertical: 16,
  },
  feedbackItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  feedbackTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  feedbackDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
}); 