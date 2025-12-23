import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import {
  Wind,
  Gauge,
  Droplets,
  MapPin,
  Users,
} from "lucide-react-native";
import openWeatherService, {
  EnhancedWeatherData,
} from "@/services/openWeatherService";
import { getBasketballVenueDisplay } from "@/utils/basketball-arena-helper";

const { width: screenWidth } = Dimensions.get("window");

interface MatchDetailsWeatherProps {
  cityName?: string;  // MUST be from fixture.venue.city (API-Football)
  stadiumName?: string;  // MUST be from fixture.venue.name (API-Football)
  stadiumCapacity?: number;
  matchId?: string;
  sport?: string;
  homeTeamName?: string;
  teamCountry?: string;
  venueCityName?: string;  // ✅ CRITICAL: Actual match city from API-Football fixture
}

// Weather Icon Component
const WeatherIcon: React.FC<{ condition: string }> = ({ condition }) => {
  const getIconForCondition = (condition: string): string => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("rain")) return "🌧️";
    if (lowerCondition.includes("snow")) return "❄️";
    if (lowerCondition.includes("cloud")) return "☁️";
    if (lowerCondition.includes("clear") || lowerCondition.includes("sun"))
      return "☀️";
    if (lowerCondition.includes("storm") || lowerCondition.includes("thunder"))
      return "⛈️";
    if (lowerCondition.includes("mist") || lowerCondition.includes("fog"))
      return "🌫️";
    return "🌤️";
  };

  return <>{getIconForCondition(condition)}</>;
};

