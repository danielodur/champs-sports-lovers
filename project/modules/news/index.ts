// News Module Index
// This file exports all news-related functionality for easy access from other parts of the app

// Types
export * from "./types";

// Services
export { newsService } from "./services/newsService";

// Components
export * from "./components";

// Screens (for routing purposes)
export { default as NewsScreen } from "./screens/news";
export { default as NewsDetailScreen } from "./screens/news-detail";
export { default as NewsTeamFixturesScreen } from "./screens/news-team-fixtures";
export { default as NewsUgSportsScreen } from "./screens/news-ug-sports";

// Assets paths (for easy reference)
export const NEWS_ASSETS = {
  images: {
    awards: require("./assets/images/awards.png"),
    database: require("./assets/images/database.png"),
    fixtures: require("./assets/images/fixtures.png"),
    replays: require("./assets/images/replays.png"),
    table: require("./assets/images/table.png"),
  },
};
