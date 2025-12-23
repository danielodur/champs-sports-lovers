import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import TopMatchesScreen from "../matches-football/top-matches";

export default function TopMatchesTabScreen() {
  const theme = useTheme();

  console.log("🎯 TOP MATCHES TAB SCREEN - SafeAreaView rendering");

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
      edges={["top"]}
    >
      <TopMatchesScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
