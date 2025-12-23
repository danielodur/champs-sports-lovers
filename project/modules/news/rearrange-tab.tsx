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
  Star,
  Trophy,
  MapPin,
  Users,
  Video,
  Target,
  Clock,
  Flame,
} from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Tab {
  id: string;
  label: string;
  icon: any;
}

interface RearrangeTabProps {
  visible: boolean;
  onClose: () => void;
  currentTabOrder: string[];
  tabLabels: { [key: string]: string };
  onSaveArrangement: (newOrder: string[]) => void;
}

const allAvailableTabs: Tab[] = [
  { id: "recent", label: "Recent", icon: Clock },
  { id: "hot", label: "Hot", icon: Flame },
  { id: "follows", label: "Followed", icon: Star },
  { id: "sports", label: "All Sports", icon: Target },
  { id: "fifa", label: "FIFA", icon: Trophy },
  { id: "uganda", label: "Uganda", icon: MapPin },
  { id: "afcon", label: "AFCON", icon: Users },
  { id: "football", label: "Football", icon: Star },
  { id: "basketball", label: "Basketball", icon: Star },
  { id: "rugby", label: "Rugby", icon: Star },
  { id: "english-pl", label: "English PL", icon: Star },
  { id: "la-liga", label: "La Liga", icon: Star },
  { id: "bundesliga", label: "Bundesliga", icon: Star },
  { id: "serie-a", label: "Serie A", icon: Star },
  { id: "ligue-1", label: "Ligue 1", icon: Star },
  { id: "videos", label: "Videos", icon: Video },
];

const STORAGE_KEY = "@news_tabs_arrangement";

