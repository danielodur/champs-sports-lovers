import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Star,
  Share2,
  Search,
  ArrowRight,
} from "lucide-react-native";

interface Transfer {
  id: string;
  playerName: string;
  age: number;
  position: string;
  nationality: string;
  fromTeam: string;
  toTeam: string;
  fromLogoUrl?: string;
  toLogoUrl?: string;
  playerImage?: string;
  transferFee?: string;
  transferDate: string;
  transferType: "permanent" | "loan" | "free" | "signed";
  status: "completed" | "pending" | "rumored";
}

interface TransferSection {
  month: string;
  transfers: Transfer[];
}

const sampleTransfers: TransferSection[] = [
  {
    month: "September 2025",
    transfers: [
      {
        id: "1",
        playerName: "Martin Kizza",
        age: 28,
        position: "Forward",
        nationality: "Uganda",
        fromTeam: "Vipers SC",
        toTeam: "KCCA FC",
        transferFee: "€500K",
        transferDate: "25/09/01",
        transferType: "permanent",
        status: "completed",
      },
      {
        id: "2",
        playerName: "David Obua",
        age: 26,
        position: "Midfielder",
        nationality: "Uganda",
        fromTeam: "Express FC",
        toTeam: "SC Villa",
        transferFee: "€300K",
        transferDate: "25/09/01",
        transferType: "permanent",
        status: "completed",
      },
      {
        id: "3",
        playerName: "Moses Waiswa",
        age: 24,
        position: "Defender",
        nationality: "Uganda",
        fromTeam: "URA FC",
        toTeam: "Vipers SC",
        transferDate: "25/09/01",
        transferType: "loan",
        status: "completed",
      },
      {
        id: "4",
        playerName: "Allan Okello",
        age: 22,
        position: "Midfielder",
        nationality: "Uganda",
        fromTeam: "Free Agent",
        toTeam: "KCCA FC",
        transferDate: "25/09/01",
        transferType: "free",
        status: "completed",
      },
    ],
  },
  {
    month: "August 2025",
    transfers: [
      {
        id: "5",
        playerName: "Joseph Ochaya",
        age: 29,
        position: "Defender",
        nationality: "Uganda",
        fromTeam: "Police FC",
        toTeam: "Express FC",
        transferFee: "€200K",
        transferDate: "25/08/30",
        transferType: "permanent",
        status: "completed",
      },
      {
        id: "6",
        playerName: "Patrick Kaddu",
        age: 27,
        position: "Forward",
        nationality: "Uganda",
        fromTeam: "SC Villa",
        toTeam: "BUL FC",
        transferDate: "25/08/29",
        transferType: "loan",
        status: "completed",
      },
    ],
  },
];

const generatePlayerImage = (playerName: string): string => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(playerName)}&backgroundColor=f0f0f0`;
};

const generateTeamLogo = (teamName: string): string => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(teamName)}&backgroundColor=f0f0f0`;
};

const getLeagueGradientColors = (): string[] => [
  "#1e3a8a",
  "#3b82f6",
  "#60a5fa",
];

