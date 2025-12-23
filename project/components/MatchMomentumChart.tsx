import React from "react";
import { View, Dimensions, Image, Text, StyleSheet } from "react-native";
import Svg, {
  Path,
  Text as SvgText,
  Line,
  Defs,
  LinearGradient,
  Stop,
  G,
  Circle,
  Rect,
  Polygon,
} from "react-native-svg";
import { useTheme } from "../hooks/useTheme";

interface MatchEvent {
  id: string;
  type: 
    | "goal" 
    | "corner" 
    | "yellow_card" 
    | "red_card" 
    | "substitution"
    | "substitution_in"
    | "substitution_out"
    | "player_in"
    | "player_out"
    | "penalty"
    | "penalty_scored"
    | "penalty_missed"
    | "own_goal"
    | "assist"
    | "shot_on_target"
    | "shot_off_target"
    | "injury"
    | "var"
    | "yellow_red_card"
    | "penalties"
    | "dangerous_attack"; // ✅ Dangerous attacks for sharper peaks
  team: "home" | "away";
  minute: number;
  icon?: string;
}

interface MatchMomentumChartProps {
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  matchEvents?: MatchEvent[];
  currentMinute?: number;
  matchStats?: {
    attacks: { home: number; away: number };
    corners?: { home: number; away: number };
    dangerousAttacks?: { home: number; away: number };
    shotsOnTarget?: { home: number; away: number };
    shotsOffTarget?: { home: number; away: number };
  };
  isLive?: boolean;
  isFinished?: boolean;
  isHalfTime?: boolean;
  homeTeamName?: string;
  awayTeamName?: string;
  sport?: string;
  matchId?: string; // ✅ Add matchId prop for seed generation
}

const CHART_WIDTH = Dimensions.get("window").width;
const CHART_HEIGHT = 180;
const CHART_AREA_HEIGHT = 140; // visual drawing area
const LOGO_SIZE = 32;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 10;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;

