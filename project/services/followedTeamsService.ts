import { supabase } from "./supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FOLLOWED_TEAMS_STORAGE_KEY = "followedTeams";

export interface FollowedTeam {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  sport: string;
  league?: string;
  dateFollowed: string;
}

interface SupabaseFollowedTeam {
  id?: string;
  user_id: string;
  team_id: string;
  team_name: string;
  team_logo?: string;
  sport: string;
  league?: string;
  date_followed?: string;
}

class FollowedTeamsService {
  private currentUserId: string | null = null;

  /**
   * Set current user ID
   */
  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
    console.log("👤 FOLLOWED TEAMS SERVICE: User set to:", userId || "none");
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.log("⚠️ FOLLOWED TEAMS SERVICE: No authenticated user");
        return null;
      }

      return user.id;
    } catch (error) {
      console.error("❌ FOLLOWED TEAMS SERVICE: Error getting user:", error);
      return null;
    }
  }

  /**
   * Follow a team
   */
  async followTeam(team: Omit<FollowedTeam, "dateFollowed">): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();

      if (userId) {
        // Authenticated user: Use Supabase
        const { error } = await supabase.from("followed_teams").insert({
          user_id: userId,
          team_id: team.teamId,
          team_name: team.teamName,
          team_logo: team.teamLogo,
          sport: team.sport,
          league: team.league,
          date_followed: new Date().toISOString(),
        });

        if (error) {
          console.error("❌ Error following team in Supabase:", error);
          // Fallback to AsyncStorage
          return this.followTeamInAsyncStorage(team);
        }

        console.log("✅ Team followed in Supabase:", team.teamName);
        return true;
      } else {
        // Guest user: Use AsyncStorage
        return this.followTeamInAsyncStorage(team);
      }
    } catch (error) {
      console.error("❌ Error following team:", error);
      return this.followTeamInAsyncStorage(team);
    }
  }

  /**
   * Unfollow a team
   */
  async unfollowTeam(teamId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();

      if (userId) {
        // Authenticated user: Use Supabase
        const { error } = await supabase
          .from("followed_teams")
          .delete()
          .eq("user_id", userId)
          .eq("team_id", teamId);

        if (error) {
          console.error("❌ Error unfollowing team in Supabase:", error);
          // Fallback to AsyncStorage
          return this.unfollowTeamInAsyncStorage(teamId);
        }

        console.log("✅ Team unfollowed in Supabase:", teamId);
        return true;
      } else {
        // Guest user: Use AsyncStorage
        return this.unfollowTeamInAsyncStorage(teamId);
      }
    } catch (error) {
      console.error("❌ Error unfollowing team:", error);
      return this.unfollowTeamInAsyncStorage(teamId);
    }
  }

  /**
   * Check if a team is followed
   */
  async isTeamFollowed(teamId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();

      if (userId) {
        // Authenticated user: Check Supabase
        const { data, error } = await supabase
          .from("followed_teams")
          .select("team_id")
          .eq("user_id", userId)
          .eq("team_id", teamId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "not found" error
          console.error("❌ Error checking if team is followed:", error);
          return this.isTeamFollowedInAsyncStorage(teamId);
        }

        return !!data;
      } else {
        // Guest user: Check AsyncStorage
        return this.isTeamFollowedInAsyncStorage(teamId);
      }
    } catch (error) {
      console.error("❌ Error checking if team is followed:", error);
      return this.isTeamFollowedInAsyncStorage(teamId);
    }
  }

  /**
   * Get all followed teams
   */
  async getFollowedTeams(): Promise<FollowedTeam[]> {
    try {
      const userId = await this.getCurrentUserId();

      if (userId) {
        // Authenticated user: Get from Supabase
        const { data, error } = await supabase
          .from("followed_teams")
          .select("*")
          .eq("user_id", userId)
          .order("date_followed", { ascending: false });

        if (error) {
          console.error("❌ Error getting followed teams from Supabase:", error);
          return this.getFollowedTeamsFromAsyncStorage();
        }

        const teams: FollowedTeam[] = (data || []).map(
          (item: SupabaseFollowedTeam) => ({
            teamId: item.team_id,
            teamName: item.team_name,
            teamLogo: item.team_logo,
            sport: item.sport,
            league: item.league,
            dateFollowed: item.date_followed || new Date().toISOString(),
          })
        );

        console.log(`📊 Retrieved ${teams.length} followed teams from Supabase`);
        return teams;
      } else {
        // Guest user: Get from AsyncStorage
        return this.getFollowedTeamsFromAsyncStorage();
      }
    } catch (error) {
      console.error("❌ Error getting followed teams:", error);
      return this.getFollowedTeamsFromAsyncStorage();
    }
  }

  /**
   * Get followed teams count
   */
  async getFollowedTeamsCount(): Promise<number> {
    const teams = await this.getFollowedTeams();
    return teams.length;
  }

  // ===== ASYNC STORAGE FALLBACK METHODS =====

  private async followTeamInAsyncStorage(
    team: Omit<FollowedTeam, "dateFollowed">
  ): Promise<boolean> {
    try {
      const teams = await this.getFollowedTeamsFromAsyncStorage();
      const newTeam: FollowedTeam = {
        ...team,
        dateFollowed: new Date().toISOString(),
      };

      // Check if team is already followed
      const existingIndex = teams.findIndex((t) => t.teamId === team.teamId);
      if (existingIndex === -1) {
        teams.push(newTeam);
        await AsyncStorage.setItem(
          FOLLOWED_TEAMS_STORAGE_KEY,
          JSON.stringify(teams)
        );
        console.log("✅ Team followed in AsyncStorage:", team.teamName);
      }

      return true;
    } catch (error) {
      console.error("❌ Error following team in AsyncStorage:", error);
      return false;
    }
  }

  private async unfollowTeamInAsyncStorage(teamId: string): Promise<boolean> {
    try {
      const teams = await this.getFollowedTeamsFromAsyncStorage();
      const filteredTeams = teams.filter((t) => t.teamId !== teamId);

      await AsyncStorage.setItem(
        FOLLOWED_TEAMS_STORAGE_KEY,
        JSON.stringify(filteredTeams)
      );
      console.log("✅ Team unfollowed in AsyncStorage:", teamId);

      return true;
    } catch (error) {
      console.error("❌ Error unfollowing team in AsyncStorage:", error);
      return false;
    }
  }

  private async isTeamFollowedInAsyncStorage(teamId: string): Promise<boolean> {
    try {
      const teams = await this.getFollowedTeamsFromAsyncStorage();
      return teams.some((t) => t.teamId === teamId);
    } catch (error) {
      console.error("❌ Error checking team in AsyncStorage:", error);
      return false;
    }
  }

  private async getFollowedTeamsFromAsyncStorage(): Promise<FollowedTeam[]> {
    try {
      const stored = await AsyncStorage.getItem(FOLLOWED_TEAMS_STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const teams = JSON.parse(stored) as FollowedTeam[];
      console.log(`📊 Retrieved ${teams.length} followed teams from AsyncStorage`);
      return teams;
    } catch (error) {
      console.error("❌ Error getting teams from AsyncStorage:", error);
      return [];
    }
  }
}

// Export singleton instance
export const followedTeamsService = new FollowedTeamsService();
export default followedTeamsService;

