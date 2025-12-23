// Export all match-related components
export { default as MatchDetailsView } from "./MatchDetailsView";
export { default as MatchList } from "./match-list";

// Export Panel Components
export {
  AllMatches,
  LiveMatches,
  FixturesMatches,
  FollowedMatches,
} from "./panel";

// Export Deep Data Modal components
export { default as MatchDetailsDeepDataModal } from "./panel/matches-screens/match-details/deep-data-modal";
export { default as MatchDetailsDeepDataIntegration } from "./panel/matches-screens/match-details/deep-data-integration";

// Export Social Service
export { default as matchDetailsSocialService } from "../services/match-details-social-service";
export type {
  MatchSocialPost,
  MatchComment,
  PostReaction,
  SocialPostFilter,
  MatchSocialStats,
  NotificationPreferences,
} from "../services/match-details-social-service";

// Export Cards components
export { MatchCards } from "./Cards";
export type { CardData } from "./Cards";