function MatchMomentumChart({
  homeTeamLogo,
  awayTeamLogo,
  matchEvents = [],
  currentMinute = 0,
  matchStats,
  isLive = false,
  isFinished = false,
  isHalfTime = false,
  homeTeamName = "Home",
  awayTeamName = "Away",
  sport = "football",
  matchId,
}: MatchMomentumChartProps) {
  const theme = useTheme();
  const chartWidth = CHART_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  // Only show event icons for football matches
  const isFootball = sport === "football";

  // ✅ Extended chart to show added time (90'+) and extra time (ET)
  // Reserve space for up to 120 minutes (90' + 30' extra time) with proper padding
  const MAX_MATCH_TIME = 120; // Support up to 120 minutes (90' + 30' ET)
  const EXTRA_RIGHT_FRACTION = 0.08; // ~8% padding on right to avoid touching screen edge
  const chartWidthEffective = chartWidth * (1 - EXTRA_RIGHT_FRACTION);
  const rightPadding = chartWidth - chartWidthEffective;

  const centerY = MARGIN_TOP + CHART_AREA_HEIGHT / 2 - 13;
  const MAX_PEAK_HEIGHT = CHART_AREA_HEIGHT / 2 - 8; // cap for peaks

  // ✅ Calculate added time width for positioning events beyond 90'
  // Space for 90' to 120' (30 minutes of extra time)
  const addedTimeWidth = chartWidthEffective * 0.25; // 25% of effective width for extra time

  // ✅ Mapping minute -> x coordinate on the SVG
  // 0-90: maps to effective width
  // 90-120: maps to added time area (extra time)
  const minuteToX = (min: number) => {
    if (min <= 90) {
      return MARGIN_LEFT + (Math.max(0, Math.min(min, 90)) / 90) * chartWidthEffective;
    } else {
      // Added time: 90' to 120' (extra time)
      const addedMinutes = Math.min(min - 90, 30); // Max 30 minutes extra time
      return MARGIN_LEFT + chartWidthEffective + (addedMinutes / 30) * addedTimeWidth;
    }
  };

  // Helpers: moving average smoothing - CACHED to prevent animation jumping
  const movingAverage = React.useMemo(
    () =>
      (arr: number[], window = 3) => {
        const res: number[] = [];
        const half = Math.floor(window / 2);
        for (let i = 0; i < arr.length; i++) {
          let sum = 0;
          let count = 0;
          for (let j = i - half; j <= i + half; j++) {
            if (j >= 0 && j < arr.length) {
              sum += arr[j];
              count += 1;
            }
          }
          res.push(count > 0 ? sum / count : 0);
        }
        return res;
      },
    [],
  );

  // ✅ Build SHARP area path with angular edges (like Chinese app - triangular/trapezoidal peaks)
  // Uses straight lines instead of curves for sharper, clearer edges
  const buildAreaPath = React.useCallback((
    points: Array<{ x: number; y: number }>,
    isTopArea = true,
  ) => {
    if (!points || points.length === 0) return "";
    if (points.length === 1) {
      // tiny rectangle / capsule so it renders
      const p = points[0];
      return `M ${p.x} ${centerY} L ${p.x} ${p.y} L ${p.x + 1} ${p.y} L ${p.x + 1} ${centerY} Z`;
    }

    // ✅ Determine how many points to include based on match status
    // For live matches, stop at currentMinute (up to 120'); for upcoming/finished, show full chart
    const maxMinute = isLive ? Math.min(120, Math.ceil(currentMinute)) : 90;
    // Find the index corresponding to maxMinute
    const pointsToUse = points.filter((_, idx) => {
      // Estimate minute from index (assuming 0-90 maps to first 91 points)
      const estimatedMinute = idx <= 90 ? idx : 90 + (idx - 90);
      return estimatedMinute <= maxMinute;
    });
    
    if (pointsToUse.length === 0) return "";
    if (pointsToUse.length === 1) {
      const p = pointsToUse[0];
      return `M ${p.x} ${centerY} L ${p.x} ${p.y} L ${p.x + 1} ${p.y} L ${p.x + 1} ${centerY} Z`;
    }

    // ✅ Use STRAIGHT lines for SHARP edges (like Chinese app)
    // No bezier curves - creates triangular/trapezoidal peaks
    let d = `M ${pointsToUse[0].x} ${centerY} L ${pointsToUse[0].x} ${pointsToUse[0].y}`;

    for (let i = 1; i < pointsToUse.length; i++) {
      const cur = pointsToUse[i];
      // ✅ Direct line to point (no curves) = sharp edges
      d += ` L ${cur.x} ${cur.y}`;
    }

    // Close the area down to center line and back to start
    const last = pointsToUse[pointsToUse.length - 1];
    d += ` L ${last.x} ${centerY} L ${pointsToUse[0].x} ${centerY} Z`;

    return d;
  }, [isLive, currentMinute, centerY]);

  // ✅ Build minute-intensity series for both teams using events + optional matchStats baseline
  // Extended to support extra time (up to 120 minutes)
  const buildSeries = React.useMemo(
    () => (team: "home" | "away") => {
      const totalMinutes = 121; // index 0..120 (90' + 30' extra time)

      // ✅ Enhanced weights for different event types - sharper peaks for dangerous attacks
      const weights: Record<string, number> = {
        goal: 10,
        corner: 2.5,
        yellow_card: 1.5,
        red_card: 4,
        substitution: 1,
        substitution_in: 1,
        substitution_out: 1,
        penalty: 6,
        penalty_scored: 8,
        penalty_missed: 3,
        own_goal: 7,
        shot_on_target: 2,
        shot_off_target: 1,
        dangerous_attack: 3, // ✅ Dangerous attacks create sharper peaks
      };

      const series: number[] = new Array(totalMinutes).fill(0);

      // ✅ Event contribution - handle events in regular time and extra time
      matchEvents.forEach((ev) => {
        if (ev.team !== team) return;
        const minuteIndex = Math.max(0, Math.min(120, Math.round(ev.minute)));
        const w = weights[ev.type] || 1;
        // add to minute bucket (accumulate if multiple events)
        series[minuteIndex] = (series[minuteIndex] || 0) + w;

        // also spread small influence to neighboring minutes so peaks look natural
        if (minuteIndex - 1 >= 0) series[minuteIndex - 1] += w * 0.5;
        if (minuteIndex + 1 <= 120) series[minuteIndex + 1] += w * 0.5;
      });

      // ✅ Use API data to create DYNAMIC, SHARP peaks (NOT flat lines!)
      // Distribute dangerous attacks and shots NON-uniformly to create peaks and valleys
      if (matchStats) {
        const teamDangerousAttacks =
          team === "home" ? matchStats.dangerousAttacks?.home || 0 : matchStats.dangerousAttacks?.away || 0;
        const teamShotsOnTarget =
          team === "home" ? matchStats.shotsOnTarget?.home || 0 : matchStats.shotsOnTarget?.away || 0;
        const teamShotsOffTarget =
          team === "home" ? matchStats.shotsOffTarget?.home || 0 : matchStats.shotsOffTarget?.away || 0;
        const teamAttacks =
          team === "home" ? matchStats.attacks?.home || 0 : matchStats.attacks?.away || 0;
        
        // ✅ Create sharp peaks by distributing attacks at RANDOM minutes (not uniform!)
        // This creates dynamic peaks and valleys, not flat lines
        const totalAttacks = teamDangerousAttacks + teamShotsOnTarget + Math.floor(teamShotsOffTarget * 0.5) + Math.floor(teamAttacks * 0.3);
        
        // Use matchId as seed for consistent but dynamic distribution
        const seed = parseInt(matchId || "0") + (team === "home" ? 0 : 1000);
        const random = (minute: number) => {
          const x = Math.sin((seed + minute) * 12.9898) * 43758.5453;
          return x - Math.floor(x);
        };
        
        // ✅ Distribute attacks at random minutes to create SHARP PEAKS
        // Stronger teams get more peaks, weaker teams get fewer/smaller peaks
        const attackCount = Math.floor(totalAttacks * 0.8); // Use 80% of attacks for peaks
        for (let i = 0; i < attackCount; i++) {
          // Random minute between 0-90 (or 0-120 for extra time matches)
          const minute = Math.floor(random(i) * 90);
          if (minute >= 0 && minute <= 120) {
            // Create sharp peak with weight based on attack type
            const peakHeight = teamDangerousAttacks > 0 ? 4 : teamShotsOnTarget > 0 ? 3 : 2;
            series[minute] += peakHeight;
            
            // Add smaller peaks to neighboring minutes for natural flow
            if (minute > 0) series[minute - 1] += peakHeight * 0.3;
            if (minute < 120) series[minute + 1] += peakHeight * 0.3;
          }
        }
        
        // ✅ Add shots on target as additional sharp peaks
        for (let i = 0; i < teamShotsOnTarget; i++) {
          const minute = Math.floor(random(i + 1000) * 90);
          if (minute >= 0 && minute <= 120) {
            series[minute] += 3; // Sharp peak for shot on target
            if (minute > 0) series[minute - 1] += 1;
            if (minute < 120) series[minute + 1] += 1;
          }
        }
      }
      
      // ✅ MINIMAL baseline ONLY to prevent zero values (very small, not creating flat lines)
      // This is just to ensure chart is visible, not to create constant lines
      const minimalBaseline = 0.2; // Very small baseline
      for (let m = 0; m <= 120; m++) {
        if (series[m] === 0) {
          series[m] = minimalBaseline; // Only fill zeros, don't add to existing peaks
        }
      }

      // ✅ Reduced smoothing for SHARPER edges (like Chinese app - triangular/trapezoidal peaks)
      // Less smoothing = sharper, clearer edges to understand dangerous attacks
      const smoothed = movingAverage(series, 2); // Reduced from 5 to 2 for sharper peaks

      return smoothed;
    },
    [matchEvents, matchStats, movingAverage],
  );

  const homeSeries = React.useMemo(() => buildSeries("home"), [buildSeries]);
  const awaySeries = React.useMemo(() => buildSeries("away"), [buildSeries]);

  // ✅ Find a shared max to normalize both sides so they visually balance like the Chinese app
  // Include extra time minutes in calculation
  const { maxVal, scale } = React.useMemo(() => {
    const maxMinute = Math.min(120, Math.ceil(currentMinute));
    const max = Math.max(
      1,
      ...homeSeries.slice(0, Math.max(1, maxMinute + 1)),
      ...awaySeries.slice(0, Math.max(1, maxMinute + 1)),
    );
    return { maxVal: max, scale: MAX_PEAK_HEIGHT / max };
  }, [homeSeries, awaySeries, currentMinute]);

  // ✅ Build points arrays for FULL match duration (0' to 120' including extra time)
  // For live matches, filled area stops at currentMinute; for upcoming/finished, show full chart
  const { homePoints, awayPoints } = React.useMemo(() => {
    const buildPointsFromSeries = (series: number[], isHome: boolean) => {
      const pts: Array<{ x: number; y: number }> = [];
      // ✅ Build points for full 90 minutes (0' to 90')
      const lastMinute = 90;
      for (let m = 0; m <= lastMinute; m++) {
        const x = minuteToX(m);
        const intensity = series[m] || 0;
        const heightPx = intensity * scale;
        const y = isHome ? centerY - heightPx : centerY + heightPx;
        pts.push({ x, y });
      }
      
      // ✅ Add points for extra time (90' to 120') if match is in extra time or finished
      // Always build points up to 120' if match has extended beyond 90'
      const maxExtraTime = (isLive && currentMinute > 90) || isFinished ? 120 : 90;
      if (maxExtraTime > 90) {
        for (let m = 91; m <= maxExtraTime; m++) {
          const x = minuteToX(m);
          // Use actual series value for extra time (series now extends to 120)
          const intensity = series[m] || series[90] || 0;
          const heightPx = intensity * scale;
          const y = isHome ? centerY - heightPx : centerY + heightPx;
          pts.push({ x, y });
        }
      }
      
      return pts;
    };

    return {
      homePoints: buildPointsFromSeries(homeSeries, true),
      awayPoints: buildPointsFromSeries(awaySeries, false),
    };
  }, [homeSeries, awaySeries, scale, centerY, minuteToX, isLive, currentMinute, isFinished]);

  const homePath = React.useMemo(
    () => buildAreaPath(homePoints, true),
    [homePoints, isLive, currentMinute],
  );
  const awayPath = React.useMemo(
    () => buildAreaPath(awayPoints, false),
    [awayPoints, isLive, currentMinute],
  );

  // ✅ Store event positions for overlay images with grouping for substitutions
  const eventPositions: Array<{
    x: number;
    y: number;
    type: string;
    key: string;
    minute: number;
    team: "home" | "away";
  }> = [];

  // ✅ Render event icons positioned exactly at event times
  // Groups substitution events (sub_in and sub_out) together
  const renderEvents = () => {
    const visibleEvents = (matchEvents || []).filter(
      (e) => e.minute <= currentMinute || (isLive && e.minute <= 120),
    );
    
    // ✅ Group substitution events by minute and team
    const substitutionGroups = new Map<string, Array<{ event: MatchEvent; index: number }>>();
    const otherEvents: Array<{ event: MatchEvent; index: number }> = [];
    
    visibleEvents.forEach((event, index) => {
      const isSubstitution = event.type === "substitution" || 
                             event.type === "substitution_in" || 
                             event.type === "substitution_out" ||
                             event.type === "player_in" ||
                             event.type === "player_out";
      
      if (isSubstitution) {
        const groupKey = `${event.team}-${event.minute}`;
        if (!substitutionGroups.has(groupKey)) {
          substitutionGroups.set(groupKey, []);
        }
        substitutionGroups.get(groupKey)!.push({ event, index });
      } else {
        otherEvents.push({ event, index });
      }
    });
    
    // ✅ Process substitution groups (position sub_in and sub_out close together)
    substitutionGroups.forEach((group, groupKey) => {
      if (group.length === 0) return;
      
      // Use the first event's minute for positioning
      const event = group[0].event;
      const x = minuteToX(event.minute);
      
      // ✅ Substitution icons on SAME horizontal line (like Chinese app)
      const ICON_SIZE = 12;
      const ICON_LINE_TOP = MARGIN_TOP + 10; // ✅ Same horizontal line for home team
      const ICON_LINE_BOTTOM = CHART_HEIGHT - MARGIN_BOTTOM - ICON_SIZE - 10; // ✅ Same horizontal line for away team
      
      let baseY: number;
      if (event.team === "home") {
        // ✅ Home team icons on SAME horizontal line at top
        baseY = ICON_LINE_TOP;
      } else {
        // ✅ Away team icons on SAME horizontal line at bottom
        baseY = ICON_LINE_BOTTOM;
      }
      
      // ✅ Position sub_out and sub_in TOGETHER with NO SPACE (compact, overlapping)
      // Find sub_out and sub_in events
      const subOutEvent = group.find(item => 
        item.event.type === "substitution_out" || item.event.type === "player_out"
      );
      const subInEvent = group.find(item => 
        item.event.type === "substitution_in" || item.event.type === "player_in" || item.event.type === "substitution"
      );
      
      const baseX = x - ICON_SIZE / 2; // Center the icons on the minute
      
      // ✅ Position sub_out (red) and sub_in (green) TOGETHER with NO SPACE
      // They should appear as one combined icon showing player out → player in
      if (subOutEvent && subInEvent) {
        // ✅ Both icons exist - position them COMPACTED TOGETHER with NO SPACE
        // sub_out (red) and sub_in (green) should appear as one combined icon
        // Position them overlapping so they appear joined together (NO gap between them)
        // ✅ Position sub_out and sub_in TOGETHER with NO SPACE (overlapping)
        // They should appear as one combined icon showing player out → player in
        eventPositions.push({
          x: baseX - 1, // ✅ sub_out (red) positioned slightly left
          y: baseY - ICON_SIZE / 2,
          type: subOutEvent.event.type,
          key: `event-${subOutEvent.event.id}-${subOutEvent.event.minute}-out`,
          minute: subOutEvent.event.minute,
          team: subOutEvent.event.team,
        });
        
        eventPositions.push({
          x: baseX + 1, // ✅ sub_in (green) positioned overlapping sub_out (2px gap = appears joined, NO visible space)
          y: baseY - ICON_SIZE / 2,
          type: subInEvent.event.type,
          key: `event-${subInEvent.event.id}-${subInEvent.event.minute}-in`,
          minute: subInEvent.event.minute,
          team: subInEvent.event.team,
        });
      } else if (subOutEvent) {
        // Only sub_out exists
        eventPositions.push({
          x: baseX,
          y: baseY - ICON_SIZE / 2,
          type: subOutEvent.event.type,
          key: `event-${subOutEvent.event.id}-${subOutEvent.event.minute}-out`,
          minute: subOutEvent.event.minute,
          team: subOutEvent.event.team,
        });
      } else if (subInEvent) {
        // Only sub_in exists
        eventPositions.push({
          x: baseX,
          y: baseY - ICON_SIZE / 2,
          type: subInEvent.event.type,
          key: `event-${subInEvent.event.id}-${subInEvent.event.minute}-in`,
          minute: subInEvent.event.minute,
          team: subInEvent.event.team,
        });
      }
    });
    
    // ✅ Process other events (goals, cards, etc.)
    otherEvents.forEach(({ event }) => {
      const x = minuteToX(event.minute);
      
      const minuteIndex = Math.max(0, Math.min(90, Math.round(event.minute)));
      const teamSeries = event.team === "home" ? homeSeries : awaySeries;
      const intensity = teamSeries[minuteIndex] || 0;
      const heightPx = intensity * scale;
      
      // ✅ ALL icons on SAME horizontal line (like Chinese app)
      // Home team icons: same horizontal line at top
      // Away team icons: same horizontal line at bottom
      const ICON_SIZE = 12;
      const ICON_LINE_TOP = MARGIN_TOP + 10; // ✅ Fixed horizontal line for home team icons
      const ICON_LINE_BOTTOM = CHART_HEIGHT - MARGIN_BOTTOM - ICON_SIZE - 10; // ✅ Fixed horizontal line for away team icons
      
      let y: number;
      if (event.team === "home") {
        // ✅ Home team icons on SAME horizontal line at top
        y = ICON_LINE_TOP;
      } else {
        // ✅ Away team icons on SAME horizontal line at bottom
        y = ICON_LINE_BOTTOM;
      }
      
      eventPositions.push({
        x: x - ICON_SIZE / 2, // Center icon on X position
        y: y - ICON_SIZE / 2,
        type: event.type,
        key: `event-${event.id}-${event.minute}`,
        minute: event.minute,
        team: event.team,
      });
    });
    
    return null; // We'll render images outside SVG
  };

  // ✅ Time markers including HT label and added time markers (90'+, ET)
  const renderTimeMarkers = () => {
    const markers = [
      { time: 0, label: "0'" },
      { time: 15, label: "15'" },
      { time: 30, label: "30'" },
      { time: 45, label: "HT" },
      { time: 60, label: "60'" },
      { time: 75, label: "75'" },
      { time: 90, label: "90'" },
    ];
    
    // ✅ Add extra time markers if match is in extra time
    if (isLive && currentMinute > 90) {
      markers.push({ time: 105, label: "105'" });
      markers.push({ time: 120, label: "120'" });
    }

    return markers.map((marker) => {
      const x = minuteToX(marker.time);

      return (
        <SvgText
          key={`marker-${marker.time}`}
          x={x}
          y={CHART_HEIGHT - 8}
          fontSize="11"
          fill={theme.colors.textSecondary}
          textAnchor="middle"
          fontWeight="500"
        >
          {marker.label}
        </SvgText>
      );
    });
  };

  // ✅ Extend timer line to show added time and extra time
  const currentX = minuteToX(currentMinute);

  return (
    <View
      style={{
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        shadowColor: theme.colors.text,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {/* Team logos (static) */}
      <View style={{ position: "absolute", left: 12, top: 30, zIndex: 10 }}>
        <Image
          source={{
            uri:
              homeTeamLogo ||
              `https://ui-avatars.com/api/?name=${homeTeamName[0]}&background=FF9500&color=000000&size=32`,
          }}
          style={{
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            borderRadius: LOGO_SIZE / 2,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        />
      </View>

      <View style={{ position: "absolute", left: 12, top: 86, zIndex: 10 }}>
        <Image
          source={{
            uri:
              awayTeamLogo ||
              `https://ui-avatars.com/api/?name=${awayTeamName[0]}&background=808080&color=000000&size=32`,
          }}
          style={{
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            borderRadius: LOGO_SIZE / 2,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        />
      </View>

      {/* SVG chart */}
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          {/* ✅ Home team gradient - Yellow/Gold like Chinese app */}
          <LinearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFD700" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#FFA500" stopOpacity="0.85" />
          </LinearGradient>
          {/* ✅ Away team gradient - Dark grey like Chinese app */}
          <LinearGradient id="awayGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#9E9E9E" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#616161" stopOpacity="0.85" />
          </LinearGradient>
        </Defs>

        {/* ✅ Center dividing line - extends to show extra time area */}
        <Line
          x1={MARGIN_LEFT}
          y1={centerY}
          x2={MARGIN_LEFT + chartWidthEffective + (isLive && currentMinute > 90 ? addedTimeWidth : 0)}
          y2={centerY}
          stroke={theme.colors.border}
          strokeWidth={1}
          opacity={0.6}
        />

        {/* ✅ Home and away smoothed area shapes - ALWAYS render both charts */}
        {homePath && homePath.length > 0 ? (
          <Path d={homePath} fill="url(#homeGradient)" opacity={0.95} />
        ) : null}

        {awayPath && awayPath.length > 0 ? (
          <Path d={awayPath} fill="url(#awayGradient)" opacity={0.95} />
        ) : null}

        {/* event icons */}
        {renderEvents()}

        {/* ✅ IMPORTANT: Red current time line (vertical line) - extends to show added time and extra time */}
        {isLive && (
          <Line
            x1={currentX}
            y1={MARGIN_TOP}
            x2={currentX}
            y2={CHART_HEIGHT - MARGIN_BOTTOM}
            stroke="#FF4444"
            strokeWidth={2}
            opacity={0.95}
          />
        )}
        
        {/* ✅ 90' marker line (visual separator for added time) */}
        <Line
          x1={minuteToX(90)}
          y1={MARGIN_TOP}
          x2={minuteToX(90)}
          y2={CHART_HEIGHT - MARGIN_BOTTOM}
          stroke={theme.colors.border}
          strokeWidth={1}
          opacity={0.4}
          strokeDasharray="4,4"
        />

        {/* time markers */}
        {renderTimeMarkers()}
      </Svg>

      {/* Half time badge (if needed) */}
      {isHalfTime && (
        <View
          style={{
            position: "absolute",
            top: MARGIN_TOP + CHART_AREA_HEIGHT / 2 - 10,
            left: MARGIN_LEFT + (45 / 90) * chartWidthEffective - 14,
            backgroundColor: theme.colors.warning || "#ff8c00",
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            zIndex: 20,
          }}
        >
          <Text style={{ color: "white", fontSize: 9, fontWeight: "bold" }}>
            HT
          </Text>
        </View>
      )}

      {/* ✅ Event Icons Overlay - Football Only - Significantly reduced size */}
      {isFootball && eventPositions.length > 0 && eventPositions.map((eventPos) => {
        // ✅ Map ALL event types to icon files from assets/matchIcons
        let iconSource;
        try {
          switch (eventPos.type) {
            case "goal":
              iconSource = require("@/assets/matchIcons/goal.png");
              break;
            case "corner":
              // ✅ Corner kick icon - ensure it's detected and displayed
              iconSource = require("@/assets/matchIcons/corner.png");
              break;
            case "yellow_card":
              iconSource = require("@/assets/matchIcons/yellow.png");
              break;
            case "red_card":
              iconSource = require("@/assets/matchIcons/red.png");
              break;
            case "yellow_red_card":
              iconSource = require("@/assets/matchIcons/yell_red.png");
              break;
            case "substitution_in":
            case "player_in":
              // ✅ Green player_in icon (for substitutions)
              iconSource = require("@/assets/matchIcons/player_in.png");
              break;
            case "substitution_out":
            case "player_out":
              // ✅ Red player_out icon (for substitutions)
              iconSource = require("@/assets/matchIcons/player_out.png");
              break;
            case "substitution":
              // Default to player_in for generic substitution
              iconSource = require("@/assets/matchIcons/player_in.png");
              break;
            case "penalty_scored":
            case "penalty":
              iconSource = require("@/assets/matchIcons/pen_in.png");
              break;
            case "penalty_missed":
              iconSource = require("@/assets/matchIcons/pen_missed.png");
              break;
            case "penalties":
              iconSource = require("@/assets/matchIcons/penalties.png");
              break;
            case "own_goal":
              iconSource = require("@/assets/matchIcons/og.png");
              break;
            case "assist":
              iconSource = require("@/assets/matchIcons/assist.png");
              break;
            case "shot_on_target":
              iconSource = require("@/assets/matchIcons/shot_on.png");
              break;
            case "shot_off_target":
              iconSource = require("@/assets/matchIcons/shot_off.png");
              break;
            case "injury":
              iconSource = require("@/assets/matchIcons/injury.png");
              break;
            case "var":
              iconSource = require("@/assets/matchIcons/var.png");
              break;
            default:
              // Fallback for unknown event types
              console.warn(`⚠️ Unknown event type: ${eventPos.type}, using default icon`);
              iconSource = require("@/assets/matchIcons/player_in.png");
          }
        } catch (error) {
          // Fallback if icon not found
          console.warn(`⚠️ Icon not found for event type: ${eventPos.type}`);
          return null;
        }
        
        // ✅ Significantly reduced icon size to avoid touching edges
        const ICON_SIZE = 12; // Reduced from 24px to 12px
        
        // ✅ Special handling for substitution icons - they should overlap/be compact
        const isSubstitution = eventPos.type === "substitution_in" || 
                               eventPos.type === "substitution_out" ||
                               eventPos.type === "player_in" ||
                               eventPos.type === "player_out";
        
        // ✅ For substitution icons, allow slight overlap for compact display
        // For other icons, ensure they don't touch edges
        let safeX = eventPos.x;
        let safeY = eventPos.y;
        
        if (!isSubstitution) {
          // ✅ Regular icons: ensure they don't touch screen edges
          safeX = Math.max(2, Math.min(CHART_WIDTH - ICON_SIZE - 2, eventPos.x));
          safeY = Math.max(MARGIN_TOP + 2, Math.min(CHART_HEIGHT - MARGIN_BOTTOM - ICON_SIZE - 2, eventPos.y));
        } else {
          // ✅ Substitution icons: allow positioning closer together (can be at edges)
          safeX = Math.max(0, Math.min(CHART_WIDTH - ICON_SIZE, eventPos.x));
          safeY = Math.max(MARGIN_TOP, Math.min(CHART_HEIGHT - MARGIN_BOTTOM - ICON_SIZE, eventPos.y));
        }
        
        return (
          <Image
            key={eventPos.key}
            source={iconSource}
            style={{
              position: "absolute",
              left: safeX,
              top: safeY,
              width: ICON_SIZE,
              height: ICON_SIZE,
              zIndex: eventPos.type === "substitution_out" ? 16 : 15, // ✅ sub_out behind sub_in for overlap
            }}
            resizeMode="contain"
          />
        );
      })}
    </View>
  );
}

export default React.memo(MatchMomentumChart);
