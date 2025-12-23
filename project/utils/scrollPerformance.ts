/**
 * Scroll Performance Optimization Utilities
 * Provides utilities and configurations for smooth scrolling performance
 */

import { Platform } from "react-native";

export interface ScrollOptimizationConfig {
  removeClippedSubviews?: boolean;
  scrollEventThrottle?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  initialNumToRender?: number;
  windowSize?: number;
  getItemLayout?: (
    data: any,
    index: number,
  ) => { length: number; offset: number; index: number };
  contentInsetAdjustmentBehavior?:
    | "automatic"
    | "scrollableAxes"
    | "never"
    | "always";
  bounces?: boolean;
  decelerationRate?: "normal" | "fast" | number;
  maintainVisibleContentPosition?: {
    minIndexForVisible: number;
    autoscrollToTopThreshold?: number;
  };
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  keyboardDismissMode?: "none" | "on-drag" | "interactive";
}

export const defaultScrollOptimization: ScrollOptimizationConfig = {
  removeClippedSubviews: true,
  scrollEventThrottle: 16,
  contentInsetAdjustmentBehavior:
    Platform.OS === "ios" ? "automatic" : undefined,
  bounces: true,
  decelerationRate: "normal",
  keyboardShouldPersistTaps: "handled",
  keyboardDismissMode: "on-drag",
};

export const highPerformanceScrollConfig: ScrollOptimizationConfig = {
  removeClippedSubviews: false,
  scrollEventThrottle: 16,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 8,
  windowSize: 15,
  contentInsetAdjustmentBehavior:
    Platform.OS === "ios" ? "automatic" : undefined,
  bounces: true,
  decelerationRate: "normal",
  keyboardShouldPersistTaps: "handled",
  keyboardDismissMode: "on-drag",
};

export const chatScrollConfig: ScrollOptimizationConfig = {
  removeClippedSubviews: false,
  scrollEventThrottle: 16,
  maxToRenderPerBatch: 15,
  updateCellsBatchingPeriod: 30,
  initialNumToRender: 10,
  windowSize: 15,
  contentInsetAdjustmentBehavior:
    Platform.OS === "ios" ? "automatic" : undefined,
  bounces: true,
  decelerationRate: "normal",
  keyboardShouldPersistTaps: "always",
  keyboardDismissMode: "interactive",
};

export const matchListScrollConfig: ScrollOptimizationConfig = {
  removeClippedSubviews: false,
  scrollEventThrottle: 16,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 8,
  windowSize: 15,
  contentInsetAdjustmentBehavior:
    Platform.OS === "ios" ? "automatic" : undefined,
  bounces: true,
  decelerationRate: "normal",
  keyboardShouldPersistTaps: "handled",
  keyboardDismissMode: "on-drag",
};

export const detailsScrollConfig: ScrollOptimizationConfig = {
  removeClippedSubviews: true,
  scrollEventThrottle: 16,
  contentInsetAdjustmentBehavior:
    Platform.OS === "ios" ? "automatic" : undefined,
  bounces: true,
  decelerationRate: "normal",
  keyboardShouldPersistTaps: "handled",
  keyboardDismissMode: "on-drag",
};

export const horizontalTabScrollConfig: ScrollOptimizationConfig = {
  removeClippedSubviews: true,
  scrollEventThrottle: 16,
  bounces: false,
  decelerationRate: "fast",
  keyboardShouldPersistTaps: "never",
  keyboardDismissMode: "none",
};

/**
 * Performance optimization styles for smooth scrolling
 */
export const scrollPerformanceStyles = {
  // iOS-specific optimizations
  ios: {
    shouldRasterizeIOS: true,
  },
  // Android-specific optimizations
  android: {
    renderToHardwareTextureAndroid: true,
  },
  // Cross-platform optimizations
  crossPlatform: {
    // Reduce overdraw
    backgroundColor: "transparent",
    // Optimize for performance
    needsOffscreenAlphaCompositing: false,
  },
};

/**
 * Get optimized styles based on platform
 */
export const getOptimizedScrollStyles = () => {
  const baseStyles = scrollPerformanceStyles.crossPlatform;

  if (Platform.OS === "ios") {
    return { ...baseStyles, ...scrollPerformanceStyles.ios };
  } else if (Platform.OS === "android") {
    return { ...baseStyles, ...scrollPerformanceStyles.android };
  }

  return baseStyles;
};

/**
 * Memory management utilities
 */
export class ScrollMemoryManager {
  private static instance: ScrollMemoryManager;
  private memoryWarningListeners: (() => void)[] = [];

