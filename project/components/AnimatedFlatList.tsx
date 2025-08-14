import React, { forwardRef, useCallback } from "react";
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  ViewStyle,
  RefreshControl,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { RotateCcw } from "lucide-react-native";
import { Match } from "@/types/match";

interface AnimatedFlatListProps
  extends Omit<FlatListProps<Match>, "data" | "renderItem"> {
  data: Match[];
  renderItem: ListRenderItem<Match>;
  refreshing?: boolean;
  onRefresh?: () => void;
  theme?: any;
  style?: ViewStyle;
}

const AnimatedFlatList = forwardRef<FlatList<Match>, AnimatedFlatListProps>(
  (
    { data, renderItem, refreshing, onRefresh, theme, style, ...props },
    ref
  ) => {
    // Optimize item layout calculation for smooth scrolling
    const getItemLayout = useCallback(
      (data: ArrayLike<Match> | null | undefined, index: number) => ({
        length: 120, // Fixed item height for consistent layout
        offset: 120 * index,
        index,
      }),
      []
    );

    // Optimize key extraction
    const keyExtractor = useCallback((item: Match) => item.id, []);

    // Custom refresh control with English text and loading icon
    const renderRefreshControl = useCallback(
      () => (
        <RefreshControl
          refreshing={refreshing || false}
          onRefresh={onRefresh}
          colors={["#FF4444"]}
          tintColor={"#FF4444"}
          titleColor={theme?.colors?.text || "#000000"}
          title={refreshing ? "Updating matches..." : "Pull to refresh"}
          progressBackgroundColor={
            theme?.colors?.backgroundSecondary || "#FFFFFF"
          }
          // Enhanced pull-to-refresh experience
          progressViewOffset={20}
        />
      ),
      [refreshing, onRefresh, theme]
    );

    return (
      <FlatList
        ref={ref}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        // Performance optimizations for stability
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={100}
        initialNumToRender={8}
        windowSize={5}
        // Smooth scrolling settings
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        disableIntervalMomentum={true}
        // Enhanced pull-to-refresh
        refreshControl={renderRefreshControl()}
        // Pull-to-refresh styling
        contentContainerStyle={[
          style,
          data.length === 0 && styles.emptyContainer,
        ]}
        // Custom empty state
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <RotateCcw
              size={48}
              color={theme?.colors?.textSecondary || "#999999"}
            />
            <Text
              style={[
                styles.emptyText,
                { color: theme?.colors?.text || "#000000" },
              ]}
            >
              Pull down to refresh matches
            </Text>
          </View>
        }
        {...props}
      />
    );
  }
);

const styles = StyleSheet.create({
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
});

AnimatedFlatList.displayName = "AnimatedFlatList";

export default AnimatedFlatList;
