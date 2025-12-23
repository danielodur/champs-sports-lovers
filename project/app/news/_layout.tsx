import { Stack } from "expo-router";

export default function NewsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="news-detail" options={{ headerShown: false }} />
      <Stack.Screen name="news-league-table-standings" options={{ headerShown: false }} />
      <Stack.Screen name="news-lower-league-table-standing" options={{ headerShown: false }} />
      <Stack.Screen name="news-team-fixtures" options={{ headerShown: false }} />
      <Stack.Screen name="news-team-replays" options={{ headerShown: false }} />
      <Stack.Screen name="news-team-week-squad" options={{ headerShown: false }} />
      <Stack.Screen name="news-ug-fixtures" options={{ headerShown: false }} />
      <Stack.Screen name="news-ug-sports-rewards" options={{ headerShown: false }} />
      {/* Search news routes - nested routes are handled by search-news/_layout.tsx */}
      <Stack.Screen 
        name="search-news" 
        options={{ headerShown: false }}
        getId={({ params }) => params?.query ? `search-news-${params.query}` : undefined}
      />
    </Stack>
  );
}
