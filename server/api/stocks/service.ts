/**
 * Stock Market Service
 *
 * Dual-provider architecture for stock data:
 * 1. Primary: Twelve Data API ($29/mo paid - best coverage, 800+ calls/day free)
 * 2. Fallback: Finnhub API (free tier - 60 calls/min)
 * 3. Graceful degradation: Returns null if both fail (UI shows N/A)
 *
 * Environment Variables:
 * - TWELVE_DATA_API_KEY: Primary provider (optional, enables best data)
 * - FINNHUB_API_KEY: Fallback provider (optional, free tier available)
 *
 * If no API keys configured: Returns null, UI shows "Data unavailable"
 *
 * @module server/api/stocks/service
 */

import { fetchWithTimeout, safeFetch } from '../../lib/apiClient';
import { cache } from '../../lib/cache';
import { log, logError } from '../../lib/logger';
import { API_URLS, CACHE_TTL } from '../../lib/constants';
import type { StockAsset, AssetSearchResult } from '../../../shared/schema';

// =============================================================================
// CONFIGURATION
// =============================================================================

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';
// Support various env var naming conventions
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || process.env.finnhub_API_key || process.env.finnhub_API_ke || '';

// Provider availability flags
const hasTwelveData = TWELVE_DATA_API_KEY.length > 0;
const hasFinnhub = FINNHUB_API_KEY.length > 0;
const hasAnyProvider = hasTwelveData || hasFinnhub;

// Log configuration on startup
if (!hasAnyProvider) {
  log('No stock API keys configured. Stock data will show as N/A.', 'stocks', 'warn');
  log('Add TWELVE_DATA_API_KEY or FINNHUB_API_KEY to .env for real data.', 'stocks', 'warn');
} else {
  log(`Stock providers: ${hasTwelveData ? 'Twelve Data (primary)' : ''} ${hasFinnhub ? 'Finnhub (fallback)' : ''}`.trim(), 'stocks', 'info');
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface TwelveDataQuote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  datetime: string;
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  previous_close: string;
  change: string;
  percent_change: string;
  is_market_open: boolean;
}

interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High
  l: number;  // Low
  o: number;  // Open
  pc: number; // Previous close
  t: number;  // Timestamp
}

interface FinnhubProfile {
  name: string;
  exchange: string;
  currency: string;
  finnhubIndustry: string;
  country: string;
  marketCapitalization: number;
}

interface FinnhubCandle {
  c: number[];  // Close prices
  h: number[];  // High prices
  l: number[];  // Low prices
  o: number[];  // Open prices
  t: number[];  // Timestamps (Unix)
  v: number[];  // Volumes
  s: string;    // Status: "ok" or "no_data"
}

interface TwelveDataTimeSeries {
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange: string;
  };
  values: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  status?: string;
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export type ChartTimeframe = '1D' | '7D' | '30D' | '1Y';

// =============================================================================
// TWELVE DATA PROVIDER (Primary - $29/mo for premium, 800 calls/day free)
// =============================================================================

