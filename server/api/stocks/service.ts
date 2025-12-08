/**
 * Stock Market Service
 * Prepared for Stock Market Expansion (Finnhub API)
 *
 * TODO: Implement when ready for Phase 1 expansion
 * API: Finnhub (https://finnhub.io/)
 * Free tier: 60 calls/min
 *
 * See: STOCK_MARKET_EXPANSION.md for full implementation plan
 */

import { cache } from '../../lib/cache';
import { fetchJson } from '../../lib/apiClient';

// Will be added to constants.ts when implementing
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Stock-specific types
export interface StockQuote {
  symbol: string;
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Change percent
  h: number;  // High
  l: number;  // Low
  o: number;  // Open
  pc: number; // Previous close
  t: number;  // Timestamp
}

export interface StockProfile {
  ticker: string;
  name: string;
  exchange: string;
  finnhubIndustry: string;
  marketCapitalization: number;
  logo?: string;
  weburl?: string;
}

export interface StockSearchResult {
  symbol: string;
  description: string;
  type: string;
}

/**
 * Stock Service - Placeholder for Finnhub API integration
 *
 * When implementing, add FINNHUB_API_KEY to:
 * - .env file
 * - server/lib/constants.ts
 */
export const stockService = {
  /**
   * Get real-time stock quote
   * Endpoint: GET /quote?symbol={symbol}&token={apiKey}
   */
  async getQuote(symbol: string): Promise<StockQuote | null> {
    // TODO: Implement
    // const apiKey = API_CONFIG.FINNHUB_API_KEY;
    // const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${apiKey}`;
    // return fetchJson<StockQuote>(url);
    return null;
  },

  /**
   * Get company profile
   * Endpoint: GET /stock/profile2?symbol={symbol}&token={apiKey}
   */
  async getProfile(symbol: string): Promise<StockProfile | null> {
    // TODO: Implement
    return null;
  },

  /**
   * Search for stock symbols
   * Endpoint: GET /search?q={query}&token={apiKey}
   */
  async search(query: string): Promise<StockSearchResult[]> {
    // TODO: Implement
    return [];
  },

  /**
   * Get historical candle data
   * Endpoint: GET /stock/candle?symbol={symbol}&resolution={res}&from={from}&to={to}&token={apiKey}
   */
  async getCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<{ c: number[]; h: number[]; l: number[]; o: number[]; t: number[]; v: number[] } | null> {
    // TODO: Implement
    return null;
  },
};
