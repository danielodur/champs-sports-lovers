import { useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  backgroundRefreshService,
  RefreshConfig,
} from "@/services/refresh/background-refresh-service";

interface UseBackgroundRefreshOptions {
  screenType:
    | "match-details"
    | "live-matches"
    | "finished-matches"
    | "all-matches"
    | "fixture-matches";
  refreshCallback: () => Promise<void>;
  enabled?: boolean;
  customConfig?: Partial<RefreshConfig>;
  pauseOnBackground?: boolean;
}

interface BackgroundRefreshState {
  isRefreshing: boolean;
  lastRefreshTime: number;
  errorCount: number;
  successCount: number;
  subscriptionId: string | null;
}

export function useBackgroundRefresh({
  screenType,
  refreshCallback,
  enabled = true,
  customConfig,
  pauseOnBackground = true,
}: UseBackgroundRefreshOptions) {
  const [state, setState] = useState<BackgroundRefreshState>({
    isRefreshing: false,
    lastRefreshTime: 0,
    errorCount: 0,
    successCount: 0,
    subscriptionId: null,
  });

  const subscriptionIdRef = useRef<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const refreshCallbackRef = useRef(refreshCallback);
  const enabledRef = useRef(enabled);
  const customConfigRef = useRef(customConfig);

  // Keep callback reference updated without causing re-subscription
  refreshCallbackRef.current = refreshCallback;
  enabledRef.current = enabled;
  customConfigRef.current = customConfig;

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!subscriptionIdRef.current || !pauseOnBackground) {
        appStateRef.current = nextAppState;
        return;
      }

      // Pause when app goes to background, resume when it comes back to foreground
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        backgroundRefreshService.resumeRefresh(subscriptionIdRef.current);
        console.log(`🔄 Resume refresh on app foreground: ${screenType}`);
      } else if (
        appStateRef.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        backgroundRefreshService.pauseRefresh(subscriptionIdRef.current);
        console.log(`🔄 Pause refresh on app background: ${screenType}`);
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, [screenType, pauseOnBackground]);

  // Subscribe to refresh service - only run once with stable dependencies
  useEffect(() => {
    if (!enabledRef.current) {
      return;
    }

    const wrappedCallback = async () => {
      setState((prev) => ({ ...prev, isRefreshing: true }));
      try {
        await refreshCallbackRef.current();
        setState((prev) => ({
          ...prev,
          successCount: prev.successCount + 1,
          lastRefreshTime: Date.now(),
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          errorCount: prev.errorCount + 1,
        }));
        throw error;
      } finally {
        setState((prev) => ({ ...prev, isRefreshing: false }));
      }
    };

    const subscriptionId = backgroundRefreshService.subscribe(
      screenType,
      wrappedCallback,
      customConfigRef.current,
    );

    subscriptionIdRef.current = subscriptionId;
    setState((prev) => ({ ...prev, subscriptionId }));

    console.log(
      `🔄 Background refresh hook initialized: ${screenType} (${subscriptionId})`,
    );

    return () => {
      if (subscriptionIdRef.current) {
        backgroundRefreshService.unsubscribe(subscriptionIdRef.current);
        console.log(`🔄 Background refresh hook cleaned up: ${screenType}`);
      }
      subscriptionIdRef.current = null;
      setState((prev) => ({ ...prev, subscriptionId: null }));
    };
  }, [screenType]); // Only depend on screenType which shouldn't change

  // Manual trigger function
  const triggerRefresh = useCallback(async () => {
    if (subscriptionIdRef.current) {
      await backgroundRefreshService.triggerRefresh(subscriptionIdRef.current);
    }
  }, []);

  // Pause function
  const pauseRefresh = useCallback(() => {
    if (subscriptionIdRef.current) {
      backgroundRefreshService.pauseRefresh(subscriptionIdRef.current);
    }
  }, []);

  // Resume function
  const resumeRefresh = useCallback(() => {
    if (subscriptionIdRef.current) {
      backgroundRefreshService.resumeRefresh(subscriptionIdRef.current);
    }
  }, []);

  return {
    ...state,
    triggerRefresh,
    pauseRefresh,
    resumeRefresh,
    statistics: backgroundRefreshService.getStatistics(),
  };
}

export default useBackgroundRefresh;
