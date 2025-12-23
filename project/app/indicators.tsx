import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Filter,
  Search,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Play,
  Download,
  Share,
  Info,
  Target,
  Zap,
  TriangleAlert as AlertTriangle,
} from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";

interface Indicator {
  id: string;
  name: string;
  description: string;
  value: number;
  previousValue: number;
  trend: "up" | "down" | "neutral";
  trendValue: number;
  trendPercentage: number;
  category: string;
  signal: "buy" | "sell" | "hold" | "neutral";
  confidence: number;
  lastUpdated: string;
  expanded?: boolean;
}

export default function IndicatorsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState("1d");
  const [indicators, setIndicators] = useState<Indicator[]>([
    {
      id: "1",
      name: "Team Form Index",
      description:
        "Measures team performance trend based on recent results, scoring patterns, and defensive solidity",
      value: 78.5,
      previousValue: 72.3,
      trend: "up",
      trendValue: 6.2,
      trendPercentage: 8.6,
      category: "Performance",
      signal: "buy",
      confidence: 85,
      lastUpdated: "2 hours ago",
      expanded: true,
    },
    {
      id: "2",
      name: "Player Value Indicator",
      description:
        "Tracks player market value fluctuations based on performance metrics and transfer market activity",
      value: 92.3,
      previousValue: 94.1,
      trend: "down",
      trendValue: -1.8,
      trendPercentage: -1.9,
      category: "Market",
      signal: "hold",
      confidence: 72,
      lastUpdated: "1 day ago",
      expanded: false,
    },
    {
      id: "3",
      name: "Match Outcome Probability",
      description:
        "Calculates win/draw/loss probabilities based on team strength, head-to-head history, and current form",
      value: 65.8,
      previousValue: 65.8,
      trend: "neutral",
      trendValue: 0,
      trendPercentage: 0,
      category: "Prediction",
      signal: "neutral",
      confidence: 68,
      lastUpdated: "3 hours ago",
      expanded: false,
    },
    {
      id: "4",
      name: "League Competitiveness Index",
      description:
        "Measures how competitive a league is based on points distribution, upsets, and performance variance",
      value: 82.7,
      previousValue: 79.5,
      trend: "up",
      trendValue: 3.2,
      trendPercentage: 4.0,
      category: "League",
      signal: "buy",
      confidence: 78,
      lastUpdated: "2 days ago",
      expanded: false,
    },
  ]);

  const tabs = [
    { id: "all", label: "All Indicators" },
    { id: "performance", label: "Performance" },
    { id: "market", label: "Market" },
    { id: "prediction", label: "Prediction" },
  ];

  const timeframes = [
    { id: "1d", label: "1 Day" },
    { id: "1w", label: "1 Week" },
    { id: "1m", label: "1 Month" },
    { id: "3m", label: "3 Months" },
  ];

  const toggleIndicatorExpansion = (indicatorId: string) => {
    setIndicators(
      indicators.map((indicator) =>
        indicator.id === indicatorId
          ? { ...indicator, expanded: !indicator.expanded }
          : indicator,
      ),
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp size={16} color="#4CAF50" />;
      case "down":
        return <TrendingDown size={16} color="#F44336" />;
      default:
        return <Minus size={16} color="#9E9E9E" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "#4CAF50";
      case "down":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "buy":
        return "#4CAF50";
      case "sell":
        return "#F44336";
      case "hold":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case "buy":
        return <TrendingUp size={16} color="#4CAF50" />;
      case "sell":
        return <TrendingDown size={16} color="#F44336" />;
      case "hold":
        return <AlertTriangle size={16} color="#FF9800" />;
      default:
        return <Minus size={16} color="#9E9E9E" />;
    }
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Indicators
      </Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
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
              activeTab === tab.id && {
                borderBottomColor: theme.colors.primary,
              },
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === tab.id && { color: theme.colors.primary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchAndFilter = () => (
    <View style={styles.searchFilterContainer}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[
            styles.searchInput,
            { color: theme.colors.text },
            ...(Platform.OS === "web" ? [{ outlineStyle: "none" as any }] : []),
          ]}
          placeholder="Search indicators..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.filterButton,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
        activeOpacity={0.7}
      >
        <Filter size={20} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTimeframeSelector = () => (
    <View
      style={[
        styles.timeframeContainer,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.timeframeHeader}>
        <Text style={[styles.timeframeTitle, { color: theme.colors.text }]}>
          Timeframe
        </Text>
        <TouchableOpacity style={styles.refreshButton} activeOpacity={0.7}>
          <RefreshCw size={16} color={theme.colors.text} />
          <Text style={[styles.refreshText, { color: theme.colors.text }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeframeButtons}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf.id}
            style={[
              styles.timeframeButton,
              {
                backgroundColor:
                  timeframe === tf.id
                    ? theme.colors.primary
                    : theme.colors.background,
              },
            ]}
            onPress={() => setTimeframe(tf.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.timeframeButtonText,
                {
                  color: timeframe === tf.id ? "#FFFFFF" : theme.colors.text,
                },
              ]}
            >
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderIndicatorCard = (indicator: Indicator) => {
    const isVisible =
      activeTab === "all" || activeTab === indicator.category.toLowerCase();

    if (!isVisible) return null;

    return (
      <View
        key={indicator.id}
        style={[
          styles.indicatorCard,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <TouchableOpacity
          style={styles.indicatorHeader}
          onPress={() => toggleIndicatorExpansion(indicator.id)}
          activeOpacity={0.7}
        >
          <View style={styles.indicatorTitleContainer}>
            <BarChart3 size={20} color={theme.colors.primary} />
            <Text style={[styles.indicatorTitle, { color: theme.colors.text }]}>
              {indicator.name}
            </Text>
          </View>

          <View style={styles.indicatorValue}>
            <Text style={[styles.valueText, { color: theme.colors.text }]}>
              {indicator.value.toFixed(1)}
            </Text>
            <View style={styles.trendContainer}>
              {getTrendIcon(indicator.trend)}
              <Text
                style={[
                  styles.trendText,
                  { color: getTrendColor(indicator.trend) },
                ]}
              >
                {indicator.trend === "up"
                  ? "+"
                  : indicator.trend === "down"
                    ? "-"
                    : ""}
                {Math.abs(indicator.trendValue).toFixed(1)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.indicatorMeta}>
          <Text
            style={[styles.categoryText, { color: theme.colors.textSecondary }]}
          >
            {indicator.category}
          </Text>
          <View style={styles.signalContainer}>
            {getSignalIcon(indicator.signal)}
            <Text
              style={[
                styles.signalText,
                { color: getSignalColor(indicator.signal) },
              ]}
            >
              {indicator.signal.toUpperCase()}
            </Text>
          </View>
        </View>

        {indicator.expanded && (
          <View style={styles.expandedContent}>
            <Text
              style={[
                styles.indicatorDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {indicator.description}
            </Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Current Value:
                </Text>
                <Text
                  style={[styles.detailValue, { color: theme.colors.text }]}
                >
                  {indicator.value.toFixed(1)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Previous Value:
                </Text>
                <Text
                  style={[styles.detailValue, { color: theme.colors.text }]}
                >
                  {indicator.previousValue.toFixed(1)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Change:
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: getTrendColor(indicator.trend) },
                  ]}
                >
                  {indicator.trend === "up"
                    ? "+"
                    : indicator.trend === "down"
                      ? "-"
                      : ""}
                  {Math.abs(indicator.trendValue).toFixed(1)} (
                  {indicator.trendPercentage.toFixed(1)}%)
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Signal:
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: getSignalColor(indicator.signal) },
                  ]}
                >
                  {indicator.signal.toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Confidence:
                </Text>
                <Text
                  style={[styles.detailValue, { color: theme.colors.text }]}
                >
                  {indicator.confidence}%
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Last Updated:
                </Text>
                <Text
                  style={[styles.detailValue, { color: theme.colors.text }]}
                >
                  {indicator.lastUpdated}
                </Text>
              </View>
            </View>

            <View style={styles.indicatorActions}>
              <TouchableOpacity
                style={[
                  styles.indicatorAction,
                  { backgroundColor: theme.colors.background },
                ]}
                activeOpacity={0.7}
              >
                <Target size={16} color={theme.colors.text} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Apply
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.indicatorAction,
                  { backgroundColor: theme.colors.background },
                ]}
                activeOpacity={0.7}
              >
                <Download size={16} color={theme.colors.text} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Export
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.indicatorAction,
                  { backgroundColor: theme.colors.background },
                ]}
                activeOpacity={0.7}
              >
                <Share size={16} color={theme.colors.text} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderHeader()}
      {renderTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSearchAndFilter()}
        {renderTimeframeSelector()}

        <View style={styles.indicatorsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Key Indicators
          </Text>
          {indicators.map(renderIndicatorCard)}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    flex: 1,
    textAlign: "center",
  },
  settingsButton: {
    padding: 4,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  content: {
    flex: 1,
  },
  searchFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  timeframeContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  timeframeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeframeTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refreshText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  timeframeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  timeframeButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  indicatorsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    marginBottom: 16,
  },
  indicatorCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  indicatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  indicatorTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  indicatorTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  indicatorValue: {
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  indicatorMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  signalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signalText: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  indicatorDescription: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  indicatorActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  indicatorAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
});
