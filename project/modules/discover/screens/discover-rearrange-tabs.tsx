import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  Plus,
  Heart,
  Flame,
  Users,
  Trophy,
  Star,
  Globe,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface DiscoverTab {
  id: string;
  label: string;
  icon: any;
}

interface DiscoverRearrangeTabsProps {
  visible: boolean;
  onClose: () => void;
  currentActiveTabs: string[];
  onSaveArrangement: (activeTabs: string[], hiddenTabs: string[]) => void;
}

const allAvailableTabs: DiscoverTab[] = [
  {
    id: "following",
    label: "Following",
    icon: Heart,
  },
  {
    id: "hot",
    label: "Hot",
    icon: Flame,
  },
  {
    id: "membership",
    label: "Membership",
    icon: Star,
  },
  {
    id: "football",
    label: "Football",
    icon: Trophy,
  },
  {
    id: "basketball",
    label: "Basketball",
    icon: Users,
  },
];

const STORAGE_KEY = "@discover_tabs_arrangement";

export default function DiscoverRearrangeTabs({
  visible,
  onClose,
  currentActiveTabs,
  onSaveArrangement,
}: DiscoverRearrangeTabsProps) {
  const theme = useTheme();
  const [activeTabIds, setActiveTabIds] = useState<string[]>(currentActiveTabs);
  const [hiddenTabIds, setHiddenTabIds] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (visible) {
      const allIds = allAvailableTabs.map((tab) => tab.id);

      // Ensure Following and Hot are always first two tabs
      const orderedActive = [
        "following",
        "hot",
        ...currentActiveTabs.filter((id) => id !== "following" && id !== "hot"),
      ];

      const hidden = allIds.filter((id) => !orderedActive.includes(id));
      setActiveTabIds(orderedActive);
      setHiddenTabIds(hidden);
      setIsEditMode(false);
    }
  }, [visible, currentActiveTabs]);

  const getTabsByIds = (ids: string[]): DiscoverTab[] => {
    return ids
      .map((id) => allAvailableTabs.find((tab) => tab.id === id)!)
      .filter(Boolean);
  };

  const activeTabs = getTabsByIds(activeTabIds);
  const hiddenTabs = getTabsByIds(hiddenTabIds);

  const moveTab = (tabId: string, fromActive: boolean) => {
    if (!isEditMode) return;

    // Prevent moving Following and Hot tabs
    if (tabId === "following" || tabId === "hot") {
      Alert.alert(
        "Cannot Move",
        "Following and Hot tabs must always remain active and in their positions.",
        [{ text: "OK" }],
      );
      return;
    }

    if (fromActive) {
      if (activeTabIds.length <= 3) {
        Alert.alert(
          "Minimum Required",
          "You must have at least 3 active tabs.",
          [{ text: "OK" }],
        );
        return;
      }

      setActiveTabIds((prev) => prev.filter((id) => id !== tabId));
      setHiddenTabIds((prev) => [...prev, tabId]);
    } else {
      if (activeTabIds.length >= 6) {
        Alert.alert(
          "Maximum Reached",
          "You can have maximum of 6 active tabs.",
          [{ text: "OK" }],
        );
        return;
      }

      setHiddenTabIds((prev) => prev.filter((id) => id !== tabId));
      setActiveTabIds((prev) => [...prev, tabId]);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      handleSave();
    } else {
      setIsEditMode(true);
    }
  };

  const handleSave = async () => {
    try {
      // Ensure Following and Hot are always first two tabs
      const orderedActive = [
        "following",
        "hot",
        ...activeTabIds.filter((id) => id !== "following" && id !== "hot"),
      ];

      const arrangement = {
        active: orderedActive,
        hidden: hiddenTabIds,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arrangement));

      onSaveArrangement(orderedActive, hiddenTabIds);
      setIsEditMode(false);
      onClose();
    } catch (error) {
      console.error("Error saving discover tabs arrangement:", error);
      Alert.alert("Error", "Failed to save arrangement. Please try again.");
    }
  };

  const renderTabGrid = (tabs: DiscoverTab[], isActive: boolean) => (
    <View
      style={[styles.tabGrid, { backgroundColor: theme.colors.background }]}
    >
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isDarkMode =
          theme.colors.background === "#2A2A2A" ||
          theme.colors.text === "#FFFFFF";

        return (
          <View key={tab.id} style={styles.tabItemContainer}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                {
                  backgroundColor: theme.colors.background,
                  borderWidth: 1,
                  borderColor:
                    theme.colors.border || "rgba(255, 255, 255, 0.1)",
                },
              ]}
              onPress={() => moveTab(tab.id, isActive)}
              activeOpacity={isEditMode ? 0.7 : 1}
            >
              <View style={styles.tabContent}>
                <IconComponent
                  size={14}
                  color={
                    tab.id === "following" || tab.id === "hot"
                      ? isDarkMode
                        ? "#FF6B6B"
                        : "#FF4444"
                      : theme.colors.textSecondary
                  }
                  style={styles.tabIcon}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color:
                        tab.id === "following" || tab.id === "hot"
                          ? isDarkMode
                            ? "#FF6B6B"
                            : "#FF4444"
                          : theme.colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>

              {isEditMode && tab.id !== "following" && tab.id !== "hot" && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: theme.colors.textSecondary,
                    },
                  ]}
                  onPress={() => moveTab(tab.id, isActive)}
                  activeOpacity={0.6}
                >
                  {isActive ? (
                    <X size={10} color={theme.colors.text} />
                  ) : (
                    <Plus size={10} color={theme.colors.text} />
                  )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <SafeAreaView
          style={[
            styles.safeArea,
            { backgroundColor: theme.colors.background },
          ]}
          edges={["top", "bottom"]}
        >
          {/* Pull-down handle */}
          <View
            style={[
              styles.pullHandle,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View
              style={[
                styles.handleBar,
                { backgroundColor: theme.colors.textSecondary },
              ]}
            />
          </View>

          {/* Header */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.colors.background,
                borderBottomColor:
                  theme.colors.border || "rgba(255, 255, 255, 0.1)",
              },
            ]}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                My Discover Tabs
              </Text>
              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleEditToggle}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.finishText,
                    {
                      color: isEditMode ? "#FF3B30" : theme.colors.text,
                    },
                  ]}
                >
                  {isEditMode ? "Done" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              style={[
                styles.headerSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {isEditMode
                ? "Tap + or - to add/remove tabs"
                : "Tap 'Edit' to rearrange tabs"}
            </Text>
          </View>

          <ScrollView
            style={[
              styles.content,
              { backgroundColor: theme.colors.background },
            ]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { backgroundColor: theme.colors.background },
            ]}
          >
            {/* Active Tabs Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Active Tabs
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isEditMode
                  ? `Tap X to hide tabs (${activeTabIds.length} active)`
                  : `${activeTabIds.length} active tabs`}
              </Text>
              {renderTabGrid(activeTabs, true)}
            </View>

            {/* Hidden Tabs Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Hidden Tabs
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isEditMode
                  ? `Tap + to show tabs (${hiddenTabIds.length} hidden)`
                  : `${hiddenTabIds.length} hidden tabs`}
              </Text>
              {renderTabGrid(hiddenTabs, false)}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  pullHandle: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  finishButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  finishText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  tabGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },
  tabItemContainer: {
    width: "28%",
    minWidth: 85,
    marginBottom: 12,
  },
  tabItem: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 70,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    marginBottom: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 14,
  },
  actionButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
