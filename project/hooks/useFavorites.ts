import { useState, useEffect } from 'react';
import { favoritesService } from '@/services/favoritesService';

export function useFavorites() {
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Function to refresh favorites count
  const refreshFavoritesCount = async () => {
    try {
      setLoading(true);
      const count = await favoritesService.getFavoritesCount();
      setFavoritesCount(count);
      console.log('⭐ Updated favorites count:', count);
    } catch (error) {
      console.error('❌ Error refreshing favorites count:', error);
      setFavoritesCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load initial favorites count
  useEffect(() => {
    refreshFavoritesCount();
  }, []);

  // Function to add favorite and update count
  const addFavorite = async (match: any) => {
    try {
      await favoritesService.addToFavorites(match);
      await refreshFavoritesCount(); // Update count
      return true;
    } catch (error) {
      console.error('❌ Error adding favorite:', error);
      return false;
    }
  };

  // Function to remove favorite and update count
  const removeFavorite = async (matchId: string) => {
    try {
      await favoritesService.removeFromFavorites(matchId);
      await refreshFavoritesCount(); // Update count
      return true;
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      return false;
    }
  };

  // Function to check if match is favorite
  const isFavorite = async (matchId: string): Promise<boolean> => {
    try {
      return await favoritesService.isFavorite(matchId);
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
      return false;
    }
  };

  return {
    favoritesCount,
    loading,
    refreshFavoritesCount,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
} 