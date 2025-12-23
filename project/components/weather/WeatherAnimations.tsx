import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import LottieView from "lottie-react-native";

const { height: screenHeight } = Dimensions.get("window");

// Import animation sources directly
const RAIN_ANIMATION = require("@/assets/weather/rain.json");
const SNOW_ANIMATION = require("@/assets/weather/snow.json");
const CLOUDS_ANIMATION = require("@/assets/weather/clouds.json");

interface WeatherAnimationProps {
  type: "rain" | "snow" | "clouds";
  intensity?: "light" | "medium" | "heavy";
  style?: any;
}

// Animation sources mapping
const getAnimationSource = (type: "rain" | "snow" | "clouds") => {
  switch (type) {
    case "rain":
      return RAIN_ANIMATION;
    case "snow":
      return SNOW_ANIMATION;
    case "clouds":
      return CLOUDS_ANIMATION;
    default:
      return null;
  }
};

const WeatherAnimation: React.FC<WeatherAnimationProps> = ({
  type,
  intensity = "medium",
  style,
}) => {
  const [isReady, setIsReady] = useState(false);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const getAnimationSpeed = () => {
    const speeds = {
      light: 0.6,
      medium: 1.0,
      heavy: 1.4,
    };
    return speeds[intensity];
  };

  const getAnimationOpacity = () => {
    const opacities = {
      light: 0.3,
      medium: 0.5,
      heavy: 0.7,
    };
    return opacities[intensity];
  };

  const animationSource = getAnimationSource(type);

  if (!isReady || !animationSource) {
    return null;
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Render Lottie animation */}
      <LottieView
        ref={animationRef}
        source={animationSource}
        autoPlay={true}
        loop={true}
        speed={getAnimationSpeed()}
        style={[
          styles.lottieAnimation,
          {
            opacity: getAnimationOpacity(),
          },
        ]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // Constrain height to upper section only - don't overlap match momentum bars
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

export { WeatherAnimation };
export default WeatherAnimation;
