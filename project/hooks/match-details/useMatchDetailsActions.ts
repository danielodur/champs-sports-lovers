import { useCallback, useState } from "react";
import { Alert, Share } from "react-native";
import { useRouter } from "expo-router";
import { useFavorites } from "@/hooks/useFavorites";
import type { MatchWithRating } from "@/types/match-details/match-details";

interface UseMatchDetailsActionsProps {
  match: MatchWithRating | null;
  matchId: string | undefined;
}

interface UseMatchDetailsActionsReturn {
  isToggling: boolean;
  handleFavoriteToggle: () => Promise<void>;
  handleShare: () => Promise<void>;
  handleVideo: () => void;
  handleAnimation: () => void;
  handleDeepDataModal: () => void;
}

export function useMatchDetailsActions({
  match,
  matchId,
}: UseMatchDetailsActionsProps): UseMatchDetailsActionsReturn {
  const router = useRouter();
  const { addFavorite, removeFavorite, refreshFavoritesCount } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);

  const handleFavoriteToggle = useCallback(async () => {
    if (!match || isToggling) return;

    setIsToggling(true);
    try {
      const favoriteMatch = {
        id: match.id,
        homeTeam: match.home.name,
        awayTeam: match.away.name,
        homeScore: match.score?.split("-")[0] || "0",
        awayScore: match.score?.split("-")[1] || "0",
        league: match.league,
        startTime: match.startTime || match.time,
        status: match.status,
        homeLogo: match.home.logo || "",
        awayLogo: match.away.logo || "",
      };

      // For now, always add (in a real app, you'd check if it's already favorited)
      await addFavorite(favoriteMatch);
      await refreshFavoritesCount();

      Alert.alert("Success", "Match added to favorites!");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to toggle favorite");
    } finally {
      setIsToggling(false);
    }
  }, [match, isToggling, addFavorite, refreshFavoritesCount]);

  const handleShare = useCallback(async () => {
    if (!match) return;

    try {
      const shareContent = {
        message: `Check out this match: ${match.home.name} vs ${match.away.name} - ${match.score}\n\nLeague: ${match.league}\nStatus: ${match.status}`,
        url: `https://champssportslovers.com/match/${match.id}`, // Your app's deep link
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share match");
    }
  }, [match]);

  const handleVideo = useCallback(() => {
    if (!match) return;

    // Navigate to video/highlights page
    console.log("🎥 Opening video highlights for match:", match.id);

    // You can implement navigation to video highlights here
    // router.push({
    //   pathname: '/match-highlights',
    //   params: { matchId: match.id }
    // });

    Alert.alert("Video", "Video highlights feature coming soon!");
  }, [match]);

  const handleAnimation = useCallback(() => {
    if (!match) return;

    // Navigate to match animation page
    console.log("⚽ Opening match animation for:", match.id);

    // You can implement navigation to match animation here
    // router.push({
    //   pathname: '/match-animation',
    //   params: { matchId: match.id }
    // });

    Alert.alert("Animation", "Match animation feature coming soon!");
  }, [match]);

  const handleDeepDataModal = useCallback(() => {
    console.log("📊 Opening deep data modal for match:", matchId);
    // This would typically set a modal visibility state in the parent component
    // For now, it's just a placeholder
  }, [matchId]);

  return {
    isToggling,
    handleFavoriteToggle,
    handleShare,
    handleVideo,
    handleAnimation,
    handleDeepDataModal,
  };
}
