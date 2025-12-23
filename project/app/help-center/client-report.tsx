import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';

type ReportStatus = 'all' | 'unprocessed' | 'processing' | 'completed';

interface ReportRecord {
  id: string;
  problemType: string;
  problemDetails: string;
  status: 'unprocessed' | 'processing' | 'completed';
  submitTime: string;
  phoneNumber?: string;
}

export default function ClientReportScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  
  // Sample data structure - in the future, this will be fetched from API
  const [reportRecords] = useState<ReportRecord[]>([
    // This array will be populated with actual report records from the backend
    // Example structure:
    // {
    //   id: '1',
    //   problemType: 'Violation',
    //   problemDetails: 'Sample report...',
    //   status: 'processing',
    //   submitTime: '2024-01-15 10:30:00',
    //   phoneNumber: '1234567890'
    // }
  ]);

  const statusTabs = [
    { id: 'all', label: t('All') },
    { id: 'unprocessed', label: t('Unprocessed') },
    { id: 'processing', label: t('Processing') },
    { id: 'completed', label: t('Completed') },
  ];

  const handleTabChange = (newStatus: ReportStatus) => {
    if (newStatus === selectedStatus || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Change the status
      setSelectedStatus(newStatus);
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call to fetch report records
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const getFilteredRecords = () => {
    if (selectedStatus === 'all') {
      return reportRecords;
    }
    return reportRecords.filter(record => record.status === selectedStatus);
  };

  const filteredRecords = getFilteredRecords();

  const renderStatusTabs = () => (
    <View style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}>
      {statusTabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tabItem}
          onPress={() => handleTabChange(tab.id as ReportStatus)}
          activeOpacity={0.7}
          disabled={isTransitioning}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: selectedStatus === tab.id ? theme.colors.primary : theme.colors.textSecondary,
              }
            ]}
          >
            {tab.label}
          </Text>
          {selectedStatus === tab.id && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No more
      </Text>
    </View>
  );

  const renderReportItem = (record: ReportRecord) => (
    <TouchableOpacity
      key={record.id}
      style={[styles.reportItem, { backgroundColor: theme.colors.background }]}
      onPress={() => {
        // Navigate to report detail screen (to be implemented)
        console.log('Report item pressed:', record.id);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTypeContainer}>
          <Text style={[styles.reportType, { color: theme.colors.text }]}>
            {record.problemType}
          </Text>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor:
                record.status === 'completed' ? '#4CAF50' :
                record.status === 'processing' ? '#FF9800' :
                '#9E9E9E'
            }
          ]}>
            <Text style={styles.statusText}>
              {record.status === 'completed' ? 'Completed' :
               record.status === 'processing' ? 'Processing' :
               'Unprocessed'}
            </Text>
          </View>
        </View>
        <Text style={[styles.reportTime, { color: theme.colors.textSecondary }]}>
          {record.submitTime}
        </Text>
      </View>
      
      <Text 
        style={[styles.reportDetails, { color: theme.colors.textSecondary }]}
        numberOfLines={2}
      >
        {record.problemDetails}
      </Text>
      
      {record.phoneNumber && (
        <Text style={[styles.reportPhone, { color: theme.colors.textSecondary }]}>
          Contact: {record.phoneNumber}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Report Records
        </Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Status Tabs */}
      {renderStatusTabs()}

      {/* Report List */}
      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor: theme.colors.backgroundSecondary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {filteredRecords.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {filteredRecords.map(record => renderReportItem(record))}
              <View style={styles.bottomSpacing}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No more
                </Text>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
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
    borderBottomColor: '#2A2A2A',
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
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '40%',
    right: '40%',
    height: 2,
    borderRadius: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  reportItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    marginBottom: 12,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  reportTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  reportDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  reportPhone: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  bottomSpacing: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

