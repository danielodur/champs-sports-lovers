// Helper function to get weather icon
export const getWeatherIcon = (condition: string): string => {
  const iconMap: { [key: string]: string } = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
    Haze: "🌫️",
  };
  return iconMap[condition] || "🌤️";
};
