import { Stack } from "expo-router";

export default function SearchNewsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="search-all" options={{ headerShown: false }} />
      <Stack.Screen name="search-player" options={{ headerShown: false }} />
      <Stack.Screen name="search-manager" options={{ headerShown: false }} />
      <Stack.Screen name="search-news" options={{ headerShown: false }} />
    </Stack>
  );
}
