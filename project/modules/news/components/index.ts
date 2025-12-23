// News Components Index
// This file exports all news-related components for easier imports

// Shared Components
export { default as NewsFilterTab } from "./shared/news-filter-tab";
export { default as NewsNotifications } from "./shared/news-notifications";
export { default as NewsRearrangeFilterTabs } from "./shared/news-rearrange-filter-tabs";
export { default as NewsSeasonsSelector } from "./shared/news-seasons-selector";
export { default as NewsMatchesLeagueRoundSelector } from "./shared/news-matches-league-round-selector";
export { default as NewsTeamMoments } from "./shared/news-team-moments";
// Removed: NewsTeamLatestMoments - file was deleted during cleanup

// Content Components - Sports News
export {
  NewsRecent,
  NewsHot,
  NewsFollowedMatches,
  NewsAllSports,
  NewsFifa,
  NewsAfcon,
  NewsFootball,
  NewsBasketball,
  NewsRugby,
  NewsVideos,
} from "./content/shared/sports-news";
export { NewsUgandaSports } from "./content/shared/team-news/uganda-sports";

// Team-specific Components
export { default as NewsTeamDetails } from "./content/shared/team-details/news-team-details";
export { default as NewsTeamDraft } from "./content/shared/news-team-draft";
export { default as NewsTeamWeekSquad } from "./content/shared/news-team-week-squad";
