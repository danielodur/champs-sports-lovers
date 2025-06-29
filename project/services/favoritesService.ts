import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match } from '@/types/match';

const FAVORITES_STORAGE_KEY = 'favoriteMatches';

interface FavoriteMatch {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  status: 'live' | 'finished' | 'upcoming';
  dateAdded: string;
}

class FavoritesService {
  // Add a match to favorites
  async addToFavorites(match: Match): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      
      // Check if already exists
      const exists = favorites.some(fav => fav.id === match.id);
      if (exists) {
        console.log('✅ Match already in favorites:', match.id);
        return;
      }
      
      const favoriteMatch: FavoriteMatch = {
        id: match.id,
        sport: match.sport,
        homeTeam: match.home.name,
        awayTeam: match.away.name,
        league: match.league,
        startTime: match.startTime,
        status: match.status,
        dateAdded: new Date().toISOString(),
      };
      
      const updatedFavorites = [...favorites, favoriteMatch];
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
      
      console.log('⭐ Added to favorites:', `${match.home.name} vs ${match.away.name}`);
    } catch (error) {
      console.error('❌ Error adding to favorites:', error);
    }
  }
  
  // Remove a match from favorites
  async removeFromFavorites(matchId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(fav => fav.id !== matchId);
      
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
      
      console.log('🗑️ Removed from favorites:', matchId);
    } catch (error) {
      console.error('❌ Error removing from favorites:', error);
    }
  }
  
  // Get all favorite matches
  async getFavorites(): Promise<FavoriteMatch[]> {
    try {
      const favoritesData = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      return favoritesData ? JSON.parse(favoritesData) : [];
    } catch (error) {
      console.error('❌ Error getting favorites:', error);
      return [];
    }
  }
  
  // Check if a match is favorited
  async isFavorite(matchId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(fav => fav.id === matchId);
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
      return false;
    }
  }
  
  // Get favorite match IDs
  async getFavoriteIds(): Promise<string[]> {
    try {
      const favorites = await this.getFavorites();
      return favorites.map(fav => fav.id);
    } catch (error) {
      console.error('❌ Error getting favorite IDs:', error);
      return [];
    }
  }
  
  // Clear all favorites
  async clearAllFavorites(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
      console.log('🗑️ Cleared all favorites');
    } catch (error) {
      console.error('❌ Error clearing favorites:', error);
    }
  }
  
  // Get favorites count
  async getFavoritesCount(): Promise<number> {
    try {
      const favorites = await this.getFavorites();
      return favorites.length;
    } catch (error) {
      console.error('❌ Error getting favorites count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const favoritesService = new FavoritesService();
export type { FavoriteMatch }; 