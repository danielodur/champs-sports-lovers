import { SupabaseClient, User } from "@supabase/supabase-js";
import { Fixture } from "../types/football-fixtures-response";
import supabase from "./supabaseClient";

export interface SupabaseFavoriteMatch {
  id?: number;
  user_id: string;
  fixture_id: number;
  fixture: Fixture;
  created_at: Date;
}

export class FootballFavoritesService {
  private currentUser: User | undefined = undefined;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        this.currentUser = session?.user;
      } else if (event === "SIGNED_OUT") {
        this.currentUser = undefined;
      }
    });

    this.supabase = supabase;
  }

  async addFavoriteMatch(fixture: Fixture) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userData) {
      throw new Error("User not authenticated");
    }

    const { error: insertError } = await supabase
      .from("football_favorite_matches")
      .insert({
        user_id: userData.user?.id,
        fixture: fixture,
        fixture_id: fixture.fixture.id,
        created_at: new Date(),
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return true;
  }

  async removeFavoriteMatch(fixtureId: number) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userData) {
      throw new Error("User not authenticated");
    }

    console.log("Removing favorite match", fixtureId);
    console.log("User ID", userData.user?.id);

    const { error } = await supabase
      .from("football_favorite_matches")
      .delete()
      .eq("fixture_id", fixtureId)
      .eq("user_id", userData.user?.id);

    if (error) {
      console.log("Error removing favorite match", error);
      throw new Error(error.message);
    }

    return true;
  }

  async isFavorite(id: number) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userData) {
      throw new Error("User not authenticated");
    }

    // Find favorite match by fixture_id
    const { data, error } = await supabase
      .from("football_favorite_matches")
      .select("fixture_id")
      .eq("user_id", userData.user?.id)
      .eq("fixture_id", id);

    if (error) {
      console.log("Error checking favorite match", error);
      throw new Error(error.message);
    }

    return data?.[0]?.fixture_id === id;
  }

  async getFavoriteMatches() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userData) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("football_favorite_matches")
      .select("*")
      .eq("user_id", userData.user?.id);

    if (error) {
      console.log("Error getting favorite matches", error);
      throw new Error(error.message);
    }

    return data as SupabaseFavoriteMatch[] | null;
  }
}

const footballFavoritesService = new FootballFavoritesService(supabase);
export default footballFavoritesService;
