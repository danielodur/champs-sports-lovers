/**
 * Followers Service
 *
 * Manages the count of users following each match.
 * Currently returns 1 (just the current user) but can be expanded
 * to integrate with real-time user tracking or database.
 */

interface MatchFollowers {
  matchId: number;
  count: number;
  lastUpdated: Date;
}

class FollowersService {
  private followersCache: Map<number, MatchFollowers> = new Map();
  private readonly DEFAULT_FOLLOWERS_COUNT = 1; // Currently just the user

  /**
   * Get the number of followers for a specific match
   * @param matchId - The ID of the match
   * @returns The number of followers for the match
   */
  getFollowersCount(matchId: number): number {
    const cached = this.followersCache.get(matchId);

    if (cached) {
      return cached.count;
    }

    // For now, return default count (1 - just the current user)
    // In the future, this could fetch from an API or database
    return this.DEFAULT_FOLLOWERS_COUNT;
  }

  /**
   * Update the followers count for a match
   * @param matchId - The ID of the match
   * @param count - The new followers count
   */
  updateFollowersCount(matchId: number, count: number): void {
    this.followersCache.set(matchId, {
      matchId,
      count,
      lastUpdated: new Date(),
    });
  }

  /**
   * Get formatted followers count for display
   * @param matchId - The ID of the match
   * @returns Formatted string for display (e.g., "1", "1.2K", "2.5M")
   */
  getFormattedFollowersCount(matchId: number): string {
    const count = this.getFollowersCount(matchId);

    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return `${(count / 1000000).toFixed(1)}M`;
    }
  }

  /**
   * Clear the followers cache
   */
  clearCache(): void {
    this.followersCache.clear();
  }

  /**
   * Get all cached followers data (for debugging)
   */
  getAllFollowers(): MatchFollowers[] {
    return Array.from(this.followersCache.values());
  }

  /**
   * Simulate real-time followers count updates
   * In a real app, this would be connected to websockets or real-time database
   * @param matchId - The ID of the match
   */
  simulateFollowersUpdate(matchId: number): void {
    const currentCount = this.getFollowersCount(matchId);

    // Randomly add or remove 1-3 followers (for simulation)
    const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
    const newCount = Math.max(1, currentCount + change); // Ensure minimum of 1

    this.updateFollowersCount(matchId, newCount);
  }

  /**
   * Batch update followers for multiple matches
   * @param updates - Array of match ID and count pairs
   */
  batchUpdateFollowers(updates: { matchId: number; count: number }[]): void {
    updates.forEach(({ matchId, count }) => {
      this.updateFollowersCount(matchId, count);
    });
  }
}

// Export a singleton instance
export const followersService = new FollowersService();
export default followersService;
