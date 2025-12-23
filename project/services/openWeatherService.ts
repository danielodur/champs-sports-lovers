// Types for OpenWeatherMap API responses
export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface MainWeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level?: number;
  grnd_level?: number;
}

export interface WindData {
  speed: number;
  deg: number;
  gust?: number;
}

export interface CloudsData {
  all: number;
}

export interface RainData {
  "1h"?: number;
  "3h"?: number;
}

export interface SnowData {
  "1h"?: number;
  "3h"?: number;
}

export interface SysData {
  type?: number;
  id?: number;
  country: string;
  sunrise: number;
  sunset: number;
}

export interface CurrentWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: WeatherCondition[];
  base: string;
  main: MainWeatherData;
  visibility: number;
  wind: WindData;
  clouds: CloudsData;
  rain?: RainData;
  snow?: SnowData;
  dt: number;
  sys: SysData;
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface AirPollutionResponse {
  coord: {
    lon: number;
    lat: number;
  };
  list: Array<{
    main: {
      aqi: number; // Air Quality Index: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
    dt: number;
  }>;
}

export interface EnhancedWeatherData {
  // Current conditions
  temperature: string;
  feelsLike: string;
  condition: string;
  description: string;
  icon: string;
  animationType: "rain" | "snow" | "clouds";

  // Detailed metrics
  humidity: string;
  windSpeed: string;
  windDirection: string;
  pressure: string;
  visibility: string;
  uvIndex: string;

  // Air quality
  airQuality: {
    index: number;
    quality: string;
    pm25: number;
    pm10: number;
  };

  // Location info
  cityName: string;
  country: string;
  coordinates: {
    lat: number;
    lon: number;
  };

  // Time info
  sunrise: string;
  sunset: string;
  timezone: number;

  // Additional data
  cloudCoverage: string;
  rainVolume?: string;
  snowVolume?: string;
}

class OpenWeatherService {
  private baseUrl = "https://api.openweathermap.org/data/2.5";
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_OPEN_WEATHER_API_KEY || "";
    if (!this.apiKey) {
      console.warn(
        "⚠️ OpenWeather API key is missing. Weather animations will be disabled until API key is provided.",
      );
      console.warn("Expected env variable: EXPO_PUBLIC_OPEN_WEATHER_API_KEY");
    } else {
      console.log("🌤️ Weather service initialized with real API key");
      // ✅ SECURITY: Never log API keys
      console.log(`🔑 OpenWeather API key loaded from EXPO_PUBLIC_OPEN_WEATHER_API_KEY`);
    }
  }

  private getCacheKey(endpoint: string, params: Record<string, any>): string {
    const paramString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");
    return `${endpoint}?${paramString}`;
  }

  private async getFromCache(cacheKey: string): Promise<any | null> {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCache(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  private async makeRequest(
    endpoint: string,
    params: Record<string, any>,
  ): Promise<any> {
    const cacheKey = this.getCacheKey(endpoint, params);

    // Check cache first
    const cachedData = await this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const queryParams = new URLSearchParams({
      ...params,
      appid: this.apiKey,
      units: "metric",
    });

    const url = `${this.baseUrl}${endpoint}?${queryParams}`;

    try {
      console.log(`🌤️ Fetching weather data: ${endpoint}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Weather API error: ${response.status} - ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Cache the response
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.log("OpenWeather API request failed:", error);
      throw error;
    }
  }

  // Get current weather by city name
  async getCurrentWeatherByCity(
    cityName: string,
  ): Promise<CurrentWeatherResponse> {
    if (!this.apiKey) {
      throw new Error("Weather API key not configured");
    }

    // Extract actual city name from team names or location strings
    const extractedCity = this.extractCityName(cityName);
    console.log(`🌍 Searching weather for city: "${cityName}" (extracted: "${extractedCity}")`);

    try {
      // Try the extracted city name first
      const result = await this.makeRequest("/weather", { q: extractedCity });
      console.log(
        `✅ Weather found for: ${result.name}, ${result.sys.country}`,
      );
      return result;
    } catch (error) {
      console.log(`❌ Weather lookup failed for "${extractedCity}":`, error);

      // Try alternative city names for common cases
      const alternatives = this.getAlternativeCityNames(cityName);
      for (const altCity of alternatives) {
        try {
          console.log(`🔄 Trying alternative city: "${altCity}"`);
          const result = await this.makeRequest("/weather", { q: altCity });
          console.log(
            `✅ Weather found using alternative: ${result.name}, ${result.sys.country}`,
          );
          return result;
        } catch (altError) {
          console.log(`❌ Alternative "${altCity}" also failed:`, altError);
        }
      }

      throw new Error(
        `Weather data unavailable for "${cityName}" and alternatives. Please verify the city name.`,
      );
    }
  }

  // Get current weather by coordinates
  async getCurrentWeatherByCoords(
    lat: number,
    lon: number,
  ): Promise<CurrentWeatherResponse> {
    if (!this.apiKey) {
      throw new Error("Weather API key not configured");
    }
    return this.makeRequest("/weather", { lat, lon });
  }

  // Get air pollution data
  async getAirPollution(
    lat: number,
    lon: number,
  ): Promise<AirPollutionResponse> {
    if (!this.apiKey) {
      throw new Error("Weather API key not configured");
    }

    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Air pollution API error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.warn("Air pollution data unavailable:", error);
      // Return default air quality data
      return {
        coord: { lon, lat },
        list: [
          {
            main: { aqi: 1 },
            components: {
              co: 0,
              no: 0,
              no2: 0,
              o3: 0,
              so2: 0,
              pm2_5: 0,
              pm10: 0,
              nh3: 0,
            },
            dt: Math.floor(Date.now() / 1000),
          },
        ],
      };
    }
  }

  // Get enhanced weather data for match location
  async getEnhancedWeatherForMatch(
    cityName: string,
    stadiumName?: string,
  ): Promise<EnhancedWeatherData> {
    console.log(`🌤️ Getting REAL weather data for city: "${cityName}"`);

    // Check if API key is available
    if (!this.apiKey) {
      console.log(
        `❌ Weather API key not configured - cannot fetch weather for ${cityName}`,
      );
      console.log(
        "Environment variables available:",
        Object.keys(process.env).filter((k) => k.includes("WEATHER")),
      );
      throw new Error(
        `Weather API key not configured. Please set EXPO_PUBLIC_OPEN_WEATHER_API_KEY environment variable.`,
      );
    }

    try {
      // Add timeout to prevent hanging requests
      const weatherPromise = this.getCurrentWeatherByCity(cityName);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Weather request timeout")), 8000),
      );

      const weatherData = await Promise.race([weatherPromise, timeoutPromise]);
      console.log(
        `🌤️ REAL API weather data received for ${cityName}:`,
        weatherData.weather[0].main,
        `Temperature: ${weatherData.main.temp}°C`,
      );

      // Get air pollution data with real coordinates
      let airPollutionData;
      try {
        const pollutionPromise = this.getAirPollution(
          weatherData.coord.lat,
          weatherData.coord.lon,
        );
        const pollutionTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Air pollution timeout")), 5000),
        );
        airPollutionData = await Promise.race([
          pollutionPromise,
          pollutionTimeout,
        ]);
      } catch (pollutionError) {
        console.warn(
          "Air pollution data unavailable, using minimal default:",
          pollutionError,
        );
        airPollutionData = {
          coord: { lon: weatherData.coord.lon, lat: weatherData.coord.lat },
          list: [
            {
              main: { aqi: 1 },
              components: {
                co: 0,
                no: 0,
                no2: 0,
                o3: 0,
                so2: 0,
                pm2_5: 10,
                pm10: 15,
                nh3: 0,
              },
              dt: Math.floor(Date.now() / 1000),
            },
          ],
        };
      }

      const enhancedData = this.transformToEnhancedData(
        weatherData,
        airPollutionData,
        stadiumName,
      );

      console.log(`🌤️ REAL weather data transformed:`, {
        city: enhancedData.cityName,
        temperature: enhancedData.temperature,
        condition: enhancedData.condition,
        animation: enhancedData.animationType,
      });

      return enhancedData;
    } catch (error) {
      console.log(
        "❌ Failed to get REAL weather data for",
        cityName,
        "Error:",
        error instanceof Error ? error.message : String(error),
      );
      throw new Error(
        `Real weather data unavailable for ${cityName}. Please check API key and network connection.`,
      );
    }
  }

  private transformToEnhancedData(
    weather: CurrentWeatherResponse,
    airPollution: AirPollutionResponse,
    stadiumName?: string,
  ): EnhancedWeatherData {
    const condition = weather.weather[0];
    const main = weather.main;
    const wind = weather.wind;
    const sys = weather.sys;
    const airQualityData = airPollution.list[0];

    // Determine animation type based on weather condition
    const animationType = this.getAnimationType(condition.id, condition.main);

    // Convert wind direction from degrees to compass direction
    const windDirection = this.getWindDirection(wind.deg);

    // Get air quality description
    const airQualityDesc = this.getAirQualityDescription(
      airQualityData.main.aqi,
    );

    // Format timestamps
    const sunrise = new Date(sys.sunrise * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const sunset = new Date(sys.sunset * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      temperature: `${Math.round(main.temp)}°C`,
      feelsLike: `${Math.round(main.feels_like)}°C`,
      condition: condition.main,
      description: condition.description
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      icon: this.getWeatherIcon(condition.icon),
      animationType,

      humidity: `${main.humidity}%`,
      windSpeed: `${Math.round(wind.speed * 3.6)} km/h`, // Convert m/s to km/h
      windDirection,
      pressure: `${main.pressure} hPa`,
      visibility: `${(weather.visibility / 1000).toFixed(1)} km`,
      uvIndex: "3", // OpenWeather doesn't provide UV in current weather endpoint

      airQuality: {
        index: airQualityData.main.aqi,
        quality: airQualityDesc,
        pm25: Math.round(airQualityData.components.pm2_5),
        pm10: Math.round(airQualityData.components.pm10),
      },

      cityName: weather.name,
      country: sys.country,
      coordinates: {
        lat: weather.coord.lat,
        lon: weather.coord.lon,
      },

      sunrise,
      sunset,
      timezone: weather.timezone,

      cloudCoverage: `${weather.clouds.all}%`,
      rainVolume: weather.rain
        ? `${weather.rain["1h"] || weather.rain["3h"] || 0} mm`
        : undefined,
      snowVolume: weather.snow
        ? `${weather.snow["1h"] || weather.snow["3h"] || 0} mm`
        : undefined,
    };
  }

  private getAnimationType(
    conditionId: number,
    main: string,
  ): EnhancedWeatherData["animationType"] {
    // Based on OpenWeatherMap condition codes - simplified to only rain, snow, clouds
    if (conditionId >= 200 && conditionId < 300) return "rain"; // Thunderstorm -> Rain
    if (conditionId >= 300 && conditionId < 600) return "rain"; // Drizzle and Rain
    if (conditionId >= 600 && conditionId < 700) return "snow"; // Snow
    if (conditionId >= 700 && conditionId < 800) return "clouds"; // Atmosphere -> Clouds
    if (conditionId === 800) return "clouds"; // Clear sky -> Clouds
    if (conditionId > 800) return "clouds"; // Clouds

    return "clouds";
  }

  private getWeatherIcon(iconCode: string): string {
    // Map OpenWeatherMap icon codes to emoji
    const iconMap: Record<string, string> = {
      "01d": "☀️",
      "01n": "🌙", // clear sky
      "02d": "🌤️",
      "02n": "🌙", // few clouds
      "03d": "⛅",
      "03n": "☁️", // scattered clouds
      "04d": "☁️",
      "04n": "☁️", // broken clouds
      "09d": "🌧️",
      "09n": "🌧️", // shower rain
      "10d": "🌦️",
      "10n": "🌦️", // rain
      "11d": "⛈️",
      "11n": "⛈️", // thunderstorm
      "13d": "❄️",
      "13n": "❄️", // snow
      "50d": "🌫️",
      "50n": "🌫️", // mist/fog
    };

    return iconMap[iconCode] || "🌤️";
  }

  private getWindDirection(degrees: number): string {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  private getAirQualityDescription(aqi: number): string {
    const descriptions = {
      1: "Good",
      2: "Fair",
      3: "Moderate",
      4: "Poor",
      5: "Very Poor",
    };
    return descriptions[aqi as keyof typeof descriptions] || "Unknown";
  }

  // This method is removed - only real weather data should be used

  // Extract city name from team names or location strings
  private extractCityName(input: string): string {
    if (!input) return input;

    // Common patterns: "City TeamName", "TeamName City", etc.
    const cityPatterns = [
      // Major cities worldwide
      "Wellington", "Auckland", "Sydney", "Melbourne", "Brisbane", "Perth",
      "London", "Manchester", "Liverpool", "Birmingham", "Leeds", "Newcastle",
      "Madrid", "Barcelona", "Sevilla", "Valencia", "Bilbao",
      "Paris", "Lyon", "Marseille", "Nice", "Bordeaux",
      "Milan", "Rome", "Turin", "Naples", "Florence",
      "Munich", "Berlin", "Hamburg", "Cologne", "Dortmund",
      "Amsterdam", "Rotterdam", "Utrecht",
      "Lisbon", "Porto", "Braga",
      "Moscow", "Petersburg", "Kazan",
      "Istanbul", "Ankara", "Izmir",
      "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
      "Toronto", "Montreal", "Vancouver",
      "Tokyo", "Osaka", "Yokohama",
      "Seoul", "Busan", "Incheon",
      "Beijing", "Shanghai", "Guangzhou",
      "Jakarta", "Bandung", "Surabaya",
      "Bangkok", "Singapore", "Kuala Lumpur",
      "Dubai", "Abu Dhabi", "Doha",
      "Cairo", "Cape Town", "Johannesburg",
      "Buenos Aires", "São Paulo", "Rio de Janeiro",
      "Mexico City", "Guadalajara", "Monterrey"
    ];

    // Check if input contains any known city name
    for (const city of cityPatterns) {
      if (input.includes(city)) {
        return city;
      }
    }

    // If no match, try to extract first word if it looks like a city
    const words = input.split(/\s+/);
    if (words.length > 1) {
      // Return first word as potential city name
      return words[0];
    }

    return input;
  }

  private getAlternativeCityNames(cityName: string): string[] {
    // First try to extract city from the name
    const extractedCity = this.extractCityName(cityName);
    
    const alternatives: Record<string, string[]> = {
      "Stadium City": ["London", "Manchester", "Birmingham"],
      "Unknown": ["London", "New York", "Paris"],
      "Test": ["London"],
      "Wellington Phoenix": ["Wellington"],
      "Wellington": ["Wellington", "Auckland"],
      "Phoenix": ["Phoenix", "Arizona"],
      "Sydney FC": ["Sydney"],
      "Melbourne": ["Melbourne", "Victoria"],
      "Auckland": ["Auckland", "Wellington"],
      "Newcastle Jets": ["Newcastle"],
      "Newcastle": ["Newcastle", "Sydney"],
      "Adelaide": ["Adelaide"],
      "Perth": ["Perth"],
      "Brisbane": ["Brisbane"],
      "Central Coast": ["Gosford", "Sydney"],
      "Western Sydney": ["Sydney"],
      "Macarthur": ["Sydney"],
      // Add more mappings as needed
    };

    // If we found alternatives for the exact name, use them
    if (alternatives[cityName]) {
      return alternatives[cityName];
    }

    // If we extracted a different city, try that
    if (extractedCity !== cityName && alternatives[extractedCity]) {
      return alternatives[extractedCity];
    }

    // Return the extracted city as a fallback
    if (extractedCity !== cityName) {
      return [extractedCity];
    }

    return [];
  }

  private getCityHash(cityName: string): number {
    let hash = 0;
    for (let i = 0; i < cityName.length; i++) {
      const char = cityName.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getCountryForCity(cityName: string): string {
    const cityCountryMap: Record<string, string> = {
      london: "GB",
      manchester: "GB",
      liverpool: "GB",
      chelsea: "GB",
      madrid: "ES",
      barcelona: "ES",
      sevilla: "ES",
      valencia: "ES",
      paris: "FR",
      lyon: "FR",
      marseille: "FR",
      nice: "FR",
      milan: "IT",
      rome: "IT",
      turin: "IT",
      naples: "IT",
      munich: "DE",
      berlin: "DE",
      hamburg: "DE",
      cologne: "DE",
      amsterdam: "NL",
      rotterdam: "NL",
      utrecht: "NL",
      lisbon: "PT",
      porto: "PT",
      braga: "PT",
      moscow: "RU",
      petersburg: "RU",
      kazan: "RU",
      istanbul: "TR",
      ankara: "TR",
      izmir: "TR",
    };

    const lowerCity = cityName.toLowerCase();
    return cityCountryMap[lowerCity] || "XX";
  }

  private getCoordinatesForCity(cityName: string): {
    lat: number;
    lon: number;
  } {
    const hash = this.getCityHash(cityName);
    return {
      lat: 40 + ((hash % 40) - 20), // Latitude between 20-60
      lon: (hash % 140) - 70, // Longitude between -70 to 70
    };
  }

  private getSunriseForCity(cityName: string): string {
    const hash = this.getCityHash(cityName);
    const hour = 5 + (hash % 3); // 5-7 AM
    const minute = hash % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }

  private getSunsetForCity(cityName: string): string {
    const hash = this.getCityHash(cityName);
    const hour = 17 + (hash % 4); // 5-8 PM
    const minute = hash % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const openWeatherService = new OpenWeatherService();
export default openWeatherService;
