import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronLeft, History, RotateCcw } from "lucide-react-native";
import { useTheme } from "../../../hooks/useTheme";
import { useRouter } from "expo-router";

const SEARCH_HISTORY_KEY = "@search_history";

export default function StatsViewAllSearchHistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSearchHistory();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleHistoryItemPress = (item: string) => {
    // Navigate back to search screen with the selected item
    router.push({
      pathname: "/stats-search",
      params: { searchQuery: item },
    });
  };

  const clearAllHistory = async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  };

  const removeHistoryItem = async (index: number) => {
    try {
      const newHistory = [...searchHistory];
      newHistory.splice(index, 1);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(newHistory),
      );
    } catch (error) {
      console.error("Error removing history item:", error);
    }
  };

  return (
    <>
      <StatusBar
        barStyle={
          theme.colors.background === "#FFFFFF"
            ? "dark-content"
            : "light-content"
        }
        backgroundColor={
          theme.colors.background === "#FFFFFF"
            ? theme.colors.background
            : "#2A2A2A"
        }
      />

      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor:
              theme.colors.background === "#FFFFFF"
                ? theme.colors.background
                : "#2A2A2A",
          },
        ]}
        edges={["top", "left", "right"]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor:
                theme.colors.background === "#FFFFFF"
                  ? theme.colors.background
                  : "#2A2A2A",
            },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <History size={20} color={theme.colors.text} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Search History
            </Text>
          </View>

          {searchHistory.length > 0 && (
            <TouchableOpacity
              onPress={clearAllHistory}
              style={styles.clearAllButton}
            >
              <RotateCcw size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {searchHistory.length > 0 ? (
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {searchHistory.length} search
                  {searchHistory.length !== 1 ? "es" : ""} found
                </Text>

                <View style={styles.historyList}>
                  {searchHistory.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.historyItem,
                        {
                          backgroundColor:
                            theme.colors.background === "#FFFFFF"
                              ? "#F8F8F8"
                              : "#1F1F1F",
                        },
                      ]}
                      onPress={() => handleHistoryItemPress(item)}
                    >
                      <View style={styles.historyItemContent}>
                        <View style={styles.historyItemLeft}>
                          <History
                            size={16}
                            color={theme.colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.historyText,
                              { color: theme.colors.text },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => removeHistoryItem(index)}
                          style={styles.removeButton}
                        >
                          <RotateCcw
                            size={14}
                            color={theme.colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <History size={64} color={theme.colors.textSecondary} />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No Search History
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Your recent searches will appear here
              </Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: "Inter-SemiBold",
  },
  clearAllButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginBottom: 16,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    borderRadius: 12,
    overflow: "hidden",
  },
  historyItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  historyItemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  historyText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    marginLeft: 12,
    flex: 1,
  },
  removeButton: {
    padding: 8,
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
    fontFamily: "Inter-SemiBold",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    fontFamily: "Inter-Regular",
  },
});
