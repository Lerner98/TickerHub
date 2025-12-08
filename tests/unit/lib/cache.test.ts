/**
 * Cache Service Unit Tests
 *
 * Tests the in-memory cache functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cache } from '../../../server/lib/cache';

describe('CacheService', () => {
  beforeEach(() => {
    // Clear cache before each test
    cache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('get/set', () => {
    it('should set and get cached data', () => {
      cache.set('test-key', { value: 'test-data' });

      const result = cache.get<{ value: string }>('test-key', 60_000);

      expect(result).toEqual({ value: 'test-data' });
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent', 60_000);

      expect(result).toBeNull();
    });

    it('should return null for expired data', () => {
      cache.set('test-key', { value: 'test-data' });

      // Advance time past the maxAge
      vi.advanceTimersByTime(61_000);

      const result = cache.get<{ value: string }>('test-key', 60_000);

      expect(result).toBeNull();
    });

    it('should return data if not expired', () => {
      cache.set('test-key', { value: 'test-data' });

      // Advance time but stay within maxAge
      vi.advanceTimersByTime(30_000);

      const result = cache.get<{ value: string }>('test-key', 60_000);

      expect(result).toEqual({ value: 'test-data' });
    });

    it('should overwrite existing data', () => {
      cache.set('test-key', { value: 'original' });
      cache.set('test-key', { value: 'updated' });

      const result = cache.get<{ value: string }>('test-key', 60_000);

      expect(result).toEqual({ value: 'updated' });
    });
  });

  describe('has', () => {
    it('should return true for valid cached data', () => {
      cache.set('test-key', 'data');

      expect(cache.has('test-key', 60_000)).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('non-existent', 60_000)).toBe(false);
    });

    it('should return false for expired data', () => {
      cache.set('test-key', 'data');

      vi.advanceTimersByTime(61_000);

      expect(cache.has('test-key', 60_000)).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing key and return true', () => {
      cache.set('test-key', 'data');

      const result = cache.delete('test-key');

      expect(result).toBe(true);
      expect(cache.get('test-key', 60_000)).toBeNull();
    });

    it('should return false for non-existent key', () => {
      const result = cache.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should invalidate all keys matching pattern', () => {
      cache.set('user-123-profile', { name: 'John' });
      cache.set('user-123-settings', { theme: 'dark' });
      cache.set('user-456-profile', { name: 'Jane' });
      cache.set('product-100', { title: 'Widget' });

      cache.invalidate('user-123');

      expect(cache.get('user-123-profile', 60_000)).toBeNull();
      expect(cache.get('user-123-settings', 60_000)).toBeNull();
      expect(cache.get('user-456-profile', 60_000)).not.toBeNull();
      expect(cache.get('product-100', 60_000)).not.toBeNull();
    });

    it('should not affect keys that do not match pattern', () => {
      cache.set('key-a', 'data-a');
      cache.set('key-b', 'data-b');

      cache.invalidate('key-a');

      expect(cache.get('key-b', 60_000)).toBe('data-b');
    });
  });

  describe('clear', () => {
    it('should remove all cache entries', () => {
      cache.set('key-1', 'data-1');
      cache.set('key-2', 'data-2');
      cache.set('key-3', 'data-3');

      cache.clear();

      expect(cache.get('key-1', 60_000)).toBeNull();
      expect(cache.get('key-2', 60_000)).toBeNull();
      expect(cache.get('key-3', 60_000)).toBeNull();
    });
  });

  describe('stats', () => {
    it('should return correct size', () => {
      cache.set('key-1', 'data-1');
      cache.set('key-2', 'data-2');

      const stats = cache.stats();

      expect(stats.size).toBe(2);
    });

    it('should return all keys', () => {
      cache.set('key-a', 'data-a');
      cache.set('key-b', 'data-b');

      const stats = cache.stats();

      expect(stats.keys).toContain('key-a');
      expect(stats.keys).toContain('key-b');
    });

    it('should return empty stats for empty cache', () => {
      const stats = cache.stats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });
});
