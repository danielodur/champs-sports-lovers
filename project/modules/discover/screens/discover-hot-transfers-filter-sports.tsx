import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface DiscoverHotTransfersFilterSportsProps {
  visible: boolean;
  selectedSport: string;
  selectedLeague: string;
  onSelectSport: (sportId: string) => void;
  onSelectLeague: (leagueId: string) => void;
  onClose: () => void;
}

interface DiscoverHotTransfersFilterStatusProps {
  visible: boolean;
  selectedStatus: "all" | "done" | "loan" | "transfer";
  onSelectStatus: (statusId: "all" | "done" | "loan" | "transfer") => void;
  onClose: () => void;
  anchor?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

const sportsOptions = [
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "rugby", label: "Rugby" },
];

const footballLeagues = [
  { id: "all", label: "All Teams" },
  { id: "english-pl", label: "English PL" },
  { id: "la-liga", label: "La Liga" },
  { id: "bundesliga", label: "Bundesliga" },
  { id: "serie-a", label: "Serie A" },
  { id: "ligue-1", label: "League 1" },
  { id: "ugandan-pl", label: "Ugandan PL" },
  { id: "kenyan-pl", label: "Kenyan PL" },
  { id: "rwandan-pl", label: "Rwanda PL" },
  { id: "tanzanian-pl", label: "Tanzanian PL" },
  { id: "nigerian-sl", label: "Nigerian SL" },
  { id: "egyptian-pl", label: "Egyptian PL" },
  { id: "senegal-sl", label: "Senegal SL" },
  { id: "saudi-pro", label: "Saudi Pro L" },
  { id: "australian-al", label: "Australian AL" },
  { id: "japanese-jl", label: "Japanese JL" },
];

const placeholderLeagues = [
  { id: "all", label: "All Teams" },
  { id: "coming-soon-1", label: "Coming Soon" },
  { id: "coming-soon-2", label: "More Leagues Soon" },
];

const statusModalOptions = [
  {
    id: "all" as const,
    label: "All",
    title: "All Transfers",
    description: "Browse every confirmed, loan, and pending transfer.",
  },
  {
    id: "done" as const,
    label: "Done Deal",
    title: "Completed Moves",
    description: "Players who have officially signed for their new clubs.",
  },
  {
    id: "loan" as const,
    label: "On Loan",
    title: "Loan Agreements",
    description: "Temporary moves including seasonal and short-term loans.",
  },
  {
    id: "transfer" as const,
    label: "Transfers",
    title: "Transfer Activity",
    description: "Major transfers and high-profile deals making headlines.",
  },
];

const DiscoverHotTransfersFilterSports: React.FC<
  DiscoverHotTransfersFilterSportsProps
> = ({
  visible,
  selectedSport,
  selectedLeague,
  onSelectSport,
  onSelectLeague,
  onClose,
}) => {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(-40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -40,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const leagueOptions = useMemo(() => {
    if (selectedSport === "football") return footballLeagues;
    return placeholderLeagues;
  }, [selectedSport]);

  const highlightColor = theme.colors.background;
  const inactiveRailColor = "rgba(255,255,255,0.07)";

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modalWrapper,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View
            style={[
              styles.contentRow,
              { backgroundColor: highlightColor },
            ]}
          >
            <View
              style={[
                styles.sportColumn,
                { backgroundColor: inactiveRailColor },
              ]}
            >
              {sportsOptions.map((sport) => {
                const isActive = sport.id === selectedSport;
                return (
                  <TouchableOpacity
                    key={sport.id}
                    style={[
                      styles.sportItem,
                      isActive && [styles.sportItemActive, { backgroundColor: highlightColor }],
                    ]}
                    onPress={() => onSelectSport(sport.id)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.sportLabel,
                        {
                          color: isActive ? theme.colors.text : theme.colors.textSecondary,
                          fontWeight: isActive ? "700" : "500",
                        },
                      ]}
                    >
                      {sport.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View
              style={[
                styles.leagueColumn,
                {
                  backgroundColor: highlightColor,
                },
              ]}
            >
              {leagueOptions.map((league) => {
                const isActive =
                  (league.id === "all" && selectedLeague === "All Teams") ||
                  league.label === selectedLeague;
                return (
                  <TouchableOpacity
                    key={league.id}
                    style={styles.leagueItem}
                    onPress={() => onSelectLeague(league.id)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.leagueLabel,
                        {
                          color: isActive ? theme.colors.primary : theme.colors.text,
                          fontWeight: isActive ? "700" : "500",
                        },
                      ]}
                    >
                      {league.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

export const DiscoverHotTransfersFilterStatus: React.FC<
  DiscoverHotTransfersFilterStatusProps
> = ({ visible, selectedStatus, onSelectStatus, onClose, anchor }) => {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(-30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const activeOption = statusModalOptions.find((option) => option.id === selectedStatus);

  const modalTop = useMemo(() => {
    if (!anchor) {
      return 120;
    }
    return Math.max(anchor.y + anchor.height + 8, 120);
  }, [anchor]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.statusModalWrapper,
          { top: modalTop },
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.statusModalContent,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View style={[styles.statusContentRow, { backgroundColor: theme.colors.background }]}
          >
            <View
              style={[styles.statusRail, { backgroundColor: "rgba(255,255,255,0.05)" }]}
            >
              {statusModalOptions.map((option) => {
                const isActive = option.id === selectedStatus;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.statusItem,
                      isActive && {
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderLeftColor: theme.colors.primary,
                      },
                    ]}
                    onPress={() => onSelectStatus(option.id)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.statusItemText,
                        {
                          color: isActive ? theme.colors.primary : theme.colors.text,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.statusDetailContainer}>
              <Text style={[styles.statusDetailTitle, { color: theme.colors.text }]}
              >
                {activeOption?.title}
              </Text>
              <Text
                style={[
                  styles.statusDetailDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {activeOption?.description}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalWrapper: {
    position: "absolute",
    top: 77,
    left: -20,
    right: -20,
    
    
  },
  modalContent: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 0,
    elevation: 5,
    minHeight: 610,
    height: 625,
  },
  contentRow: {
    flexDirection: "row",
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  sportColumn: {
    width: 120,
    paddingVertical: 21,
    paddingHorizontal: 19,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  sportItem: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  sportItemActive: {
    marginLeft: -18,
    marginRight: -20,
    paddingLeft: 19,
    paddingRight: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  sportLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  leagueColumn: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "flex-start",
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 18,
    marginLeft: -20,
  },
  leagueItem: {
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  leagueLabel: {
    fontSize: 14,
  },
  statusModalWrapper: {
    position: "absolute",
    zIndex: 30,
    left: -25,
    right: -25,
  },
  statusModalContent: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 0,
    minHeight: 320,
    height: 360,
    elevation: 5,
    overflow: "hidden",
  },
  statusContentRow: {
    flexDirection: "row",
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  statusRail: {
    width: 140,
    paddingVertical: 20,
    paddingLeft: 0,
    paddingRight: 24,
  },
  statusItem: {
    paddingVertical: 14,
    paddingLeft: 28,
    paddingRight: 12,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  statusItemText: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  statusDetailContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: "center",
  },
  statusDetailTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  statusDetailDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default DiscoverHotTransfersFilterSports;
