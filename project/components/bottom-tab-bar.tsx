import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Home, Compass, Newspaper, Trophy, User } from "lucide-react-native";
import { useTheme } from "../hooks/useTheme";

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const BottomTabBar: React.FC<TabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const theme = useTheme();

  const getIcon = (routeName: string, color: string, focused: boolean) => {
    const size = 24;
    const strokeWidth = focused ? 2.5 : 1.8;

    switch (routeName) {
      case "index":
        return <Home size={size} color={color} strokeWidth={strokeWidth} />;
      case "discover":
        return <Compass size={size} color={color} strokeWidth={strokeWidth} />;
      case "news":
        return (
          <Newspaper size={size} color={color} strokeWidth={strokeWidth} />
        );
      case "stats":
        return <Trophy size={size} color={color} strokeWidth={strokeWidth} />;
      case "profile":
        return <User size={size} color={color} strokeWidth={strokeWidth} />;
      default:
        return <Home size={size} color={color} strokeWidth={strokeWidth} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case "index":
        return "Home";
      case "discover":
        return "Discover";
      case "news":
        return "News";
      case "stats":
        return "Stats";
      case "profile":
        return "Profile";
      default:
        return routeName;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <View style={styles.tabContainer}>
        {state.routes.map((route: any, index: number) => {
          // Skip the top-matches route as it should be hidden
          if (route.name === "top-matches") return null;

          const isFocused = state.index === index;
          const isNewsTab = route.name === "news";
          const label = getTabLabel(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          // Color logic
          let iconColor = isFocused
            ? theme.colors.primary
            : theme.colors.textSecondary;
          let labelColor = isFocused
            ? theme.colors.primary
            : theme.colors.textSecondary;

          // Special News tab styling - use contrasting color based on theme
          if (isNewsTab && isFocused) {
            // Use white on dark backgrounds, dark text on light backgrounds
            const contrastColor =
              theme.colors.background === "#FFFFFF" ? "#121212" : "#FFFFFF";
            iconColor = contrastColor;
            labelColor = contrastColor;
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tab}
            >
              {/* Beautiful bump effect for News tab only */}
              {isNewsTab && (
                <>
                  <View
                    style={[
                      styles.newsBackgroundBump,
                      {
                        backgroundColor: isFocused
                          ? theme.colors.primary
                          : "transparent",
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.newsCircle,
                      {
                        backgroundColor: isFocused
                          ? theme.colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    {getIcon(route.name, iconColor, isFocused)}
                  </View>
                </>
              )}

              {/* Regular icons for other tabs */}
              {!isNewsTab && (
                <View style={styles.iconContainer}>
                  {getIcon(route.name, iconColor, isFocused)}
                </View>
              )}

              {/* Labels for all tabs including News */}
              <Text
                style={[
                  styles.label,
                  {
                    color: labelColor,
                    fontWeight: isFocused ? "600" : "500",
                    marginTop: isNewsTab ? 4 : 4,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Clean grey line positioned lower like Chinese app */}
      <View
        style={[styles.bottomLine, { backgroundColor: theme.colors.border }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 4,
    elevation: 0,
    shadowOpacity: 0,
    position: "relative",
  },
  bottomLine: {
    height: 0.8,
    width: "100%",
    opacity: 0.2,
    position: "absolute",
    bottom: Platform.OS === "ios" ? 20 : 10,
    left: 0,
  },
  tabContainer: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 48 : 44,
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 2,
    position: "relative",
    minHeight: 46,
  },
  iconContainer: {
    marginBottom: 2,
  },
  newsBackgroundBump: {
    position: "absolute",
    top: -12,
    width: 48,
    height: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1,
  },
  newsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -2,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    textAlign: "center",
    marginBottom: 2,
  },
});

export default BottomTabBar;