async function fetchFromTwelveData(symbol: string): Promise<StockAsset | null> {
  if (!hasTwelveData) return null;

  try {
    const url = `${API_URLS.TWELVE_DATA}/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`Twelve Data error: ${response.status}`, 'stocks', 'warn');
      return null;
    }

    const data: TwelveDataQuote = await response.json();

    // Check for API error response
    if ('code' in data || !data.close) {
      log(`Twelve Data invalid response for ${symbol}`, 'stocks', 'debug');
      return null;
    }

    return {
      id: symbol.toUpperCase(),
      type: 'stock',
      symbol: symbol.toUpperCase(),
      name: data.name || symbol,
      price: parseFloat(data.close),
      change24h: parseFloat(data.change),
      changePercent24h: parseFloat(data.percent_change),
      volume24h: parseInt(data.volume) || 0,
      high24h: parseFloat(data.high),
      low24h: parseFloat(data.low),
      lastUpdated: data.timestamp * 1000,
      exchange: data.exchange,
      currency: data.currency,
      previousClose: parseFloat(data.previous_close),
      open: parseFloat(data.open),
    };
  } catch (error) {
    logError(error as Error, `Twelve Data fetch failed: ${symbol}`);
    return null;
  }
}

// =============================================================================
// FINNHUB PROVIDER (Fallback - 60 calls/min free)
// =============================================================================

async function fetchFromFinnhub(symbol: string): Promise<StockAsset | null> {
  if (!hasFinnhub) return null;

  try {
    // Fetch quote and profile in parallel
    const [quoteResponse, profileResponse] = await Promise.all([
      fetchWithTimeout(`${API_URLS.FINNHUB}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetchWithTimeout(`${API_URLS.FINNHUB}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
    ]);

    if (!quoteResponse.ok) {
      log(`Finnhub quote error: ${quoteResponse.status}`, 'stocks', 'warn');
      return null;
    }

    const quote: FinnhubQuote = await quoteResponse.json();
    const profile: FinnhubProfile | null = profileResponse.ok ? await profileResponse.json() : null;

    // Validate quote (Finnhub returns zeros for invalid symbols)
    if (quote.c === 0 && quote.d === null) {
      log(`Finnhub invalid symbol: ${symbol}`, 'stocks', 'debug');
      return null;
    }

    return {
      id: symbol.toUpperCase(),
      type: 'stock',
      symbol: symbol.toUpperCase(),
      name: profile?.name || symbol,
      price: quote.c,
      change24h: quote.d,
      changePercent24h: quote.dp,
      volume24h: 0, // Finnhub quote doesn't include volume
      high24h: quote.h,
      low24h: quote.l,
      lastUpdated: quote.t * 1000,
      exchange: profile?.exchange || 'US',
      currency: profile?.currency || 'USD',
      marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1_000_000 : undefined,
      sector: profile?.finnhubIndustry,
      previousClose: quote.pc,
      open: quote.o,
    };
  } catch (error) {
    logError(error as Error, `Finnhub fetch failed: ${symbol}`);
    return null;
  }
}

// =============================================================================
// FINNHUB PROFILE ENRICHMENT
// =============================================================================

/**
 * Fetch only profile data from Finnhub (for enriching Twelve Data results)
 * Returns marketCap and sector without fetching quote data
 */
async function fetchFinnhubProfile(symbol: string): Promise<{ marketCap?: number; sector?: string } | null> {
  if (!hasFinnhub) return null;

  try {
    const url = `${API_URLS.FINNHUB}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`Finnhub profile error: ${response.status}`, 'stocks', 'debug');
      return null;
    }

    const profile: FinnhubProfile = await response.json();

    // Check for valid profile data
    if (!profile || !profile.name) {
      return null;
    }

    return {
      marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1_000_000 : undefined,
      sector: profile.finnhubIndustry || undefined,
    };
  } catch (error) {
    logError(error as Error, `Finnhub profile fetch failed: ${symbol}`);
    return null;
  }
}

// =============================================================================
// PUBLIC API - Dual Provider with Fallback
// =============================================================================

/**
 * Get stock asset data with dual-provider fallback
 *
 * Priority:
 * 1. Cache (30 second TTL)
 * 2. Twelve Data API (primary)
 * 3. Finnhub API (fallback)
 * 4. null (UI shows N/A)
 */
