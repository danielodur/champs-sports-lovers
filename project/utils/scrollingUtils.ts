import { Platform } from "react-native";

/**
 * Scrolling Utilities for Mac Development Environment
 *
 * This utility provides Mac-specific scrolling configurations and helpers
 * to ensure proper scrolling behavior during development on macOS.
 */

export interface ScrollingConfig {
  scrollEventThrottle: number;
  bounces: boolean;
  showsVerticalScrollIndicator: boolean;
  keyboardShouldPersistTaps: "handled" | "always" | "never";
  removeClippedSubviews: boolean;
  contentContainerStyle: {
    flexGrow: number;
    paddingBottom: number;
    minHeight?: string;
  };
  maxToRenderPerBatch?: number;
  initialNumToRender?: number;
  windowSize?: number;
}

/**
 * Get optimized scrolling configuration for current platform
 */
export const getScrollingConfig = (): ScrollingConfig => {
  const baseConfig: ScrollingConfig = {
    scrollEventThrottle: 16, // 60fps
    bounces: true,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled",
    removeClippedSubviews: false, // Better for development
    contentContainerStyle: {
      flexGrow: 1,
      paddingBottom: 20,
    },
  };

  if (Platform.OS === "web" || __DEV__) {
    // Mac development environment optimizations
    return {
      ...baseConfig,
      contentContainerStyle: {
        ...baseConfig.contentContainerStyle,
        minHeight: "100%", // Ensure scrollable area
      },
      removeClippedSubviews: false, // Always false for development
      maxToRenderPerBatch: 10, // Larger batch for development
      initialNumToRender: 8,
      windowSize: 15,
    };
  }

  // Production optimizations
  return {
    ...baseConfig,
    maxToRenderPerBatch: 8,
    initialNumToRender: 6,
    windowSize: 12,
  };
};

/**
 * Check if we should use ScrollView instead of FlatList
 * (Useful for Mac development environment)
 */
export const shouldUseScrollView = (): boolean => {
  return Platform.OS === "web" || (__DEV__ && Platform.OS === "ios");
};

/**
 * Get loading overlay configuration that doesn't block scrolling
 */
export const getLoadingOverlayConfig = () => ({
  pointerEvents: "none" as const,
  style: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor:
      Platform.OS === "web" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.05)",
    zIndex: 10,
  },
});

/**
 * Container styles for scrollable components
 */
export const getScrollContainerStyles = () => ({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
    minHeight: __DEV__ ? "100%" : undefined,
  },
});

/**
 * Debug helper to log scrolling issues
 */
export const debugScrolling = (
  componentName: string,
  data: any[],
  isLoading: boolean,
) => {
  if (__DEV__) {
    console.log(`📱 [${componentName}] Scrolling Debug:`, {
      platform: Platform.OS,
      dataLength: data.length,
      isLoading,
      isDev: __DEV__,
      shouldUseScrollView: shouldUseScrollView(),
    });
  }
};

/**
 * Handle scroll events with throttling
 */
export const createScrollHandler = (onScroll?: (event: any) => void) => {
  if (!onScroll) return undefined;

  let lastScrollTime = 0;
  const throttleMs = 16; // 60fps

  return (event: any) => {
    const now = Date.now();
    if (now - lastScrollTime >= throttleMs) {
      lastScrollTime = now;
      onScroll(event);
    }
  };
};

/**
 * Refresh control configuration
 */
export const getRefreshControlConfig = (theme: any) => ({
  colors: [theme.colors.primary],
  tintColor: theme.colors.primary,
  titleColor: theme.colors.text,
  progressBackgroundColor: theme.colors.background,
});

/**
 * Handle pull-to-refresh with haptic feedback
 */
export const handleRefreshWithFeedback = async (
  refreshFn: () => Promise<void>,
  setRefreshing: (value: boolean) => void,
) => {
  try {
    // Provide haptic feedback on supported platforms
    if (Platform.OS === "ios") {
      const Haptics = await import("expo-haptics");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setRefreshing(true);
    await refreshFn();
  } catch (error) {
    console.warn("Refresh error:", error);
  } finally {
    setRefreshing(false);
  }
};

/**
 * Mac-specific gesture configurations
 */
export const getMacGestureConfig = () => ({
  // Enable mouse wheel scrolling on web/Mac
  enableMouseEvents: Platform.OS === "web",
  // Ensure touch events work properly in development
  touchAction: "pan-y",
  // Handle trackpad gestures
  overflowY: "auto" as const,
});

/**
 * Performance monitoring for scrolling
 */
export const monitorScrollPerformance = (componentName: string) => {
  if (!__DEV__) return;

  let frameCount = 0;
  let lastTime = performance.now();

  const checkFPS = () => {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

      if (fps < 55) {
        console.warn(`⚠️ [${componentName}] Low FPS detected: ${fps} fps`);
      } else {
        console.log(`✅ [${componentName}] Good FPS: ${fps} fps`);
      }

      frameCount = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(checkFPS);
  };

  requestAnimationFrame(checkFPS);
};

export default {
  getScrollingConfig,
  shouldUseScrollView,
  getLoadingOverlayConfig,
  getScrollContainerStyles,
  debugScrolling,
  createScrollHandler,
  getRefreshControlConfig,
  handleRefreshWithFeedback,
  getMacGestureConfig,
  monitorScrollPerformance,
};
