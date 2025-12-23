import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";

const { height: screenHeight } = Dimensions.get("window");

interface WeatherAnimationWrapperProps {
  type: "rain" | "snow" | "clouds";
  intensity?: "light" | "medium" | "heavy";
  style?: any;
}

interface LottieComponentState {
  component: React.ComponentType<any> | null;
  error: string | null;
  loading: boolean;
}

// Lottie animation wrapper with proper bounds and error handling
const LottieAnimation: React.FC<WeatherAnimationWrapperProps> = ({
  type,
  intensity = "medium",
  style,
}) => {
  const [lottieState, setLottieState] = useState<LottieComponentState>({
    component: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const loadLottie = async () => {
      try {
        const lottieModule = await Promise.race([
          import("lottie-react-native"),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Lottie load timeout")), 3000),
          ),
        ]);

        if (!isMounted) return;

        const LottieView = lottieModule.default;
        if (!LottieView) {
          throw new Error("LottieView not found in module");
        }

        setLottieState({
          component: LottieView,
          error: null,
          loading: false,
        });
      } catch (error) {
        if (!isMounted) return;

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.warn(`Lottie failed to load for ${type}: ${errorMessage}`);

        setLottieState({
          component: null,
          error: errorMessage,
          loading: false,
        });
      }
    };

    loadLottie();

    return () => {
      isMounted = false;
    };
  }, [type]);

  const getAnimationSource = useCallback(() => {
    try {
      const sources = {
        rain: require("@/assets/weather/rain.json"),
        snow: require("@/assets/weather/snow.json"),
        clouds: require("@/assets/weather/clouds.json"),
      };
      return sources[type];
    } catch (error) {
      console.warn(`Animation source not found for ${type}:`, error);
      return null;
    }
  }, [type]);

  const getAnimationSpeed = useCallback(() => {
    const speeds = { light: 0.6, medium: 1.0, heavy: 1.4 };
    return speeds[intensity];
  }, [intensity]);

  const getAnimationOpacity = useCallback(() => {
    const opacities = { light: 0.3, medium: 0.5, heavy: 0.7 };
    return opacities[intensity];
  }, [intensity]);

  // Show nothing if loading, error, or no component (Lottie requires dev build)
  if (lottieState.loading || lottieState.error || !lottieState.component) {
    return null;
  }

  const LottieView = lottieState.component;
  const animationSource = getAnimationSource();

  if (!animationSource) {
    return null;
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Lottie Animation */}
      <LottieView
        source={animationSource}
        autoPlay={true}
        loop={true}
        speed={getAnimationSpeed()}
        style={[styles.lottieAnimation, { opacity: getAnimationOpacity() }]}
        resizeMode="cover"
        onAnimationFailure={(error: any) => {
          console.warn(`Lottie animation runtime error for ${type}:`, error);
        }}
      />
    </View>
  );
};

// Main wrapper component - Lottie only
export const WeatherAnimationWrapper: React.FC<WeatherAnimationWrapperProps> = (
  props,
) => {
  return <LottieAnimation {...props} />;
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // CRITICAL: Constrain height to upper section only - don't overlap match momentum bars
    // Based on screenshots, weather should only cover team info area, not match statistics
    height: Math.min(screenHeight * 0.28, 260),
    zIndex: 30,
    overflow: "hidden",
    pointerEvents: "none",
  },
  lottieAnimation: {
    width: "100%",
    height: "100%",
  },
});

export default WeatherAnimationWrapper;