  static getInstance(): ScrollMemoryManager {
    if (!ScrollMemoryManager.instance) {
      ScrollMemoryManager.instance = new ScrollMemoryManager();
    }
    return ScrollMemoryManager.instance;
  }

  addMemoryWarningListener(listener: () => void): void {
    this.memoryWarningListeners.push(listener);
  }

  removeMemoryWarningListener(listener: () => void): void {
    const index = this.memoryWarningListeners.indexOf(listener);
    if (index > -1) {
      this.memoryWarningListeners.splice(index, 1);
    }
  }

  clearMemoryWarningListeners(): void {
    this.memoryWarningListeners = [];
  }

  triggerMemoryCleanup(): void {
    this.memoryWarningListeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.warn("Error in memory cleanup listener:", error);
      }
    });
  }
}

/**
 * Performance monitoring utilities
 */
export class ScrollPerformanceMonitor {
  private static measurements: { [key: string]: number[] } = {};

  static startMeasurement(key: string): void {
    if (!this.measurements[key]) {
      this.measurements[key] = [];
    }
    this.measurements[key].push(Date.now());
  }

  static endMeasurement(key: string): number | null {
    if (!this.measurements[key] || this.measurements[key].length === 0) {
      return null;
    }

    const startTime = this.measurements[key].pop();
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`ScrollPerformance [${key}]: ${duration}ms`);
      return duration;
    }

    return null;
  }

  static getAverageTime(key: string, sampleSize: number = 10): number | null {
    // Implementation would track multiple measurements and calculate average
    // For now, return null as placeholder
    return null;
  }

  static clearMeasurements(): void {
    this.measurements = {};
  }
}

/**
 * Image loading optimization for better scroll performance
 */
export const optimizeImageForScrolling = (
  imageUri: string,
  size: { width: number; height: number },
) => {
  // Add query parameters to optimize image loading
  const separator = imageUri.includes("?") ? "&" : "?";
  return `${imageUri}${separator}w=${size.width}&h=${size.height}&fit=cover&auto=format&q=80`;
};

/**
 * Debounce utility for scroll events
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean,
): T => {
  let timeout: NodeJS.Timeout | null = null;

  return ((...args: any[]) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args);
    }
  }) as T;
};

/**
 * Throttle utility for scroll events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): T => {
  let inThrottle: boolean = false;

  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  }) as T;
};

/**
 * Configuration presets for different screen types
 */
/**
 * Data caching utilities for match data
 */
interface CachedData {
  data: any[];
  timestamp: number;
  key: string;
}

class DataCache {
  private cache: Map<string, CachedData> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any[]): void {
    this.cache.set(key, {
      data: [...data],
      timestamp: Date.now(),
      key,
    });
  }

  get(key: string): any[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (this.isExpired(cached)) {
      this.cache.delete(key);
      return null;
    }

    return [...cached.data];
  }

  isExpired(cached: CachedData): boolean {
    return Date.now() - cached.timestamp > this.CACHE_DURATION;
  }

  clear(): void {
    this.cache.clear();
  }

  clearStale(): void {
    for (const [key, cached] of this.cache.entries()) {
      if (this.isExpired(cached)) {
        this.cache.delete(key);
      }
    }
  }

  isFresh(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? !this.isExpired(cached) : false;
  }
}

const dataCache = new DataCache();

/**
 * Cache match data with a specific key
 */
export const cacheMatchData = (key: string, matches: any[]): void => {
  dataCache.set(key, matches);
};

/**
 * Get cached matches by key
 */
export const getCachedMatches = (key: string): any[] | null => {
  return dataCache.get(key);
};

/**
 * Check if cached data is still fresh
 */
export const isDataFresh = (key: string): boolean => {
  return dataCache.isFresh(key);
};

/**
 * Clear stale data from cache
 */
export const clearStaleData = (): void => {
  dataCache.clearStale();
};

/**
 * Clear all cached data
 */
export const clearAllCachedData = (): void => {
  dataCache.clear();
};

export const screenConfigs = {
  matchDetails: {
    scroll: detailsScrollConfig,
    styles: getOptimizedScrollStyles(),
  },
  matchList: {
    scroll: matchListScrollConfig,
    styles: getOptimizedScrollStyles(),
  },
  chat: {
    scroll: chatScrollConfig,
    styles: getOptimizedScrollStyles(),
  },
  horizontalTabs: {
    scroll: horizontalTabScrollConfig,
    styles: getOptimizedScrollStyles(),
  },
  highPerformance: {
    scroll: highPerformanceScrollConfig,
    styles: getOptimizedScrollStyles(),
  },
};