export default function NewsTeamTransfersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const teamName = Array.isArray(params.teamName)
    ? params.teamName[0]
    : (params.teamName as string);

  const [activeTab, setActiveTab] = useState("all");

  const [isStarred, setIsStarred] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isDarkMode =
    theme.colors.background === "#2A2A2A" || theme.colors.text === "#FFFFFF";
  const gradientColors = getLeagueGradientColors();

  const tabs = [
    { id: "all", label: "All" },
    { id: "signed", label: "Signed" },
    { id: "loan", label: "Loan" },
    { id: "transfers", label: "Transfers" },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const filterTransfersByTab = (transfers: Transfer[]): Transfer[] => {
    switch (activeTab) {
      case "signed":
        return transfers.filter(
          (t) => t.transferType === "free" || t.transferType === "signed",
        );
      case "loan":
        return transfers.filter((t) => t.transferType === "loan");
      case "transfers":
        return transfers.filter((t) => t.transferType === "permanent");
      default:
        return transfers;
    }
  };

  const getTransferStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "rumored":
        return "#757575";
      default:
        return "#757575";
    }
  };

  const getTransferTypeLabel = (type: string): string => {
    switch (type) {
      case "permanent":
        return "Transfer";
      case "loan":
        return "Loan";
      case "free":
        return "Signed";
      case "signed":
        return "Signed";
      default:
        return "Transfer";
    }
  };

  const renderTransferItem = (transfer: Transfer) => (
    <TouchableOpacity
      key={transfer.id}
      style={[
        styles.transferItem,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: isDarkMode ? "#333" : "#F0F0F0",
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.transferLayout}>
        {/* Player Info */}
        <View style={styles.playerSection}>
          <Image
            source={{
              uri:
                transfer.playerImage ||
                generatePlayerImage(transfer.playerName),
            }}
            style={styles.playerImage}
          />
          <View style={styles.playerInfo}>
            <Text
              style={[styles.playerName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {transfer.playerName}
            </Text>
            <Text
              style={[
                styles.playerDetails,
                { color: theme.colors.textSecondary },
              ]}
            >
              {transfer.nationality} / {transfer.age} years /{" "}
              {transfer.position}
            </Text>
          </View>
        </View>

        {/* Transfer Info */}
        <View style={styles.transferInfo}>
          <View style={styles.teamTransfer}>
            <View style={styles.teamInfo}>
              <Image
                source={{
                  uri:
                    transfer.fromLogoUrl || generateTeamLogo(transfer.fromTeam),
                }}
                style={styles.teamLogo}
              />
              <Text
                style={[styles.teamName, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {transfer.fromTeam}
              </Text>
            </View>

            <View style={styles.transferArrow}>
              <ArrowRight size={14} color="#FF6B35" />
            </View>

            <View style={styles.teamInfo}>
              <Image
                source={{
                  uri: transfer.toLogoUrl || generateTeamLogo(transfer.toTeam),
                }}
                style={styles.teamLogo}
              />
              <Text
                style={[styles.teamName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {transfer.toTeam}
              </Text>
            </View>
          </View>

          <View style={styles.transferDetails}>
            <Text
              style={[
                styles.transferDate,
                { color: theme.colors.textSecondary },
              ]}
            >
              {transfer.transferDate}
            </Text>
            {transfer.transferFee && (
              <Text style={[styles.transferFee, { color: theme.colors.text }]}>
                {transfer.transferFee}
              </Text>
            )}
            <View
              style={[
                styles.transferTypeBadge,
                {
                  backgroundColor: `${getTransferStatusColor(transfer.status)}20`,
                },
              ]}
            >
              <Text
                style={[
                  styles.transferTypeText,
                  { color: getTransferStatusColor(transfer.status) },
                ]}
              >
                {getTransferTypeLabel(transfer.transferType)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTransferSection = (section: TransferSection) => {
    const filteredTransfers = filterTransfersByTab(section.transfers);

    if (filteredTransfers.length === 0) return null;

    return (
      <View key={section.month} style={styles.transferSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {section.month}
        </Text>
        {filteredTransfers.map(renderTransferItem)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Transfers Tabs */}
      <View
        style={[
          styles.tabsContainer,
          {
            backgroundColor: isDarkMode ? "#2A2A2A" : "#FFFFFF",
            borderBottomColor: isDarkMode ? "#333333" : "#F0F0F0",
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab.id
                        ? "#FF6B35"
                        : isDarkMode
                          ? "#FFFFFF"
                          : "#6B7280",
                    fontWeight: activeTab === tab.id ? "600" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={styles.activeTabIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transfer Header */}
      <View
        style={[
          styles.transferHeader,
          { backgroundColor: isDarkMode ? "#1F1F1F" : "#FAFAFA" },
        ]}
      >
        <Text style={[styles.headerLeft, { color: theme.colors.text }]}>
          Player
        </Text>
        <Text
          style={[styles.headerRight, { color: theme.colors.textSecondary }]}
        >
          Team / Transfer Fee (EUR)
        </Text>
      </View>

      {/* Transfers List */}
      <ScrollView
        style={[styles.content, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6B35"]}
            tintColor="#FF6B35"
          />
        }
      >
        <View style={styles.transfersList}>
          {sampleTransfers.map(renderTransferSection)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tabsScrollView: {
    flex: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    position: "relative",
  },
  activeTab: {
    position: "relative",
  },
  tabText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: "#FF6B35",
    borderRadius: 1,
    zIndex: 2,
  },
  transferHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  headerLeft: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  headerRight: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  content: {
    flex: 1,
  },
  transfersList: {
    paddingBottom: 20,
  },
  transferSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  transferItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  transferLayout: {
    gap: 12,
  },
  playerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 2,
  },
  playerDetails: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  transferInfo: {
    gap: 8,
  },
  teamTransfer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  teamLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  teamName: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    flex: 1,
  },
  transferArrow: {
    paddingHorizontal: 8,
  },
  transferDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  transferDate: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
  },
  transferFee: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  transferTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  transferTypeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
});
