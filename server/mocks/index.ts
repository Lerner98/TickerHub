/**
 * Mock Data Loader
 *
 * Provides mock data for development and testing.
 * Zero external API calls in development by default (API_TESTING_STRATEGY.md).
 *
 * IMPORTANT: This module is ONLY used in development/test.
 * In production, shouldUseMock() returns false and mock functions are never called.
 *
 * @module server/mocks
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { FinnhubQuote, FinnhubProfile } from '../../shared/schema';

// Mock data directory - relative to project root
// In dev (ESM), we use process.cwd() which points to project root
// In prod (CJS), this is never called because shouldUseMock() returns false
function getMocksDir(): string {
  return join(process.cwd(), 'server', 'mocks');
}

/**
 * Check if mock data should be used
 *
 * - Development: Mock by default (USE_REAL_API=true to override)
 * - Test: Always mock
 * - Production: Never mock
 */
export function shouldUseMock(): boolean {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'test') {
    return true;
  }

  if (env === 'production') {
    return false;
  }

  // Development: mock unless explicitly disabled
  return process.env.USE_REAL_API !== 'true';
}

/**
 * Load a mock JSON file
 *
 * @param provider - Provider directory name (e.g., 'finnhub', 'coingecko')
 * @param filename - JSON file name (e.g., 'quotes.json')
 * @returns Parsed JSON data
 */
export function loadMock<T>(provider: string, filename: string): T {
  const mockPath = join(getMocksDir(), provider, filename);
  const content = readFileSync(mockPath, 'utf-8');
  return JSON.parse(content);
}

// =============================================================================
// FINNHUB MOCK DATA
// =============================================================================

let finnhubQuotesCache: Record<string, FinnhubQuote> | null = null;
let finnhubProfilesCache: Record<string, FinnhubProfile> | null = null;

/**
 * Get mock Finnhub quote for a symbol
 */
export function getMockFinnhubQuote(symbol: string): FinnhubQuote | null {
  if (!finnhubQuotesCache) {
    finnhubQuotesCache = loadMock<Record<string, FinnhubQuote>>('finnhub', 'quotes.json');
  }

  const quote = finnhubQuotesCache[symbol.toUpperCase()];
  if (!quote) return null;

  // Update timestamp to make it look fresh
  return {
    ...quote,
    t: Math.floor(Date.now() / 1000),
  };
}

/**
 * Get mock Finnhub profile for a symbol
 */
export function getMockFinnhubProfile(symbol: string): FinnhubProfile | null {
  if (!finnhubProfilesCache) {
    finnhubProfilesCache = loadMock<Record<string, FinnhubProfile>>('finnhub', 'profiles.json');
  }

  return finnhubProfilesCache[symbol.toUpperCase()] || null;
}

/**
 * Get all available mock stock symbols
 */
export function getMockStockSymbols(): string[] {
  if (!finnhubQuotesCache) {
    finnhubQuotesCache = loadMock<Record<string, FinnhubQuote>>('finnhub', 'quotes.json');
  }

  return Object.keys(finnhubQuotesCache);
}

/**
 * Get mock quotes for multiple symbols
 */
export function getMockFinnhubQuotes(symbols: string[]): Record<string, FinnhubQuote> {
  const result: Record<string, FinnhubQuote> = {};

  for (const symbol of symbols) {
    const quote = getMockFinnhubQuote(symbol);
    if (quote) {
      result[symbol.toUpperCase()] = quote;
    }
  }

  return result;
}
