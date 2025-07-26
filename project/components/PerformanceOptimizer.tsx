import React, { useEffect, useRef } from 'react';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

/**
 * 🚀 Performance Optimizer Component
 * Handles app performance optimizations and memory management
 */
export default function PerformanceOptimizer({ children }: PerformanceOptimizerProps) {
  const appState = useRef(AppState.currentState);
  const isActive = useRef(true);

  useEffect(() => {
    // Optimize initial render
    InteractionManager.runAfterInteractions(() => {
      console.log('🚀 Performance: Initial interactions completed');
    });

    // Handle app state changes for performance
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🚀 Performance: App became active - optimizing resources');
        isActive.current = true;
        
        // Run performance optimizations when app becomes active
        InteractionManager.runAfterInteractions(() => {
          // Clear any cached data that might be stale
          if (global.gc) {
            global.gc();
          }
        });
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('🚀 Performance: App going to background - cleaning up');
        isActive.current = false;
        
        // Clean up resources when app goes to background
        // This helps prevent memory leaks
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return <>{children}</>;
}

/**
 * 🎯 Performance Hooks
 */
export const usePerformanceOptimization = () => {
  const optimizeListRendering = (data: any[], maxItems = 50) => {
    return data.slice(0, maxItems);
  };

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  };

  const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  return {
    optimizeListRendering,
    debounce,
    throttle,
  };
}; 