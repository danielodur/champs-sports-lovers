import { Tabs } from "expo-router";
import { Home, Newspaper, Trophy, User, Compass } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { Platform } from "react-native";
import BottomTabBar from "../../components/bottom-tab-bar";

export default function TabLayout() {
  const theme = useTheme();
  console.log("🚨 TAB LAYOUT RENDERING - This should appear in console!");

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="top-matches"
        options={{
          href: null, // Hide from tab bar
          title: "Top Matches",
        }}
      />
    </Tabs>
  );
}