export async function getStockAsset(symbol: string): Promise<StockAsset | null> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `stock-quote-${upperSymbol}`;

  // Check cache first
  const cached = cache.get<StockAsset>(cacheKey, CACHE_TTL.STOCK_QUOTE);
  if (cached) {
    log(`Stock cache HIT: ${upperSymbol}`, 'stocks', 'debug');
    return cached;
  }

  // No providers configured
  if (!hasAnyProvider) {
    log(`No API keys - returning null for ${upperSymbol}`, 'stocks', 'debug');
    return null;
  }

  // Try Twelve Data first (primary) for price data
  let asset = await fetchFromTwelveData(upperSymbol);

  // If Twelve Data succeeded but we have Finnhub, enrich with profile data
  if (asset && hasFinnhub) {
    const finnhubData = await fetchFinnhubProfile(upperSymbol);
    if (finnhubData) {
      asset = {
        ...asset,
        marketCap: finnhubData.marketCap || asset.marketCap,
        sector: finnhubData.sector || asset.sector,
      };
      log(`Enriched ${upperSymbol} with Finnhub profile`, 'stocks', 'debug');
    }
  }

  // Fallback to Finnhub entirely if Twelve Data failed
  if (!asset && hasFinnhub) {
    log(`Falling back to Finnhub for ${upperSymbol}`, 'stocks', 'debug');
    asset = await fetchFromFinnhub(upperSymbol);
  }

  // Cache successful response
  if (asset) {
    cache.set(cacheKey, asset);
    log(`Stock fetched: ${upperSymbol} @ $${asset.price}`, 'stocks', 'debug');
  }

  return asset;
}

/**
 * Get multiple stock assets
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
  const TOP_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'JNJ'];
  return getStockAssets(TOP_SYMBOLS);
}

/**
 * Search stocks by symbol
 * Note: Uses local dataset for fuzzy search, then fetches real data for matches
 */
export async function searchStocks(query: string): Promise<AssetSearchResult[]> {
  // Search is handled client-side with Fuse.js
  // This endpoint just returns basic info
  const upperQuery = query.toUpperCase();

  // For now, return empty - search is done client-side
  // When user clicks a result, we fetch real data via getStockAsset
  return [];
}

/**
 * Get provider status for health check / debugging
 */
export function getProviderStatus(): {
  twelveData: { configured: boolean; apiKey: string };
  finnhub: { configured: boolean; apiKey: string };
  anyConfigured: boolean;
} {
  return {
    twelveData: {
      configured: hasTwelveData,
      apiKey: hasTwelveData ? '***configured***' : 'missing',
    },
    finnhub: {
      configured: hasFinnhub,
      apiKey: hasFinnhub ? '***configured***' : 'missing',
    },
    anyConfigured: hasAnyProvider,
  };
}

/**
 * Check if service has any provider configured
 */
export function isConfigured(): boolean {
  return hasAnyProvider;
}

// =============================================================================
// HISTORICAL CHART DATA
// =============================================================================

/**
 * Get resolution and time range for Finnhub candles
 */
function getChartParams(timeframe: ChartTimeframe): { resolution: string; from: number; to: number } {
  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;

  switch (timeframe) {
    case '1D':
      return { resolution: '5', from: now - day, to: now }; // 5-minute candles
    case '7D':
      return { resolution: '60', from: now - 7 * day, to: now }; // 1-hour candles
    case '30D':
      return { resolution: 'D', from: now - 30 * day, to: now }; // Daily candles
    case '1Y':
      return { resolution: 'D', from: now - 365 * day, to: now }; // Daily candles
    default:
      return { resolution: 'D', from: now - 30 * day, to: now };
  }
}

/**
 * Fetch chart data from Finnhub
 */
