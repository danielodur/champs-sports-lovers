import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

/**
 * 🚀 Advanced Caching Service
 * Provides intelligent caching for API responses, user data, and app state
 */
class CacheService {
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes default
    maxSize: 50, // Maximum number of cached items
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
  };

  private cachePrefix = '@sports_cache:';
  private cacheKeys: Set<string> = new Set();

  constructor() {
    this.initializeCache();
    this.startCleanupInterval();
  }

  /**
   * Initialize cache and load existing keys
   */
  private async initializeCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      this.cacheKeys = new Set(cacheKeys.map(key => key.replace(this.cachePrefix, '')));
      console.log('🚀 Cache initialized with', this.cacheKeys.size, 'items');
    } catch (error) {
      console.error('❌ Cache initialization error:', error);
    }
  }

  /**
   * Set cache item with TTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.cachePrefix + key;
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      this.cacheKeys.add(key);

      // Enforce max size
      if (this.cacheKeys.size > this.config.maxSize) {
        await this.cleanupOldest();
      }

      console.log('💾 Cache set:', key);
    } catch (error) {
      console.error('❌ Cache set error:', error);
    }
  }

  /**
   * Get cache item if not expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.cachePrefix + key;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if expired
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        await this.delete(key);
        return null;
      }

      console.log('📖 Cache hit:', key);
      return cacheItem.data;
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache item
   */
  async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.cachePrefix + key;
      await AsyncStorage.removeItem(cacheKey);
      this.cacheKeys.delete(key);
      console.log('🗑️ Cache deleted:', key);
    } catch (error) {
      console.error('❌ Cache delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
      this.cacheKeys.clear();
      console.log('🧹 Cache cleared');
    } catch (error) {
      console.error('❌ Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    size: number;
    keys: string[];
    totalSize: number;
  }> {
    try {
      const keys = Array.from(this.cacheKeys);
      let totalSize = 0;

      for (const key of keys) {
        const cacheKey = this.cachePrefix + key;
        const item = await AsyncStorage.getItem(cacheKey);
        if (item) {
          totalSize += item.length;
        }
      }

      return {
        size: this.cacheKeys.size,
        keys,
        totalSize,
      };
    } catch (error) {
      console.error('❌ Cache stats error:', error);
      return { size: 0, keys: [], totalSize: 0 };
    }
  }

  /**
   * Cleanup expired items
   */
  private async cleanupExpired(): Promise<void> {
    try {
      const keys = Array.from(this.cacheKeys);
      const expiredKeys: string[] = [];

      for (const key of keys) {
        const cacheKey = this.cachePrefix + key;
        const cached = await AsyncStorage.getItem(cacheKey);

        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);
          const now = Date.now();

          if (now - cacheItem.timestamp > cacheItem.ttl) {
            expiredKeys.push(key);
          }
        }
      }

      // Remove expired items
      for (const key of expiredKeys) {
        await this.delete(key);
      }

      if (expiredKeys.length > 0) {
        console.log('🧹 Cleaned up', expiredKeys.length, 'expired cache items');
      }
    } catch (error) {
      console.error('❌ Cache cleanup error:', error);
    }
  }

  /**
   * Remove oldest items when cache is full
   */
  private async cleanupOldest(): Promise<void> {
    try {
      const keys = Array.from(this.cacheKeys);
      const items: { key: string; timestamp: number }[] = [];

      // Get timestamps for all items
      for (const key of keys) {
        const cacheKey = this.cachePrefix + key;
        const cached = await AsyncStorage.getItem(cacheKey);

        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);
          items.push({ key, timestamp: cacheItem.timestamp });
        }
      }

      // Sort by timestamp and remove oldest
      items.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = items.slice(0, Math.floor(this.config.maxSize * 0.2)); // Remove 20% of oldest

      for (const item of toRemove) {
        await this.delete(item.key);
      }

      console.log('🧹 Removed', toRemove.length, 'oldest cache items');
    } catch (error) {
      console.error('❌ Cache cleanup oldest error:', error);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  /**
   * Cache with automatic refresh
   */
  async getWithRefresh<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch and cache
    try {
      const data = await fetchFunction();
      await this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error('❌ Cache refresh error:', error);
      throw error;
    }
  }

  /**
   * Preload cache for better performance
   */
  async preload<T>(key: string, fetchFunction: () => Promise<T>, ttl?: number): Promise<void> {
    try {
      const data = await fetchFunction();
      await this.set(key, data, ttl);
      console.log('⚡ Cache preloaded:', key);
    } catch (error) {
      console.error('❌ Cache preload error:', error);
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService; 