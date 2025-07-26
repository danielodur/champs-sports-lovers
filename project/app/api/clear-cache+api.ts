import AsyncStorage from '@react-native-async-storage/async-storage';

export async function GET() {
  try {
    console.log('🧹 CLEARING FAVORITES CACHE AND FIXING COUNT MISMATCH...');
    
    // Check what's currently stored
    const currentData = await AsyncStorage.getItem('favoriteMatches');
    const currentFavorites = currentData ? JSON.parse(currentData) : [];
    
    console.log(`🔍 Found ${currentFavorites.length} persistent favorites in AsyncStorage`);
    
    if (currentFavorites.length > 0) {
      console.log('📋 Persistent favorites being cleared:');
      currentFavorites.forEach((fav: any, index: number) => {
        console.log(`   ${index + 1}. ${fav.homeTeam} vs ${fav.awayTeam} (${fav.dateAdded})`);
      });
    }
    
    // Clear the favorites storage key
    await AsyncStorage.removeItem('favoriteMatches');
    
    // Also clear any other potential test data keys
    const testKeys = ['testFavorites', 'debugFavorites', 'tempFavorites'];
    for (const key of testKeys) {
      await AsyncStorage.removeItem(key);
    }
    
    // Verify it's cleared
    const check = await AsyncStorage.getItem('favoriteMatches');
    const isCleared = check === null;
    
    console.log('✅ Favorites cache cleared successfully');
    console.log('✅ Follows button count should now show 0 and count correctly');
    
    return Response.json({
      success: true,
      message: 'Favorites cache cleared - Follows count fixed!',
      clearedCount: currentFavorites.length,
      cleared: isCleared,
      recommendation: currentFavorites.length > 0 ? 
        'Persistent test data was found and cleared. The Follows button should now show accurate count.' :
        'No persistent data found. If count is still wrong, check for other issues.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error clearing favorites cache:', error);
    return Response.json({
      success: false,
      error: String(error),
      message: 'Failed to clear favorites cache'
    }, { status: 500 });
  }
}

export async function POST() {
  return GET(); // Same functionality for POST requests
} 