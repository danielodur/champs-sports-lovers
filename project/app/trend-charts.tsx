import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Share,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
  id: string;
  title: string;
  description: string;
  type: 'line' | 'bar' | 'pie' | 'radar';
  timeframe: string;
  lastUpdated: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  expanded?: boolean;
}

export default function TrendChartsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('teams');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [charts, setCharts] = useState<ChartData[]>([
    {
      id: '1',
      title: 'Team Performance Trends',
      description: 'Performance metrics for top teams over time',
      type: 'line',
      timeframe: '1m',
      lastUpdated: '2 hours ago',
      trend: 'up',
      trendValue: '+5.2%',
      expanded: true
    },
    {
      id: '2',
      title: 'Player Value Fluctuations',
      description: 'Market value changes for top players',
      type: 'line',
      timeframe: '1m',
      lastUpdated: '4 hours ago',
      trend: 'down',
      trendValue: '-2.8%',
      expanded: false
    },
    {
      id: '3',
      title: 'League Comparison',
      description: 'Comparative analysis of major leagues',
      type: 'bar',
      timeframe: '1m',
      lastUpdated: '1 day ago',
      trend: 'up',
      trendValue: '+1.5%',
      expanded: false
    },
    {
      id: '4',
      title: 'Goal Distribution',
      description: 'Analysis of goal scoring patterns',
      type: 'pie',
      timeframe: '1m',
      lastUpdated: '3 days ago',
      trend: 'neutral',
      trendValue: '0.0%',
      expanded: false
    }
  ]);

  const tabs = [
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
    { id: 'leagues', label: 'Leagues' },
    { id: 'matches', label: 'Matches' }
  ];

  const timeframes = [
    { id: '1w', label: '1W' },
    { id: '1m', label: '1M' },
    { id: '3m', label: '3M' },
    { id: '6m', label: '6M' },
    { id: '1y', label: '1Y' },
    { id: 'all', label: 'All' }
  ];

  const { t } = useTranslation();

  const toggleChartExpansion = (chartId: string) => {
    setCharts(charts.map(chart => 
      chart.id === chartId 
        ? { ...chart, expanded: !chart.expanded } 
        : chart
    ));
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} color="#4CAF50" />;
      case 'down':
        return <TrendingDown size={16} color="#F44336" />;
      default:
        return <TrendingUp size={16} color="#9E9E9E" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#4CAF50';
      case 'down':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
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
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('trendCharts.headerTitle')}</Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { borderBottomColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === tab.id && { color: theme.colors.primary }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTimeframeSelector = () => (
    <View style={[styles.timeframeContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.timeframeHeader}>
        <Text style={[styles.timeframeTitle, { color: theme.colors.text }]}>
          {t('trendCharts.timeframeTitle')}
        </Text>
        <TouchableOpacity style={styles.refreshButton} activeOpacity={0.7}>
          <RefreshCw size={16} color={theme.colors.text} />
          <Text style={[styles.refreshText, { color: theme.colors.text }]}>
            {t('trendCharts.refreshButton')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeframeButtons}>
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe.id}
            style={[
              styles.timeframeButton,
              {
                backgroundColor: selectedTimeframe === timeframe.id ? theme.colors.primary : theme.colors.background,
              }
            ]}
            onPress={() => setSelectedTimeframe(timeframe.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.timeframeButtonText,
                {
                  color: selectedTimeframe === timeframe.id ? '#FFFFFF' : theme.colors.text,
                }
              ]}
            >
              {timeframe.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderChartCard = (chart: ChartData) => (
    <View
      key={chart.id}
      style={[styles.chartCard, { backgroundColor: theme.colors.backgroundSecondary }]}
    >
      <TouchableOpacity
        style={styles.chartHeader}
        onPress={() => toggleChartExpansion(chart.id)}
        activeOpacity={0.7}
      >
        <View style={styles.chartTitleContainer}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            {chart.title}
          </Text>
          <View style={styles.chartTrend}>
            {getTrendIcon(chart.trend)}
            <Text style={[styles.trendValue, { color: getTrendColor(chart.trend) }]}>
              {chart.trendValue}
            </Text>
          </View>
        </View>
        
        <View style={styles.chartActions}>
          <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
            {chart.lastUpdated}
          </Text>
          {chart.expanded ? (
            <ChevronUp size={20} color={theme.colors.text} />
          ) : (
            <ChevronDown size={20} color={theme.colors.text} />
          )}
        </View>
      </TouchableOpacity>
      
      {chart.expanded && (
        <View style={styles.chartContent}>
          <Text style={[styles.chartDescription, { color: theme.colors.textSecondary }]}>
            {chart.description}
          </Text>
          
          <View style={[styles.chartPlaceholder, { backgroundColor: theme.colors.background }]}>
            {chart.type === 'line' && (
              <View style={styles.lineChartPlaceholder}>
                <View style={[styles.linePoint, { top: '60%', left: '0%' }]} />
                <View style={[styles.linePoint, { top: '40%', left: '20%' }]} />
                <View style={[styles.linePoint, { top: '50%', left: '40%' }]} />
                <View style={[styles.linePoint, { top: '30%', left: '60%' }]} />
                <View style={[styles.linePoint, { top: '20%', left: '80%' }]} />
                <View style={[styles.linePoint, { top: '10%', left: '100%' }]} />
                <View style={[styles.line, { top: '60%', left: '0%', width: '20%', transform: [{ rotate: '-45deg' }] }]} />
                <View style={[styles.line, { top: '40%', left: '20%', width: '20%', transform: [{ rotate: '30deg' }] }]} />
                <View style={[styles.line, { top: '50%', left: '40%', width: '20%', transform: [{ rotate: '-45deg' }] }]} />
                <View style={[styles.line, { top: '30%', left: '60%', width: '20%', transform: [{ rotate: '-30deg' }] }]} />
                <View style={[styles.line, { top: '20%', left: '80%', width: '20%', transform: [{ rotate: '-30deg' }] }]} />
              </View>
            )}
            
            {chart.type === 'bar' && (
              <View style={styles.barChartPlaceholder}>
                <View style={[styles.bar, { height: '60%' }]} />
                <View style={[styles.bar, { height: '80%' }]} />
                <View style={[styles.bar, { height: '40%' }]} />
                <View style={[styles.bar, { height: '70%' }]} />
                <View style={[styles.bar, { height: '50%' }]} />
              </View>
            )}
            
            {chart.type === 'pie' && (
              <View style={styles.pieChartPlaceholder}>
                <View style={[styles.pieSlice, styles.pieSlice1]} />
                <View style={[styles.pieSlice, styles.pieSlice2]} />
                <View style={[styles.pieSlice, styles.pieSlice3]} />
                <View style={[styles.pieSlice, styles.pieSlice4]} />
              </View>
            )}
          </View>
          
          <View style={styles.chartControls}>
            <TouchableOpacity
              style={[styles.chartControl, { backgroundColor: theme.colors.background }]}
              activeOpacity={0.7}
            >
              <Filter size={16} color={theme.colors.text} />
              <Text style={[styles.chartControlText, { color: theme.colors.text }]}>
                {t('trendCharts.filterButton')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.chartControl, { backgroundColor: theme.colors.background }]}
              activeOpacity={0.7}
            >
              <Calendar size={16} color={theme.colors.text} />
              <Text style={[styles.chartControlText, { color: theme.colors.text }]}>
                {t('trendCharts.dateButton')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.chartControl, { backgroundColor: theme.colors.background }]}
              activeOpacity={0.7}
            >
              <Download size={16} color={theme.colors.text} />
              <Text style={[styles.chartControlText, { color: theme.colors.text }]}>
                {t('trendCharts.exportButton')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.chartControl, { backgroundColor: theme.colors.background }]}
              activeOpacity={0.7}
            >
              <Share size={16} color={theme.colors.text} />
              <Text style={[styles.chartControlText, { color: theme.colors.text }]}>
                {t('trendCharts.shareButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderTabs()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTimeframeSelector()}
        
        <View style={styles.chartsContainer}>
          {charts.map(renderChartCard)}
        </View>
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
  settingsButton: {
    padding: 4,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  timeframeContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  timeframeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeframeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  timeframeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center',
  },
  timeframeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  chartsContainer: {
    padding: 16,
    gap: 16,
  },
  chartCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartHeader: {
    padding: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  chartTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  chartActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  chartContent: {
    padding: 16,
    paddingTop: 0,
  },
  chartDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  lineChartPlaceholder: {
    flex: 1,
    position: 'relative',
  },
  linePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: -4,
    marginTop: -4,
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#4CAF50',
    transformOrigin: 'left center',
  },
  barChartPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 20,
  },
  bar: {
    width: 30,
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  pieChartPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginVertical: 25,
    overflow: 'hidden',
    position: 'relative',
  },
  pieSlice: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pieSlice1: {
    backgroundColor: '#4CAF50',
    transform: [{ rotate: '0deg' }],
    width: '50%',
    height: '50%',
    top: 0,
    left: 0,
  },
  pieSlice2: {
    backgroundColor: '#2196F3',
    transform: [{ rotate: '0deg' }],
    width: '50%',
    height: '50%',
    top: 0,
    right: 0,
  },
  pieSlice3: {
    backgroundColor: '#FFC107',
    transform: [{ rotate: '0deg' }],
    width: '50%',
    height: '50%',
    bottom: 0,
    left: 0,
  },
  pieSlice4: {
    backgroundColor: '#9C27B0',
    transform: [{ rotate: '0deg' }],
    width: '50%',
    height: '50%',
    bottom: 0,
    right: 0,
  },
  chartControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartControl: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  chartControlText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});