export default function RearrangeTab({
  visible,
  onClose,
  currentTabOrder,
  tabLabels,
  onSaveArrangement,
}: RearrangeTabProps) {
  const theme = useTheme();
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);
  const [upperTabs, setUpperTabs] = useState<(string | null)[]>([]); // null represents empty slot
  const [lowerTabs, setLowerTabs] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (visible && !initialized) {
      console.log("🎯 [NewsRearrange] Initializing with current order:", currentTabOrder);
      
      // Store the original order
      const allIds = allAvailableTabs.map((tab) => tab.id);
      
      // Ensure Recent and Hot are always first two tabs
      const orderedActive = [
        "recent",
        "hot",
        ...currentTabOrder.filter((id) => id !== "recent" && id !== "hot"),
      ];
      
      // Fill up with any missing tabs that exist in allAvailableTabs
      const allOrderedTabs = [
        ...orderedActive,
        ...allIds.filter(id => !orderedActive.includes(id))
      ];

      console.log("📋 [NewsRearrange] Complete tab order initialized:", allOrderedTabs);
      setOriginalOrder([...allOrderedTabs]);
      setUpperTabs([...allOrderedTabs]);
      setLowerTabs([]);
      setIsEditMode(false);
      setInitialized(true);
    } else if (!visible) {
      // Reset initialization when modal closes
      setInitialized(false);
    }
  }, [visible, currentTabOrder, initialized]);

  const getTabsByIds = (ids: (string | null)[]): (Tab | null)[] => {
    return ids.map((id) => {
      if (id === null) return null;
      return allAvailableTabs.find((tab) => tab.id === id) || null;
    });
  };

  const moveTabDown = (tabId: string, index: number) => {
    if (!isEditMode) return;

    // Prevent moving Recent and Hot tabs
    if (tabId === "recent" || tabId === "hot") {
      Alert.alert(
        "Cannot Move",
        "Recent and Hot tabs must always remain in their positions.",
        [{ text: "OK" }]
      );
      return;
    }

    // Move tab down - replace with empty slot
    const newUpperTabs = [...upperTabs];
    newUpperTabs[index] = null; // Empty slot
    setUpperTabs(newUpperTabs);
    
    // Add to lower tabs
    setLowerTabs([...lowerTabs, tabId]);
  };

  const moveTabUp = (tabId: string) => {
    if (!isEditMode) return;

    // Find the first empty slot in upper tabs
    const emptySlotIndex = upperTabs.findIndex(slot => slot === null);
    
    if (emptySlotIndex === -1) {
      Alert.alert(
        "No Empty Slots",
        "Please move a tab down first to create an empty slot.",
        [{ text: "OK" }]
      );
      return;
    }

    // Fill the empty slot
    const newUpperTabs = [...upperTabs];
    newUpperTabs[emptySlotIndex] = tabId;
    setUpperTabs(newUpperTabs);

    // Remove from lower tabs
    setLowerTabs(lowerTabs.filter(id => id !== tabId));
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // When clicking Done, check if all tabs are back before saving
      const allTabsBack = lowerTabs.length === 0;
      
      if (!allTabsBack) {
        Alert.alert(
          "Cannot Save",
          "Please move all tabs back to the Active Filter Tabs section before saving.",
          [{ text: "OK" }]
        );
        return;
      }
      
      // All tabs are back, save and close
      handleSave();
    } else {
      // Enter edit mode
      setIsEditMode(true);
    }
  };

  const handleSave = async () => {
    try {
      console.log("🔄 [NewsRearrange] Starting tab arrangement save...");
      
      // Remove null slots and get final order
      const finalOrder = upperTabs.filter((id): id is string => id !== null);
      
      // Ensure Recent and Hot are always first two tabs
      const orderedActive = [
        "recent",
        "hot",
        ...finalOrder.filter((id) => id !== "recent" && id !== "hot"),
      ];

      console.log("💾 [NewsRearrange] Saving tab order to AsyncStorage:", orderedActive);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ active: orderedActive, hidden: [] }));
      
      console.log("📡 [NewsRearrange] Notifying parent component of arrangement change");
      await onSaveArrangement(orderedActive);
      
      console.log("✅ [NewsRearrange] Tab arrangement saved successfully");
      setIsEditMode(false);
      onClose();
    } catch (error) {
      console.error("❌ [NewsRearrange] Error saving tab arrangement:", error);
      Alert.alert("Error", "Failed to save arrangement. Please try again.");
    }
  };

  const handleClose = () => {
    // Revert to original order if not saved
    if (isEditMode || lowerTabs.length > 0) {
      console.log("↩️ [NewsRearrange] Reverting to original tab arrangement");
      setUpperTabs([...originalOrder]);
      setLowerTabs([]);
      setIsEditMode(false);
    }
    onClose();
  };

  const upperTabsData = getTabsByIds(upperTabs);
  const lowerTabsData = getTabsByIds(lowerTabs);

  // Check if we can save (all tabs back in position)
  const canSave = lowerTabs.length === 0;

  const renderUpperTab = (tab: Tab | null, index: number) => {
    if (tab === null) {
      // Empty slot
      return (
        <View key={`empty-${index}`} style={styles.tabItemContainer}>
          <View
            style={[
              styles.tabItem,
              styles.emptySlot,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderWidth: 2,
                borderColor: theme.colors.border || "rgba(255, 255, 255, 0.2)",
                borderStyle: "dashed",
              },
            ]}
          >
            <Text
              style={[
                styles.emptySlotText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Empty
            </Text>
          </View>
        </View>
      );
    }

    const IconComponent = tab.icon;
    const displayLabel = tabLabels[tab.id] || tab.label;

    return (
      <View key={tab.id} style={styles.tabItemContainer}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            {
              backgroundColor: theme.colors.backgroundSecondary,
              borderWidth: 1,
              borderColor: theme.colors.border || "rgba(255, 255, 255, 0.1)",
            },
          ]}
          activeOpacity={1}
        >
          <View style={styles.tabContent}>
            <IconComponent
              size={14}
              color={
                tab.id === "recent" || tab.id === "hot"
                  ? "#FF3B30"
                  : theme.colors.textSecondary
              }
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    tab.id === "recent" || tab.id === "hot"
                      ? "#FF3B30"
                      : theme.colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {displayLabel}
            </Text>
          </View>

          {isEditMode && tab.id !== "recent" && tab.id !== "hot" && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.colors.textSecondary,
                },
              ]}
              onPress={() => moveTabDown(tab.id, index)}
              activeOpacity={0.6}
            >
              <X size={10} color={theme.colors.background} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderLowerTab = (tab: Tab | null) => {
    if (!tab) return null;

    const IconComponent = tab.icon;
    const displayLabel = tabLabels[tab.id] || tab.label;

    return (
      <View key={tab.id} style={styles.tabItemContainer}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            {
              backgroundColor: theme.colors.backgroundSecondary,
              borderWidth: 1,
              borderColor: theme.colors.border || "rgba(255, 255, 255, 0.1)",
              opacity: 0.7,
            },
          ]}
          activeOpacity={1}
        >
          <View style={styles.tabContent}>
            <IconComponent
              size={14}
              color={theme.colors.textSecondary}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {displayLabel}
            </Text>
          </View>

          {isEditMode && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.colors.textSecondary,
                },
              ]}
              onPress={() => moveTabUp(tab.id)}
              activeOpacity={0.6}
            >
              <Plus size={10} color={theme.colors.background} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
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
                Rearrange News Tabs
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
                      color: isEditMode ? "#FF3B30" : "#808080",
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
                ? "Tap X to move down, + to move up. Click Done when finished."
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
            {/* Active Filter Tabs Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Active Filter Tabs
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isEditMode
                  ? `Press X to move tabs down (${upperTabs.filter(t => t !== null).length} active)`
                  : `${upperTabs.filter(t => t !== null).length} active tabs`}
              </Text>
              <View style={styles.tabGrid}>
                {upperTabsData.map((tab, index) => renderUpperTab(tab, index))}
              </View>
            </View>

            {/* Repositioned Tabs Section - Only show if there are tabs here */}
            {lowerTabs.length > 0 && (
              <View
                style={[
                  styles.section,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Repositioned Tabs
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {isEditMode
                    ? `Press + to move tabs back up (${lowerTabs.length} repositioned)`
                    : `${lowerTabs.length} repositioned tabs`}
                </Text>
                <View style={styles.tabGrid}>
                  {lowerTabsData.map((tab) => renderLowerTab(tab))}
                </View>
              </View>
            )}
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
  emptySlot: {
    opacity: 0.5,
  },
  emptySlotText: {
    fontSize: 11,
    fontWeight: "500",
    fontStyle: "italic",
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