async function fetchChartFromFinnhub(
  symbol: string,
  timeframe: ChartTimeframe
): Promise<ChartDataPoint[] | null> {
  if (!hasFinnhub) return null;

  try {
    const { resolution, from, to } = getChartParams(timeframe);
    const url = `${API_URLS.FINNHUB}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      log(`Finnhub candle error: ${response.status}`, 'stocks', 'warn');
      return null;
    }

    const data: FinnhubCandle = await response.json();

    if (data.s !== 'ok' || !data.c || data.c.length === 0) {
      log(`Finnhub no candle data for ${symbol}`, 'stocks', 'debug');
      return null;
    }

    // Transform to ChartDataPoint array
    return data.t.map((timestamp, i) => ({
      timestamp: timestamp * 1000, // Convert to milliseconds
      price: data.c[i],
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      volume: data.v[i],
    }));
  } catch (error) {
    logError(error as Error, `Finnhub candle fetch failed: ${symbol}`);
    return null;
  }
}

/**
 * Fetch chart data from Twelve Data
 */
async function fetchChartFromTwelveData(
  symbol: string,
  timeframe: ChartTimeframe
): Promise<ChartDataPoint[] | null> {
  if (!hasTwelveData) {
    log(`Twelve Data not configured for chart: ${symbol}`, 'stocks', 'debug');
    return null;
  }

  try {
    // Map timeframe to Twelve Data interval and outputsize
    let interval: string;
    let outputsize: number;

    switch (timeframe) {
      case '1D':
        interval = '5min';
        outputsize = 78; // ~6.5 hours of trading
        break;
      case '7D':
        interval = '1h';
        outputsize = 50; // ~7 days of hourly
        break;
      case '30D':
        interval = '1day';
        outputsize = 30;
        break;
      case '1Y':
        interval = '1day';
        outputsize = 252; // Trading days in a year
        break;
      default:
        interval = '1day';
        outputsize = 30;
    }

    const url = `${API_URLS.TWELVE_DATA}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
    log(`Fetching Twelve Data chart: ${symbol} ${timeframe}`, 'stocks', 'debug');

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      log(`Twelve Data time_series error: ${response.status}`, 'stocks', 'warn');
      return null;
    }

    const data: TwelveDataTimeSeries = await response.json();

    // Check for API error response (Twelve Data returns errors in JSON)
    if ('code' in data || 'message' in data) {
      log(`Twelve Data API error for chart ${symbol}: ${JSON.stringify(data).slice(0, 200)}`, 'stocks', 'warn');
      return null;
    }

    if (!data.values || data.values.length === 0) {
      log(`Twelve Data no time_series data for ${symbol}`, 'stocks', 'debug');
      return null;
    }

    log(`Twelve Data chart success: ${symbol} ${timeframe} (${data.values.length} points)`, 'stocks', 'debug');

    // Transform and reverse (Twelve Data returns newest first)
    return data.values
      .map((point) => ({
        timestamp: new Date(point.datetime).getTime(),
        price: parseFloat(point.close),
        open: parseFloat(point.open),
        high: parseFloat(point.high),
        low: parseFloat(point.low),
        volume: parseInt(point.volume) || 0,
      }))
      .reverse();
  } catch (error) {
    logError(error as Error, `Twelve Data time_series fetch failed: ${symbol}`);
    return null;
  }
}

/**
 * Get historical chart data for a stock
 *
 * @param symbol - Stock symbol (e.g., "AAPL")
 * @param timeframe - Time range: "1D", "7D", "30D", "1Y"
 * @returns Array of chart data points or null if unavailable
 */
export async function getStockChart(
  symbol: string,
  timeframe: ChartTimeframe = '30D'
): Promise<ChartDataPoint[] | null> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `stock-chart-${upperSymbol}-${timeframe}`;

  // Check cache first
  const cached = cache.get<ChartDataPoint[]>(cacheKey, CACHE_TTL.STOCK_CHART);
  if (cached) {
    log(`Stock chart cache HIT: ${upperSymbol} ${timeframe}`, 'stocks', 'debug');
    return cached;
  }

  // No providers configured
  if (!hasAnyProvider) {
    return null;
  }

  // Try Twelve Data first (primary)
  let chartData = await fetchChartFromTwelveData(upperSymbol, timeframe);

  // Fallback to Finnhub
  if (!chartData && hasFinnhub) {
    log(`Falling back to Finnhub for chart: ${upperSymbol}`, 'stocks', 'debug');
    chartData = await fetchChartFromFinnhub(upperSymbol, timeframe);
  }

  // Cache successful response
  if (chartData && chartData.length > 0) {
    cache.set(cacheKey, chartData);
    log(`Stock chart fetched: ${upperSymbol} ${timeframe} (${chartData.length} points)`, 'stocks', 'debug');
  }

  return chartData;
}
