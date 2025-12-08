interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string, maxAge: number): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < maxAge) {
      return entry.data as T;
    }
    return null;
  }

  /**
   * Set data in cache with current timestamp
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Check if a key exists and is still valid
   */
  has(key: string, maxAge: number): boolean {
    const entry = this.cache.get(key);
    return !!(entry && Date.now() - entry.timestamp < maxAge);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const cache = new CacheService();
