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
  Target, 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Calendar,
  Filter,
  Download
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface PredictionRecord {
  id: string;
  predictionNumber: string;
  sport: 'football' | 'basketball' | 'rugby' | 'boxing';
  match: string;
  prediction: string;
  confidence: number;
  odds: number;
  stake: number;
  purchaseDate: string;
  matchDate: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  result?: string;
  payout?: number;
  expert: string;
  category: 'premium' | 'vip' | 'basic';
}

type FilterType = 'all' | 'pending' | 'won' | 'lost' | 'void';

export default function PredictionNumbersScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real prediction data (to be replaced with API call)
  const realPredictions: PredictionRecord[] = [
    {
      id: '1',
      predictionNumber: 'PN2024-001',
      sport: 'football',
      match: 'Liverpool vs Manchester City',
      prediction: 'Over 2.5 Goals',
      confidence: 95,
      odds: 1.85,
      stake: 50,
      purchaseDate: '2024-01-15T10:30:00Z',
      matchDate: '2024-01-20T15:00:00Z',
      status: 'won',
      result: 'Final Score: 3-1',
      payout: 92.5,
      expert: 'Football Pro Analyst',
      category: 'premium'
    },
    {
      id: '2',
      predictionNumber: 'PN2024-002',
      sport: 'basketball',
      match: 'Lakers vs Warriors',
      prediction: 'Lakers +5.5',
      confidence: 88,
      odds: 1.95,
      stake: 30,
      purchaseDate: '2024-01-14T14:20:00Z',
      matchDate: '2024-01-18T20:00:00Z',
      status: 'lost',
      result: 'Final Score: 112-108',
      expert: 'NBA Expert',
      category: 'vip'
    },
    {
      id: '3',
      predictionNumber: 'PN2024-003',
      sport: 'football',
      match: 'Arsenal vs Chelsea',
      prediction: 'Arsenal to Win',
      confidence: 78,
      odds: 2.1,
      stake: 25,
      purchaseDate: '2024-01-16T09:15:00Z',
      matchDate: '2024-01-25T17:30:00Z',
      status: 'pending',
      expert: 'Premier League Insider',
      category: 'basic'
    }
  ];

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPredictions(realPredictions);
    } catch (error) {
      console.error('Error loading predictions:', error);
      Alert.alert('Error', 'Failed to load prediction records');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPredictions();
    setRefreshing(false);
  };

  const getFilteredPredictions = (): PredictionRecord[] => {
    if (activeFilter === 'all') return predictions;
    return predictions.filter(prediction => prediction.status === activeFilter);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#FF9800" />;
      case 'won':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'lost':
        return <XCircle size={16} color="#EF5350" />;
      case 'void':
        return <XCircle size={16} color="#607D8B" />;
      default:
        return <Clock size={16} color="#FF9800" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'won':
        return '#4CAF50';
      case 'lost':
        return '#EF5350';
      case 'void':
        return '#607D8B';
      default:
        return '#FF9800';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'premium':
        return '#9C27B0';
      case 'vip':
        return '#FF9800';
      case 'basic':
        return '#2196F3';
      default:
        return '#607D8B';
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'football':
        return '⚽';
      case 'basketball':
        return '🏀';
      case 'rugby':
        return '🏉';
      case 'boxing':
        return '🥊';
      default:
        return '🏃';
    }
  };

  const renderFilterTabs = () => {
    const filters = [
      { id: 'all', label: 'All' },
      { id: 'pending', label: 'Pending' },
      { id: 'won', label: 'Won' },
      { id: 'lost', label: 'Lost' },
      { id: 'void', label: 'Void' }
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              {
                backgroundColor: activeFilter === filter.id 
                  ? '#EF5350' 
                  : theme.colors.backgroundSecondary
              }
            ]}
            onPress={() => setActiveFilter(filter.id as FilterType)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterText,
              {
                color: activeFilter === filter.id ? '#FFFFFF' : theme.colors.text
              }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderPredictionItem = ({ item }: { item: PredictionRecord }) => (
    <TouchableOpacity
      style={[styles.predictionItem, { backgroundColor: theme.colors.backgroundSecondary }]}
      activeOpacity={0.7}
      onPress={() => {
        Alert.alert(
          item.predictionNumber,
          `Match: ${item.match}\n\nPrediction: ${item.prediction}\nConfidence: ${item.confidence}%\nOdds: ${item.odds}\nStake: $${item.stake}\n\nExpert: ${item.expert}\nPurchase Date: ${formatDate(item.purchaseDate)}\nMatch Date: ${formatDate(item.matchDate)}${item.result ? `\n\nResult: ${item.result}` : ''}${item.payout ? `\nPayout: $${item.payout}` : ''}`,
          [{ text: 'OK' }]
        );
      }}
    >
      {/* Header */}
      <View style={styles.predictionHeader}>
        <View style={styles.predictionInfo}>
          <Text style={[styles.predictionNumber, { color: theme.colors.text }]}>
            {item.predictionNumber}
          </Text>
          <View style={styles.sportContainer}>
            <Text style={styles.sportEmoji}>{getSportIcon(item.sport)}</Text>
            <Text style={[styles.sportText, { color: theme.colors.textSecondary }]}>
              {item.sport.charAt(0).toUpperCase() + item.sport.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Match Info */}
      <Text style={[styles.matchText, { color: theme.colors.text }]} numberOfLines={1}>
        {item.match}
      </Text>
      <Text style={[styles.predictionText, { color: theme.colors.textSecondary }]}>
        {item.prediction}
      </Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Star size={14} color="#FF9800" />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {item.confidence}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <TrendingUp size={14} color="#4CAF50" />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {item.odds}x
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.stakeLabel, { color: theme.colors.textSecondary }]}>
            Stake:
          </Text>
          <Text style={[styles.stakeAmount, { color: theme.colors.text }]}>
            ${item.stake}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.predictionFooter}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryText}>
            {item.category.toUpperCase()}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Calendar size={12} color={theme.colors.textSecondary} />
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.matchDate)}
          </Text>
        </View>
      </View>

      {/* Result/Payout */}
      {item.result && (
        <View style={[styles.resultContainer, { 
          backgroundColor: item.status === 'won' ? '#E8F5E8' : '#FFEBEE' 
        }]}>
          <Text style={[styles.resultText, { 
            color: item.status === 'won' ? '#4CAF50' : '#EF5350' 
          }]}>
            {item.result}
            {item.payout && ` • Payout: $${item.payout}`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSummaryStats = () => {
    const totalPredictions = predictions.length;
    const wonPredictions = predictions.filter(p => p.status === 'won').length;
    const lostPredictions = predictions.filter(p => p.status === 'lost').length;
    const pendingPredictions = predictions.filter(p => p.status === 'pending').length;
    const winRate = totalPredictions > 0 ? (wonPredictions / (wonPredictions + lostPredictions)) * 100 : 0;
    const totalStake = predictions.reduce((sum, p) => sum + p.stake, 0);
    const totalPayout = predictions.reduce((sum, p) => sum + (p.payout || 0), 0);

    return (
      <View style={[styles.summaryContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
          Your Prediction Summary
        </Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#2196F3' }]}>{totalPredictions}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{wonPredictions}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Won</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#EF5350' }]}>{lostPredictions}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Lost</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>{winRate.toFixed(1)}%</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Win Rate</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
            Total Invested: <Text style={{ color: theme.colors.text }}>${totalStake}</Text>
          </Text>
          <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
            Total Returns: <Text style={{ color: totalPayout > totalStake ? '#4CAF50' : '#EF5350' }}>${totalPayout.toFixed(2)}</Text>
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Target size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No prediction numbers found
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
        Purchase predictions from the marketplace to see them here
      </Text>
      <TouchableOpacity
        style={[styles.marketplaceButton, { backgroundColor: '#EF5350' }]}
        onPress={() => router.push('/predictions')}
        activeOpacity={0.8}
      >
        <Text style={styles.marketplaceButtonText}>
          Visit Predictions Marketplace
        </Text>
      </TouchableOpacity>
    </View>
  );

  const filteredPredictions = getFilteredPredictions();

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
          Prediction Numbers
        </Text>
        <TouchableOpacity 
          style={styles.downloadButton}
          activeOpacity={0.7}
        >
          <Download size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading your predictions...
            </Text>
          </View>
        ) : predictions.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredPredictions}
            renderItem={renderPredictionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            ListHeaderComponent={renderSummaryStats}
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
  downloadButton: {
    padding: 4,
  },
  filterContainer: {
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
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
    marginBottom: 24,
  },
  marketplaceButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  marketplaceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  listContainer: {
    padding: 16,
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  predictionItem: {
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
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionNumber: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  sportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sportEmoji: {
    fontSize: 16,
  },
  sportText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
  matchText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  predictionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  stakeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  stakeAmount: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  predictionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
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
  resultContainer: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
}); 