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

interface Category {
  id: string;
  label: string;
  icon: any;
}

interface NewsRearrangeFilterTabsProps {
  visible: boolean;
  onClose: () => void;
  currentActiveCategories: string[];
  onSaveArrangement: (
    activeCategories: string[],
    hiddenCategories: string[],
  ) => void;
}

const allAvailableCategories: Category[] = [
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

const STORAGE_KEY = "@news_filter_arrangement";

export default function NewsRearrangeFilterTabs({
  visible,
  onClose,
  currentActiveCategories,
  onSaveArrangement,
}: NewsRearrangeFilterTabsProps) {
  const theme = useTheme();
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>(
    currentActiveCategories,
  );
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (visible) {
      const allIds = allAvailableCategories.map((cat) => cat.id);

      // Ensure Recent and Hot are always first two categories
      const orderedActive = [
        "recent",
        "hot",
        ...currentActiveCategories.filter(
          (id) => id !== "recent" && id !== "hot",
        ),
      ];

      const hidden = allIds.filter((id) => !orderedActive.includes(id));
      setActiveCategoryIds(orderedActive);
      setHiddenCategoryIds(hidden);
      setIsEditMode(false);
    }
  }, [visible, currentActiveCategories]);

  const getCategoriesByIds = (ids: string[]): Category[] => {
    return ids
      .map(
        (id) => allAvailableCategories.find((category) => category.id === id)!,
      )
      .filter(Boolean);
  };

  const activeCategories = getCategoriesByIds(activeCategoryIds);
  const hiddenCategories = getCategoriesByIds(hiddenCategoryIds);

  const moveCategory = (categoryId: string, fromActive: boolean) => {
    if (!isEditMode) return;

    // Prevent moving Recent and Hot tabs
    if (categoryId === "recent" || categoryId === "hot") {
      Alert.alert(
        "Cannot Move",
        "Recent and Hot tabs must always remain active and in their positions.",
        [{ text: "OK" }],
      );
      return;
    }

    if (fromActive) {
      if (activeCategoryIds.length <= 3) {
        Alert.alert(
          "Minimum Required",
          "You must have at least 3 active filter tabs.",
          [{ text: "OK" }],
        );
        return;
      }

      setActiveCategoryIds((prev) => prev.filter((id) => id !== categoryId));
      setHiddenCategoryIds((prev) => [...prev, categoryId]);
    } else {
      if (activeCategoryIds.length >= 8) {
        Alert.alert(
          "Maximum Reached",
          "You can have maximum of 8 active filter tabs.",
          [{ text: "OK" }],
        );
        return;
      }

      setHiddenCategoryIds((prev) => prev.filter((id) => id !== categoryId));
      setActiveCategoryIds((prev) => [...prev, categoryId]);
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
      // Ensure Recent and Hot are always first two categories
      const orderedActive = [
        "recent",
        "hot",
        ...activeCategoryIds.filter((id) => id !== "recent" && id !== "hot"),
      ];

      const arrangement = {
        active: orderedActive,
        hidden: hiddenCategoryIds,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arrangement));

      onSaveArrangement(orderedActive, hiddenCategoryIds);
      setIsEditMode(false);
      onClose();
    } catch (error) {
      console.error("Error saving filter arrangement:", error);
      Alert.alert("Error", "Failed to save arrangement. Please try again.");
    }
  };

  const renderCategoryGrid = (categories: Category[], isActive: boolean) => (
    <View
      style={[
        styles.categoryGrid,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {categories.map((category) => {
        const IconComponent = category.icon;

        return (
          <View key={category.id} style={styles.categoryItemContainer}>
            <TouchableOpacity
              style={[
                styles.categoryItem,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor:
                    theme.colors.border || "rgba(255, 255, 255, 0.1)",
                },
              ]}
              onPress={() => moveCategory(category.id, isActive)}
              activeOpacity={isEditMode ? 0.7 : 1}
            >
              <View style={styles.categoryContent}>
                <IconComponent
                  size={14}
                  color={
                    category.id === "recent" || category.id === "hot"
                      ? "#FF3B30"
                      : theme.colors.textSecondary
                  }
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color:
                        category.id === "recent" || category.id === "hot"
                          ? "#FF3B30"
                          : theme.colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {category.label}
                </Text>
              </View>

              {isEditMode &&
                category.id !== "recent" &&
                category.id !== "hot" && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: theme.colors.textSecondary,
                      },
                    ]}
                    onPress={() => moveCategory(category.id, isActive)}
                    activeOpacity={0.6}
                  >
                    {isActive ? (
                      <X size={10} color={theme.colors.background} />
                    ) : (
                      <Plus size={10} color={theme.colors.background} />
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
                My Filter Tabs
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
                  ? `Tap X to hide tabs (${activeCategoryIds.length} active)`
                  : `${activeCategoryIds.length} active tabs`}
              </Text>
              {renderCategoryGrid(activeCategories, true)}
            </View>

            {/* Hidden Filter Tabs Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Hidden Filter Tabs
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isEditMode
                  ? `Tap + to show tabs (${hiddenCategoryIds.length} hidden)`
                  : `${hiddenCategoryIds.length} hidden tabs`}
              </Text>
              {renderCategoryGrid(hiddenCategories, false)}
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },
  categoryItemContainer: {
    width: "28%",
    minWidth: 85,
    marginBottom: 12,
  },
  categoryItem: {
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
  categoryContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIcon: {
    marginBottom: 6,
  },
  categoryLabel: {
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