export default function MatchDetailsWeather({
  cityName,
  stadiumName,
  stadiumCapacity,
  matchId,
  sport = "football",
  homeTeamName,
  teamCountry,
  venueCityName,  // ✅ CRITICAL: Real match city from fixture data
}: MatchDetailsWeatherProps) {
  const theme = useTheme();
  const [weatherData, setWeatherData] = useState<EnhancedWeatherData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ Get the proper city name for display (especially for basketball)
  const displayCityName = React.useMemo(() => {
    // For basketball, venueCityName might contain team name instead of city
    // Filter out obvious team names (containing "W" suffix like "Japan W", "Canada W")
    if (sport === "basketball") {
      const cityToCheck = venueCityName || cityName || "City";
      
      // If city name matches team name pattern (e.g., "Japan W", "Canada W"), 
      // try to extract just the country/city part
      if (cityToCheck && cityToCheck.includes(" W")) {
        // Remove " W" suffix to get the actual location
        return cityToCheck.replace(/ W$/i, "").trim() || "City";
      }
      
      return cityToCheck;
    }
    
    // Football: use as-is
    return venueCityName || cityName || "City";
  }, [sport, venueCityName, cityName, homeTeamName]);

  // ✅ BASKETBALL: Determine what to display (arena or country)
  const venueDisplayValue = React.useMemo(() => {
    if (sport === "basketball" && homeTeamName) {
      const venueInfo = getBasketballVenueDisplay(
        homeTeamName,
        stadiumName,
        teamCountry
      );
      console.log(`🏀 [Venue] Basketball team "${homeTeamName}" → Display: "${venueInfo.displayValue}"`);
      return venueInfo.displayValue;
    }
    // Football: Show stadium name if available, otherwise just show city
    return stadiumName || (cityName ? `${cityName} Stadium` : "Stadium");
  }, [sport, homeTeamName, stadiumName, teamCountry, cityName]);

  const loadWeatherData = async () => {
    if (!cityName) {
      console.log("🌤️ No city name provided, skipping weather data load");
      setError(null);
      setLoading(false);
      setWeatherData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🌤️ Loading weather data for ${cityName}`);

      const data = await openWeatherService.getEnhancedWeatherForMatch(
        cityName,
        stadiumName,
      );
      console.log(
        `🌤️ Weather data loaded with animationType: ${data?.animationType}`,
      );
      setWeatherData(data);
      setLastUpdated(new Date());
      setError(null); // Clear any previous errors on success
    } catch (err) {
      console.log("Weather data loading failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Only show user-friendly errors, don't break the app
      if (errorMessage.includes("Weather API key not configured")) {
        console.log("⚠️ Weather API key not configured - hiding weather section");
        setError(null); // Don't show error to user, just hide weather
      } else if (errorMessage.includes("timeout")) {
        console.log("⚠️ Weather request timed out - hiding weather section");
        setError(null); // Don't show error to user, just hide weather
      } else if (errorMessage.includes("unavailable")) {
        console.log(`⚠️ Weather data unavailable for ${cityName} - hiding weather section`);
        setError(null); // Don't show error to user, just hide weather
      } else {
        console.log("⚠️ Weather loading failed - hiding weather section");
        setError(null); // Don't show error to user, just hide weather
      }
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
  }, [cityName]);

  // Debug weather animation integration
  useEffect(() => {
    if (weatherData?.animationType) {
      console.log(
        `🌤️ WeatherData loaded - Animation Type: ${weatherData.animationType}`,
      );
      console.log(`🌤️ Weather condition: ${weatherData.condition}`);
      console.log(`🌤️ Weather city: ${weatherData.cityName}`);
    }
  }, [weatherData?.animationType]);

  // Debug animation rendering
  useEffect(() => {
    if (weatherData?.animationType) {
      console.log(
        `🎬 WeatherAnimation rendering with type: ${weatherData.animationType}`,
      );
      console.log(`🎬 Weather data exists:`, !!weatherData);
    }
  }, [weatherData]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        loadWeatherData();
      },
      10 * 60 * 1000,
    ); // 10 minutes

    return () => clearInterval(interval);
  }, [cityName]);

  // Show nothing while loading initially
  if (loading && !weatherData) {
    return null;
  }

  // If no weather data and no error, just hide the component gracefully
  if (!weatherData) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Stadium/Arena Header with City and Spectators */}
      <View style={styles.topBar}>
        <View style={styles.stadiumNameSection}>
          <MapPin size={16} color="#FFFFFF" />
          <Text style={styles.stadiumNameText}>
            {venueDisplayValue}
          </Text>
        </View>
        <View style={styles.rightInfo}>
          <View style={styles.citySection}>
            <MapPin size={14} color="#64B5F6" />
            <Text style={styles.cityText}>
              {displayCityName}
            </Text>
            </View>
                {stadiumCapacity && (
            <View style={styles.spectatorsSection}>
              <Users size={14} color="#64B5F6" />
              <Text style={styles.spectatorsText}>
                {stadiumCapacity.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

      {/* Weather Block - Light Blue Design */}
      <View style={styles.weatherBlock}>
        <View style={styles.weatherRow}>
          {/* Left Side - Temperature and Humidity */}
          <View style={styles.weatherLeft}>
            <View style={styles.tempSection}>
              <Text style={styles.tempIcon}>🌡️</Text>
              <Text style={styles.tempValue}>{weatherData.temperature}</Text>
          </View>
            <View style={styles.conditionSection}>
              <Text style={styles.conditionEmoji}>
                <WeatherIcon condition={weatherData.condition} />
              </Text>
              <Text style={styles.conditionText}>{weatherData.condition}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.weatherDivider} />

          {/* Middle - Humidity and Wind */}
          <View style={styles.weatherMiddle}>
            <View style={styles.weatherItem}>
              <Droplets size={14} color="#4A90E2" />
              <Text style={styles.weatherLabel}>Humidity: {weatherData.humidity}</Text>
            </View>
            <View style={styles.weatherItem}>
              <Wind size={14} color="#4A90E2" />
              <Text style={styles.weatherLabel}>Wind: {weatherData.windSpeed}</Text>
          </View>
          </View>

          {/* Divider */}
          <View style={styles.weatherDivider} />

          {/* Right Side - Pressure and Weather Icon */}
          <View style={styles.weatherRight}>
            <View style={styles.weatherItem}>
              <Gauge size={14} color="#4A90E2" />
              <Text style={styles.weatherLabel}>Pressure: {weatherData.pressure}</Text>
      </View>
            <View style={styles.weatherIconLarge}>
              <Text style={styles.weatherEmojiLarge}>
                <WeatherIcon condition={weatherData.condition} />
          </Text>
        </View>
      </View>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },

  // Top Bar - Stadium, City, Spectators
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  stadiumNameSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  stadiumNameText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  rightInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  citySection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cityText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  spectatorsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spectatorsText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  // Weather Block - Light Blue
  weatherBlock: {
    backgroundColor: "#A8D5F7",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weatherLeft: {
    flex: 1,
    gap: 12,
  },
  tempSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tempIcon: {
    fontSize: 24,
  },
  tempValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2C5F8D",
  },
  conditionSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  conditionEmoji: {
    fontSize: 20,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C5F8D",
  },

  weatherDivider: {
    width: 1,
    height: 60,
    backgroundColor: "rgba(44, 95, 141, 0.2)",
    marginHorizontal: 12,
  },

  weatherMiddle: {
    flex: 1,
    gap: 10,
  },
  weatherItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weatherLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2C5F8D",
  },

  weatherRight: {
    flex: 1,
    gap: 10,
    alignItems: "flex-end",
  },
  weatherIconLarge: {
    marginTop: 4,
  },
  weatherEmojiLarge: {
    fontSize: 36,
  },

  // Loading and Error States
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#A8D5F7",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#2C5F8D",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#A8D5F7",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    color: "#FF6B6B",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
    color: "#FF6B6B",
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

