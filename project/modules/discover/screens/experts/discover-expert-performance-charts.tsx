import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  LinearGradient,
  Defs,
  Stop,
} from "react-native-svg";

const CHART_WIDTH = 280;
const CHART_HEIGHT = 120;
const PADDING = 30;

interface PerformanceData {
  date: string;
  winRate: number;
  wins: number;
  total: number;
}

interface PerformanceChartsProps {
  expertId: string;
  timeRange: "7days" | "15days" | "30days";
  onTimeRangeChange: (range: "7days" | "15days" | "30days") => void;
}

export default function DiscoverExpertPerformanceCharts({
  expertId,
  timeRange,
  onTimeRangeChange,
}: PerformanceChartsProps) {
  const theme = useTheme();
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [overallWinRate, setOverallWinRate] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"results" | "accuracy">(
    "accuracy",
  );

  useEffect(() => {
    loadPerformanceData();
  }, [expertId, timeRange]);

  const loadPerformanceData = async () => {
    // Mock performance data matching the Chinese app
    const mockData: PerformanceData[] = [
      { date: "10.01", winRate: 0.6, wins: 3, total: 5 },
      { date: "10.02", winRate: 0.5, wins: 2, total: 4 },
      { date: "10.03", winRate: 0.6, wins: 3, total: 5 },
      { date: "10.04", winRate: 0.2, wins: 1, total: 5 },
      { date: "10.05", winRate: 0.95, wins: 4, total: 4 },
      { date: "10.06", winRate: 0.75, wins: 3, total: 4 },
      { date: "10.07", winRate: 1.0, wins: 4, total: 4 },
    ];

    setPerformanceData(mockData);

    // Calculate overall win rate
    const totalWins = mockData.reduce((sum, day) => sum + day.wins, 0);
    const totalPredictions = mockData.reduce((sum, day) => sum + day.total, 0);
    const overall = totalPredictions > 0 ? totalWins / totalPredictions : 0;
    setOverallWinRate(overall);
  };

  const createLinePath = (
    data: PerformanceData[],
  ): {
    path: string;
    points: Array<{ x: number; y: number; winRate: number }>;
  } => {
    if (data.length === 0) return { path: "", points: [] };

    const points = data.map((item, index) => {
      const x =
        PADDING + (index * (CHART_WIDTH - 2 * PADDING)) / (data.length - 1);
      const y =
        CHART_HEIGHT - PADDING - item.winRate * (CHART_HEIGHT - 2 * PADDING);
      return { x, y, winRate: item.winRate };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const controlPointX1 = prevPoint.x + (currentPoint.x - prevPoint.x) / 3;
      const controlPointX2 =
        currentPoint.x - (currentPoint.x - prevPoint.x) / 3;
      path += ` C ${controlPointX1} ${prevPoint.y} ${controlPointX2} ${currentPoint.y} ${currentPoint.x} ${currentPoint.y}`;
    }

    return { path, points };
  };

  const createGradientPath = (data: PerformanceData[]): string => {
    const lineData = createLinePath(data);
    if (!lineData.path || lineData.points.length === 0) return "";

    let gradientPath = lineData.path;
    const lastPoint = lineData.points[lineData.points.length - 1];
    const firstPoint = lineData.points[0];

    gradientPath += ` L ${lastPoint.x} ${CHART_HEIGHT - PADDING}`;
    gradientPath += ` L ${firstPoint.x} ${CHART_HEIGHT - PADDING}`;
    gradientPath += " Z";

    return gradientPath;
  };

  const renderChart = () => {
    if (performanceData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            Loading...
          </Text>
        </View>
      );
    }

    const lineData = createLinePath(performanceData);
    const gradientPath = createGradientPath(performanceData);

    return (
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient
              id="chartGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <Stop
                offset="0%"
                stopColor={theme.colors.primary}
                stopOpacity="0.3"
              />
              <Stop
                offset="100%"
                stopColor={theme.colors.primary}
                stopOpacity="0.05"
              />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((index) => {
            const y = PADDING + (index * (CHART_HEIGHT - 2 * PADDING)) / 4;
            return (
              <Line
                key={index}
                x1={PADDING}
                y1={y}
                x2={CHART_WIDTH - PADDING}
                y2={y}
                stroke={
                  theme.colors.border ||
                  (theme.colors.background === "#FFFFFF"
                    ? "#E0E0E0"
                    : "rgba(150, 150, 150, 0.2)")
                }
                strokeWidth="1"
              />
            );
          })}

          {/* Gradient area */}
          <Path d={gradientPath} fill="url(#chartGradient)" />

          {/* Main line */}
          <Path
            d={lineData.path}
            stroke={theme.colors.primary}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {lineData.points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={theme.colors.primary}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          ))}

          {/* Y-axis labels */}
          {["100%", "80%", "60%", "40%", "20%"].map((label, index) => {
            const y = PADDING + (index * (CHART_HEIGHT - 2 * PADDING)) / 4;
            return (
              <SvgText
                key={index}
                x="15"
                y={y + 4}
                fontSize="10"
                fill={theme.colors.textSecondary}
                textAnchor="end"
              >
                {label}
              </SvgText>
            );
          })}

          {/* X-axis labels */}
          {performanceData.map((item, index) => {
            const x =
              PADDING +
              (index * (CHART_WIDTH - 2 * PADDING)) /
                (performanceData.length - 1);
            return (
              <SvgText
                key={index}
                x={x}
                y={CHART_HEIGHT - 8}
                fontSize="10"
                fill={theme.colors.textSecondary}
                textAnchor="middle"
              >
                {item.date}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.colors.backgroundSecondary ||
            (theme.colors.background === "#FFFFFF" ? "#F5F5F5" : "#2A2A2A"),
          borderColor:
            theme.colors.border ||
            (theme.colors.background === "#FFFFFF"
              ? "#E0E0E0"
              : "rgba(255, 255, 255, 0.1)"),
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "results" && [
                styles.activeFilterButton,
                {
                  backgroundColor:
                    theme.colors.background === "#FFFFFF"
                      ? "rgba(255, 107, 107, 0.15)"
                      : "rgba(255, 107, 107, 0.2)",
                },
              ],
            ]}
            onPress={() => setActiveFilter("results")}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    activeFilter === "results"
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              Results
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "accuracy" && [
                styles.activeFilterButton,
                {
                  backgroundColor:
                    theme.colors.background === "#FFFFFF"
                      ? "rgba(255, 107, 107, 0.15)"
                      : "rgba(255, 107, 107, 0.2)",
                },
              ],
            ]}
            onPress={() => setActiveFilter("accuracy")}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    activeFilter === "accuracy"
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              Hit Rate
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.timeRangeSelector}>
            <Text
              style={[
                styles.timeRangeText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Last 7 Days
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          <Text style={[styles.winRateValue, { color: theme.colors.primary }]}>
            Hit Rate: {(overallWinRate * 100).toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Chart */}
      {renderChart()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
  },
  activeFilterButton: {
    borderColor: "rgba(255, 107, 107, 0.5)",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeRangeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dropdownIcon: {
    fontSize: 10,
    color: "rgba(150, 150, 150, 0.8)",
  },
  winRateValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChart: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
