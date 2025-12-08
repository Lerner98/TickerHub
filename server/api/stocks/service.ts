/**
 * Stock Market Service
 *
 * Provides stock data via Finnhub API with:
 * - Circuit breaker pattern (ADR-008)
 * - Development: Mock data (zero API calls)
 * - Production: Real API → Stale Cache → null (graceful error)
 *
 * IMPORTANT: Mock data is ONLY used in development/test.
 * Production NEVER falls back to mock - it returns null/error instead.
 *
 * @module server/api/stocks/service
 */

import { fetchJson } from '../../lib/apiClient';
import { cache } from '../../lib/cache';
import { finnhubBreaker, CircuitOpenError } from '../../lib/circuitBreaker';
import { log, logError } from '../../lib/logger';
import { shouldUseMock } from '../../mocks';
import type {
  StockAsset,
  FinnhubQuote,
  FinnhubProfile,
  AssetSearchResult,
} from '../../../shared/schema';

// =============================================================================
// CONFIGURATION
// =============================================================================

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Cache TTLs
const CACHE_TTL = {
  QUOTE: 60_000,        // 1 minute (real-time-ish)
  PROFILE: 86_400_000,  // 24 hours (rarely changes)
  STALE_MAX: 300_000,   // 5 minutes (max stale data age)
};

// Top stock symbols for production
const TOP_STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'JNJ'];

// =============================================================================
// MOCK DATA (Development Only - Never loaded in production)
// =============================================================================

// These are lazy-loaded ONLY when shouldUseMock() is true
let mockQuotes: Record<string, FinnhubQuote> | null = null;
let mockProfiles: Record<string, FinnhubProfile> | null = null;

function loadMockData(): void {
  if (mockQuotes !== null) return; // Already loaded

  // Only import mock data in non-production
  // This ensures mock files are never bundled/loaded in production
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockQuotes = require('../../mocks/finnhub/quotes.json');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockProfiles = require('../../mocks/finnhub/profiles.json');
  } catch {
    mockQuotes = {};
    mockProfiles = {};
  }
}

function getMockQuote(symbol: string): FinnhubQuote | null {
  if (!shouldUseMock()) return null;
  loadMockData();
  const quote = mockQuotes?.[symbol.toUpperCase()];
  if (!quote) return null;
  // Update timestamp to look fresh
  return { ...quote, t: Math.floor(Date.now() / 1000) };
}

function getMockProfile(symbol: string): FinnhubProfile | null {
  if (!shouldUseMock()) return null;
  loadMockData();
  return mockProfiles?.[symbol.toUpperCase()] || null;
}

