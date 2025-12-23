import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface WeatherAnimationFallbackProps {
  type: "rain" | "snow" | "clouds";
  intensity?: "light" | "medium" | "heavy";
  style?: any;
}

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  size: number;
  speed: number;
}

// Pure React Native Weather Animation (No Lottie dependency)
export const WeatherAnimationFallback: React.FC<
  WeatherAnimationFallbackProps
> = ({ type, intensity = "medium", style }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const getParticleCount = () => {
    const counts = {
      light: { rain: 20, snow: 15, clouds: 8 },
      medium: { rain: 35, snow: 25, clouds: 12 },
      heavy: { rain: 50, snow: 40, clouds: 18 },
    };
    return counts[intensity][type];
  };

  const getBaseSpeed = () => {
    const speeds = {
      light: { rain: 3, snow: 1, clouds: 0.5 },
      medium: { rain: 5, snow: 2, clouds: 1 },
      heavy: { rain: 8, snow: 3, clouds: 1.5 },
    };
    return speeds[intensity][type];
  };

  useEffect(() => {
    console.log(
      `🌦️ Creating fallback animation: ${type} (${intensity} intensity)`,
    );

    const particleCount = getParticleCount();
    const baseSpeed = getBaseSpeed();

    const newParticles: Particle[] = Array.from(
      { length: particleCount },
      (_, i) => ({
        id: i,
        x: new Animated.Value(Math.random() * screenWidth),
        y: new Animated.Value(-Math.random() * 500),
        opacity: new Animated.Value(0.4 + Math.random() * 0.6),
        size: type === "snow" ? 4 + Math.random() * 4 : 2 + Math.random() * 2,
        speed: baseSpeed + Math.random() * 2,
      }),
    );

    setParticles(newParticles);

    // Animate particles
    const animations = newParticles.map((particle) => {
      const animateParticle = () => {
        // Reset position when particle goes off screen
        particle.y.addListener(({ value }) => {
          if (value > screenHeight + 50) {
            particle.y.setValue(-50);
            particle.x.setValue(Math.random() * screenWidth);
          }
        });

        // Continuous falling animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(particle.y, {
              toValue: screenHeight + 50,
              duration: (screenHeight / particle.speed) * 100,
              useNativeDriver: false,
            }),
            Animated.timing(particle.y, {
              toValue: -50,
              duration: 0,
              useNativeDriver: false,
            }),
          ]),
        ).start();

        // Add horizontal drift for snow and light sway
        if (type === "snow" || type === "clouds") {
          Animated.loop(
            Animated.sequence([
              Animated.timing(particle.x, {
                toValue: Math.random() * screenWidth,
                duration: 8000 + Math.random() * 4000,
                useNativeDriver: false,
              }),
              Animated.timing(particle.x, {
                toValue: Math.random() * screenWidth,
                duration: 8000 + Math.random() * 4000,
                useNativeDriver: false,
              }),
            ]),
          ).start();
        }
      };

      return animateParticle;
    });

    animations.forEach((animate) => animate());

    return () => {
      newParticles.forEach((particle) => {
        particle.x.removeAllListeners();
        particle.y.removeAllListeners();
        particle.opacity.removeAllListeners();
      });
    };
  }, [type, intensity]);

  const renderRainParticle = (particle: Particle) => (
    <Animated.View
      key={particle.id}
      style={[
        styles.rainDrop,
        {
          left: particle.x,
          top: particle.y,
          opacity: particle.opacity,
          width: particle.size,
          height: particle.size * 8,
        },
      ]}
    />
  );

  const renderSnowParticle = (particle: Particle) => (
    <Animated.View
      key={particle.id}
      style={[
        styles.snowFlake,
        {
          left: particle.x,
          top: particle.y,
          opacity: particle.opacity,
          width: particle.size,
          height: particle.size,
        },
      ]}
    />
  );

  const renderCloudParticle = (particle: Particle) => (
    <Animated.View
      key={particle.id}
      style={[
        styles.cloudPuff,
        {
          left: particle.x,
          top: particle.y,
          opacity: particle.opacity,
          width: particle.size * 6,
          height: particle.size * 3,
        },
      ]}
    />
  );

  const renderParticles = () => {
    switch (type) {
      case "rain":
        return particles.map(renderRainParticle);
      case "snow":
        return particles.map(renderSnowParticle);
      case "clouds":
        return particles.map(renderCloudParticle);
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Weather Background Effect */}
      <LinearGradient
        colors={getBackgroundGradient() as any}
        locations={[0, 0.7, 1]}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />

      {/* Animated Particles */}
      <View style={styles.particleContainer}>{renderParticles()}</View>

      {/* Fade Out Effect */}
      <LinearGradient
        colors={
          [
            "transparent",
            "rgba(255,255,255,0.1)",
            "rgba(255,255,255,0.6)",
            "rgba(255,255,255,1)",
          ] as any
        }
        locations={[0, 0.4, 0.8, 1]}
        style={styles.fadeOverlay}
        pointerEvents="none"
      />

      {/* Debug Info */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Fallback: {type} ({intensity})
          </Text>
          <Text style={styles.debugSubText}>{particles.length} particles</Text>
        </View>
      )}
    </View>
  );

  function getBackgroundGradient(): string[] {
    switch (type) {
      case "rain":
        return [
          "rgba(100, 181, 246, 0.05)",
          "rgba(100, 181, 246, 0.15)",
          "rgba(100, 181, 246, 0.25)",
        ];
      case "snow":
        return [
          "rgba(255, 255, 255, 0.05)",
          "rgba(255, 255, 255, 0.15)",
          "rgba(255, 255, 255, 0.25)",
        ];
      case "clouds":
        return [
          "rgba(224, 224, 224, 0.05)",
          "rgba(224, 224, 224, 0.15)",
          "rgba(224, 224, 224, 0.25)",
        ];
      default:
        return ["transparent", "transparent", "transparent"];
    }
  }
};

// Enhanced weather animation with wind effect
export const EnhancedWeatherAnimationFallback: React.FC<
  WeatherAnimationFallbackProps
> = ({ type, intensity = "medium", style }) => {
  const windValue = new Animated.Value(0);

  useEffect(() => {
    // Create wind effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(windValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(windValue, {
          toValue: -1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(windValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  const windTransform = windValue.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-10, 0, 10],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX: windTransform }],
        },
      ]}
    >
      <WeatherAnimationFallback
        type={type}
        intensity={intensity}
        style={style}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.45,
    zIndex: 30,
    overflow: "hidden",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rainDrop: {
    position: "absolute",
    backgroundColor: "#64B5F6",
    borderRadius: 1,
    shadowColor: "#1976D2",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  snowFlake: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    ...Platform.select({
      android: {
        elevation: 3,
      },
    }),
  },
  cloudPuff: {
    position: "absolute",
    backgroundColor: "#E0E0E0",
    borderRadius: 20,
    opacity: 0.4,
    shadowColor: "#BDBDBD",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  fadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  debugInfo: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 100,
  },
  debugText: {
    color: "#00FF00",
    fontSize: 12,
    fontWeight: "bold",
  },
  debugSubText: {
    color: "#CCCCCC",
    fontSize: 10,
  },
});

export default WeatherAnimationFallback;
