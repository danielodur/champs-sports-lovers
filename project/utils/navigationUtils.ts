import { Router } from "expo-router";

/**
 * Safe navigation utility to prevent "This screen does not exist" errors
 */
export class SafeNavigation {
  /**
   * Safely navigate back with fallback options
   * @param router - The expo-router instance
   * @param fallbackRoute - Route to navigate to if back navigation isn't possible
   * @param fallbackAction - Action to take for fallback ('push' | 'replace')
   */
  static goBack(
    router: Router,
    fallbackRoute: string = "/(tabs)",
    fallbackAction: "push" | "replace" = "replace"
  ): void {
    try {
      if (router.canGoBack()) {
        console.log("✅ SafeNavigation: Going back to previous screen");
        router.back();
      } else {
        console.log(
          `⚠️ SafeNavigation: No previous screen, using fallback: ${fallbackRoute}`
        );
        if (fallbackAction === "replace") {
          router.replace(fallbackRoute as any);
        } else {
          router.push(fallbackRoute as any);
        }
      }
    } catch (error) {
      console.error("❌ SafeNavigation: Error during navigation:", error);
      // Last resort fallback
      try {
        router.replace("/(tabs)" as any);
      } catch (finalError) {
        console.error(
          "❌ SafeNavigation: Final fallback failed:",
          finalError
        );
      }
    }
  }

  /**
   * Safe navigation with error handling
   * @param router - The expo-router instance
   * @param route - Route to navigate to
   * @param action - Navigation action ('push' | 'replace')
   * @param fallbackRoute - Route to use if navigation fails
   */
  static navigate(
    router: Router,
    route: string,
    action: "push" | "replace" = "push",
    fallbackRoute: string = "/(tabs)"
  ): void {
    try {
      console.log(`🧭 SafeNavigation: Navigating to ${route} with ${action}`);
      if (action === "replace") {
        router.replace(route as any);
      } else {
        router.push(route as any);
      }
    } catch (error) {
      console.error(`❌ SafeNavigation: Failed to navigate to ${route}:`, error);
      try {
        console.log(`⚠️ SafeNavigation: Using fallback route: ${fallbackRoute}`);
        router.replace(fallbackRoute as any);
      } catch (fallbackError) {
        console.error(
          "❌ SafeNavigation: Fallback navigation failed:",
          fallbackError
        );
      }
    }
  }

  /**
   * Navigate to authentication screen with proper fallbacks
   * @param router - The expo-router instance
   * @param preferredAuthScreen - Preferred auth screen ('login-register' | 'register-and-login')
   */
  static goToAuth(
    router: Router,
    preferredAuthScreen: "login-register" | "register-and-login" = "login-register"
  ): void {
    const authRoute = `/${preferredAuthScreen}`;
    const fallbackAuthRoute = "/login-register";

    try {
      console.log(`🔐 SafeNavigation: Going to auth screen: ${authRoute}`);
      router.push(authRoute as any);
    } catch (error) {
      console.error(
        `❌ SafeNavigation: Failed to navigate to ${authRoute}:`,
        error
      );
      try {
        console.log(
          `⚠️ SafeNavigation: Using fallback auth: ${fallbackAuthRoute}`
        );
        router.replace(fallbackAuthRoute as any);
      } catch (fallbackError) {
        console.error(
          "❌ SafeNavigation: Auth fallback failed:",
          fallbackError
        );
        // Final fallback to tabs
        try {
          router.replace("/(tabs)" as any);
        } catch (finalError) {
          console.error(
            "❌ SafeNavigation: Final auth fallback failed:",
            finalError
          );
        }
      }
    }
  }

  /**
   * Navigate to home/tabs with safety checks
   * @param router - The expo-router instance
   */
  static goHome(router: Router): void {
    try {
      console.log("🏠 SafeNavigation: Going to home/tabs");
      router.replace("/(tabs)" as any);
    } catch (error) {
      console.error("❌ SafeNavigation: Failed to navigate home:", error);
      // Try alternative routes
      const alternatives = ["/", "/(tabs)/index"];
      for (const alt of alternatives) {
        try {
          console.log(`⚠️ SafeNavigation: Trying alternative: ${alt}`);
          router.replace(alt as any);
          return;
        } catch (altError) {
          console.error(
            `❌ SafeNavigation: Alternative ${alt} failed:`,
            altError
          );
        }
      }
    }
  }

  /**
   * Check if a route exists and is navigable
   * @param router - The expo-router instance
   * @param route - Route to check
   * @returns boolean indicating if route is safe
   */
  static isRouteSafe(router: Router, route: string): boolean {
    try {
      // This is a basic check - in a real app you might want more sophisticated validation
      return typeof route === "string" && route.length > 0;
    } catch (error) {
      console.error("❌ SafeNavigation: Route safety check failed:", error);
      return false;
    }
  }

  /**
   * Get the current route name safely
   * @param router - The expo-router instance
   * @returns string of current route or 'unknown'
   */
  static getCurrentRoute(router: Router): string {
    try {
      // This would need to be implemented based on your router's capabilities
      // For now, return a safe default
      return "unknown";
    } catch (error) {
      console.error("❌ SafeNavigation: Failed to get current route:", error);
      return "unknown";
    }
  }
}

/**
 * Hook-like function for safe navigation (can be used in components)
 */
export function useSafeNavigation(router: Router) {
  return {
    goBack: (fallbackRoute?: string, fallbackAction?: "push" | "replace") =>
      SafeNavigation.goBack(router, fallbackRoute, fallbackAction),
    navigate: (
      route: string,
      action?: "push" | "replace",
      fallbackRoute?: string
    ) => SafeNavigation.navigate(router, route, action, fallbackRoute),
    goToAuth: (
      preferredAuthScreen?: "login-register" | "register-and-login"
    ) => SafeNavigation.goToAuth(router, preferredAuthScreen),
    goHome: () => SafeNavigation.goHome(router),
    isRouteSafe: (route: string) => SafeNavigation.isRouteSafe(router, route),
    getCurrentRoute: () => SafeNavigation.getCurrentRoute(router),
  };
}

/**
 * Common fallback routes for different contexts
 */
export const FALLBACK_ROUTES = {
  HOME: "/(tabs)",
  AUTH: "/login-register",
  PROFILE: "/(tabs)/profile",
  INDEX: "/",
} as const;

/**
 * Navigation error types for better error handling
 */
export enum NavigationErrorType {
  ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND",
  NAVIGATION_BLOCKED = "NAVIGATION_BLOCKED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class NavigationError extends Error {
  constructor(
    message: string,
    public type: NavigationErrorType,
    public attemptedRoute?: string
  ) {
    super(message);
    this.name = "NavigationError";
  }
}