function getMockSymbols(): string[] {
  if (!shouldUseMock()) return [];
  loadMockData();
  return Object.keys(mockQuotes || {});
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Build Finnhub API URL with authentication
 */
function buildUrl(endpoint: string, params: Record<string, string> = {}): string {
  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  url.searchParams.set('token', FINNHUB_API_KEY);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

/**
 * Transform Finnhub quote + profile into StockAsset
 */
function transformToStockAsset(
  symbol: string,
  quote: FinnhubQuote,
  profile: FinnhubProfile | null
): StockAsset {
  return {
    id: symbol.toUpperCase(),
    type: 'stock',
    symbol: symbol.toUpperCase(),
    name: profile?.name || symbol.toUpperCase(),
    price: quote.c,
    change24h: quote.d,
    changePercent24h: quote.dp,
    volume24h: 0, // Finnhub quote doesn't include volume
    high24h: quote.h,
    low24h: quote.l,
    lastUpdated: quote.t * 1000, // Convert to milliseconds
    exchange: profile?.exchange || 'UNKNOWN',
    currency: profile?.currency || 'USD',
    marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1_000_000 : undefined,
    sector: profile?.finnhubIndustry,
    industry: profile?.finnhubIndustry,
    country: profile?.country,
    previousClose: quote.pc,
    open: quote.o,
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Fetch stock quote
 *
 * Development: Returns mock data (zero API calls)
 * Production: Real API → Stale Cache → null
 */
export async function fetchStockQuote(symbol: string): Promise<FinnhubQuote | null> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `finnhub-quote-${upperSymbol}`;

  // Check cache first (always, regardless of mode)
  const cached = cache.get<FinnhubQuote>(cacheKey, CACHE_TTL.QUOTE);
  if (cached) {
    log(`Stock quote cache HIT: ${upperSymbol}`, 'stocks', 'debug');
    return cached;
  }

  // Development/Test: Use mock data only
  if (shouldUseMock()) {
    log(`Stock quote MOCK: ${upperSymbol}`, 'stocks', 'debug');
    const mock = getMockQuote(upperSymbol);
    if (mock) {
      cache.set(cacheKey, mock);
    }
    return mock;
  }

  // Production: Fetch from Finnhub with circuit breaker
  try {
    const quote = await finnhubBreaker.execute(async () => {
      const url = buildUrl('/quote', { symbol: upperSymbol });
      return fetchJson<FinnhubQuote>(url);
    });

    // Validate response (Finnhub returns { c: 0, d: null, ... } for invalid symbols)
    if (quote.c === 0 && quote.d === null) {
      log(`Invalid symbol: ${upperSymbol}`, 'stocks', 'warn');
      return null;
    }

    cache.set(cacheKey, quote);
    return quote;
  } catch (error) {
    // Try stale cache (up to 5 minutes old) - production fallback
    const staleCache = cache.get<FinnhubQuote>(cacheKey, CACHE_TTL.STALE_MAX);
    if (staleCache) {
      log(`Stock quote STALE cache: ${upperSymbol}`, 'stocks', 'warn');
      return staleCache;
    }

    // Production: Log error and return null (NO mock fallback)
    if (error instanceof CircuitOpenError) {
      log(`Circuit open for Finnhub: ${upperSymbol}`, 'stocks', 'error');
    } else {
      logError(error as Error, `Failed to fetch stock quote: ${upperSymbol}`);
    }

    return null; // Graceful failure - let UI handle missing data
  }
}

/**
 * Fetch stock profile
 *
 * Development: Returns mock data
 * Production: Real API → Cache → null
 */
export async function fetchStockProfile(symbol: string): Promise<FinnhubProfile | null> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `finnhub-profile-${upperSymbol}`;

  // Check cache first
  const cached = cache.get<FinnhubProfile>(cacheKey, CACHE_TTL.PROFILE);
  if (cached) {
    return cached;
  }

  // Development/Test: Use mock data only
  if (shouldUseMock()) {
    const mock = getMockProfile(upperSymbol);
    if (mock) {
      cache.set(cacheKey, mock);
    }
    return mock;
  }

  // Production: Fetch from Finnhub with circuit breaker
  try {
    const profile = await finnhubBreaker.execute(async () => {
      const url = buildUrl('/stock/profile2', { symbol: upperSymbol });
      return fetchJson<FinnhubProfile>(url);
    });

    // Validate response
    if (!profile.name) {
      return null;
    }

    cache.set(cacheKey, profile);
    return profile;
  } catch (error) {
    // Production: Log and return null (NO mock fallback)
    logError(error as Error, `Failed to fetch stock profile: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get full stock asset data (quote + profile combined)
 */
export async function getStockAsset(symbol: string): Promise<StockAsset | null> {
  const [quote, profile] = await Promise.all([
    fetchStockQuote(symbol),
    fetchStockProfile(symbol),
  ]);

  if (!quote) {
    return null;
  }

  return transformToStockAsset(symbol, quote, profile);
}

/**
 * Get multiple stock assets (batch request)
 */
export async function getStockAssets(symbols: string[]): Promise<StockAsset[]> {
  const results = await Promise.all(
    symbols.map((symbol) => getStockAsset(symbol))
  );

  return results.filter((asset): asset is StockAsset => asset !== null);
}

/**
 * Get top/popular stocks
 */
export async function getTopStocks(): Promise<StockAsset[]> {
  const symbols = shouldUseMock() ? getMockSymbols() : TOP_STOCK_SYMBOLS;
  return getStockAssets(symbols);
}

/**
 * Search stocks by symbol or name
 *
 * Development: Search mock data
 * Production: Search known symbols (Finnhub search requires paid tier)
 */
export async function searchStocks(query: string): Promise<AssetSearchResult[]> {
  const upperQuery = query.toUpperCase();

  // In production, we'd need paid Finnhub tier for search
  // For now, search against known symbols
  const symbols = shouldUseMock() ? getMockSymbols() : TOP_STOCK_SYMBOLS;

  const results: AssetSearchResult[] = [];

  for (const symbol of symbols) {
    if (symbol.includes(upperQuery)) {
      const profile = shouldUseMock() ? getMockProfile(symbol) : null;
      results.push({
        id: symbol,
        type: 'stock',
        symbol,
        name: profile?.name || symbol,
        exchange: profile?.exchange,
      });
    }
  }

  return results.slice(0, 10);
}

/**
 * Check if Finnhub API is configured
 */
export function isConfigured(): boolean {
  return FINNHUB_API_KEY.length > 0;
}

/**
 * Get service status for health check
 */
export function getServiceStatus(): {
  configured: boolean;
  mockMode: boolean;
  circuitState: string;
} {
  return {
    configured: isConfigured(),
    mockMode: shouldUseMock(),
    circuitState: finnhubBreaker.getState(),
  };
}
