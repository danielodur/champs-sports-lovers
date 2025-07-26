import { useState, useEffect } from 'react';
import { favoritesService } from '@/services/favoritesService';

export function useFavorites() {
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Function to refresh favorites count (NON-DESTRUCTIVE)
  const refreshFavoritesCount = async () => {
    try {
      setLoading(true);
      
      // ✅ SAFE: Only get the count, never clear user data
      const count = await favoritesService.getFavoritesCount();
      const previousCount = favoritesCount;
      
      setFavoritesCount(count);
      
      if (previousCount !== count) {
        console.log(`⭐ FAVORITES COUNT UPDATED: ${previousCount} → ${count}`);
      } else {
        console.log(`⭐ Favorites count confirmed: ${count}`);
      }
    } catch (error) {
      console.error('❌ Error refreshing favorites count:', error);
      setFavoritesCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load initial favorites count
  useEffect(() => {
    const initializeFavorites = async () => {
      try {
        console.log('⚡ INITIALIZING FAVORITES...');
        await refreshFavoritesCount();
        console.log('⚡ FAVORITES INITIALIZED SUCCESSFULLY');
      } catch (error) {
        console.error('❌ Error initializing favorites:', error);
        setFavoritesCount(0);
      }
    };
    
    initializeFavorites();
  }, []);

  // Function to add favorite with proper error handling
  const addFavorite = async (match: any) => {
    try {
      // ✅ ENHANCED VALIDATION: Check for valid match data
      if (!match || !match.id || typeof match.id !== 'string' || match.id.trim() === '') {
        console.error('❌ useFavorites: INVALID MATCH for addFavorite:', match);
        return false;
      }

      const homeTeamName = match.home?.name || match.homeTeam;
      const awayTeamName = match.away?.name || match.awayTeam;
      
      if (!homeTeamName || !awayTeamName) {
        console.error('❌ useFavorites: INVALID MATCH DATA - missing team names:', match);
        return false;
      }

      console.log(`➕ ADDING TO FAVORITES: ${homeTeamName} vs ${awayTeamName}`);
      console.log(`   Match ID: ${match.id}`);
      
      // Create a standardized match object for the favorites service
      const standardizedMatch = {
        id: match.id,
        sport: match.sport || 'football',
        league: match.league || 'Unknown League',
        status: match.status || 'upcoming',
        statusText: match.statusText || '',
        startTime: match.startTime || new Date().toISOString(),
        home: {
          name: homeTeamName,
          logo: match.home?.logo || '',
        },
        away: {
          name: awayTeamName, 
          logo: match.away?.logo || '',
        },
        score: match.score || '0-0',
        halfTimeScore: match.halfTimeScore || '0-0',
        viewers: match.viewers || '1', // Show 1 viewer (current user) as fallback
        hasVideo: match.hasVideo || false,
        isFavorite: true,
      };
      
      await favoritesService.addToFavorites(standardizedMatch);
      
      // IMMEDIATE UPDATE: Update count right away
      const newCount = await favoritesService.getFavoritesCount();
      setFavoritesCount(newCount);
      
      console.log('✅ Added to favorites successfully and count updated');
      return true;
    } catch (error) {
      console.error('❌ Error adding favorite:', error);
      await refreshFavoritesCount(); // Refresh on error
      return false;
    }
  };

  // Function to remove favorite with proper error handling
  const removeFavorite = async (matchId: string) => {
    try {
      // ✅ ENHANCED VALIDATION: Check for valid match ID
      if (!matchId || typeof matchId !== 'string' || matchId.trim() === '') {
        console.error('❌ useFavorites: INVALID MATCH ID for removeFavorite:', matchId);
        return false;
      }

      console.log(`🗑️ REMOVING FROM FAVORITES: ${matchId}`);
      await favoritesService.removeFromFavorites(matchId);
      
      // IMMEDIATE UPDATE: Update count right away
      const newCount = await favoritesService.getFavoritesCount();
      setFavoritesCount(newCount);
      
      console.log('✅ Removed from favorites successfully and count updated');
      return true;
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      await refreshFavoritesCount(); // Refresh on error
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